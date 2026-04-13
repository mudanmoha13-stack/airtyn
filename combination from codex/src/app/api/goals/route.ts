import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveCoreTenantId } from '@/lib/server/core-tenant';

const keyResultSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['number', 'percentage', 'currency', 'boolean']),
  startValue: z.number().default(0),
  targetValue: z.number(),
  currentValue: z.number().default(0),
  unit: z.string().optional(),
});

const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['on_track', 'at_risk', 'off_track', 'completed', 'draft']).default('draft'),
  progress: z.number().min(0).max(100).default(0),
  ownerId: z.string().min(1),
  startDate: z.string(),
  dueDate: z.string(),
  parentGoalId: z.string().optional(),
  projectIds: z.array(z.string()).optional(),
  keyResults: z.array(keyResultSchema).default([]),
  color: z.string().optional(),
});

const COL = 'core_goals';

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const snap = await adminFirestore.collection(COL)
      .where('tenantId', '==', tenantId)
      .orderBy('createdAt', 'desc')
      .get();
    const goals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, goals });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const payload = createGoalSchema.parse(await request.json());
    const id = makeId(COL);
    const now = nowIso();
    const keyResults = payload.keyResults.map((kr, i) => ({
      ...kr,
      id: `${id}-kr-${i}`,
      goalId: id,
      progress: 0,
      createdAt: now,
    }));
    await adminFirestore.collection(COL).doc(id).set({
      id, tenantId, ...payload, keyResults, createdAt: now, updatedAt: now,
    });
    return NextResponse.json({ ok: true, goal: { id, tenantId, ...payload, keyResults, createdAt: now } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
