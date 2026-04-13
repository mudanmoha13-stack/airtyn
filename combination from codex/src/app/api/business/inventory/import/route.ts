import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normaliseStockState(raw: string): 'on_hand' | 'reserved' | 'available' | 'in_transit' {
  const l = raw.toLowerCase();
  if (l.includes('transit')) return 'in_transit';
  if (l.includes('reserv')) return 'reserved';
  if (l.includes('avail')) return 'available';
  return 'on_hand';
}

function normaliseBool(raw: string): boolean {
  return ['yes', 'true', '1', 'y'].includes(raw.trim().toLowerCase());
}

// ─── schema ───────────────────────────────────────────────────────────────────

const rowSchema = z.object({
  name:         z.string().optional(),
  sku:          z.string().optional(),
  description:  z.string().optional(),
  unitPrice:    z.string().optional(),
  costPrice:    z.string().optional(),
  quantity:     z.string().optional(),
  reorderLevel: z.string().optional(),
  reorderTime:  z.string().optional(),
  reorderQty:   z.string().optional(),
  discontinued: z.string().optional(),
  warehouse:    z.string().optional(),
});

const bodySchema = z.object({
  rows: z.array(z.record(z.string())).min(1).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const body = bodySchema.parse(await request.json());

    // Values that indicate a header row accidentally slipped through
    const HEADER_MARKERS = new Set([
      'inventory id', 'inventoryid', 'name', 'product name', 'item name',
      'sku', 'sku / code', 'inventory id / sku',
    ]);

    const parsedRows = body.rows.map((r) => {
      try { return rowSchema.parse(r); } catch { return null; }
    }).filter((r): r is z.infer<typeof rowSchema> => {
      if (r === null) return false;
      const nameTrim = (r.name ?? '').trim();
      const skuTrim  = (r.sku ?? '').trim();
      // need at least one identifier
      if (!nameTrim && !skuTrim) return false;
      // skip header rows
      if (HEADER_MARKERS.has(nameTrim.toLowerCase())) return false;
      if (HEADER_MARKERS.has(skuTrim.toLowerCase())) return false;
      return true;
    });

    if (parsedRows.length === 0) {
      return NextResponse.json({ ok: false, error: 'No valid rows found' }, { status: 400 });
    }

    const batch = adminFirestore.batch();
    let imported = 0;

    for (const row of parsedRows) {
      // Resolve a human-readable name: prefer explicit name → description snippet → SKU
      const productName = row.name?.trim()
        || row.description?.trim()?.slice(0, 80)
        || (row.sku?.trim() ?? 'Unnamed Product');
      const sku = (row.sku?.trim() || productName).replace(/\s+/g, '-').toUpperCase();
      const warehouseName = (row.warehouse ?? 'Main Warehouse').trim();
      const qty = parseAmount(row.quantity ?? '0');
      const unitPrice = row.unitPrice ? parseAmount(row.unitPrice) : 0;
      const costPrice = row.costPrice ? parseAmount(row.costPrice) : null;

      // Upsert product
      const productSnap = await adminFirestore
        .collection(col.bizProducts)
        .where('tenantId', '==', tenantId)
        .where('sku', '==', sku)
        .limit(1)
        .get();

      const productId = productSnap.empty ? makeId(col.bizProducts) : productSnap.docs[0].id;

      if (productSnap.empty) {
        const productRef = adminFirestore.collection(col.bizProducts).doc(productId);
        batch.set(productRef, {
          id: productId,
          tenantId,
          name: productName,
          sku,
          description: row.description?.trim() ?? null,
          productType: 'physical',
          category: 'Imported',
          lifecycle: normaliseBool(row.discontinued ?? '') ? 'discontinued' : 'active',
          basePrice: unitPrice || null,
          costPrice: costPrice,
          reorderLevel: row.reorderLevel ? parseAmount(row.reorderLevel) : null,
          reorderTimeDays: row.reorderTime ? parseAmount(row.reorderTime) : null,
          reorderQty: row.reorderQty ? parseAmount(row.reorderQty) : null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      }

      // Upsert warehouse
      const warehouseSnap = await adminFirestore
        .collection(col.bizWarehouses)
        .where('tenantId', '==', tenantId)
        .where('name', '==', warehouseName)
        .limit(1)
        .get();

      const warehouseId = warehouseSnap.empty ? makeId(col.bizWarehouses) : warehouseSnap.docs[0].id;

      if (warehouseSnap.empty) {
        const whRef = adminFirestore.collection(col.bizWarehouses).doc(warehouseId);
        batch.set(whRef, {
          id: warehouseId,
          tenantId,
          name: warehouseName,
          code: warehouseName.slice(0, 6).toUpperCase(),
          active: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      }

      // Create stock item
      const stockItemId = makeId(col.bizStockItems);
      const stockRef = adminFirestore.collection(col.bizStockItems).doc(stockItemId);
      batch.set(stockRef, {
        id: stockItemId,
        tenantId,
        productId,
        warehouseId,
        stockState: normaliseStockState('On-hand'),
        ownershipType: 'company',
        quantity: qty,
        unitCost: costPrice ?? (unitPrice || null),
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: nowIso(),
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
