import { prisma } from '@/lib/server/prisma';
import { ensureRedisConnection } from '@/lib/server/redis';
import { mapUserRecord } from '@/lib/server/mappers';

const USERS_CACHE_KEY = 'pinkplan:users:all';
const USERS_CACHE_TTL_SECONDS = 60;

export async function listUsersCached() {
  const redis = await ensureRedisConnection();
  const cached = await redis.get(USERS_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as Awaited<ReturnType<typeof fetchUsers>>;
  }

  const users = await fetchUsers();
  await redis.set(USERS_CACHE_KEY, JSON.stringify(users), { EX: USERS_CACHE_TTL_SECONDS });
  return users;
}

export async function invalidateUsersCache() {
  const redis = await ensureRedisConnection();
  await redis.del(USERS_CACHE_KEY);
}

async function fetchUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return users.map(mapUserRecord);
}