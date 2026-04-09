import { prisma } from '@/lib/server/prisma';
import { ensureRedisConnection } from '@/lib/server/redis';
import { mapProjectRecord } from '@/lib/server/mappers';

const PROJECTS_CACHE_KEY = 'pinkplan:projects:all';
const PROJECTS_CACHE_TTL_SECONDS = 60;

export async function listProjectsCached() {
  const redis = await ensureRedisConnection();
  const cached = await redis.get(PROJECTS_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as Awaited<ReturnType<typeof fetchProjects>>;
  }

  const projects = await fetchProjects();
  await redis.set(PROJECTS_CACHE_KEY, JSON.stringify(projects), {
    EX: PROJECTS_CACHE_TTL_SECONDS,
  });
  return projects;
}

export async function invalidateProjectsCache() {
  const redis = await ensureRedisConnection();
  await redis.del(PROJECTS_CACHE_KEY);
}

async function fetchProjects() {
  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
  return projects.map(mapProjectRecord);
}
