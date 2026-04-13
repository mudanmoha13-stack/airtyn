import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  skuPrefix: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  baseUomId: z.string().optional(),
  lifecycle: z.enum(['draft', 'active', 'discontinued', 'seasonal', 'archived']).default('active'),
  productType: z.enum(['physical', 'digital', 'service', 'bundle']).default('physical'),
  basePrice: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
});

const patchSchema = z.object({
  name: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  productType: z.enum(['physical', 'digital', 'service', 'bundle']).optional(),
  lifecycle: z.enum(['draft', 'active', 'discontinued', 'seasonal', 'archived']).optional(),
  description: z.string().optional(),
  basePrice: z.number().nonnegative().nullable().optional(),
  costPrice: z.number().nonnegative().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  baseUomId: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    const [productsSnap, categoriesSnap, uomsSnap, variantsSnap, bundlesSnap, bundleItemsSnap] = await Promise.all([
      adminFirestore.collection(col.bizProducts).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizProductCategories).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizUoms).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizProductVariants).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizProductBundles).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizBundleItems).where('tenantId', '==', tenantId).get(),
    ]);

    const categoryMap = new Map(categoriesSnap.docs.map((doc) => [doc.id, doc.data()]));
    const uomMap = new Map(uomsSnap.docs.map((doc) => [doc.id, doc.data()]));
    const variantsByProduct = new Map<string, Array<Record<string, unknown>>>();
    variantsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const key = String(data.productId ?? '');
      const arr = variantsByProduct.get(key) ?? [];
      arr.push({ id: doc.id, ...data });
      variantsByProduct.set(key, arr);
    });

    const bundleItemsByBundle = new Map<string, Array<Record<string, unknown>>>();
    bundleItemsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const key = String(data.bundleId ?? '');
      const arr = bundleItemsByBundle.get(key) ?? [];
      arr.push({ id: doc.id, ...data });
      bundleItemsByBundle.set(key, arr);
    });

    const bundlesByProduct = new Map<string, Array<Record<string, unknown>>>();
    bundlesSnap.docs.forEach((doc) => {
      const data = doc.data();
      const key = String(data.productId ?? '');
      const arr = bundlesByProduct.get(key) ?? [];
      arr.push({ id: doc.id, ...data, items: bundleItemsByBundle.get(doc.id) ?? [] });
      bundlesByProduct.set(key, arr);
    });

    const products = productsSnap.docs.map((doc) => {
      const data = doc.data();
      const category = categoryMap.get(String(data.categoryId ?? ''));
      const uom = uomMap.get(String(data.baseUomId ?? ''));
      const createdAt = String(data.createdAt ?? '');
      return {
        id: doc.id,
        ...data,
        createdAt,
        productCategory: category
          ? { id: String(data.categoryId), name: String(category.name ?? ''), code: String(category.code ?? '') }
          : null,
        baseUom: uom ? { id: String(data.baseUomId), name: String(uom.name ?? ''), symbol: String(uom.symbol ?? '') } : null,
        variants: variantsByProduct.get(doc.id) ?? [],
        bundleHeaders: bundlesByProduct.get(doc.id) ?? [],
      };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ ok: true, products });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(req);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(req));
    const body = createSchema.parse(await req.json());

    const normalizedName = body.name.trim();
    if (!normalizedName) {
      return NextResponse.json({ ok: false, error: 'Product name is required' }, { status: 400 });
    }

    const sameName = await adminFirestore
      .collection(col.bizProducts)
      .where('tenantId', '==', tenantId)
      .where('nameLower', '==', normalizedName.toLowerCase())
      .limit(1)
      .get();

    if (!sameName.empty) {
      return NextResponse.json({ ok: false, error: `Product '${normalizedName}' already exists`, duplicateField: 'name' }, { status: 409 });
    }

    let sku = body.sku?.toUpperCase();
    if (!sku) {
      const prefix = (body.skuPrefix ?? body.name.slice(0, 3)).toUpperCase().replace(/\s+/g, '');
      const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
      sku = `${prefix}-${suffix}`;
    }

    const sameSku = await adminFirestore
      .collection(col.bizProducts)
      .where('tenantId', '==', tenantId)
      .where('sku', '==', sku)
      .limit(1)
      .get();

    if (!sameSku.empty) {
      return NextResponse.json({ ok: false, error: `SKU '${sku}' is already in use`, duplicateField: 'sku' }, { status: 409 });
    }

    const id = makeId(col.bizProducts);
    const product = {
      id,
      tenantId,
      name: normalizedName,
      nameLower: normalizedName.toLowerCase(),
      description: body.description ?? null,
      sku,
      skuPrefix: body.skuPrefix ?? null,
      category: body.category ?? null,
      categoryId: body.categoryId ?? null,
      baseUomId: body.baseUomId ?? null,
      lifecycle: body.lifecycle,
      productType: body.productType,
      basePrice: body.basePrice ?? null,
      costPrice: body.costPrice ?? null,
      tags: body.tags ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    await adminFirestore.collection(col.bizProducts).doc(id).set(product);
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: e.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });

    const body = patchSchema.parse(await req.json());

    const ref = adminFirestore.collection(col.bizProducts).doc(id);
    const existing = await ref.get();
    if (!existing.exists || String(existing.data()?.tenantId ?? '') !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Product not found for tenant' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: nowIso() };

    if (body.name !== undefined) {
      const normalizedName = body.name.trim();
      if (!normalizedName) {
        return NextResponse.json({ ok: false, error: 'Product name is required' }, { status: 400 });
      }
      const duplicateName = await adminFirestore
        .collection(col.bizProducts)
        .where('tenantId', '==', tenantId)
        .where('nameLower', '==', normalizedName.toLowerCase())
        .limit(1)
        .get();

      if (!duplicateName.empty && duplicateName.docs[0].id !== id) {
        return NextResponse.json({ ok: false, error: `Product '${normalizedName}' already exists`, duplicateField: 'name' }, { status: 409 });
      }

      updates.name = normalizedName;
      updates.nameLower = normalizedName.toLowerCase();
    }

    if (body.sku !== undefined) {
      const normalizedSku = body.sku.trim().toUpperCase();
      if (!normalizedSku) {
        return NextResponse.json({ ok: false, error: 'SKU cannot be empty' }, { status: 400 });
      }

      const duplicateSku = await adminFirestore
        .collection(col.bizProducts)
        .where('tenantId', '==', tenantId)
        .where('sku', '==', normalizedSku)
        .limit(1)
        .get();

      if (!duplicateSku.empty && duplicateSku.docs[0].id !== id) {
        return NextResponse.json({ ok: false, error: `SKU '${normalizedSku}' is already in use`, duplicateField: 'sku' }, { status: 409 });
      }

      updates.sku = normalizedSku;
    }

    if (body.category !== undefined) updates.category = body.category.trim() || null;
    if (body.productType !== undefined) updates.productType = body.productType;
    if (body.lifecycle !== undefined) updates.lifecycle = body.lifecycle;
    if (body.description !== undefined) updates.description = body.description.trim() || null;
    if (body.basePrice !== undefined) updates.basePrice = body.basePrice;
    if (body.costPrice !== undefined) updates.costPrice = body.costPrice;
    if (body.categoryId !== undefined) updates.categoryId = body.categoryId || null;
    if (body.baseUomId !== undefined) updates.baseUomId = body.baseUomId || null;

    await ref.set(updates, { merge: true });
    const product = { id, ...(await ref.get()).data() };

    return NextResponse.json({ ok: true, product });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: e.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
