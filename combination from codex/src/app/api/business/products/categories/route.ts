import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessTenantId } from '@/lib/server/business-tenant';

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  parentId: z.string().optional(),
});

type ProductCategoryDoc = {
  id: string;
  name?: string;
  code?: string;
  parentId?: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    const [categoriesSnap, productsSnap] = await Promise.all([
      adminFirestore.collection(col.bizProductCategories).where('tenantId', '==', tenantId).orderBy('name', 'asc').get(),
      adminFirestore.collection(col.bizProducts).where('tenantId', '==', tenantId).get(),
    ]);

    const categories: ProductCategoryDoc[] = categoriesSnap.docs.map((doc) => {
      const data = doc.data() as Omit<ProductCategoryDoc, 'id'>;
      return { id: doc.id, ...data };
    });
    const countByCategory = new Map<string, number>();

    productsSnap.docs.forEach((doc) => {
      const categoryId = String(doc.data().categoryId ?? '');
      if (!categoryId) return;
      countByCategory.set(categoryId, (countByCategory.get(categoryId) ?? 0) + 1);
    });

    return NextResponse.json({
      ok: true,
      categories: categories.map((category) => ({
        ...category,
        parent: category.parentId ? categories.find((c) => c.id === category.parentId) ?? null : null,
        children: categories
          .filter((c) => c.parentId === category.id)
          .map((c) => ({ id: c.id, name: c.name ?? '', code: c.code ?? '' })),
        _count: { products: countByCategory.get(String(category.id)) ?? 0 },
      })),
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

    const normalizedName = body.name.trim();
    if (!normalizedName) {
      return NextResponse.json({ ok: false, error: 'Category name is required' }, { status: 400 });
    }

    const existing = await adminFirestore
      .collection(col.bizProductCategories)
      .where('tenantId', '==', tenantId)
      .where('nameLower', '==', normalizedName.toLowerCase())
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { ok: false, error: `Category '${normalizedName}' already exists`, duplicateField: 'name' },
        { status: 409 }
      );
    }

    const id = makeId(col.bizProductCategories);
    const category = {
      id,
      tenantId,
      name: normalizedName,
      nameLower: normalizedName.toLowerCase(),
      code: body.code ?? normalizedName.slice(0, 4).toUpperCase().replace(/\s+/g, ''),
      parentId: body.parentId ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    await adminFirestore.collection(col.bizProductCategories).doc(id).set(category);
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: e.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
