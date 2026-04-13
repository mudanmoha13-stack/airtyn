import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, makeId, nowIso } from '@/lib/server/firestore-data';
import { invalidateUsersCache, listUsersCached } from '@/lib/server/user-cache';
import { resolveCoreTenantId } from '@/lib/server/core-tenant';
import { hashPassword } from '@/lib/server/password';

const createUserSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().min(1),
  departmentId: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  avatarUrl: z.string().optional(),
  role: z.enum(['owner', 'admin', 'member']),
  password: z.string().min(8).optional(),
  createdAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const users = await listUsersCached(tenantId);
    return NextResponse.json({ ok: true, cached: true, users });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const payload = createUserSchema.parse(await request.json());
    if (payload.tenantId !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Tenant mismatch for user creation' }, { status: 403 });
    }
    const email = payload.email.toLowerCase();
    const existingByEmail = await adminFirestore
      .collection(col.coreUsers)
      .where('email', '==', email)
      .where('tenantId', '==', tenantId)
      .limit(1)
      .get();

    const userId = payload.id ?? (existingByEmail.empty ? makeId(col.coreUsers) : existingByEmail.docs[0].id);
    const ref = adminFirestore.collection(col.coreUsers).doc(userId);
    const now = nowIso();
    await ref.set(
      {
        id: userId,
        tenantId: payload.tenantId,
        departmentId: payload.departmentId ?? null,
        name: payload.name,
        email,
        avatarUrl: payload.avatarUrl ?? null,
        role: payload.role,
        ...(payload.password ? { passwordHash: hashPassword(payload.password) } : {}),
        createdAt: payload.createdAt ?? now,
        updatedAt: now,
      },
      { merge: true }
    );

    const snap = await ref.get();
    const user = { id: snap.id, ...snap.data() };
    await invalidateUsersCache(tenantId);
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid user payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create user' }, { status: 500 });
  }
}