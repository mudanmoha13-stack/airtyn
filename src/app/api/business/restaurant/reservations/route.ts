import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const reservationStatus = z.enum(['booked', 'confirmed', 'seated', 'completed', 'canceled', 'no_show']);

const createReservationSchema = z.object({
  branchId: z.string().min(1),
  tableId: z.string().optional(),
  guestName: z.string().min(2),
  guestPhone: z.string().min(3).optional(),
  guestEmail: z.string().email().optional(),
  pax: z.number().int().min(1).max(30),
  slotAt: z.string().min(10),
  notes: z.string().optional(),
});

const patchReservationSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['confirm', 'seat', 'complete', 'cancel', 'no_show']),
  tableId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const branchId = request.nextUrl.searchParams.get('branchId')?.trim();
    let query = adminFirestore.collection(col.bizRestaurantReservations).where('tenantId', '==', tenantId);
    if (branchId) {
      query = query.where('branchId', '==', branchId);
    }

    const snap = await query.get();
    const reservations = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as { id: string; slotAt?: unknown }))
      .sort((a, b) => String(a.slotAt ?? '').localeCompare(String(b.slotAt ?? '')));

    return NextResponse.json({ ok: true, reservations });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list reservations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = createReservationSchema.parse(await request.json());

    const id = makeId(col.bizRestaurantReservations);
    await adminFirestore.collection(col.bizRestaurantReservations).doc(id).set({
      id,
      tenantId,
      branchId: payload.branchId,
      tableId: payload.tableId ?? null,
      guestName: payload.guestName.trim(),
      guestPhone: payload.guestPhone?.trim() ?? null,
      guestEmail: payload.guestEmail?.trim().toLowerCase() ?? null,
      pax: payload.pax,
      slotAt: payload.slotAt,
      status: 'booked',
      notes: payload.notes?.trim() ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    if (payload.tableId) {
      await adminFirestore.collection(col.bizRestaurantTables).doc(payload.tableId).set(
        {
          status: 'reserved',
          currentReservationId: id,
          updatedAt: nowIso(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid reservation payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create reservation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    const payload = patchReservationSchema.parse(await request.json());

    const ref = adminFirestore.collection(col.bizRestaurantReservations).doc(payload.id);
    const snap = await ref.get();
    if (!snap.exists || String(snap.data()?.tenantId ?? '') !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Reservation not found for tenant' }, { status: 404 });
    }

    const reservation = snap.data() as Record<string, unknown>;
    const existingTableId = String(reservation.tableId ?? '');
    const nextTableId = payload.tableId ?? existingTableId;

    const statusMap: Record<string, z.infer<typeof reservationStatus>> = {
      confirm: 'confirmed',
      seat: 'seated',
      complete: 'completed',
      cancel: 'canceled',
      no_show: 'no_show',
    };
    const nextStatus = statusMap[payload.action];

    await ref.set(
      {
        status: nextStatus,
        tableId: nextTableId || null,
        notes: payload.notes?.trim() ?? reservation.notes ?? null,
        updatedAt: nowIso(),
      },
      { merge: true }
    );

    if (nextTableId) {
      const tableStatus = payload.action === 'seat' ? 'occupied' : payload.action === 'confirm' ? 'reserved' : 'available';
      await adminFirestore.collection(col.bizRestaurantTables).doc(nextTableId).set(
        {
          status: tableStatus,
          currentReservationId: tableStatus === 'available' ? null : payload.id,
          updatedAt: nowIso(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true, id: payload.id, status: nextStatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid reservation update payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to update reservation' }, { status: 500 });
  }
}
