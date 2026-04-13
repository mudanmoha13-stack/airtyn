import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, nowIso } from '@/lib/server/firestore-data';
import { invalidateProjectsCache } from '@/lib/server/project-cache';
import { resolveCoreTenantId } from '@/lib/server/core-tenant';

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const { projectId } = await context.params;
    const payload = updateProjectSchema.parse(await request.json());
    const ref = adminFirestore.collection(col.coreProjects).doc(projectId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: 'Project not found' }, { status: 404 });
    }
    if (String(snap.data()?.tenantId ?? '') !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Project not found for tenant' }, { status: 404 });
    }
    await ref.set({ ...payload, updatedAt: nowIso() }, { merge: true });
    const updatedSnap = await ref.get();
    const project = { id: updatedSnap.id, ...updatedSnap.data() };
    await invalidateProjectsCache(tenantId);
    return NextResponse.json({ ok: true, project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid project payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to update project' }, { status: 500 });
  }
}