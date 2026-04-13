import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, nowIso } from '@/lib/server/firestore-data';

const requestSchema = z.object({
  email: z.string().email(),
  mode: z.enum(['projects', 'business']),
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

export async function POST(request: NextRequest) {
  try {
    const payload = requestSchema.parse(await request.json());

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();

    const tokenRef = adminFirestore.collection(col.coreOnboardingTokens).doc();
    await tokenRef.set({
      id: tokenRef.id,
      tokenHash,
      email: payload.email.toLowerCase(),
      mode: payload.mode,
      status: 'pending',
      createdAt,
      expiresAt,
      consumedAt: null,
    });

    const appBaseUrl = getBaseUrl(request);
    const confirmLink = `${appBaseUrl}/onboarding/confirm?token=${encodeURIComponent(token)}`;
    const productLabel = payload.mode === 'business' ? 'Business Management' : 'Project Management';

    const { error } = await resend.emails.send({
      from: 'Airtyn <noreply@airtyn.com>',
      to: payload.email,
      subject: `Confirm your Airtyn ${productLabel} account`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111"><h2>Confirm your email to continue</h2><p>You started creating an Airtyn account for <strong>${productLabel}</strong>.</p><p><a href="${confirmLink}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Confirm email</a></p><p>If the button does not work, open this link:</p><p>${confirmLink}</p><p>This link expires in 30 minutes.</p></div>`,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send confirmation email';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
