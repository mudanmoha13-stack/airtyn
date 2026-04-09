import { createClient } from 'redis';

type PinkplanRedisClient = ReturnType<typeof createClient>;

declare global {
  // eslint-disable-next-line no-var
  var __pinkplanRedis__: PinkplanRedisClient | undefined;
}

// Lazily create the Redis client only when first needed at request time.
// This avoids throwing at module-evaluation / build time when REDIS_URL is absent.
function getRedisClient(): PinkplanRedisClient {
  if (global.__pinkplanRedis__) {
    return global.__pinkplanRedis__;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL is not configured.');
  }

  const client = createClient({ url: redisUrl });
  client.on('error', (error) => {
    console.error('Redis client error', error);
  });

  if (process.env.NODE_ENV !== 'production') {
    global.__pinkplanRedis__ = client;
  }

  return client;
}

export async function ensureRedisConnection() {
  const client = getRedisClient();
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}
