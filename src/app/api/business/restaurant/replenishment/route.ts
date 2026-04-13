import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const replenishmentQuerySchema = z.object({
  branchId: z.string().optional(),
  componentProductId: z.string().optional(),
  includeUnsuggestedOnly: z.enum(['true', 'false']).optional(),
});

const createReplenishmentSchema = z.object({
  componentProductId: z.string().min(1),
  suggestedQuantity: z.number().positive(),
  minStockLevel: z.number().nonnegative(),
  leadTimeDays: z.number().positive(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const url = new URL(request.url);
    const params = replenishmentQuerySchema.parse({
      branchId: url.searchParams.get('branchId') ?? undefined,
      componentProductId: url.searchParams.get('componentProductId') ?? undefined,
      includeUnsuggestedOnly: url.searchParams.get('includeUnsuggestedOnly') ?? undefined,
    });

    let query: FirebaseFirestore.Query = adminFirestore
      .collection(col.bizRestaurantReplenishment)
      .where('tenantId', '==', tenantId);

    if (params.branchId) {
      query = query.where('branchId', '==', params.branchId);
    }

    if (params.componentProductId) {
      query = query.where('componentProductId', '==', params.componentProductId);
    }

    if (params.includeUnsuggestedOnly === 'true') {
      query = query.where('status', 'in', ['suggested', 'pending']);
    }

    const snap = await query.orderBy('createdAt', 'desc').get();

    const replenishmentRecords = snap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        componentProductId: data.componentProductId,
        branchId: data.branchId,
        currentStock: Number(data.currentStock ?? 0),
        suggestedQuantity: Number(data.suggestedQuantity ?? 0),
        minStockLevel: Number(data.minStockLevel ?? 0),
        consumptionDailyAvg: Number(data.consumptionDailyAvg ?? 0),
        leadTimeDays: Number(data.leadTimeDays ?? 0),
        supplierId: data.supplierId ?? null,
        status: String(data.status ?? 'suggested'),
        notes: data.notes ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    return NextResponse.json({ ok: true, data: replenishmentRecords });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid query parameters', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to fetch replenishment suggestions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = createReplenishmentSchema.parse(await request.json());

    const replenishmentId = makeId(col.bizRestaurantReplenishment);
    const now = nowIso();

    await adminFirestore.collection(col.bizRestaurantReplenishment).doc(replenishmentId).set({
      id: replenishmentId,
      tenantId,
      componentProductId: payload.componentProductId,
      branchId: null,
      currentStock: 0,
      suggestedQuantity: payload.suggestedQuantity,
      minStockLevel: payload.minStockLevel,
      consumptionDailyAvg: 0,
      leadTimeDays: payload.leadTimeDays,
      supplierId: payload.supplierId ?? null,
      status: 'suggested',
      notes: payload.notes?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true, data: { id: replenishmentId } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid replenishment payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create replenishment suggestion' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const payload = z.object({
      id: z.string().min(1),
      status: z.enum(['suggested', 'pending', 'ordered', 'received', 'cancelled']).optional(),
      supplierId: z.string().optional(),
      notes: z.string().optional(),
    }).parse(await request.json());

    const ref = adminFirestore.collection(col.bizRestaurantReplenishment).doc(payload.id);
    const snap = await ref.get();

    if (!snap.exists || String(snap.data()?.tenantId ?? '') !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Replenishment record not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: nowIso() };
    if (payload.status) updateData.status = payload.status;
    if (payload.supplierId !== undefined) updateData.supplierId = payload.supplierId || null;
    if (payload.notes !== undefined) updateData.notes = payload.notes?.trim() ?? null;

    await ref.set(updateData, { merge: true });

    return NextResponse.json({ ok: true, data: { id: payload.id } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid update payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to update replenishment' }, { status: 500 });
  }
}
