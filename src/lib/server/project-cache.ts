import { ensureRedisConnection } from '@/lib/server/redis';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, normalizeDate, asNumber } from '@/lib/server/firestore-data';

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
  const snap = await adminFirestore.collection(col.coreProjects).orderBy('createdAt', 'desc').get();
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
