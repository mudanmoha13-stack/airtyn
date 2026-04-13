import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const createDeliverySchema = z.object({
  branchId: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  address: z.string().min(3),
  zone: z.string().min(1).default('default'),
  driverName: z.string().optional(),
  orderId: z.string().optional(),
  promisedAt: z.string().optional(),
  total: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

const patchDeliverySchema = z.object({
  id: z.string().min(1),
  action: z.enum(['dispatch', 'picked_up', 'delivered', 'failed', 'returned']),
  driverName: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const branchId = request.nextUrl.searchParams.get('branchId')?.trim();
    let query = adminFirestore.collection(col.bizRestaurantDeliveries).where('tenantId', '==', tenantId);
    if (branchId) {
      query = query.where('branchId', '==', branchId);
    }

    const snap = await query.get();
    const deliveries = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as { id: string; createdAt?: unknown }))
      .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));

    return NextResponse.json({ ok: true, deliveries });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list deliveries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = createDeliverySchema.parse(await request.json());

    const id = makeId(col.bizRestaurantDeliveries);
    await adminFirestore.collection(col.bizRestaurantDeliveries).doc(id).set({
      id,
      tenantId,
      branchId: payload.branchId,
      orderId: payload.orderId ?? null,
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      address: payload.address.trim(),
      zone: payload.zone.trim(),
      driverName: payload.driverName?.trim() ?? null,
      promisedAt: payload.promisedAt ?? null,
      total: payload.total,
      status: 'queued',
      notes: payload.notes?.trim() ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid delivery payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create delivery' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    const payload = patchDeliverySchema.parse(await request.json());

    const ref = adminFirestore.collection(col.bizRestaurantDeliveries).doc(payload.id);
    const snap = await ref.get();
    if (!snap.exists || String(snap.data()?.tenantId ?? '') !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Delivery not found for tenant' }, { status: 404 });
    }

    const statusMap: Record<z.infer<typeof patchDeliverySchema>['action'], string> = {
      dispatch: 'dispatched',
      picked_up: 'picked_up',
      delivered: 'delivered',
      failed: 'failed',
      returned: 'returned',
    };

    await ref.set(
      {
        status: statusMap[payload.action],
        ...(payload.driverName ? { driverName: payload.driverName.trim() } : {}),
        ...(payload.action === 'dispatch' ? { dispatchedAt: nowIso() } : {}),
        ...(payload.action === 'picked_up' ? { pickedUpAt: nowIso() } : {}),
        ...(payload.action === 'delivered' ? { deliveredAt: nowIso() } : {}),
        notes: payload.notes?.trim() ?? snap.data()?.notes ?? null,
        updatedAt: nowIso(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, id: payload.id, status: statusMap[payload.action] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid delivery update payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to update delivery' }, { status: 500 });
  }
}