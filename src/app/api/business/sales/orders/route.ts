import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const createOrderSchema = z.object({
  employeeId: z.string().min(1),
  currency: z.string().min(1).default('USD'),
  channel: z.enum(['pos', 'warehouse', 'ecommerce']).default('pos'),
  status: z.enum(['draft', 'open', 'settled', 'closed', 'canceled']).default('open'),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(3),
  }),
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

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const [ordersSnap, linesSnap, paymentsSnap, productsSnap, employeesSnap, usersSnap] = await Promise.all([
      adminFirestore.collection(col.bizOrders).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizOrderLines).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizPayments).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizProducts).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizEmployees).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizUsers).where('tenantId', '==', tenantId).get(),
    ]);

    const linesByOrder = new Map<string, Array<Record<string, unknown>>>();
    linesSnap.docs.forEach((doc) => {
      const data = doc.data();
      const orderId = String(data.orderId ?? '');
      const arr = linesByOrder.get(orderId) ?? [];
      arr.push({ id: doc.id, ...data });
      linesByOrder.set(orderId, arr);
    });
    const paymentsByOrder = new Map<string, Array<Record<string, unknown>>>();
    paymentsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const orderId = String(data.orderId ?? '');
      const arr = paymentsByOrder.get(orderId) ?? [];
      arr.push({ id: doc.id, ...data });
      paymentsByOrder.set(orderId, arr);
    });
    const productMap = new Map(productsSnap.docs.map((doc) => [doc.id, doc.data()]));
    const employeeMap = new Map(employeesSnap.docs.map((doc) => [doc.id, doc.data()]));
    const userMap = new Map(usersSnap.docs.map((doc) => [doc.id, doc.data()]));

    return NextResponse.json({
      ok: true,
      orders: ordersSnap.docs.map((orderDoc) => {
        const order = orderDoc.data();
        const employee = employeeMap.get(String(order.employeeId ?? ''));
        const user = userMap.get(String(employee?.userId ?? ''));
        return {
          id: orderDoc.id,
          orderNo: String(order.orderNo ?? ''),
          employeeId: String(order.employeeId ?? ''),
          employeeName: user
            ? `${String(user.firstName ?? '')} ${String(user.lastName ?? '')}`.trim() || String(user.email ?? 'Unknown Employee')
            : String(employee?.name ?? 'Unknown Employee'),
          currency: String(order.currency ?? 'USD'),
          channel: String(order.channel ?? 'pos'),
          status: String(order.status ?? 'open'),
          total: Number(order.total ?? 0),
          costTotal: Number(order.costTotal ?? 0),
          customerName: String(order.customerName ?? ''),
          customerEmail: String(order.customerEmail ?? ''),
          customerPhone: String(order.customerPhone ?? ''),
          createdAt: String(order.createdAt ?? nowIso()),
          lines: (linesByOrder.get(orderDoc.id) ?? []).map((line) => {
            const product = productMap.get(String(line.productId ?? ''));
            return {
              id: String(line.id ?? ''),
              productId: String(line.productId ?? ''),
              productName: String(product?.name ?? ''),
              productSku: String(product?.sku ?? ''),
              quantity: Number(line.quantity ?? 0),
              unitPrice: Number(line.unitPrice ?? 0),
              lineTotal: Number(line.lineTotal ?? 0),
            };
          }),
          payments: (paymentsByOrder.get(orderDoc.id) ?? []).map((payment) => ({
            id: String(payment.id ?? ''),
            method: String(payment.method ?? ''),
            amount: Number(payment.amount ?? 0),
            reference: payment.reference ? String(payment.reference) : undefined,
          })),
        };
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list sales orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = createOrderSchema.parse(await request.json());

    const orderNo = `SO-${Date.now().toString().slice(-8)}`;

    const productIds = Array.from(new Set(payload.lines.map((line) => line.productId)));
    const productSnaps = await Promise.all(productIds.map((id) => adminFirestore.collection(col.bizProducts).doc(id).get()));
    const invalidProduct = productSnaps.find((snap) => !snap.exists || String(snap.data()?.tenantId ?? '') !== tenantId);
    if (invalidProduct) {
      return NextResponse.json({ ok: false, error: `Product ${invalidProduct.id} not found for tenant.` }, { status: 404 });
    }
    const productPrice = new Map(productSnaps.filter((snap) => snap.exists).map((snap) => [snap.id, Number(snap.data()?.basePrice ?? 0)]));
    const productCost = new Map(productSnaps.filter((snap) => snap.exists).map((snap) => [snap.id, Number(snap.data()?.costPrice ?? 0)]));

    const preparedLines = payload.lines.map((line) => {
      const unitPrice = line.unitPrice ?? productPrice.get(line.productId) ?? 0;
      const unitCost = productCost.get(line.productId) ?? 0;
      const lineTotal = unitPrice * line.quantity;
      const lineCostTotal = unitCost * line.quantity;
      return {
        productId: line.productId,
        quantity: line.quantity,
        unitPrice,
        unitCost,
        lineTotal,
        lineCostTotal,
      };
    });

    if (payload.status === 'settled' || payload.status === 'closed') {
      for (const line of preparedLines) {
        const stockSnap = await adminFirestore
          .collection(col.bizStockItems)
          .where('tenantId', '==', tenantId)
          .where('productId', '==', line.productId)
          .get();

        const stockDocs: Array<{ id: string; stockState: string; quantity: number }> = stockSnap.docs
          .map((doc) => {
            const data = doc.data() as Record<string, unknown>;
            return {
              id: doc.id,
              stockState: String(data.stockState ?? ''),
              quantity: Number(data.quantity ?? 0),
            };
          })
          .filter((item) => item.stockState === 'available' || item.stockState === 'on_hand')
          .sort((a, b) => String(a.stockState).localeCompare(String(b.stockState)));

        const availableQty = stockDocs.reduce((sum, item) => sum + item.quantity, 0);
        if (availableQty < line.quantity) {
          return NextResponse.json(
            { ok: false, error: `Insufficient stock for product ${line.productId}. Available ${availableQty}, requested ${line.quantity}.` },
            { status: 400 }
          );
        }

        let remaining = line.quantity;
        for (const stockItem of stockDocs) {
          if (remaining <= 0) break;
          const currentQty = Number(stockItem.quantity ?? 0);
          if (currentQty <= 0) continue;
          const deduct = Math.min(currentQty, remaining);
          await adminFirestore.collection(col.bizStockItems).doc(String(stockItem.id)).set(
            {
              quantity: FieldValue.increment(-deduct),
              updatedAt: nowIso(),
            },
            { merge: true }
          );
          remaining -= deduct;
        }

        const moveId = makeId(col.bizStockMoves);
        await adminFirestore.collection(col.bizStockMoves).doc(moveId).set({
          id: moveId,
          tenantId,
          productId: line.productId,
          quantity: line.quantity,
          moveType: 'out',
          createdAt: nowIso(),
        });
      }
    }

    const total = preparedLines.reduce((sum, line) => sum + line.lineTotal, 0);
    const costTotal = preparedLines.reduce((sum, line) => sum + line.lineCostTotal, 0);

    const orderId = makeId(col.bizOrders);
    await adminFirestore.collection(col.bizOrders).doc(orderId).set({
      id: orderId,
      tenantId,
      employeeId: payload.employeeId,
      orderNo,
      currency: payload.currency,
      channel: payload.channel,
      status: payload.status,
      customerName: payload.customer.name,
      customerEmail: payload.customer.email,
      customerPhone: payload.customer.phone,
      total,
      costTotal,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    const lineWrites = preparedLines.map((line) => {
      const lineId = makeId(col.bizOrderLines);
      return adminFirestore.collection(col.bizOrderLines).doc(lineId).set({
        id: lineId,
        tenantId,
        orderId,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        unitCost: line.unitCost,
        lineTotal: line.lineTotal,
      });
    });

    const paymentWrites = payload.payments
      .filter((payment) => payment.amount > 0)
      .map((payment) => {
        const paymentId = makeId(col.bizPayments);
        return adminFirestore.collection(col.bizPayments).doc(paymentId).set({
          id: paymentId,
          tenantId,
          orderId,
          method: payment.method,
          amount: payment.amount,
          reference: payment.reference ?? null,
        });
      });

    await Promise.all([...lineWrites, ...paymentWrites]);

    return NextResponse.json({ ok: true, id: orderId, orderNo }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid sales order payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create sales order' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    const payload = patchSchema.parse(await request.json());

    const orderRef = adminFirestore.collection(col.bizOrders).doc(payload.id);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists || String(orderSnap.data()?.tenantId ?? '') !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Order not found for tenant' }, { status: 404 });
    }

    await orderRef.set({ status: payload.status, updatedAt: nowIso() }, { merge: true });
    return NextResponse.json({ ok: true, id: payload.id, status: payload.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid sales order update payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to update sales order' }, { status: 500 });
  }
}
