import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { businessPrisma, ensureBusinessTenant, BUSINESS_DEFAULT_TENANT_ID } from '@/lib/server/business-prisma';

const createEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  title: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  department: z.string().default('General'),
  email: z.string().email(),
});

export async function GET() {
  try {
    await ensureBusinessTenant();
    const employees = await businessPrisma.hrEmployee.findMany({
      where: { tenantId: BUSINESS_DEFAULT_TENANT_ID },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      ok: true,
      employees: employees.map((employee) => ({
        id: employee.id,
        name: employee.user ? `${employee.user.firstName ?? ''} ${employee.user.lastName ?? ''}`.trim() || employee.user.email : 'Unknown Employee',
        title: employee.title,
        department: employee.departmentId ?? 'General',
        email: employee.user?.email ?? 'unknown@local',
        status: 'Active',
      })),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list employees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBusinessTenant();
    const payload = createEmployeeSchema.parse(await request.json());

    const normalizedName =
      payload.name?.trim() ||
      [payload.firstName?.trim(), payload.lastName?.trim()].filter(Boolean).join(' ').trim();
    const normalizedTitle = payload.title?.trim() || payload.position?.trim();

    if (!normalizedName || !normalizedTitle) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid employee payload',
          issues: {
            fieldErrors: {
              ...(normalizedName ? {} : { name: ['Required (or provide firstName)'] }),
              ...(normalizedTitle ? {} : { title: ['Required (or provide position)'] }),
            },
          },
        },
        { status: 400 }
      );
    }

    const [firstName, ...rest] = normalizedName.split(' ');
    const lastName = rest.join(' ');

    const user = await businessPrisma.businessUser.upsert({
      where: { email: payload.email.toLowerCase() },
      update: {
        firstName,
        lastName: lastName || null,
        status: 'active',
      },
      create: {
        email: payload.email.toLowerCase(),
        passwordHash: 'temp-password-hash',
        status: 'active',
        firstName,
        lastName: lastName || null,
      },
    });

    const employee = await businessPrisma.hrEmployee.upsert({
      where: { userId: user.id },
      update: {
        title: normalizedTitle,
        departmentId: payload.department,
      },
      create: {
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        userId: user.id,
        title: normalizedTitle,
        departmentId: payload.department,
      },
    });

    return NextResponse.json({ ok: true, employee }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid employee payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create employee' }, { status: 500 });
  }
}
