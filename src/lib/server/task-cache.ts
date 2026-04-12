import { ensureRedisConnection } from '@/lib/server/redis';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, asArray, normalizeDate, toIsoDateOnly } from '@/lib/server/firestore-data';

const TASKS_CACHE_KEY = 'pinkplan:tasks:all';
const TASKS_CACHE_TTL_SECONDS = 60;

export async function listTasksCached() {
  const redis = await ensureRedisConnection();
  const cached = await redis.get(TASKS_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as Awaited<ReturnType<typeof fetchTasks>>;
  }

  const tasks = await fetchTasks();
  await redis.set(TASKS_CACHE_KEY, JSON.stringify(tasks), { EX: TASKS_CACHE_TTL_SECONDS });
  return tasks;
}

export async function invalidateTasksCache() {
  const redis = await ensureRedisConnection();
  await redis.del(TASKS_CACHE_KEY);
}

async function fetchTasks() {
  const [tasksSnap, commentsSnap, subtasksSnap] = await Promise.all([
    adminFirestore.collection(col.coreTasks).orderBy('createdAt', 'desc').get(),
    adminFirestore.collection(col.coreTaskComments).orderBy('createdAt', 'asc').get(),
    adminFirestore.collection(col.coreSubtasks).orderBy('createdAt', 'asc').get(),
  ]);

  const commentsByTask = new Map<string, Array<Record<string, unknown>>>();
  for (const doc of commentsSnap.docs) {
    const data = doc.data();
    const taskId = String(data.taskId ?? '');
    if (!taskId) continue;
    const arr = commentsByTask.get(taskId) ?? [];
    arr.push({ id: doc.id, ...data });
    commentsByTask.set(taskId, arr);
  }

  const subtasksByTask = new Map<string, Array<Record<string, unknown>>>();
  for (const doc of subtasksSnap.docs) {
    const data = doc.data();
    const taskId = String(data.taskId ?? '');
    if (!taskId) continue;
    const arr = subtasksByTask.get(taskId) ?? [];
    arr.push({ id: doc.id, ...data });
    subtasksByTask.set(taskId, arr);
  }

  return tasksSnap.docs.map((doc) => {
    const data = doc.data();
    const taskId = doc.id;
    const comments = (commentsByTask.get(taskId) ?? []).map((comment) => ({
      id: String(comment.id ?? ''),
      userId: String(comment.userId ?? ''),
      userName: String(comment.userName ?? 'Unknown'),
      userAvatar: comment.userAvatar ? String(comment.userAvatar) : undefined,
      content: String(comment.content ?? ''),
      createdAt: normalizeDate(comment.createdAt) ?? new Date(0).toISOString(),
    }));
    const subtasks = (subtasksByTask.get(taskId) ?? []).map((subtask) => ({
      id: String(subtask.id ?? ''),
      title: String(subtask.title ?? ''),
      completed: Boolean(subtask.completed),
      createdAt: normalizeDate(subtask.createdAt) ?? new Date(0).toISOString(),
    }));

    return {
      id: taskId,
      projectId: String(data.projectId ?? ''),
      milestoneId: data.milestoneId ? String(data.milestoneId) : undefined,
      title: String(data.title ?? ''),
      description: String(data.description ?? ''),
      status: (data.status ?? 'todo') as 'todo' | 'in_progress' | 'review' | 'done',
      priority: (data.priority ?? 'medium') as 'low' | 'medium' | 'high' | 'urgent',
      assigneeId: data.assigneeId ? String(data.assigneeId) : undefined,
      dueDate: toIsoDateOnly(data.dueDate),
      startDate: toIsoDateOnly(data.startDate),
      estimatedMinutes: typeof data.estimatedMinutes === 'number' ? data.estimatedMinutes : undefined,
      tags: asArray<string>(data.tags),
      createdAt: normalizeDate(data.createdAt) ?? new Date(0).toISOString(),
      createdBy: String(data.createdBy ?? ''),
      subtasks,
      comments,
      timeEntries: asArray(data.timeEntries),
      attachments: asArray(data.attachments),
    };
  });
}