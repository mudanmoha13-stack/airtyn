import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { businessPrisma, BUSINESS_DEFAULT_TENANT_ID, ensureBusinessTenant } from '@/lib/server/business-prisma';

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  parentId: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const categories = await businessPrisma.invProductCategory.findMany({
      where: { tenantId: BUSINESS_DEFAULT_TENANT_ID },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, code: true } },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ ok: true, categories });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureBusinessTenant();
    const body = createSchema.parse(await req.json());

    // Auto-derive code from name if not provided
    const code = (body.code ?? body.name.slice(0, 4).toUpperCase().replace(/\s+/g, ''));

    const category = await businessPrisma.invProductCategory.create({
      data: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        name: body.name,
        code,
        parentId: body.parentId ?? null,
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: e.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
