import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, makeId, nowIso } from '@/lib/server/firestore-data';
import { invalidateProjectsCache, listProjectsCached } from '@/lib/server/project-cache';
import { resolveCoreTenantId } from '@/lib/server/core-tenant';

const createProjectSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().min(1),
  ownerId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(['active', 'archived', 'completed']).default('active'),
  progress: z.number().int().min(0).max(100).default(0),
  templateId: z.string().optional(),
  color: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const projects = await listProjectsCached(tenantId);
    return NextResponse.json({ ok: true, cached: true, projects });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to list projects',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const payload = createProjectSchema.parse(await request.json());
    if (payload.tenantId !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Tenant mismatch for project creation' }, { status: 403 });
    }
    const id = payload.id ?? makeId(col.coreProjects);
    const now = nowIso();
    const ref = adminFirestore.collection(col.coreProjects).doc(id);
    await ref.set({
      id,
      tenantId: payload.tenantId,
      ownerId: payload.ownerId,
      name: payload.name,
      description: payload.description,
      status: payload.status,
      progress: payload.progress,
      templateId: payload.templateId ?? null,
      color: payload.color ?? null,
      createdAt: payload.createdAt ?? now,
      updatedAt: now,
    });
    const project = { id, ...(await ref.get()).data() };
    await invalidateProjectsCache(tenantId);

    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid project payload',
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      },
      { status: 500 }
    );
  }
}
