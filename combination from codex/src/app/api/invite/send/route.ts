import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, nowIso } from '@/lib/server/firestore-data';

const sendSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member']),
  tenantId: z.string().min(1),
  tenantName: z.string().min(1),
  workspaceName: z.string().min(1),
  invitedByName: z.string().min(1),
});

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, '');
  const host = request.headers.get('host') ?? 'localhost:9002';
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

async function sendInviteEmail(args: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
}) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Airtyn <noreply@airtyn.com>',
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  if (response.ok) return { ok: true as const };

  let detail = `${response.status} ${response.statusText}`;
  try {
    const payload = (await response.json()) as { message?: string };
    if (payload?.message) detail = payload.message;
  } catch {
    // Ignore parse errors and keep fallback status text
  }
  return { ok: false as const, error: detail };
}

export async function POST(request: NextRequest) {
  try {
    const payload = sendSchema.parse(await request.json());

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const createdAt = nowIso();
    // Invite links are valid for 72 hours
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString();

    const appBaseUrl = getBaseUrl(request);
    const inviteLink = `${appBaseUrl}/invite/accept?token=${encodeURIComponent(token)}`;

    // Store token in Firestore when available
    let firestoreStored = false;
    try {
      const tokenRef = adminFirestore.collection(col.coreInviteTokens).doc();
      await tokenRef.set({
        id: tokenRef.id,
        tokenHash,
        email: payload.email.toLowerCase(),
        role: payload.role,
        tenantId: payload.tenantId,
        tenantName: payload.tenantName,
        workspaceName: payload.workspaceName,
        invitedByName: payload.invitedByName,
        status: 'pending',
        createdAt,
        expiresAt,
        consumedAt: null,
      });
      firestoreStored = true;
    } catch {
      // Firestore not configured — still return link so admin can share it manually
    }

    // Send email via Resend HTTP API when configured
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const result = await sendInviteEmail({
        apiKey,
        to: payload.email,
        subject: `You're invited to join ${payload.workspaceName} on Airtyn`,
        html: `
<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:520px;margin:0 auto">
  <h2 style="margin-bottom:8px">You've been invited! 🎉</h2>
  <p style="color:#555;margin-bottom:20px">
    <strong>${payload.invitedByName}</strong> has invited you to join
    <strong>${payload.workspaceName}</strong> on Airtyn as a
    <strong>${payload.role}</strong>.
  </p>

  <a href="${inviteLink}"
     style="display:inline-block;background:#111;color:#fff;padding:12px 24px;
            border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
    Accept invitation &rarr;
  </a>

  <p style="margin-top:24px;font-size:13px;color:#888">
    If the button doesn't work, copy and paste this link into your browser:
  </p>
  <p style="font-size:13px;word-break:break-all;color:#555">${inviteLink}</p>

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="font-size:12px;color:#aaa">
    This invitation expires in 72 hours. If you didn't expect this email, you can safely ignore it.
  </p>
</div>`,
      });

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: `Email failed: ${result.error}`, inviteLink: firestoreStored ? inviteLink : null },
          { status: 422 }
        );
      }

      return NextResponse.json({ ok: true, inviteLink });
    }

    // No Resend key — return link so admin can share it
    return NextResponse.json({
      ok: true,
      inviteLink,
      warning: 'RESEND_API_KEY not configured — email was not sent. Share the invite link manually.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send invitation';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
