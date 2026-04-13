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
      return NextResponse.json({ ok: false, error: 'Missing invite token' }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    const snap = await adminFirestore
      .collection(col.coreInviteTokens)
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ ok: false, error: 'Invite link is invalid or has expired' }, { status: 404 });
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
      return NextResponse.json({ ok: false, error: 'This invitation has already been accepted' }, { status: 410 });
    }

    if (!data.expiresAt || new Date(data.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: 'This invite link has expired. Ask the workspace owner to send a new one.' }, { status: 410 });
    }

    return NextResponse.json({
      ok: true,
      email: data.email ?? '',
      role: data.role ?? 'member',
      tenantId: data.tenantId ?? '',
      tenantName: data.tenantName ?? '',
      workspaceName: data.workspaceName ?? '',
      invitedByName: data.invitedByName ?? '',
      expiresAt: data.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify invite link';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
