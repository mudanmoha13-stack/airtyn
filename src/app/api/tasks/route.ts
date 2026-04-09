import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
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
    const project = await prisma.project.findUnique({
      where: { id: payload.projectId },
      select: { tenantId: true },
    });

    if (!project) {
      return NextResponse.json({ ok: false, error: 'Project not found for task creation' }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        id: payload.id,
        tenantId: project.tenantId,
        projectId: payload.projectId,
        milestoneId: payload.milestoneId,
        title: payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        assigneeId: payload.assigneeId,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        estimatedMinutes: payload.estimatedMinutes,
        tags: payload.tags ?? [],
        timeEntries: payload.timeEntries ?? [],
        attachments: payload.attachments ?? [],
        createdBy: payload.createdBy,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : undefined,
      },
    });
    await invalidateTasksCache();
    return NextResponse.json({ ok: true, task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid task payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create task' }, { status: 500 });
  }
}