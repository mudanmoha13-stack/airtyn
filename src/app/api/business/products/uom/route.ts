import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { businessPrisma, BUSINESS_DEFAULT_TENANT_ID, ensureBusinessTenant } from '@/lib/server/business-prisma';

const uomSchema = z.object({
  name: z.string().min(1),
  symbol: z.string().min(1),
  category: z.string().optional(),
});

const conversionSchema = z.object({
  fromUomId: z.string().min(1),
  toUomId: z.string().min(1),
  factor: z.number().positive(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeConversions = searchParams.get('conversions') === 'true';

    const uoms = await businessPrisma.invUoM.findMany({
      where: { tenantId: BUSINESS_DEFAULT_TENANT_ID },
      include: includeConversions
        ? {
            fromConversions: { include: { toUom: { select: { id: true, name: true, symbol: true } } } },
            toConversions:   { include: { fromUom: { select: { id: true, name: true, symbol: true } } } },
          }
        : undefined,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ ok: true, uoms });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureBusinessTenant();
    const { searchParams } = new URL(req.url);

    if (searchParams.get('conversion') === 'true') {
      const body = conversionSchema.parse(await req.json());
      const conversion = await businessPrisma.invUoMConversion.create({
        data: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          fromUomId: body.fromUomId,
          toUomId: body.toUomId,
          factor: body.factor,
        },
        include: {
          fromUom: { select: { id: true, name: true, symbol: true } },
          toUom:   { select: { id: true, name: true, symbol: true } },
        },
      });
      return NextResponse.json({ ok: true, conversion }, { status: 201 });
    }

    const body = uomSchema.parse(await req.json());
    const uom = await businessPrisma.invUoM.create({
      data: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        name: body.name,
        symbol: body.symbol.toLowerCase(),
        category: body.category,
      },
    });

    return NextResponse.json({ ok: true, uom }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: e.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
