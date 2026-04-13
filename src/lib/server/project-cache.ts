import { tryRedisConnection } from '@/lib/server/redis';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, normalizeDate, asNumber } from '@/lib/server/firestore-data';

const PROJECTS_CACHE_TTL_SECONDS = 60;

function getProjectsCacheKey(tenantId: string) {
  return `pinkplan:projects:${tenantId}`;
}

export async function listProjectsCached(tenantId: string) {
  const redis = await tryRedisConnection();
  if (redis) {
    const cacheKey = getProjectsCacheKey(tenantId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Awaited<ReturnType<typeof fetchProjects>>;
    }
    const projects = await fetchProjects(tenantId);
    await redis.set(cacheKey, JSON.stringify(projects), { EX: PROJECTS_CACHE_TTL_SECONDS });
    return projects;
  }
  return fetchProjects(tenantId);
}

export async function invalidateProjectsCache(tenantId: string) {
  const redis = await tryRedisConnection();
  if (redis) await redis.del(getProjectsCacheKey(tenantId));
}

async function fetchProjects(tenantId: string) {
  const snap = await adminFirestore
    .collection(col.coreProjects)
    .where('tenantId', '==', tenantId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      tenantId: String(data.tenantId ?? ''),
      name: String(data.name ?? ''),
      description: String(data.description ?? ''),
      status: (data.status ?? 'active') as 'active' | 'archived' | 'completed',
      progress: asNumber(data.progress),
      ownerId: String(data.ownerId ?? ''),
      createdAt: normalizeDate(data.createdAt) ?? new Date(0).toISOString(),
      templateId: data.templateId ? String(data.templateId) : undefined,
      color: data.color ? String(data.color) : undefined,
    };
  });
}
