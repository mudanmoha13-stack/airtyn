import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { businessPrisma, BUSINESS_DEFAULT_TENANT_ID, ensureBusinessTenant } from '@/lib/server/business-prisma';

const createOrderSchema = z.object({
  employeeId: z.string().min(1),
  currency: z.string().min(1).default('USD'),
  channel: z.enum(['pos', 'warehouse', 'ecommerce']).default('pos'),
  status: z.enum(['draft', 'open', 'settled', 'closed', 'canceled']).default('open'),
  lines: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative().optional(),
  })).min(1),
  payments: z.array(z.object({
    method: z.enum(['cash', 'card', 'wallet', 'bank']),
    amount: z.number().nonnegative(),
    reference: z.string().optional(),
  })).default([]),
});

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['draft', 'open', 'settled', 'closed', 'canceled']),
});

export async function GET() {
  try {
    await ensureBusinessTenant();

    const orders = await businessPrisma.saleOrder.findMany({
      where: { tenantId: BUSINESS_DEFAULT_TENANT_ID },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        lines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                basePrice: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      ok: true,
      orders: orders.map((order) => ({
        id: order.id,
        orderNo: order.orderNo,
        employeeId: order.employeeId,
        employeeName: order.employee?.user
          ? `${order.employee.user.firstName ?? ''} ${order.employee.user.lastName ?? ''}`.trim() || order.employee.user.email
          : 'Unknown Employee',
        currency: order.currency,
        channel: order.channel,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
        lines: order.lines.map((line) => ({
          id: line.id,
          productId: line.productId,
          productName: line.product.name,
          productSku: line.product.sku,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          lineTotal: Number(line.lineTotal),
        })),
        payments: order.payments.map((payment) => ({
          id: payment.id,
          method: payment.method,
          amount: Number(payment.amount),
          reference: payment.reference,
        })),
      })),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list sales orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBusinessTenant();
    const payload = createOrderSchema.parse(await request.json());

    const orderNo = `SO-${Date.now().toString().slice(-8)}`;

    const productIds = payload.lines.map((line) => line.productId);
    const products = await businessPrisma.invProduct.findMany({
      where: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        id: { in: productIds },
      },
      select: {
        id: true,
        basePrice: true,
      },
    });

    const productPrice = new Map(products.map((product) => [product.id, product.basePrice ? Number(product.basePrice) : 0]));

    const preparedLines = payload.lines.map((line) => {
      const unitPrice = line.unitPrice ?? productPrice.get(line.productId) ?? 0;
      const lineTotal = unitPrice * line.quantity;
      return {
        productId: line.productId,
        quantity: line.quantity,
        unitPrice,
        lineTotal,
      };
    });

    const total = preparedLines.reduce((sum, line) => sum + line.lineTotal, 0);

    const order = await businessPrisma.saleOrder.create({
      data: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        employeeId: payload.employeeId,
        orderNo,
        currency: payload.currency,
        channel: payload.channel,
        status: payload.status,
        total,
        lines: {
          create: preparedLines.map((line) => ({
            tenantId: BUSINESS_DEFAULT_TENANT_ID,
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          })),
        },
        payments: {
          create: payload.payments
            .filter((payment) => payment.amount > 0)
            .map((payment) => ({
              tenantId: BUSINESS_DEFAULT_TENANT_ID,
              method: payment.method,
              amount: payment.amount,
              reference: payment.reference,
            })),
        },
      },
    });

    return NextResponse.json({ ok: true, id: order.id, orderNo: order.orderNo }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid sales order payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create sales order' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = patchSchema.parse(await request.json());

    const order = await businessPrisma.saleOrder.update({
      where: { id: payload.id },
      data: { status: payload.status },
    });

    return NextResponse.json({ ok: true, id: order.id, status: order.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid sales order update payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to update sales order' }, { status: 500 });
  }
}
