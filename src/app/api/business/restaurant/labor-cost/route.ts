import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const laborCostQuerySchema = z.object({
  branchId: z.string().optional(),
  orderId: z.string().optional(),
  ticketId: z.string().optional(),
  serviceMode: z.enum(['reservation', 'walk_in']).optional(),
});

const calculateLaborCostSchema = z.object({
  orderId: z.string().min(1),
  ticketId: z.string().min(1),
  kitchenMinutes: z.number().nonnegative(),
  serviceMode: z.enum(['reservation', 'walk_in']),
  stationSummary: z.array(z.string()).min(1),
  numberOfStaff: z.number().positive().default(1),
  hourlyRate: z.number().positive().optional(),
});

// Labor cost model: estimated hourly rates by station
const STATION_HOURLY_RATES: Record<string, number> = {
  cold: 12,      // Salad/pastry chef
  drinks: 11,    // Bartender
  grill: 14,     // Grill chef (highest skill)
  hot: 13,       // Hot cook
  pass: 11,      // Expediter
};

const SERVICE_MODE_MULTIPLIER: Record<string, number> = {
  reservation: 1.0,  // Pre-planned, steady pacing
  walk_in: 1.15,     // Higher stress, faster turnover
};

function estimateAverageLaborCost(kitchenMinutes: number, stationCount: number, serviceMode: string, numberOfStaff: number): number {
  // Average hourly rate across stations
  const avgHourlyRate = stationCount > 0 
    ? Object.values(STATION_HOURLY_RATES).reduce((a, b) => a + b, 0) / Object.values(STATION_HOURLY_RATES).length
    : 12;
  
  // Adjust for service mode (walk-in is more labor intensive)
  const modeMultiplier = SERVICE_MODE_MULTIPLIER[serviceMode] ?? 1.0;
  
  // Cost = (kitchen_minutes / 60) * avg_hourly_rate * staff_count * mode_multiplier
  const laborCostPerOrder = (kitchenMinutes / 60) * avgHourlyRate * numberOfStaff * modeMultiplier;
  
  return Number(laborCostPerOrder.toFixed(2));
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const url = new URL(request.url);
    const params = laborCostQuerySchema.parse({
      branchId: url.searchParams.get('branchId') ?? undefined,
      orderId: url.searchParams.get('orderId') ?? undefined,
      ticketId: url.searchParams.get('ticketId') ?? undefined,
      serviceMode: url.searchParams.get('serviceMode') as any ?? undefined,
    });

    let query: FirebaseFirestore.Query = adminFirestore
      .collection(col.bizRestaurantLaborCost)
      .where('tenantId', '==', tenantId);

    if (params.branchId) {
      query = query.where('branchId', '==', params.branchId);
    }

    if (params.orderId) {
      query = query.where('orderId', '==', params.orderId);
    }

    if (params.ticketId) {
      query = query.where('ticketId', '==', params.ticketId);
    }

    if (params.serviceMode) {
      query = query.where('serviceMode', '==', params.serviceMode);
    }

    const snap = await query.orderBy('createdAt', 'desc').get();

    const laborRecords = snap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        orderId: data.orderId,
        ticketId: data.ticketId,
        branchId: data.branchId,
        kitchenMinutes: Number(data.kitchenMinutes ?? 0),
        serviceMode: String(data.serviceMode ?? ''),
        numberOfStaff: Number(data.numberOfStaff ?? 1),
        laborCostPerOrder: Number(data.laborCostPerOrder ?? 0),
        stationCount: Number(data.stationCount ?? 0),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    return NextResponse.json({ ok: true, data: laborRecords });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid query parameters', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to fetch labor costs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = calculateLaborCostSchema.parse(await request.json());

    const laborCostId = makeId(col.bizRestaurantLaborCost);
    const now = nowIso();

    const laborCost = estimateAverageLaborCost(
      payload.kitchenMinutes,
      payload.stationSummary.length,
      payload.serviceMode,
      payload.numberOfStaff
    );

    // Fetch order to get branchId
    const orderSnap = await adminFirestore.collection(col.bizOrders).doc(payload.orderId).get();
    const branchId = orderSnap.exists ? String(orderSnap.data()?.branchId ?? '') : '';

    await adminFirestore.collection(col.bizRestaurantLaborCost).doc(laborCostId).set({
      id: laborCostId,
      tenantId,
      orderId: payload.orderId,
      ticketId: payload.ticketId,
      branchId,
      kitchenMinutes: payload.kitchenMinutes,
      serviceMode: payload.serviceMode,
      numberOfStaff: payload.numberOfStaff,
      stationCount: payload.stationSummary.length,
      laborCostPerOrder: laborCost,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true, data: { id: laborCostId, laborCostPerOrder: laborCost } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid labor cost payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to calculate labor cost' }, { status: 500 });
  }
}
