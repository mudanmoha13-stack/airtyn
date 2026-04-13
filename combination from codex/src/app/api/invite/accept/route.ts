import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, nowIso } from '@/lib/server/firestore-data';

const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2),
});

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const payload = acceptSchema.parse(await request.json());

    const tokenHash = hashToken(payload.token);
    const snap = await adminFirestore
      .collection(col.coreInviteTokens)
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ ok: false, error: 'Invite link is invalid' }, { status: 404 });
    }

    const doc = snap.docs[0];
    const data = doc.data() as {
      email?: string;
      role?: string;
      tenantId?: string;
      tenantName?: string;
      workspaceName?: string;
      invitedByName?: string;
      status?: 'pending' | 'accepted';
      expiresAt?: string;
    };

    if (data.status !== 'pending') {
      return NextResponse.json({ ok: false, error: 'This invitation has already been used' }, { status: 410 });
    }

    if (!data.expiresAt || new Date(data.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: 'This invite link has expired' }, { status: 410 });
    }

    // Mark token as consumed
    await doc.ref.set(
      { status: 'accepted', consumedAt: nowIso(), acceptedName: payload.name },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      email: data.email ?? '',
      role: data.role ?? 'member',
      tenantId: data.tenantId ?? '',
      tenantName: data.tenantName ?? '',
      workspaceName: data.workspaceName ?? '',
      invitedByName: data.invitedByName ?? '',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to accept invitation';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
