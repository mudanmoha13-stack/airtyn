import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, normalizeDate, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessTenantId } from '@/lib/server/business-tenant';

const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  productType: z.enum(['physical', 'digital', 'service', 'bundle']).default('physical'),
  category: z.string().default('general'),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId);
    const snap = await adminFirestore
      .collection(col.bizProducts)
      .where('tenantId', '==', tenantId)
      .limit(100)
      .get();

    const products = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data(), createdAt: normalizeDate(doc.data().createdAt) }))
      .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));

    return NextResponse.json({ ok: true, products });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId);
    const payload = createProductSchema.parse(await request.json());
    const id = makeId(col.bizProducts);
    const product = {
      id,
      tenantId,
      name: payload.name,
      sku: payload.sku.toUpperCase(),
      productType: payload.productType,
      category: payload.category,
      lifecycle: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await adminFirestore.collection(col.bizProducts).doc(id).set(product);

    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid product payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create product' }, { status: 500 });
  }
}
