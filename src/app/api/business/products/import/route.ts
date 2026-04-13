import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normaliseProductType(raw: string): 'physical' | 'digital' | 'service' | 'bundle' {
  const l = raw.toLowerCase().trim();
  if (l === 'digital') return 'digital';
  if (l === 'service') return 'service';
  if (l === 'bundle') return 'bundle';
  return 'physical';
}

function slugifySku(raw: string): string {
  return raw.replace(/\s+/g, '-').toUpperCase();
}

// ─── schema ───────────────────────────────────────────────────────────────────

const rowSchema = z.object({
  name:        z.string().min(1),
  sku:         z.string().optional(),
  description: z.string().optional(),
  category:    z.string().optional(),
  basePrice:   z.string().optional(),
  costPrice:   z.string().optional(),
  productType: z.string().optional(),
});

const bodySchema = z.object({
  rows: z.array(z.record(z.string())).min(1).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const body = bodySchema.parse(await request.json());
    const parsedRows = body.rows.map((r) => {
      try { return rowSchema.parse(r); } catch { return null; }
    }).filter((r): r is z.infer<typeof rowSchema> => r !== null && r.name.trim().length > 0);

    if (parsedRows.length === 0) {
      return NextResponse.json({ ok: false, error: 'No valid rows found' }, { status: 400 });
    }

    // Cache categories we create in this batch to avoid duplicate fetches
    const categoryCache = new Map<string, string>(); // name → id

    let imported = 0;
    const batch = adminFirestore.batch();

    for (const row of parsedRows) {
      const sku = row.sku?.trim() ? slugifySku(row.sku) : slugifySku(row.name);

      // Deduplicate by SKU
      const existingSnap = await adminFirestore
        .collection(col.bizProducts)
        .where('tenantId', '==', tenantId)
        .where('sku', '==', sku)
        .limit(1)
        .get();

      if (!existingSnap.empty) continue; // skip duplicates

      // Ensure category
      let categoryId: string | null = null;
      if (row.category?.trim()) {
        const catName = row.category.trim();
        if (categoryCache.has(catName)) {
          categoryId = categoryCache.get(catName)!;
        } else {
          const catSnap = await adminFirestore
            .collection(col.bizProductCategories)
            .where('tenantId', '==', tenantId)
            .where('name', '==', catName)
            .limit(1)
            .get();

          if (catSnap.empty) {
            const newCatId = makeId(col.bizProductCategories);
            batch.set(adminFirestore.collection(col.bizProductCategories).doc(newCatId), {
              id: newCatId,
              tenantId,
              name: catName,
              code: catName.slice(0, 6).toUpperCase(),
              parentId: null,
              createdAt: nowIso(),
              updatedAt: nowIso(),
            });
            categoryId = newCatId;
          } else {
            categoryId = catSnap.docs[0].id;
          }

          categoryCache.set(catName, categoryId);
        }
      }

      const productId = makeId(col.bizProducts);
      batch.set(adminFirestore.collection(col.bizProducts).doc(productId), {
        id: productId,
        tenantId,
        name: row.name.trim(),
        sku,
        description: row.description?.trim() ?? null,
        productType: normaliseProductType(row.productType ?? ''),
        category: row.category?.trim() ?? 'Imported',
        categoryId: categoryId ?? null,
        lifecycle: 'active',
        basePrice: row.basePrice ? parseAmount(row.basePrice) : null,
        costPrice: row.costPrice ? parseAmount(row.costPrice) : null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });

      imported++;
    }

    await batch.commit();

    return NextResponse.json({ ok: true, imported });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid import payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Import failed' }, { status: 500 });
  }
}
