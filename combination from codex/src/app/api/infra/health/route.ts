import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { ensureRedisConnection } from '@/lib/server/redis';

export async function GET() {
  const startedAt = Date.now();

  try {
    await adminFirestore.collection('_health').doc('ping').set({ at: new Date().toISOString() }, { merge: true });
    const redis = await ensureRedisConnection();
    const redisPing = await redis.ping();

    return NextResponse.json({
      ok: true,
      services: {
        firestore: 'up',
        redis: redisPing === 'PONG' ? 'up' : 'degraded',
      },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown infrastructure error',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
