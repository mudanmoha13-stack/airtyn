import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { businessPrisma, BUSINESS_DEFAULT_TENANT_ID, ensureBusinessTenant } from '@/lib/server/business-prisma';

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

export async function GET(_req: NextRequest) {
  try {
    const bundles = await businessPrisma.invProductBundle.findMany({
      where: { tenantId: BUSINESS_DEFAULT_TENANT_ID },
      include: {
        product: { select: { id: true, name: true, sku: true, lifecycle: true } },
        items: {
          include: {
            componentProduct: { select: { id: true, name: true, sku: true, productType: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ok: true, bundles });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureBusinessTenant();
    const body = createBundleSchema.parse(await req.json());

    const bundle = await businessPrisma.invProductBundle.create({
      data: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        productId: body.productId,
        name: body.name,
        description: body.description,
        items: {
          create: body.items.map((item) => ({
            componentProductId: item.componentProductId,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        items: {
          include: {
            componentProduct: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    return NextResponse.json({ ok: true, bundle }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: e.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
