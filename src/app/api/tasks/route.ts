import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, makeId, nowIso } from '@/lib/server/firestore-data';
import { invalidateTasksCache, listTasksCached } from '@/lib/server/task-cache';

const createTaskSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1),
  milestoneId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  estimatedMinutes: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
  timeEntries: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  createdBy: z.string().min(1),
  createdAt: z.string().datetime().optional(),
});

export async function GET() {
  try {
    const tasks = await listTasksCached();
    return NextResponse.json({ ok: true, cached: true, tasks });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = createTaskSchema.parse(await request.json());
    const projectSnap = await adminFirestore.collection(col.coreProjects).doc(payload.projectId).get();
    if (!projectSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Project not found for task creation' }, { status: 404 });
    }
    const project = projectSnap.data();
    const id = payload.id ?? makeId(col.coreTasks);
    const now = nowIso();

    await adminFirestore.collection(col.coreTasks).doc(id).set({
      id,
      tenantId: String(project?.tenantId ?? ''),
      projectId: payload.projectId,
      milestoneId: payload.milestoneId ?? null,
      title: payload.title,
      description: payload.description,
      status: payload.status,
      priority: payload.priority,
      assigneeId: payload.assigneeId ?? null,
      dueDate: payload.dueDate ?? null,
      startDate: payload.startDate ?? null,
      estimatedMinutes: payload.estimatedMinutes ?? null,
      tags: payload.tags ?? [],
      timeEntries: payload.timeEntries ?? [],
      attachments: payload.attachments ?? [],
      createdBy: payload.createdBy,
      createdAt: payload.createdAt ?? now,
      updatedAt: now,
    });
    const task = { id, ...(await adminFirestore.collection(col.coreTasks).doc(id).get()).data() };
    await invalidateTasksCache();
    return NextResponse.json({ ok: true, task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid task payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create task' }, { status: 500 });
  }
}