import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { businessPrisma, BUSINESS_DEFAULT_TENANT_ID, ensureBusinessTenant } from '@/lib/server/business-prisma';

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
  tags: z.array(z.string()).optional(),
});

const patchSchema = z.object({
  lifecycle: z.enum(['draft', 'active', 'discontinued', 'seasonal', 'archived']).optional(),
  description: z.string().optional(),
  basePrice: z.number().nonnegative().optional(),
  categoryId: z.string().optional(),
  baseUomId: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const products = await businessPrisma.invProduct.findMany({
      where: { tenantId: BUSINESS_DEFAULT_TENANT_ID },
      include: {
        productCategory: { select: { id: true, name: true, code: true } },
        baseUom: { select: { id: true, name: true, symbol: true } },
        variants: { select: { id: true, sku: true, attributeValues: true, additionalPrice: true, lifecycle: true } },
        bundleHeaders: { select: { id: true, name: true, description: true, items: { include: { componentProduct: { select: { id: true, name: true, sku: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, products });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureBusinessTenant();
    const body = createSchema.parse(await req.json());

    // Auto-generate SKU if not provided
    let sku = body.sku?.toUpperCase();
    if (!sku) {
      const prefix = (body.skuPrefix ?? body.name.slice(0, 3)).toUpperCase().replace(/\s+/g, '');
      const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
      sku = `${prefix}-${suffix}`;
    }

    const product = await businessPrisma.invProduct.create({
      data: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        name: body.name,
        description: body.description,
        sku,
        skuPrefix: body.skuPrefix,
        category: body.category,
        categoryId: body.categoryId ?? null,
        baseUomId: body.baseUomId ?? null,
        lifecycle: body.lifecycle,
        productType: body.productType,
        basePrice: body.basePrice ?? null,
        tags: body.tags ? body.tags : undefined,
      },
      include: {
        productCategory: { select: { id: true, name: true, code: true } },
        baseUom: { select: { id: true, name: true, symbol: true } },
      },
    });

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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });

    const body = patchSchema.parse(await req.json());

    const product = await businessPrisma.invProduct.update({
      where: { id },
      data: {
        ...(body.lifecycle ? { lifecycle: body.lifecycle } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.basePrice !== undefined ? { basePrice: body.basePrice } : {}),
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
        ...(body.baseUomId !== undefined ? { baseUomId: body.baseUomId } : {}),
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: e.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
