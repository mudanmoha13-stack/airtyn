import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col } from '@/lib/server/firestore-data';
import { resolveCoreTenantId } from '@/lib/server/core-tenant';
import { verifyPassword } from '@/lib/server/password';

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const tenantHeader = request.headers.get('x-tenant-id')?.trim();
    const tenantQuery = request.nextUrl.searchParams.get('tenantId')?.trim();
    if (!tenantHeader && !tenantQuery) {
      return NextResponse.json(
        { ok: false, error: 'Tenant context is required. Sign in from your workspace subdomain.' },
        { status: 400 }
      );
    }

    const tenantId = resolveCoreTenantId(request);
    const payload = signinSchema.parse(await request.json());
    const email = payload.email.toLowerCase();

    const userSnap = await adminFirestore
      .collection(col.coreUsers)
      .where('tenantId', '==', tenantId)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return NextResponse.json({ ok: false, error: 'Account not found for this organization' }, { status: 404 });
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();
    const passwordHash = String(userData.passwordHash ?? '');

    if (!passwordHash || !verifyPassword(payload.password, passwordHash)) {
      return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 });
    }

    const workspaceSnap = await adminFirestore
      .collection(col.coreWorkspaces)
      .where('tenantId', '==', tenantId)
      .limit(1)
      .get();

    return NextResponse.json({
      ok: true,
      user: {
        id: userDoc.id,
        name: String(userData.name ?? ''),
        email: String(userData.email ?? ''),
        avatarUrl: userData.avatarUrl ? String(userData.avatarUrl) : undefined,
        role: (userData.role ?? 'member') as 'owner' | 'admin' | 'member',
        departmentId: userData.departmentId ? String(userData.departmentId) : undefined,
      },
      workspace: workspaceSnap.empty
        ? null
        : {
            id: String(workspaceSnap.docs[0].data().id ?? workspaceSnap.docs[0].id),
            tenantId: String(workspaceSnap.docs[0].data().tenantId ?? tenantId),
            name: String(workspaceSnap.docs[0].data().name ?? 'Workspace'),
            createdAt: String(workspaceSnap.docs[0].data().createdAt ?? new Date().toISOString()),
          },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid sign-in payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to sign in' }, { status: 500 });
  }
}
