import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, nowIso } from '@/lib/server/firestore-data';
import { invalidateProjectsCache } from '@/lib/server/project-cache';

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const payload = updateProjectSchema.parse(await request.json());
    const ref = adminFirestore.collection(col.coreProjects).doc(projectId);
    await ref.set({ ...payload, updatedAt: nowIso() }, { merge: true });
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: 'Project not found' }, { status: 404 });
    }
    const project = { id: snap.id, ...snap.data() };
    await invalidateProjectsCache();
    return NextResponse.json({ ok: true, project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid project payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to update project' }, { status: 500 });
  }
}