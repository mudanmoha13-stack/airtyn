import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col } from '@/lib/server/firestore-data';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')?.trim();
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    const snap = await adminFirestore
      .collection(col.coreOnboardingTokens)
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ ok: false, error: 'Invalid confirmation link' }, { status: 404 });
    }

    const doc = snap.docs[0];
    const data = doc.data() as {
      email?: string;
      mode?: 'projects' | 'business';
      status?: 'pending' | 'completed';
      expiresAt?: string;
    };

    if (data.status !== 'pending') {
      return NextResponse.json({ ok: false, error: 'This link has already been used' }, { status: 410 });
    }

    if (!data.expiresAt || new Date(data.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: 'This confirmation link has expired' }, { status: 410 });
    }

    return NextResponse.json({
      ok: true,
      email: data.email ?? '',
      mode: data.mode ?? 'projects',
      expiresAt: data.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to validate confirmation link';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
