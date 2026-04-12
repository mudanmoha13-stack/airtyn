import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { BUSINESS_DEFAULT_TENANT_ID, col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';

const createBundleSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  items: z.array(z.object({
    componentProductId: z.string().min(1),
    quantity: z.number().positive(),
    notes: z.string().optional(),
  })).min(1),
});

export async function GET() {
  try {
    const [bundleSnap, itemSnap, productsSnap] = await Promise.all([
      adminFirestore.collection(col.bizProductBundles).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).orderBy('createdAt', 'desc').get(),
      adminFirestore.collection(col.bizBundleItems).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).get(),
      adminFirestore.collection(col.bizProducts).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).get(),
    ]);

    const products = new Map(productsSnap.docs.map((doc) => [doc.id, doc.data()]));
    const itemsByBundle = new Map<string, Array<Record<string, unknown>>>();
    itemSnap.docs.forEach((doc) => {
      const data = doc.data();
      const key = String(data.bundleId ?? '');
      const arr = itemsByBundle.get(key) ?? [];
      arr.push({ id: doc.id, ...data });
      itemsByBundle.set(key, arr);
    });

    return NextResponse.json({
      ok: true,
      bundles: bundleSnap.docs.map((doc) => {
        const data = doc.data();
        const bundleProduct = products.get(String(data.productId ?? ''));
        return {
          id: doc.id,
          ...data,
          product: bundleProduct ? { id: String(data.productId), name: bundleProduct.name, sku: bundleProduct.sku, lifecycle: bundleProduct.lifecycle } : null,
          items: (itemsByBundle.get(doc.id) ?? []).map((item) => {
            const p = products.get(String(item.componentProductId ?? ''));
            return {
              ...item,
              componentProduct: p ? { id: String(item.componentProductId), name: p.name, sku: p.sku, productType: p.productType } : null,
            };
          }),
        };
      }),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureBusinessTenantDoc();
    const body = createBundleSchema.parse(await req.json());

    const normalizedName = body.name.trim();
    if (!normalizedName) {
      return NextResponse.json({ ok: false, error: 'Bundle name is required' }, { status: 400 });
    }

    const duplicateComponentIds = new Set<string>();
    const seen = new Set<string>();
    body.items.forEach((item) => {
      if (seen.has(item.componentProductId)) duplicateComponentIds.add(item.componentProductId);
      seen.add(item.componentProductId);
    });
    if (duplicateComponentIds.size > 0) {
      return NextResponse.json({ ok: false, error: 'Bundle contains duplicate component rows. Merge quantities instead.' }, { status: 409 });
    }

    const existingBundle = await adminFirestore
      .collection(col.bizProductBundles)
      .where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID)
      .where('productId', '==', body.productId)
      .where('nameLower', '==', normalizedName.toLowerCase())
      .limit(1)
      .get();

    if (!existingBundle.empty) {
      return NextResponse.json({ ok: false, error: `Bundle '${normalizedName}' already exists for this product`, duplicateField: 'name' }, { status: 409 });
    }

    const bundleId = makeId(col.bizProductBundles);
    await adminFirestore.collection(col.bizProductBundles).doc(bundleId).set({
      id: bundleId,
      tenantId: BUSINESS_DEFAULT_TENANT_ID,
      productId: body.productId,
      name: normalizedName,
      nameLower: normalizedName.toLowerCase(),
      description: body.description ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    const itemWrites = body.items.map((item) => {
      const itemId = makeId(col.bizBundleItems);
      return adminFirestore.collection(col.bizBundleItems).doc(itemId).set({
        id: itemId,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        bundleId,
        componentProductId: item.componentProductId,
        quantity: item.quantity,
        notes: item.notes ?? null,
      });
    });
    await Promise.all(itemWrites);

    return NextResponse.json({ ok: true, bundle: { id: bundleId } }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: e.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
