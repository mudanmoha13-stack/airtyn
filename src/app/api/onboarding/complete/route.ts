import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, nowIso } from '@/lib/server/firestore-data';

const completeSchema = z.object({
  token: z.string().min(1),
  mode: z.enum(['projects', 'business']),
  ownerName: z.string().min(2),
  businessName: z.string().min(2),
  workspaceName: z.string().optional(),
  businessType: z.string().optional(),
  enabledModules: z.array(z.string()).optional(),
  password: z.string().min(10),
});

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isStrongPassword(password: string): boolean {
  return /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password)
    && password.length >= 10;
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
    const payload = completeSchema.parse(await request.json());
    if (!isStrongPassword(payload.password)) {
      return NextResponse.json({ ok: false, error: 'Password does not meet strength requirements' }, { status: 400 });
    }

    const tokenHash = hashToken(payload.token);
    const snap = await adminFirestore
      .collection(col.coreOnboardingTokens)
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ ok: false, error: 'Invalid confirmation link' }, { status: 404 });
    }

    const tokenDoc = snap.docs[0];
    const tokenData = tokenDoc.data() as {
      email?: string;
      mode?: 'projects' | 'business';
      status?: 'pending' | 'completed';
      expiresAt?: string;
    };

    if (tokenData.status !== 'pending') {
      return NextResponse.json({ ok: false, error: 'This link has already been used' }, { status: 410 });
    }
    if (!tokenData.expiresAt || new Date(tokenData.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: 'This confirmation link has expired' }, { status: 410 });
    }

    const email = tokenData.email ?? '';
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Onboarding session is missing email' }, { status: 400 });
    }

    await tokenDoc.ref.set(
      {
        status: 'completed',
        consumedAt: nowIso(),
        profile: {
          ownerName: payload.ownerName,
          businessName: payload.businessName,
          workspaceName: payload.workspaceName ?? null,
          businessType: payload.businessType ?? null,
          enabledModules: payload.enabledModules ?? null,
        },
      },
      { merge: true }
    );

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const appBaseUrl = getBaseUrl(request);
      const productLabel = payload.mode === 'business' ? 'Business Management' : 'Project Management';
      const workspaceLabel = payload.workspaceName?.trim() || `${payload.businessName} Workspace`;
      const loginLink = `${appBaseUrl}/`;
      const templateNote = payload.businessType?.toLowerCase() === 'restaurant'
        ? '<p><strong>Template activated:</strong> Restaurant Odoo-style operations (POS, tables, kitchen, inventory, procurement, finance, HR, CRM, analytics).</p>'
        : '';

      await resend.emails.send({
        from: 'Airtyn <noreply@airtyn.com>',
        to: email,
        subject: `Welcome to Airtyn, ${payload.ownerName}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111"><h2>Welcome to Airtyn</h2><p>Your onboarding is complete for <strong>${productLabel}</strong>.</p><p><strong>Business:</strong> ${payload.businessName}<br/><strong>Workspace:</strong> ${workspaceLabel}${payload.businessType ? `<br/><strong>Primary module:</strong> ${payload.businessType}` : ''}</p>${templateNote}<p><a href="${loginLink}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open Airtyn Login</a></p><p>If the button does not work, open this link:</p><p>${loginLink}</p></div>`,
      });
    }

    return NextResponse.json({
      ok: true,
      email,
      mode: tokenData.mode ?? payload.mode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to complete onboarding';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
