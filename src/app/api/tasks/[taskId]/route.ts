import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { invalidateTasksCache } from '@/lib/server/task-cache';

const updateTaskSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await context.params;
    const payload = updateTaskSchema.parse(await request.json());
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...payload,
        dueDate: payload.dueDate === undefined ? undefined : payload.dueDate ? new Date(payload.dueDate) : null,
      },
    });
    await invalidateTasksCache();
    return NextResponse.json({ ok: true, task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid task payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to update task' }, { status: 500 });
  }
}