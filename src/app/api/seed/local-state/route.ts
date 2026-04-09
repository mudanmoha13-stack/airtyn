import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { invalidateProjectsCache } from '@/lib/server/project-cache';
import { invalidateTasksCache } from '@/lib/server/task-cache';
import { invalidateUsersCache } from '@/lib/server/user-cache';

const subtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
});

const commentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),
  content: z.string(),
  createdAt: z.string(),
});

const seedPayloadSchema = z.object({
  currentTenant: z.object({ id: z.string(), name: z.string(), slug: z.string(), plan: z.string() }).nullable(),
  currentWorkspace: z.object({ id: z.string(), tenantId: z.string(), name: z.string(), createdAt: z.string() }).nullable(),
  users: z.array(z.object({ id: z.string(), name: z.string(), email: z.string(), avatarUrl: z.string().optional(), role: z.enum(['owner', 'admin', 'member']), departmentId: z.string().optional() })),
  projects: z.array(z.object({ id: z.string(), tenantId: z.string(), name: z.string(), description: z.string(), status: z.enum(['active', 'archived', 'completed']), progress: z.number(), ownerId: z.string(), createdAt: z.string(), templateId: z.string().optional(), color: z.string().optional() })),
  milestones: z.array(z.object({ id: z.string(), projectId: z.string(), title: z.string(), description: z.string(), dueDate: z.string(), status: z.enum(['pending', 'completed']), createdAt: z.string() })).default([]),
  tasks: z.array(z.object({ id: z.string(), projectId: z.string(), milestoneId: z.string().optional(), title: z.string(), description: z.string(), status: z.enum(['todo', 'in_progress', 'review', 'done']), priority: z.enum(['low', 'medium', 'high', 'urgent']), assigneeId: z.string().optional(), dueDate: z.string().optional(), startDate: z.string().optional(), estimatedMinutes: z.number().optional(), tags: z.array(z.string()).default([]), createdAt: z.string(), createdBy: z.string(), subtasks: z.array(subtaskSchema).default([]), comments: z.array(commentSchema).default([]), timeEntries: z.array(z.any()).default([]), attachments: z.array(z.any()).default([]) })),
});

export async function POST(request: NextRequest) {
  try {
    const payload = seedPayloadSchema.parse(await request.json());
    const tenantId = payload.currentTenant?.id;
    const projectTenantById = new Map(payload.projects.map((project) => [project.id, project.tenantId]));

    if (payload.currentTenant) {
      await prisma.tenant.upsert({
        where: { id: payload.currentTenant.id },
        update: { name: payload.currentTenant.name, slug: payload.currentTenant.slug, plan: payload.currentTenant.plan },
        create: payload.currentTenant,
      });
    }

    if (payload.currentWorkspace) {
      await prisma.workspace.upsert({
        where: { id: payload.currentWorkspace.id },
        update: { name: payload.currentWorkspace.name, tenantId: payload.currentWorkspace.tenantId },
        create: { ...payload.currentWorkspace, createdAt: new Date(payload.currentWorkspace.createdAt) },
      });
    }

    for (const user of payload.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: { name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role, tenantId: tenantId ?? '', departmentId: user.departmentId },
        create: { ...user, tenantId: tenantId ?? '', departmentId: user.departmentId },
      });
    }

    for (const project of payload.projects) {
      await prisma.project.upsert({
        where: { id: project.id },
        update: { name: project.name, description: project.description, status: project.status, progress: project.progress, ownerId: project.ownerId, templateId: project.templateId, color: project.color },
        create: { ...project, createdAt: new Date(project.createdAt) },
      });
    }

    for (const milestone of payload.milestones) {
      await prisma.milestone.upsert({
        where: { id: milestone.id },
        update: { title: milestone.title, description: milestone.description, dueDate: new Date(milestone.dueDate), status: milestone.status, projectId: milestone.projectId },
        create: { ...milestone, dueDate: new Date(milestone.dueDate), createdAt: new Date(milestone.createdAt) },
      });
    }

    for (const task of payload.tasks) {
      await prisma.task.upsert({
        where: { id: task.id },
        update: {
          tenantId: projectTenantById.get(task.projectId) ?? tenantId ?? '',
          projectId: task.projectId,
          milestoneId: task.milestoneId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          startDate: task.startDate ? new Date(task.startDate) : null,
          estimatedMinutes: task.estimatedMinutes,
          tags: task.tags,
          timeEntries: task.timeEntries,
          attachments: task.attachments,
          createdBy: task.createdBy,
        },
        create: {
          id: task.id,
          tenantId: projectTenantById.get(task.projectId) ?? tenantId ?? '',
          projectId: task.projectId,
          milestoneId: task.milestoneId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          startDate: task.startDate ? new Date(task.startDate) : undefined,
          estimatedMinutes: task.estimatedMinutes,
          tags: task.tags,
          timeEntries: task.timeEntries,
          attachments: task.attachments,
          createdBy: task.createdBy,
          createdAt: new Date(task.createdAt),
        },
      });

      await prisma.subtask.deleteMany({ where: { taskId: task.id } });
      await prisma.taskComment.deleteMany({ where: { taskId: task.id } });

      if (task.subtasks.length > 0) {
        await prisma.subtask.createMany({
          data: task.subtasks.map((subtask) => ({
            id: subtask.id,
            taskId: task.id,
            title: subtask.title,
            completed: subtask.completed,
            createdAt: new Date(subtask.createdAt),
          })),
          skipDuplicates: true,
        });
      }

      for (const comment of task.comments) {
        await prisma.taskComment.create({
          data: {
            id: comment.id,
            taskId: task.id,
            userId: comment.userId,
            content: comment.content,
            createdAt: new Date(comment.createdAt),
          },
        });
      }
    }

    await Promise.all([invalidateProjectsCache(), invalidateTasksCache(), invalidateUsersCache()]);

    return NextResponse.json({ ok: true, counts: { users: payload.users.length, projects: payload.projects.length, tasks: payload.tasks.length, milestones: payload.milestones.length } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid seed payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to seed local state' }, { status: 500 });
  }
}