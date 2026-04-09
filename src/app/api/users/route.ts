import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { invalidateUsersCache, listUsersCached } from '@/lib/server/user-cache';

const createUserSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().min(1),
  departmentId: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  avatarUrl: z.string().optional(),
  role: z.enum(['owner', 'admin', 'member']),
  createdAt: z.string().datetime().optional(),
});

export async function GET() {
  try {
    const users = await listUsersCached();
    return NextResponse.json({ ok: true, cached: true, users });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = createUserSchema.parse(await request.json());
    const user = await prisma.user.upsert({
      where: { email: payload.email },
      update: {
        name: payload.name,
        role: payload.role,
        avatarUrl: payload.avatarUrl,
        departmentId: payload.departmentId,
        tenantId: payload.tenantId,
      },
      create: {
        id: payload.id,
        tenantId: payload.tenantId,
        departmentId: payload.departmentId,
        name: payload.name,
        email: payload.email,
        avatarUrl: payload.avatarUrl,
        role: payload.role,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : undefined,
      },
    });
    await invalidateUsersCache();
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid user payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create user' }, { status: 500 });
  }
}