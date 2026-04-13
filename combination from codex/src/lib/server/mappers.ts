import type { Comment, Project, Subtask, Task, User } from '@/lib/types';

type TaskCommentRecord = {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  user: {
    name: string;
    avatarUrl: string | null;
  };
};

type SubtaskRecord = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
};

type TaskRecord = {
  id: string;
  projectId: string;
  milestoneId: string | null;
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  assigneeId: string | null;
  dueDate: Date | null;
  startDate: Date | null;
  estimatedMinutes: number | null;
  tags: unknown;
  timeEntries: unknown;
  attachments: unknown;
  createdBy: string;
  createdAt: Date;
  comments: TaskCommentRecord[];
  subtasks: SubtaskRecord[];
};

type ProjectRecord = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: Project['status'];
  progress: number;
  ownerId: string;
  createdAt: Date;
  templateId: string | null;
  color: string | null;
};

type UserRecord = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: User['role'];
  departmentId: string | null;
};

export const mapProjectRecord = (project: ProjectRecord): Project => ({
  id: project.id,
  tenantId: project.tenantId,
  name: project.name,
  description: project.description,
  status: project.status,
  progress: project.progress,
  ownerId: project.ownerId,
  createdAt: project.createdAt.toISOString(),
  templateId: project.templateId ?? undefined,
  color: project.color ?? undefined,
});

export const mapUserRecord = (user: UserRecord): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl ?? undefined,
  role: user.role,
  departmentId: user.departmentId ?? undefined,
});

const mapCommentRecord = (comment: TaskCommentRecord): Comment => ({
  id: comment.id,
  userId: comment.userId,
  userName: comment.user.name,
  userAvatar: comment.user.avatarUrl ?? undefined,
  content: comment.content,
  createdAt: comment.createdAt.toISOString(),
});

const mapSubtaskRecord = (subtask: SubtaskRecord): Subtask => ({
  id: subtask.id,
  title: subtask.title,
  completed: subtask.completed,
  createdAt: subtask.createdAt.toISOString(),
});

export const mapTaskRecord = (task: TaskRecord): Task => ({
  id: task.id,
  projectId: task.projectId,
  milestoneId: task.milestoneId ?? undefined,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  assigneeId: task.assigneeId ?? undefined,
  dueDate: task.dueDate?.toISOString().slice(0, 10),
  startDate: task.startDate?.toISOString().slice(0, 10),
  estimatedMinutes: task.estimatedMinutes ?? undefined,
  tags: Array.isArray(task.tags) ? (task.tags as string[]) : [],
  createdAt: task.createdAt.toISOString(),
  createdBy: task.createdBy,
  subtasks: task.subtasks.map(mapSubtaskRecord),
  comments: task.comments.map(mapCommentRecord),
  timeEntries: Array.isArray(task.timeEntries) ? (task.timeEntries as Task['timeEntries']) : [],
  attachments: Array.isArray(task.attachments) ? (task.attachments as Task['attachments']) : [],
});