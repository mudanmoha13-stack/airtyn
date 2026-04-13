import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveCoreTenantId } from '@/lib/server/core-tenant';

const createListSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  order: z.number().default(0),
  sprintId: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const COL = 'core_task_lists';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const { projectId } = await context.params;
    // Verify project belongs to tenant
    const projectSnap = await adminFirestore.collection(col.coreProjects).doc(projectId).get();
    if (!projectSnap.exists || projectSnap.data()?.tenantId !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Project not found' }, { status: 404 });
    }
    const snap = await adminFirestore.collection(COL)
      .where('projectId', '==', projectId)
      .orderBy('order', 'asc')
      .get();
    const lists = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, lists });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const { projectId } = await context.params;
    const projectSnap = await adminFirestore.collection(col.coreProjects).doc(projectId).get();
    if (!projectSnap.exists || projectSnap.data()?.tenantId !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Project not found' }, { status: 404 });
    }
    const payload = createListSchema.parse(await request.json());
    const id = makeId(COL);
    const now = nowIso();
    await adminFirestore.collection(COL).doc(id).set({
      id, projectId, tenantId, ...payload, createdAt: now,
    });
    return NextResponse.json({ ok: true, list: { id, projectId, ...payload, createdAt: now } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
