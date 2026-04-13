import { tryRedisConnection } from '@/lib/server/redis';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, normalizeDate } from '@/lib/server/firestore-data';

const USERS_CACHE_TTL_SECONDS = 60;

function getUsersCacheKey(tenantId: string) {
  return `pinkplan:users:${tenantId}`;
}

export async function listUsersCached(tenantId: string) {
  const redis = await tryRedisConnection();
  if (redis) {
    const cacheKey = getUsersCacheKey(tenantId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Awaited<ReturnType<typeof fetchUsers>>;
    }
    const users = await fetchUsers(tenantId);
    await redis.set(cacheKey, JSON.stringify(users), { EX: USERS_CACHE_TTL_SECONDS });
    return users;
  }
  return fetchUsers(tenantId);
}

export async function invalidateUsersCache(tenantId: string) {
  const redis = await tryRedisConnection();
  if (redis) await redis.del(getUsersCacheKey(tenantId));
}

async function fetchUsers(tenantId: string) {
  const snap = await adminFirestore.collection(col.coreUsers).where('tenantId', '==', tenantId).orderBy('createdAt', 'asc').get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      tenantId: String(data.tenantId ?? tenantId), // always include so client can filter
      name: String(data.name ?? ''),
      email: String(data.email ?? ''),
      avatarUrl: data.avatarUrl ? String(data.avatarUrl) : undefined,
      role: (data.role ?? 'member') as 'owner' | 'admin' | 'member',
      departmentId: data.departmentId ? String(data.departmentId) : undefined,
      createdAt: normalizeDate(data.createdAt),
    };
  });
}