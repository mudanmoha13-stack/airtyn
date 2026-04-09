import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { invalidateProjectsCache, listProjectsCached } from '@/lib/server/project-cache';

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

export async function GET() {
  try {
    const projects = await listProjectsCached();
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
    const payload = createProjectSchema.parse(await request.json());
    const project = await prisma.project.create({
      data: {
        ...payload,
        id: payload.id,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : undefined,
      },
    });
    await invalidateProjectsCache();

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
