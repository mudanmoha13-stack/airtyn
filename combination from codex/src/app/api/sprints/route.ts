import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveCoreTenantId } from '@/lib/server/core-tenant';

const createSprintSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  goal: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'cancelled']).default('planning'),
  startDate: z.string(),
  endDate: z.string(),
  velocity: z.number().optional(),
  plannedPoints: z.number().optional(),
});

const COL = 'core_sprints';

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const projectId = request.nextUrl.searchParams.get('projectId');
    let query = adminFirestore.collection(COL).where('tenantId', '==', tenantId);
    if (projectId) query = query.where('projectId', '==', projectId) as typeof query;
    const snap = await query.orderBy('startDate', 'desc').get();
    const sprints = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, sprints });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const payload = createSprintSchema.parse(await request.json());
    const id = makeId(COL);
    const now = nowIso();
    await adminFirestore.collection(COL).doc(id).set({
      id, tenantId, ...payload, createdAt: now, updatedAt: now,
    });
    return NextResponse.json({ ok: true, sprint: { id, tenantId, ...payload, createdAt: now } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
