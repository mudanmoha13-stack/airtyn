import { tryRedisConnection } from '@/lib/server/redis';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, normalizeDate } from '@/lib/server/firestore-data';

const USERS_CACHE_KEY = 'pinkplan:users:all';
const USERS_CACHE_TTL_SECONDS = 60;

export async function listUsersCached() {
  const redis = await tryRedisConnection();
  if (redis) {
    const cached = await redis.get(USERS_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as Awaited<ReturnType<typeof fetchUsers>>;
    }
    const users = await fetchUsers();
    await redis.set(USERS_CACHE_KEY, JSON.stringify(users), { EX: USERS_CACHE_TTL_SECONDS });
    return users;
  }
  return fetchUsers();
}

export async function invalidateUsersCache() {
  const redis = await tryRedisConnection();
  if (redis) await redis.del(USERS_CACHE_KEY);
}

async function fetchUsers() {
  const snap = await adminFirestore.collection(col.coreUsers).orderBy('createdAt', 'asc').get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: String(data.name ?? ''),
      email: String(data.email ?? ''),
      avatarUrl: data.avatarUrl ? String(data.avatarUrl) : undefined,
      role: (data.role ?? 'member') as 'owner' | 'admin' | 'member',
      departmentId: data.departmentId ? String(data.departmentId) : undefined,
      createdAt: normalizeDate(data.createdAt),
    };
  });
}