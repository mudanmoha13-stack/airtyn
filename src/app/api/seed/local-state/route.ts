import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col } from '@/lib/server/firestore-data';
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
    const tenantId = payload.currentTenant?.id ?? '';
    const projectTenantById = new Map(payload.projects.map((project) => [project.id, project.tenantId]));

    if (payload.currentTenant) {
      await adminFirestore.collection(col.coreTenants).doc(payload.currentTenant.id).set(payload.currentTenant, { merge: true });
    }

    if (payload.currentWorkspace) {
      await adminFirestore.collection(col.coreWorkspaces).doc(payload.currentWorkspace.id).set(payload.currentWorkspace, { merge: true });
    }

    for (const user of payload.users) {
      await adminFirestore.collection(col.coreUsers).doc(user.id).set(
        {
          ...user,
          tenantId,
          departmentId: user.departmentId ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    for (const project of payload.projects) {
      await adminFirestore.collection(col.coreProjects).doc(project.id).set(
        {
          ...project,
          createdAt: project.createdAt,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    for (const milestone of payload.milestones) {
      await adminFirestore.collection(col.coreMilestones).doc(milestone.id).set(
        {
          ...milestone,
          dueDate: milestone.dueDate,
          createdAt: milestone.createdAt,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    for (const task of payload.tasks) {
      await adminFirestore.collection(col.coreTasks).doc(task.id).set(
        {
          id: task.id,
          tenantId: projectTenantById.get(task.projectId) ?? tenantId,
          projectId: task.projectId,
          milestoneId: task.milestoneId ?? null,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId ?? null,
          dueDate: task.dueDate ?? null,
          startDate: task.startDate ?? null,
          estimatedMinutes: task.estimatedMinutes ?? null,
          tags: task.tags,
          timeEntries: task.timeEntries,
          attachments: task.attachments,
          createdBy: task.createdBy,
          createdAt: task.createdAt,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      const existingSubtasks = await adminFirestore.collection(col.coreSubtasks).where('taskId', '==', task.id).get();
      const existingComments = await adminFirestore.collection(col.coreTaskComments).where('taskId', '==', task.id).get();
      const batch = adminFirestore.batch();
      existingSubtasks.docs.forEach((doc) => batch.delete(doc.ref));
      existingComments.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      for (const subtask of task.subtasks) {
        await adminFirestore.collection(col.coreSubtasks).doc(subtask.id).set({
          ...subtask,
          taskId: task.id,
        });
      }

      for (const comment of task.comments) {
        await adminFirestore.collection(col.coreTaskComments).doc(comment.id).set({
          ...comment,
          taskId: task.id,
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