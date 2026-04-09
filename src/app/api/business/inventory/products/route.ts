import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { businessPrisma, ensureBusinessTenant, BUSINESS_DEFAULT_TENANT_ID } from '@/lib/server/business-prisma';

const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  productType: z.string().default('physical'),
  category: z.string().default('general'),
});

export async function GET() {
  try {
    await ensureBusinessTenant();
    const products = await businessPrisma.invProduct.findMany({
      where: { tenantId: BUSINESS_DEFAULT_TENANT_ID },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ ok: true, products });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBusinessTenant();
    const payload = createProductSchema.parse(await request.json());

    const product = await businessPrisma.invProduct.create({
      data: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        name: payload.name,
        sku: payload.sku.toUpperCase(),
        productType: payload.productType,
        category: payload.category,
        lifecycle: 'active',
      },
    });

    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid product payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create product' }, { status: 500 });
  }
}
