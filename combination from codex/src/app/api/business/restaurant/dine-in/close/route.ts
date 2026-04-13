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

function stationSequence(station: string): number {
  if (station === 'cold' || station === 'drinks') return 1;
  if (station === 'grill') return 2;
  if (station === 'hot') return 3;
  return 4;
}

function fireOffsetMinutes(station: string): number {
  if (station === 'cold' || station === 'drinks') return 0;
  if (station === 'grill') return 4;
  if (station === 'hot') return 7;
  return 9;
}

const closeDineInSchema = z.object({
  sessionId: z.string().min(1).optional(),
  branchId: z.string().min(1),
  tableId: z.string().min(1),
  servedByEmployeeId: z.string().min(1),
  waiterId: z.string().optional(),
  waiterName: z.string().optional(),
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

async function resolveActiveSessionId({
  tenantId,
  branchId,
  requestedSessionId,
  servedByEmployeeId,
}: {
  tenantId: string;
  branchId: string;
  requestedSessionId?: string;
  servedByEmployeeId: string;
}) {
  if (requestedSessionId) {
    const requestedSnap = await adminFirestore.collection(col.bizRestaurantPosSessions).doc(requestedSessionId).get();
    if (
      requestedSnap.exists
      && String(requestedSnap.data()?.tenantId ?? '') === tenantId
      && String(requestedSnap.data()?.status ?? '') === 'open'
    ) {
      return requestedSessionId;
    }
  }

  const existingOpenSnap = await adminFirestore
    .collection(col.bizRestaurantPosSessions)
    .where('tenantId', '==', tenantId)
    .where('branchId', '==', branchId)
    .where('status', '==', 'open')
    .limit(1)
    .get();

  if (!existingOpenSnap.empty) {
    return existingOpenSnap.docs[0].id;
  }

  const autoSessionId = makeId(col.bizRestaurantPosSessions);
  await adminFirestore.collection(col.bizRestaurantPosSessions).doc(autoSessionId).set({
    id: autoSessionId,
    tenantId,
    branchId,
    terminalName: 'Built-in POS',
    status: 'open',
    openedByUserId: servedByEmployeeId,
    openingCash: 0,
    autoManaged: true,
    openedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return autoSessionId;
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = closeDineInSchema.parse(await request.json());

    const resolvedSessionId = await resolveActiveSessionId({
      tenantId,
      branchId: payload.branchId,
      requestedSessionId: payload.sessionId,
      servedByEmployeeId: payload.servedByEmployeeId,
    });

    const usesPhysicalTable = payload.tableId !== 'counter';
    const tableSnap = usesPhysicalTable
      ? await adminFirestore.collection(col.bizRestaurantTables).doc(payload.tableId).get()
      : null;

    if (usesPhysicalTable && (!tableSnap?.exists || String(tableSnap.data()?.tenantId ?? '') !== tenantId || String(tableSnap.data()?.branchId ?? '') !== payload.branchId)) {
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

    const recipeBundleSnaps = await Promise.all(
      productIds.map(async (productId) => {
        const snap = await adminFirestore
          .collection(col.bizProductBundles)
          .where('tenantId', '==', tenantId)
          .where('productId', '==', productId)
          .limit(1)
          .get();
        return { productId, bundle: snap.empty ? null : snap.docs[0] };
      })
    );

    const recipeBundleMap = new Map(recipeBundleSnaps.map((item) => [item.productId, item.bundle]));
    const recipeBundleIds = recipeBundleSnaps.map((item) => item.bundle?.id).filter((value): value is string => Boolean(value));
    const recipeItemSnaps = recipeBundleIds.length > 0
      ? await Promise.all(
          recipeBundleIds.map((bundleId) =>
            adminFirestore.collection(col.bizBundleItems).where('tenantId', '==', tenantId).where('bundleId', '==', bundleId).get()
          )
        )
      : [];

    const recipeItemsByBundle = new Map<string, Array<Record<string, unknown>>>();
    recipeItemSnaps.forEach((snap) => {
      snap.docs.forEach((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const key = String(data.bundleId ?? '');
        const existing = recipeItemsByBundle.get(key) ?? [];
        existing.push({ id: doc.id, ...data });
        recipeItemsByBundle.set(key, existing);
      });
    });

    const preparedLines = payload.lines.map((line) => {
      const unitPrice = line.unitPrice ?? productPrice.get(line.productId) ?? 0;
      const unitCost = productCost.get(line.productId) ?? 0;
      const recipeBundle = recipeBundleMap.get(line.productId);
      const recipeItems = recipeBundle ? recipeItemsByBundle.get(recipeBundle.id) ?? [] : [];
      return {
        ...line,
        unitPrice,
        unitCost,
        lineTotal: unitPrice * line.quantity,
        lineCostTotal: unitCost * line.quantity,
        recipeBundleId: recipeBundle?.id ?? null,
        recipeItems,
      };
    });

    for (const line of preparedLines) {
      const consumptionItems = line.recipeItems.length > 0
        ? line.recipeItems.map((item) => ({
            productId: String(item.componentProductId ?? ''),
            quantity: Number(item.quantity ?? 0) * line.quantity,
            sourceProductId: line.productId,
            sourceType: 'recipe_component' as const,
          }))
        : [{ productId: line.productId, quantity: line.quantity, sourceProductId: line.productId, sourceType: 'direct_product' as const }];

      for (const consumptionItem of consumptionItems) {
        const stockSnap = await adminFirestore
          .collection(col.bizStockItems)
          .where('tenantId', '==', tenantId)
          .where('productId', '==', consumptionItem.productId)
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
        if (availableQty < consumptionItem.quantity) {
          return NextResponse.json(
            { ok: false, error: `Insufficient stock for product ${consumptionItem.productId}. Available ${availableQty}, requested ${consumptionItem.quantity}.` },
            { status: 400 }
          );
        }

        let remaining = consumptionItem.quantity;
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
          productId: consumptionItem.productId,
          quantity: consumptionItem.quantity,
          moveType: 'out',
          source: consumptionItem.sourceType === 'recipe_component' ? 'recipe_consumption' : 'dine_in_sale',
          sourceProductId: consumptionItem.sourceProductId,
          createdAt: nowIso(),
        });
      }
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
      orderType: usesPhysicalTable ? 'dine_in' : 'counter',
      branchId: payload.branchId,
      sessionId: resolvedSessionId,
      tableId: usesPhysicalTable ? payload.tableId : null,
      reservationId: payload.reservationId ?? null,
      waiterId: payload.waiterId ?? payload.servedByEmployeeId,
      waiterName: payload.waiterName?.trim() ?? null,
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
        recipeBundleId: line.recipeBundleId,
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
    const createdAt = nowIso();
    const kitchenLines = preparedLines.map((line) => {
      const station = inferKitchenStation(productName.get(line.productId) ?? '', productCategory.get(line.productId) ?? '');
      const fireInMinutes = fireOffsetMinutes(station);
      return {
        id: makeId(col.bizRestaurantKitchenTickets),
        productId: line.productId,
        productName: productName.get(line.productId) ?? '',
        qty: line.quantity,
        status: 'queued',
        station,
        stationSequence: stationSequence(station),
        fireAt: new Date(Date.now() + fireInMinutes * 60_000).toISOString(),
        fireInMinutes,
        slaMinutes: inferStationSlaMinutes(station),
        createdAt,
        updatedAt: createdAt,
      };
    });
    const ticketWrites = adminFirestore.collection(col.bizRestaurantKitchenTickets).doc(ticketId).set({
      id: ticketId,
      tenantId,
      branchId: payload.branchId,
      tableId: usesPhysicalTable ? payload.tableId : null,
      orderId,
      waiterId: payload.waiterId ?? payload.servedByEmployeeId,
      waiterName: payload.waiterName?.trim() ?? null,
      status: 'queued',
      stationSummary: Array.from(new Set(kitchenLines.map((line) => line.station))),
      serviceMode: payload.reservationId ? 'reservation' : usesPhysicalTable ? 'walk_in' : 'counter',
      lines: kitchenLines,
      slaTargetMinutes: Math.max(...kitchenLines.map((line) => line.slaMinutes), 0),
      nextFireAt: kitchenLines.slice().sort((a, b) => String(a.fireAt).localeCompare(String(b.fireAt)))[0]?.fireAt ?? createdAt,
      lifecycle: [
        {
          action: 'queued',
          status: 'queued',
          station: null,
          notes: payload.notes?.trim() ?? null,
          at: createdAt,
        },
      ],
      createdAt,
      updatedAt: createdAt,
    });

    await Promise.all([...lineWrites, ...paymentWrites, ticketWrites]);

    // Phase 4: Calculate labor cost and post accounting entries
    const kitchenMinutes = Math.max(
      ...kitchenLines.map((line) => {
        const station = line.station;
        if (station === 'cold' || station === 'drinks') return 6;
        if (station === 'grill') return 14;
        if (station === 'hot') return 10;
        return 8;
      }),
      0
    );

    const serviceMode = payload.reservationId ? 'reservation' : 'walk_in';

    // Create labor cost record
    const laborCostId = makeId(col.bizRestaurantLaborCost);
    const stationCount = Array.from(new Set(kitchenLines.map((line) => line.station))).length;
    const stationHourlyRates: Record<string, number> = {
      cold: 12,
      drinks: 11,
      grill: 14,
      hot: 13,
      pass: 11,
    };
    const avgHourlyRate = stationCount > 0
      ? Object.values(stationHourlyRates).reduce((a, b) => a + b, 0) / Object.keys(stationHourlyRates).length
      : 12;
    const serviceModeMultiplier = serviceMode === 'reservation' ? 1.0 : 1.15;
    const laborCostPerOrder = Number(((kitchenMinutes / 60) * avgHourlyRate * serviceModeMultiplier).toFixed(2));
    const laborWrites = adminFirestore.collection(col.bizRestaurantLaborCost).doc(laborCostId).set({
      id: laborCostId,
      tenantId,
      orderId,
      ticketId,
      branchId: payload.branchId,
      kitchenMinutes,
      serviceMode,
      numberOfStaff: 1,
      stationCount,
      laborCostPerOrder,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    // Create GL journal entries
    const journalWrites: Promise<any>[] = [];

    // COGS entry (Debit COGS, Credit Inventory)
    const cogsJournalId = makeId(col.bizAccountingJournals);
    journalWrites.push(
      adminFirestore.collection(col.bizAccountingJournals).doc(cogsJournalId).set({
        id: cogsJournalId,
        tenantId,
        orderId,
        entryType: 'cogs',
        accountDebit: '5000', // COGS
        accountCredit: '1300', // Inventory
        amount: costTotal,
        description: `COGS for order ${orderNo}`,
        branchId: payload.branchId,
        status: 'posted',
        createdAt: nowIso(),
      })
    );

    // Labor Expense entry (Debit Labor Expense, Credit Payable)
    const laborJournalId = makeId(col.bizAccountingJournals);
    journalWrites.push(
      adminFirestore.collection(col.bizAccountingJournals).doc(laborJournalId).set({
        id: laborJournalId,
        tenantId,
        orderId,
        entryType: 'labor_expense',
        accountDebit: '5100', // Labor Expense
        accountCredit: '2000', // Accounts Payable
        amount: laborCostPerOrder,
        description: `Labor Cost for order ${orderNo}`,
        branchId: payload.branchId,
        status: 'posted',
        createdAt: nowIso(),
      })
    );

    // Revenue entry (Debit Cash/Receivables, Credit Revenue)
    const revenueJournalId = makeId(col.bizAccountingJournals);
    const revenueAccount = payload.payments.some((p) => p.method === 'cash') ? '1000' : '1200'; // Cash or Receivables
    journalWrites.push(
      adminFirestore.collection(col.bizAccountingJournals).doc(revenueJournalId).set({
        id: revenueJournalId,
        tenantId,
        orderId,
        entryType: 'revenue',
        accountDebit: revenueAccount,
        accountCredit: '4000', // Revenue
        amount: total,
        description: `Revenue from order ${orderNo}`,
        branchId: payload.branchId,
        status: 'posted',
        createdAt: nowIso(),
      })
    );

    // Check replenishment needs
    const replenishmentWrites: Promise<any>[] = [];
    const componentProductIds = preparedLines
      .filter((line) => line.recipeItems.length > 0)
      .flatMap((line) => line.recipeItems.map((item) => String(item.componentProductId ?? '')));

    if (componentProductIds.length > 0) {
      const uniqueComponentIds = Array.from(new Set(componentProductIds));
      for (const componentId of uniqueComponentIds) {
        const stockSnap = await adminFirestore
          .collection(col.bizStockItems)
          .where('tenantId', '==', tenantId)
          .where('productId', '==', componentId)
          .get();

        const totalStock = stockSnap.docs.reduce((sum, doc) => {
          const data = doc.data() as Record<string, unknown>;
          const qty = Number(data.quantity ?? 0);
          return sum + qty;
        }, 0);

        // If stock is low (< 20 units), suggest replenishment
        if (totalStock < 20) {
          const existingReplenishment = await adminFirestore
            .collection(col.bizRestaurantReplenishment)
            .where('tenantId', '==', tenantId)
            .where('componentProductId', '==', componentId)
            .where('status', 'in', ['suggested', 'pending'])
            .limit(1)
            .get();

          if (existingReplenishment.empty) {
            const replenishmentId = makeId(col.bizRestaurantReplenishment);
            replenishmentWrites.push(
              adminFirestore.collection(col.bizRestaurantReplenishment).doc(replenishmentId).set({
                id: replenishmentId,
                tenantId,
                componentProductId: componentId,
                branchId: payload.branchId,
                currentStock: totalStock,
                suggestedQuantity: 50,
                minStockLevel: 20,
                consumptionDailyAvg: 0,
                leadTimeDays: 3,
                supplierId: null,
                status: 'suggested',
                notes: `Auto-suggested from order ${orderNo}`,
                createdAt: nowIso(),
                updatedAt: nowIso(),
              })
            );
          }
        }
      }
    }

    await Promise.all([laborWrites, ...journalWrites, ...replenishmentWrites]);

    if (usesPhysicalTable) {
      await adminFirestore.collection(col.bizRestaurantTables).doc(payload.tableId).set(
        {
          status: 'available',
          currentOrderId: null,
          currentReservationId: null,
          updatedAt: nowIso(),
        },
        { merge: true }
      );
    }

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
