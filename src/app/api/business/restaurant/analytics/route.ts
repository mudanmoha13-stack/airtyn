import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const branchId = request.nextUrl.searchParams.get('branchId')?.trim();

    const branchFilter = (value: unknown) => !branchId || String(value ?? '') === branchId;

    const [ordersSnap, ticketsSnap, reservationsSnap, deliveriesSnap] = await Promise.all([
      adminFirestore.collection(col.bizOrders).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizRestaurantKitchenTickets).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizRestaurantReservations).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizRestaurantDeliveries).where('tenantId', '==', tenantId).get(),
    ]);

    const orders = ordersSnap.docs.map((doc) => doc.data()).filter((order) => branchFilter(order.branchId));
    const tickets = ticketsSnap.docs.map((doc) => doc.data()).filter((ticket) => branchFilter(ticket.branchId));
    const reservations = reservationsSnap.docs.map((doc) => doc.data()).filter((reservation) => branchFilter(reservation.branchId));
    const deliveries = deliveriesSnap.docs.map((doc) => doc.data()).filter((delivery) => branchFilter(delivery.branchId));

    const revenue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const dineInOrders = orders.filter((order) => String(order.orderType ?? '') === 'dine_in').length;
    const avgTicket = orders.length > 0 ? revenue / orders.length : 0;
    const kitchenReadyMins = tickets
      .map((ticket) => {
        const createdAt = Date.parse(String(ticket.createdAt ?? ''));
        const readyAt = Date.parse(String(ticket.readyAt ?? ticket.servedAt ?? ''));
        if (Number.isNaN(createdAt) || Number.isNaN(readyAt)) return null;
        return Math.max(0, Math.round((readyAt - createdAt) / 60000));
      })
      .filter((value): value is number => value !== null);
    const avgKitchenMins = kitchenReadyMins.length > 0 ? kitchenReadyMins.reduce((sum, value) => sum + value, 0) / kitchenReadyMins.length : 0;
    const completedReservations = reservations.filter((reservation) => String(reservation.status ?? '') === 'completed').length;
    const deliveredOrders = deliveries.filter((delivery) => String(delivery.status ?? '') === 'delivered').length;
    const pendingDeliveries = deliveries.filter((delivery) => !['delivered', 'returned', 'failed'].includes(String(delivery.status ?? ''))).length;

    return NextResponse.json({
      ok: true,
      analytics: {
        revenue,
        orders: orders.length,
        dineInOrders,
        avgTicket,
        avgKitchenMins: Number(avgKitchenMins.toFixed(1)),
        completedReservations,
        deliveredOrders,
        pendingDeliveries,
        kitchenLateTickets: tickets.filter((ticket) => {
          const createdAt = Date.parse(String(ticket.startedAt ?? ticket.createdAt ?? ''));
          if (Number.isNaN(createdAt)) return false;
          const age = Math.round((Date.now() - createdAt) / 60000);
          return age > Number(ticket.slaTargetMinutes ?? 0) && !['served', 'bumped'].includes(String(ticket.status ?? ''));
        }).length,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to compute restaurant analytics' }, { status: 500 });
  }
}