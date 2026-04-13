import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

function inferKitchenStation(productName: string, categoryName: string): string {
  const source = `${productName} ${categoryName}`.toLowerCase();
  if (/drink|juice|soda|tea|coffee|cocktail|bar/.test(source)) return 'drinks';
  if (/salad|dessert|ice cream|fruit/.test(source)) return 'cold';
  if (/fry|fries|burger|steak|grill|bbq/.test(source)) return 'grill';
  if (/soup|pasta|rice|stew|pizza|hot/.test(source)) return 'hot';
  return 'pass';
}

function inferStationSlaMinutes(station: string): number {
  if (station === 'drinks') return 4;
  if (station === 'cold') return 6;
  if (station === 'pass') return 3;
  if (station === 'grill') return 14;
  return 10;
}

const closeDineInSchema = z.object({
  sessionId: z.string().min(1),
  branchId: z.string().min(1),
  tableId: z.string().min(1),
  servedByEmployeeId: z.string().min(1),
  reservationId: z.string().optional(),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
  lines: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative().optional(),
    notes: z.string().optional(),
  })).min(1),
  payments: z.array(z.object({
    method: z.enum(['cash', 'card', 'wallet', 'bank']),
    amount: z.number().nonnegative(),
    reference: z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = closeDineInSchema.parse(await request.json());

    const [sessionSnap, tableSnap] = await Promise.all([
      adminFirestore.collection(col.bizRestaurantPosSessions).doc(payload.sessionId).get(),
      adminFirestore.collection(col.bizRestaurantTables).doc(payload.tableId).get(),
    ]);

    if (!sessionSnap.exists || String(sessionSnap.data()?.tenantId ?? '') !== tenantId || String(sessionSnap.data()?.status ?? '') !== 'open') {
      return NextResponse.json({ ok: false, error: 'Active POS session not found for tenant' }, { status: 404 });
    }

    if (!tableSnap.exists || String(tableSnap.data()?.tenantId ?? '') !== tenantId || String(tableSnap.data()?.branchId ?? '') !== payload.branchId) {
      return NextResponse.json({ ok: false, error: 'Table not found for branch/tenant' }, { status: 404 });
    }

    const productIds = Array.from(new Set(payload.lines.map((line) => line.productId)));
    const productSnaps = await Promise.all(productIds.map((id) => adminFirestore.collection(col.bizProducts).doc(id).get()));
    const invalidProduct = productSnaps.find((snap) => !snap.exists || String(snap.data()?.tenantId ?? '') !== tenantId);
    if (invalidProduct) {
      return NextResponse.json({ ok: false, error: `Product ${invalidProduct.id} not found for tenant.` }, { status: 404 });
    }

    const productPrice = new Map(productSnaps.filter((snap) => snap.exists).map((snap) => [snap.id, Number(snap.data()?.basePrice ?? 0)]));
    const productCost = new Map(productSnaps.filter((snap) => snap.exists).map((snap) => [snap.id, Number(snap.data()?.costPrice ?? 0)]));
    const productName = new Map(productSnaps.filter((snap) => snap.exists).map((snap) => [snap.id, String(snap.data()?.name ?? '')]));
    const productCategory = new Map(productSnaps.filter((snap) => snap.exists).map((snap) => [snap.id, String(snap.data()?.category ?? '')]));

    const preparedLines = payload.lines.map((line) => {
      const unitPrice = line.unitPrice ?? productPrice.get(line.productId) ?? 0;
      const unitCost = productCost.get(line.productId) ?? 0;
      return {
        ...line,
        unitPrice,
        unitCost,
        lineTotal: unitPrice * line.quantity,
        lineCostTotal: unitCost * line.quantity,
      };
    });

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
        source: 'dine_in_sale',
        createdAt: nowIso(),
      });
    }

    const total = preparedLines.reduce((sum, line) => sum + line.lineTotal, 0);
    const costTotal = preparedLines.reduce((sum, line) => sum + line.lineCostTotal, 0);
    const paidTotal = payload.payments.reduce((sum, payment) => sum + payment.amount, 0);

    if (paidTotal + 0.001 < total) {
      return NextResponse.json({ ok: false, error: `Insufficient payment. Total ${total.toFixed(2)}, paid ${paidTotal.toFixed(2)}.` }, { status: 400 });
    }

    const orderId = makeId(col.bizOrders);
    const orderNo = `DIN-${Date.now().toString().slice(-8)}`;
    await adminFirestore.collection(col.bizOrders).doc(orderId).set({
      id: orderId,
      tenantId,
      employeeId: payload.servedByEmployeeId,
      orderNo,
      currency: 'KES',
      channel: 'pos',
      orderType: 'dine_in',
      branchId: payload.branchId,
      sessionId: payload.sessionId,
      tableId: payload.tableId,
      reservationId: payload.reservationId ?? null,
      status: 'settled',
      customerName: payload.customer.name,
      customerEmail: payload.customer.email ?? null,
      customerPhone: payload.customer.phone ?? null,
      notes: payload.notes?.trim() ?? null,
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
        notes: line.notes?.trim() ?? null,
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
          createdAt: nowIso(),
        });
      });

    const ticketId = makeId(col.bizRestaurantKitchenTickets);
    const kitchenLines = preparedLines.map((line) => {
      const station = inferKitchenStation(productName.get(line.productId) ?? '', productCategory.get(line.productId) ?? '');
      return {
        id: makeId(col.bizRestaurantKitchenTickets),
        productId: line.productId,
        productName: productName.get(line.productId) ?? '',
        qty: line.quantity,
        status: 'queued',
        station,
        slaMinutes: inferStationSlaMinutes(station),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
    });
    const ticketWrites = adminFirestore.collection(col.bizRestaurantKitchenTickets).doc(ticketId).set({
      id: ticketId,
      tenantId,
      branchId: payload.branchId,
      tableId: payload.tableId,
      orderId,
      status: 'queued',
      stationSummary: Array.from(new Set(kitchenLines.map((line) => line.station))),
      lines: kitchenLines,
      slaTargetMinutes: Math.max(...kitchenLines.map((line) => line.slaMinutes), 0),
      lifecycle: [
        {
          action: 'queued',
          status: 'queued',
          station: null,
          notes: payload.notes?.trim() ?? null,
          at: nowIso(),
        },
      ],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    await Promise.all([...lineWrites, ...paymentWrites, ticketWrites]);

    await adminFirestore.collection(col.bizRestaurantTables).doc(payload.tableId).set(
      {
        status: 'available',
        currentOrderId: null,
        currentReservationId: null,
        updatedAt: nowIso(),
      },
      { merge: true }
    );

    if (payload.reservationId) {
      await adminFirestore.collection(col.bizRestaurantReservations).doc(payload.reservationId).set(
        {
          status: 'completed',
          updatedAt: nowIso(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true, orderId, orderNo, total, paidTotal, change: Number((paidTotal - total).toFixed(2)) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid dine-in close payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to close dine-in order' }, { status: 500 });
  }
}
