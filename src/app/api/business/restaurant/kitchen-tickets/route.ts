import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const kitchenStatus = z.enum(['queued', 'in_prep', 'ready', 'served', 'bumped', 'canceled']);
const lineStatus = z.enum(['queued', 'in_prep', 'ready', 'served', 'canceled']);

const patchKitchenTicketSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['start_prep', 'mark_ready', 'serve', 'bump', 'cancel', 'requeue']),
  station: z.string().optional(),
  lineId: z.string().optional(),
  notes: z.string().optional(),
});

function nextStatusFromAction(action: z.infer<typeof patchKitchenTicketSchema>['action']): z.infer<typeof kitchenStatus> {
  const map: Record<z.infer<typeof patchKitchenTicketSchema>['action'], z.infer<typeof kitchenStatus>> = {
    start_prep: 'in_prep',
    mark_ready: 'ready',
    serve: 'served',
    bump: 'bumped',
    cancel: 'canceled',
    requeue: 'queued',
  };
  return map[action];
}

function deriveTicketStatus(lines: Array<Record<string, unknown>>): z.infer<typeof kitchenStatus> {
  const statuses = lines.map((line) => String(line.status ?? 'queued'));
  if (statuses.length === 0) return 'queued';
  if (statuses.every((status) => status === 'canceled')) return 'canceled';
  if (statuses.every((status) => status === 'served' || status === 'canceled')) return 'served';
  if (statuses.every((status) => status === 'ready' || status === 'served' || status === 'canceled')) return 'ready';
  if (statuses.some((status) => status === 'in_prep')) return 'in_prep';
  return 'queued';
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const branchId = request.nextUrl.searchParams.get('branchId')?.trim();
    const status = request.nextUrl.searchParams.get('status')?.trim();
    const station = request.nextUrl.searchParams.get('station')?.trim().toLowerCase();
    const serviceMode = request.nextUrl.searchParams.get('serviceMode')?.trim().toLowerCase();

    let query = adminFirestore.collection(col.bizRestaurantKitchenTickets).where('tenantId', '==', tenantId);
    if (branchId) {
      query = query.where('branchId', '==', branchId);
    }
    if (status && kitchenStatus.safeParse(status).success) {
      query = query.where('status', '==', status);
    }
    if (serviceMode) {
      query = query.where('serviceMode', '==', serviceMode);
    }

    const snap = await query.get();
    const tickets = snap.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...(doc.data() as Record<string, unknown>),
          } as {
            id: string;
            lines?: unknown;
            createdAt?: unknown;
            nextFireAt?: unknown;
          })
      )
      .filter((ticket) => {
        if (!station) return true;
        const lines = Array.isArray(ticket.lines) ? ticket.lines : [];
        return lines.some((line: unknown) => String((line as Record<string, unknown>).station ?? '').toLowerCase() === station);
      })
      .sort((a, b) => String(a.nextFireAt ?? a.createdAt ?? '').localeCompare(String(b.nextFireAt ?? b.createdAt ?? '')));

    return NextResponse.json({ ok: true, tickets });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list kitchen tickets' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    const payload = patchKitchenTicketSchema.parse(await request.json());

    const ref = adminFirestore.collection(col.bizRestaurantKitchenTickets).doc(payload.id);
    const snap = await ref.get();
    if (!snap.exists || String(snap.data()?.tenantId ?? '') !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Kitchen ticket not found for tenant' }, { status: 404 });
    }

    const existing = snap.data() as Record<string, unknown>;
    const nextStatus = nextStatusFromAction(payload.action);
    const existingLines = (Array.isArray(existing.lines) ? existing.lines : []) as Array<Record<string, unknown>>;

    const nextLineStatus: z.infer<typeof lineStatus> =
      payload.action === 'start_prep'
        ? 'in_prep'
        : payload.action === 'mark_ready'
          ? 'ready'
          : payload.action === 'serve' || payload.action === 'bump'
            ? 'served'
            : payload.action === 'cancel'
              ? 'canceled'
              : 'queued';

    const lines = existingLines.map((current) => {
      const lineStation = String(current.station ?? '').toLowerCase();
      const shouldUpdate = payload.lineId
        ? String(current.id ?? '') === payload.lineId
        : payload.station
          ? lineStation === payload.station.toLowerCase()
          : true;

      if (!shouldUpdate) return current;
      return {
        ...current,
        status: nextLineStatus,
        ...(nextLineStatus === 'in_prep' ? { startedAt: nowIso() } : {}),
        ...(nextLineStatus === 'ready' ? { readyAt: nowIso() } : {}),
        ...(nextLineStatus === 'served' ? { servedAt: nowIso() } : {}),
        updatedAt: nowIso(),
      };
    });

    const derivedStatus = payload.action === 'bump' ? 'bumped' : deriveTicketStatus(lines);

    const lifecycleEvent = {
      action: payload.action,
      status: payload.action === 'bump' ? 'bumped' : derivedStatus,
      station: payload.station ?? null,
      lineId: payload.lineId ?? null,
      notes: payload.notes?.trim() ?? null,
      at: nowIso(),
    };

    const lifecycle = Array.isArray(existing.lifecycle) ? [...existing.lifecycle, lifecycleEvent] : [lifecycleEvent];

    const patch: Record<string, unknown> = {
      status: payload.action === 'bump' ? 'bumped' : derivedStatus,
      lines,
      lifecycle,
      nextFireAt: lines
        .filter((line) => String(line.status ?? '') === 'queued' || String(line.status ?? '') === 'in_prep')
        .sort((a, b) => String(a.fireAt ?? '').localeCompare(String(b.fireAt ?? '')))[0]?.fireAt ?? null,
      updatedAt: nowIso(),
    };

    if (derivedStatus === 'in_prep' && !existing.startedAt) patch.startedAt = nowIso();
    if (derivedStatus === 'ready') patch.readyAt = nowIso();
    if (derivedStatus === 'served') patch.servedAt = nowIso();
    if (payload.action === 'bump') patch.bumpedAt = nowIso();

    await ref.set(patch, { merge: true });

    return NextResponse.json({ ok: true, id: payload.id, status: payload.action === 'bump' ? 'bumped' : derivedStatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid kitchen ticket update payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to update kitchen ticket' }, { status: 500 });
  }
}
