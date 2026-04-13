import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const createBranchSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  brand: z.string().min(2).optional(),
  city: z.string().min(2),
  country: z.string().min(2).default('Kenya'),
  timezone: z.string().min(2).default('Africa/Nairobi'),
  currency: z.string().min(3).default('KES'),
  taxRatePct: z.number().min(0).max(100).default(16),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const snap = await adminFirestore.collection(col.bizRestaurantBranches).where('tenantId', '==', tenantId).get();
    const branches = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as { id: string; name?: unknown }))
      .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));

    return NextResponse.json({ ok: true, branches });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list branches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = createBranchSchema.parse(await request.json());

    const duplicateCode = await adminFirestore
      .collection(col.bizRestaurantBranches)
      .where('tenantId', '==', tenantId)
      .where('code', '==', payload.code.trim().toUpperCase())
      .limit(1)
      .get();

    if (!duplicateCode.empty) {
      return NextResponse.json({ ok: false, error: 'Branch code already exists for tenant' }, { status: 409 });
    }

    const id = makeId(col.bizRestaurantBranches);
    await adminFirestore.collection(col.bizRestaurantBranches).doc(id).set({
      id,
      tenantId,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      brand: payload.brand?.trim() ?? null,
      city: payload.city.trim(),
      country: payload.country.trim(),
      timezone: payload.timezone.trim(),
      currency: payload.currency.trim().toUpperCase(),
      taxRatePct: payload.taxRatePct,
      active: payload.active,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid branch payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create branch' }, { status: 500 });
  }
}
