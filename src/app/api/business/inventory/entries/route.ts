import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  businessPrisma,
  ensureBusinessTenant,
  ensureInventoryProduct,
  ensureInventoryWarehouse,
  BUSINESS_DEFAULT_TENANT_ID,
} from '@/lib/server/business-prisma';

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
    await ensureBusinessTenant();
    const entries = await businessPrisma.invStockItem.findMany({
      where: { tenantId: BUSINESS_DEFAULT_TENANT_ID },
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      ok: true,
      entries: entries.map((entry) => ({
        id: entry.id,
        productSku: entry.product.sku ?? entry.product.name,
        warehouse: entry.warehouse.name,
        stockType: entry.stockState,
        ownership: entry.ownershipType,
        quantity: Number(entry.quantity),
      })),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list inventory entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBusinessTenant();
    const payload = createEntrySchema.parse(await request.json());

    const sku = payload.productSku.toUpperCase();
    const warehouseName = payload.warehouse.trim();

    const product = await ensureInventoryProduct(BUSINESS_DEFAULT_TENANT_ID, sku, sku);
    const warehouse = await ensureInventoryWarehouse(BUSINESS_DEFAULT_TENANT_ID, warehouseName);

    const stockItem = await businessPrisma.invStockItem.upsert({
      where: {
        productId_warehouseId_stockState: {
          productId: product.id,
          warehouseId: warehouse.id,
          stockState: payload.stockState,
        },
      },
      update: {
        quantity: { increment: payload.quantity },
        ownershipType: payload.ownershipType,
      },
      create: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        productId: product.id,
        warehouseId: warehouse.id,
        stockState: payload.stockState,
        ownershipType: payload.ownershipType,
        quantity: payload.quantity,
      },
    });

    await businessPrisma.invStockMove.create({
      data: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        productId: product.id,
        quantity: payload.quantity,
        moveType: payload.stockState === 'in_transit' ? 'transfer' : 'in',
      },
    });

    return NextResponse.json({ ok: true, stockItem }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid inventory entry payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create inventory entry' }, { status: 500 });
  }
}
