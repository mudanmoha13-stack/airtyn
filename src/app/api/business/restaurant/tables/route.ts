import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const tableStatus = z.enum(['available', 'reserved', 'occupied', 'cleaning', 'maintenance']);

const createTableSchema = z.object({
  branchId: z.string().min(1),
  floor: z.string().min(1).default('Main Floor'),
  code: z.string().min(1),
  name: z.string().min(1),
  capacity: z.number().int().min(1).max(30),
  shape: z.enum(['square', 'round', 'booth']).default('square'),
  active: z.boolean().default(true),
});

const patchTableSchema = z.object({
  id: z.string().min(1),
  status: tableStatus.optional(),
  currentOrderId: z.string().nullable().optional(),
  currentReservationId: z.string().nullable().optional(),
  name: z.string().min(1).optional(),
  capacity: z.number().int().min(1).max(30).optional(),
  active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const branchId = request.nextUrl.searchParams.get('branchId')?.trim();
    let query = adminFirestore.collection(col.bizRestaurantTables).where('tenantId', '==', tenantId);
    if (branchId) {
      query = query.where('branchId', '==', branchId);
    }

    const snap = await query.get();
    const tables = snap.docs
      .map(
        (doc) =>
          ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as {
            id: string;
            floor?: unknown;
            code?: unknown;
          })
      )
      .sort((a, b) => `${String(a.floor ?? '')}-${String(a.code ?? '')}`.localeCompare(`${String(b.floor ?? '')}-${String(b.code ?? '')}`));

    return NextResponse.json({ ok: true, tables });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list tables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = createTableSchema.parse(await request.json());

    const duplicateCode = await adminFirestore
      .collection(col.bizRestaurantTables)
      .where('tenantId', '==', tenantId)
      .where('branchId', '==', payload.branchId)
      .where('code', '==', payload.code.trim().toUpperCase())
      .limit(1)
      .get();

    if (!duplicateCode.empty) {
      return NextResponse.json({ ok: false, error: 'Table code already exists in branch' }, { status: 409 });
    }

    const id = makeId(col.bizRestaurantTables);
    await adminFirestore.collection(col.bizRestaurantTables).doc(id).set({
      id,
      tenantId,
      branchId: payload.branchId,
      floor: payload.floor.trim(),
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      capacity: payload.capacity,
      shape: payload.shape,
      status: 'available',
      currentOrderId: null,
      currentReservationId: null,
      active: payload.active,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid table payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create table' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    const payload = patchTableSchema.parse(await request.json());

    const ref = adminFirestore.collection(col.bizRestaurantTables).doc(payload.id);
    const snap = await ref.get();
    if (!snap.exists || String(snap.data()?.tenantId ?? '') !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Table not found for tenant' }, { status: 404 });
    }

    await ref.set(
      {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.currentOrderId !== undefined ? { currentOrderId: payload.currentOrderId } : {}),
        ...(payload.currentReservationId !== undefined ? { currentReservationId: payload.currentReservationId } : {}),
        ...(payload.name ? { name: payload.name.trim() } : {}),
        ...(payload.capacity ? { capacity: payload.capacity } : {}),
        ...(payload.active !== undefined ? { active: payload.active } : {}),
        updatedAt: nowIso(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, id: payload.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid table update payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to update table' }, { status: 500 });
  }
}
