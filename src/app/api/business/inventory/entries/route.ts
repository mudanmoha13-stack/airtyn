import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { BUSINESS_DEFAULT_TENANT_ID, col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';

const stockStateSchema = z.enum(['on_hand', 'reserved', 'available', 'in_transit']);
const ownershipSchema = z.enum(['company', 'consignment', 'vendor_owned']);

const createEntrySchema = z.object({
  productSku: z.string().min(1),
  warehouse: z.string().min(1),
  stockState: stockStateSchema,
  ownershipType: ownershipSchema,
  quantity: z.number().min(0),
});

export async function GET() {
  try {
    await ensureBusinessTenantDoc();
    const [entriesSnap, productsSnap, warehousesSnap] = await Promise.all([
      adminFirestore.collection(col.bizStockItems).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).limit(200).get(),
      adminFirestore.collection(col.bizProducts).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).get(),
      adminFirestore.collection(col.bizWarehouses).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).get(),
    ]);
    const productMap = new Map(productsSnap.docs.map((doc) => [doc.id, doc.data()]));
    const warehouseMap = new Map(warehousesSnap.docs.map((doc) => [doc.id, doc.data()]));

    return NextResponse.json({
      ok: true,
      entries: entriesSnap.docs.map((entryDoc) => {
        const entry = entryDoc.data();
        const product = productMap.get(String(entry.productId ?? ''));
        const warehouse = warehouseMap.get(String(entry.warehouseId ?? ''));
        return {
          id: entryDoc.id,
          productSku: String(product?.sku ?? product?.name ?? ''),
          warehouse: String(warehouse?.name ?? ''),
          stockType: String(entry.stockState ?? ''),
          ownership: String(entry.ownershipType ?? ''),
          quantity: Number(entry.quantity ?? 0),
          updatedAt: String(entry.updatedAt ?? ''),
        };
      }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(({ updatedAt, ...entry }) => entry),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list inventory entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBusinessTenantDoc();
    const payload = createEntrySchema.parse(await request.json());

    const sku = payload.productSku.toUpperCase();
    const warehouseName = payload.warehouse.trim();

    const existingProduct = await adminFirestore
      .collection(col.bizProducts)
      .where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID)
      .where('sku', '==', sku)
      .limit(1)
      .get();
    const productId = existingProduct.empty ? makeId(col.bizProducts) : existingProduct.docs[0].id;
    if (existingProduct.empty) {
      await adminFirestore.collection(col.bizProducts).doc(productId).set({
        id: productId,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        name: sku,
        sku,
        productType: 'physical',
        category: 'general',
        lifecycle: 'active',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    const existingWarehouse = await adminFirestore
      .collection(col.bizWarehouses)
      .where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID)
      .where('name', '==', warehouseName)
      .limit(1)
      .get();
    const warehouseId = existingWarehouse.empty ? makeId(col.bizWarehouses) : existingWarehouse.docs[0].id;
    if (existingWarehouse.empty) {
      await adminFirestore.collection(col.bizWarehouses).doc(warehouseId).set({
        id: warehouseId,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        name: warehouseName,
        region: 'default',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    const key = `${productId}_${warehouseId}_${payload.stockState}`;
    const stockRef = adminFirestore.collection(col.bizStockItems).doc(key);
    await stockRef.set(
      {
        id: key,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        productId,
        warehouseId,
        stockState: payload.stockState,
        ownershipType: payload.ownershipType,
        quantity: FieldValue.increment(payload.quantity),
        updatedAt: nowIso(),
      },
      { merge: true }
    );

    const moveId = makeId(col.bizStockMoves);
    await adminFirestore.collection(col.bizStockMoves).doc(moveId).set({
      id: moveId,
      tenantId: BUSINESS_DEFAULT_TENANT_ID,
      productId,
      quantity: payload.quantity,
      moveType: payload.stockState === 'in_transit' ? 'transfer' : 'in',
      createdAt: nowIso(),
    });

    const stockSnap = await stockRef.get();
    const stockItem = { id: stockSnap.id, ...stockSnap.data() };

    return NextResponse.json({ ok: true, stockItem }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid inventory entry payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create inventory entry' }, { status: 500 });
  }
}
