import { prisma } from '@/lib/server/prisma';
import { ensureRedisConnection } from '@/lib/server/redis';
import { mapTaskRecord } from '@/lib/server/mappers';

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
  const tasks = await prisma.task.findMany({
    include: {
      comments: {
        include: {
          user: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      subtasks: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return tasks.map(mapTaskRecord);
}