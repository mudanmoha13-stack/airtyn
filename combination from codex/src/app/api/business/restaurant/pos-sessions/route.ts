import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const openSessionSchema = z.object({
  branchId: z.string().min(1),
  terminalName: z.string().min(1),
  openedByUserId: z.string().min(1),
  openingCash: z.number().nonnegative().default(0),
});

const closeSessionSchema = z.object({
  id: z.string().min(1),
  closedByUserId: z.string().min(1),
  closingCash: z.number().nonnegative().default(0),
  expectedCash: z.number().nonnegative().default(0),
  cashSales: z.number().nonnegative().default(0),
  cardSales: z.number().nonnegative().default(0),
  walletSales: z.number().nonnegative().default(0),
  bankSales: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const branchId = request.nextUrl.searchParams.get('branchId')?.trim();
    let query = adminFirestore.collection(col.bizRestaurantPosSessions).where('tenantId', '==', tenantId);
    if (branchId) {
      query = query.where('branchId', '==', branchId);
    }

    const snap = await query.get();
    const sessions = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as { id: string; openedAt?: unknown }))
      .sort((a, b) => String(b.openedAt ?? '').localeCompare(String(a.openedAt ?? '')));

    return NextResponse.json({ ok: true, sessions });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list POS sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = openSessionSchema.parse(await request.json());

    const activeSnap = await adminFirestore
      .collection(col.bizRestaurantPosSessions)
      .where('tenantId', '==', tenantId)
      .where('branchId', '==', payload.branchId)
      .where('terminalName', '==', payload.terminalName.trim())
      .where('status', '==', 'open')
      .limit(1)
      .get();

    if (!activeSnap.empty) {
      return NextResponse.json({ ok: false, error: 'An open session already exists for this terminal' }, { status: 409 });
    }

    const id = makeId(col.bizRestaurantPosSessions);
    await adminFirestore.collection(col.bizRestaurantPosSessions).doc(id).set({
      id,
      tenantId,
      branchId: payload.branchId,
      terminalName: payload.terminalName.trim(),
      status: 'open',
      openedByUserId: payload.openedByUserId,
      openedAt: nowIso(),
      openingCash: payload.openingCash,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid POS session payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to open POS session' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    const payload = closeSessionSchema.parse(await request.json());

    const ref = adminFirestore.collection(col.bizRestaurantPosSessions).doc(payload.id);
    const snap = await ref.get();
    if (!snap.exists || String(snap.data()?.tenantId ?? '') !== tenantId) {
      return NextResponse.json({ ok: false, error: 'POS session not found for tenant' }, { status: 404 });
    }

    const variance = Number((payload.closingCash - payload.expectedCash).toFixed(2));

    await ref.set(
      {
        status: 'closed',
        closedByUserId: payload.closedByUserId,
        closedAt: nowIso(),
        closingCash: payload.closingCash,
        expectedCash: payload.expectedCash,
        variance,
        cashSales: payload.cashSales,
        cardSales: payload.cardSales,
        walletSales: payload.walletSales,
        bankSales: payload.bankSales,
        notes: payload.notes?.trim() ?? null,
        updatedAt: nowIso(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, id: payload.id, variance });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid POS close payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to close POS session' }, { status: 500 });
  }
}
