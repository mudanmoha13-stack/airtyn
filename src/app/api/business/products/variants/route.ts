import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { businessPrisma, BUSINESS_DEFAULT_TENANT_ID, ensureBusinessTenant } from '@/lib/server/business-prisma';

const createSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().optional(),
  attributeValues: z.record(z.string(), z.string()),
  additionalPrice: z.number().optional(),
  lifecycle: z.enum(['draft', 'active', 'discontinued', 'seasonal', 'archived']).default('active'),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    const variants = await businessPrisma.invProductVariant.findMany({
      where: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        ...(productId ? { productId } : {}),
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ok: true, variants });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureBusinessTenant();
    const body = createSchema.parse(await req.json());

    // Auto-generate variant SKU from product SKU + attribute suffix
    let sku = body.sku?.toUpperCase();
    if (!sku) {
      const product = await businessPrisma.invProduct.findUnique({ where: { id: body.productId }, select: { sku: true, name: true } });
      const base = (product?.sku ?? product?.name ?? 'VAR').slice(0, 8).toUpperCase();
      const attrSuffix = Object.values(body.attributeValues).map((v) => v.slice(0, 2).toUpperCase()).join('-');
      sku = `${base}-${attrSuffix}`;
    }

    const variant = await businessPrisma.invProductVariant.create({
      data: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        productId: body.productId,
        sku,
        attributeValues: body.attributeValues,
        additionalPrice: body.additionalPrice ?? null,
        lifecycle: body.lifecycle,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    return NextResponse.json({ ok: true, variant }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: e.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
