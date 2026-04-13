import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessTenantId } from '@/lib/server/business-tenant';

const createSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().optional(),
  attributeValues: z.record(z.string(), z.string()),
  additionalPrice: z.number().optional(),
  lifecycle: z.enum(['draft', 'active', 'discontinued', 'seasonal', 'archived']).default('active'),
});

export async function GET(req: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(req);
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    let query = adminFirestore.collection(col.bizProductVariants).where('tenantId', '==', tenantId);
    if (productId) query = query.where('productId', '==', productId);

    const [variantsSnap, productsSnap] = await Promise.all([
      query.orderBy('createdAt', 'desc').get(),
      adminFirestore.collection(col.bizProducts).where('tenantId', '==', tenantId).get(),
    ]);

    const productMap = new Map(productsSnap.docs.map((doc) => [doc.id, doc.data()]));

    return NextResponse.json({
      ok: true,
      variants: variantsSnap.docs.map((doc) => {
        const data = doc.data();
        const product = productMap.get(String(data.productId ?? ''));
        return {
          id: doc.id,
          ...data,
          product: product ? { id: String(data.productId), name: product.name, sku: product.sku } : null,
        };
      }),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(req);
    await ensureBusinessTenantDoc(tenantId);
    const body = createSchema.parse(await req.json());

    const parent = await adminFirestore.collection(col.bizProducts).doc(body.productId).get();
    if (!parent.exists || String(parent.data()?.tenantId ?? '') !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Parent product not found' }, { status: 404 });
    }

    const normalized = Object.fromEntries(Object.entries(body.attributeValues).map(([k, v]) => [k.trim().toLowerCase(), v.trim().toLowerCase()]));
    const existing = await adminFirestore
      .collection(col.bizProductVariants)
      .where('tenantId', '==', tenantId)
      .where('productId', '==', body.productId)
      .get();

    const duplicate = existing.docs.find((doc) => {
      const attrs = doc.data().attributeValues as Record<string, string>;
      const normalizedExisting = Object.fromEntries(Object.entries(attrs ?? {}).map(([k, v]) => [k.trim().toLowerCase(), String(v).trim().toLowerCase()]));
      return JSON.stringify(normalizedExisting) === JSON.stringify(normalized);
    });
    if (duplicate) {
      return NextResponse.json({ ok: false, error: 'Variant with identical attribute combination already exists', duplicateField: 'attributeValues' }, { status: 409 });
    }

    let sku = body.sku?.toUpperCase();
    if (!sku) {
      const p = parent.data() ?? {};
      const base = String(p.sku ?? p.name ?? 'VAR').slice(0, 8).toUpperCase();
      const suffix = Object.values(body.attributeValues).map((v) => v.slice(0, 2).toUpperCase()).join('-');
      sku = `${base}-${suffix}`;
    }

    const sameSku = await adminFirestore.collection(col.bizProductVariants).where('tenantId', '==', tenantId).where('sku', '==', sku).limit(1).get();
    if (!sameSku.empty) {
      return NextResponse.json({ ok: false, error: `Variant SKU '${sku}' already exists`, duplicateField: 'sku' }, { status: 409 });
    }

    const id = makeId(col.bizProductVariants);
    const variant = {
      id,
      tenantId,
      productId: body.productId,
      sku,
      attributeValues: body.attributeValues,
      additionalPrice: body.additionalPrice ?? null,
      lifecycle: body.lifecycle,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await adminFirestore.collection(col.bizProductVariants).doc(id).set(variant);

    return NextResponse.json({ ok: true, variant: { ...variant, product: { id: parent.id, ...parent.data() } } }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: e.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
