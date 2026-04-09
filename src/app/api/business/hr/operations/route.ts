import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { businessPrisma, ensureBusinessTenant, BUSINESS_DEFAULT_TENANT_ID } from '@/lib/server/business-prisma';

const createSchema = z.discriminatedUnion('entityType', [
  z.object({
    entityType: z.literal('employee'),
    name: z.string().min(1),
    email: z.string().email(),
    title: z.string().min(1),
    department: z.string().default('General'),
  }),
  z.object({
    entityType: z.literal('contract'),
    employeeId: z.string().min(1),
    contractType: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
  }),
  z.object({
    entityType: z.literal('attendance'),
    employeeId: z.string().min(1),
    checkIn: z.string().datetime().optional(),
    checkOut: z.string().datetime().optional(),
  }),
  z.object({
    entityType: z.literal('leave'),
    employeeId: z.string().min(1),
    leaveType: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
  z.object({
    entityType: z.literal('payroll'),
    employeeId: z.string().min(1),
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime(),
    netPay: z.number().nonnegative(),
  }),
  z.object({
    entityType: z.literal('candidate'),
    name: z.string().min(1),
    roleTitle: z.string().min(1),
    stage: z.string().default('screening'),
  }),
]);

const patchSchema = z.discriminatedUnion('entityType', [
  z.object({
    entityType: z.literal('leave'),
    id: z.string().min(1),
    status: z.enum(['requested', 'approved', 'rejected', 'canceled']),
  }),
  z.object({
    entityType: z.literal('candidate'),
    id: z.string().min(1),
    stage: z.string().min(1),
  }),
  z.object({
    entityType: z.literal('payroll'),
    id: z.string().min(1),
    approval: z.enum(['approved', 'rejected']),
  }),
]);

export async function GET() {
  try {
    await ensureBusinessTenant();

    const [employees, contracts, attendance, leaves, payrollRuns, candidates, payrollLogs] = await Promise.all([
      businessPrisma.hrEmployee.findMany({
        where: { tenantId: BUSINESS_DEFAULT_TENANT_ID },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      businessPrisma.hrContract.findMany({
        include: { employee: { include: { user: true } } },
        orderBy: { startDate: 'desc' },
        take: 200,
      }),
      businessPrisma.hrAttendance.findMany({
        include: { employee: { include: { user: true } } },
        orderBy: { checkIn: 'desc' },
        take: 300,
      }),
      businessPrisma.hrLeave.findMany({
        include: { employee: { include: { user: true } } },
        orderBy: { startDate: 'desc' },
        take: 200,
      }),
      businessPrisma.hrPayrollRun.findMany({
        where: { tenantId: BUSINESS_DEFAULT_TENANT_ID },
        include: {
          payslips: {
            include: {
              employee: {
                include: { user: true },
              },
            },
          },
        },
        orderBy: { periodStart: 'desc' },
        take: 100,
      }),
      businessPrisma.hrCandidate.findMany({
        where: { tenantId: BUSINESS_DEFAULT_TENANT_ID },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      businessPrisma.auditLog.findMany({
        where: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          module: 'hr',
          entityType: 'payroll_run',
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
    ]);

    const payrollStatusMap = new Map<string, string>();
    for (const log of payrollLogs) {
      if (payrollStatusMap.has(log.entityId)) continue;
      if (log.action === 'payroll_approved') payrollStatusMap.set(log.entityId, 'approved');
      else if (log.action === 'payroll_rejected') payrollStatusMap.set(log.entityId, 'rejected');
      else payrollStatusMap.set(log.entityId, 'pending_approval');
    }

    return NextResponse.json({
      ok: true,
      employees: employees.map((employee) => ({
        id: employee.id,
        name: employee.user ? `${employee.user.firstName ?? ''} ${employee.user.lastName ?? ''}`.trim() || employee.user.email : 'Unknown Employee',
        title: employee.title,
        department: employee.departmentId ?? 'General',
        email: employee.user?.email ?? 'unknown@local',
        status: 'active',
      })),
      contracts: contracts.map((contract) => ({
        id: contract.id,
        employeeId: contract.employeeId,
        employeeName: contract.employee.user ? `${contract.employee.user.firstName ?? ''} ${contract.employee.user.lastName ?? ''}`.trim() || contract.employee.user.email : 'Unknown Employee',
        type: contract.type,
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate?.toISOString() ?? null,
      })),
      attendance: attendance.map((entry) => ({
        id: entry.id,
        employeeId: entry.employeeId,
        employeeName: entry.employee.user ? `${entry.employee.user.firstName ?? ''} ${entry.employee.user.lastName ?? ''}`.trim() || entry.employee.user.email : 'Unknown Employee',
        checkIn: entry.checkIn.toISOString(),
        checkOut: entry.checkOut?.toISOString() ?? null,
      })),
      leaves: leaves.map((leave) => ({
        id: leave.id,
        employeeId: leave.employeeId,
        employeeName: leave.employee.user ? `${leave.employee.user.firstName ?? ''} ${leave.employee.user.lastName ?? ''}`.trim() || leave.employee.user.email : 'Unknown Employee',
        type: leave.type,
        status: leave.status,
        startDate: leave.startDate.toISOString(),
        endDate: leave.endDate.toISOString(),
      })),
      payrollRuns: payrollRuns.map((run) => ({
        id: run.id,
        periodStart: run.periodStart.toISOString(),
        periodEnd: run.periodEnd.toISOString(),
        createdAt: run.createdAt.toISOString(),
        approvalStatus: payrollStatusMap.get(run.id) ?? 'pending_approval',
        payslips: run.payslips.map((slip) => ({
          id: slip.id,
          employeeId: slip.employeeId,
          employeeName: slip.employee.user ? `${slip.employee.user.firstName ?? ''} ${slip.employee.user.lastName ?? ''}`.trim() || slip.employee.user.email : 'Unknown Employee',
          netPay: Number(slip.netPay),
        })),
      })),
      candidates: candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        roleTitle: candidate.roleTitle,
        stage: candidate.stage,
        createdAt: candidate.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load HR operations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBusinessTenant();
    const payload = createSchema.parse(await request.json());

    if (payload.entityType === 'employee') {
      const [firstName, ...rest] = payload.name.trim().split(' ');
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
          title: payload.title,
          departmentId: payload.department,
        },
        create: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          userId: user.id,
          title: payload.title,
          departmentId: payload.department,
        },
      });

      return NextResponse.json({ ok: true, id: employee.id }, { status: 201 });
    }

    if (payload.entityType === 'contract') {
      const contract = await businessPrisma.hrContract.create({
        data: {
          employeeId: payload.employeeId,
          type: payload.contractType,
          startDate: new Date(payload.startDate),
          endDate: payload.endDate ? new Date(payload.endDate) : null,
        },
      });

      return NextResponse.json({ ok: true, id: contract.id }, { status: 201 });
    }

    if (payload.entityType === 'attendance') {
      const attendance = await businessPrisma.hrAttendance.create({
        data: {
          employeeId: payload.employeeId,
          checkIn: payload.checkIn ? new Date(payload.checkIn) : new Date(),
          checkOut: payload.checkOut ? new Date(payload.checkOut) : null,
        },
      });

      return NextResponse.json({ ok: true, id: attendance.id }, { status: 201 });
    }

    if (payload.entityType === 'leave') {
      const leave = await businessPrisma.hrLeave.create({
        data: {
          employeeId: payload.employeeId,
          type: payload.leaveType,
          status: 'requested',
          startDate: new Date(payload.startDate),
          endDate: new Date(payload.endDate),
        },
      });

      return NextResponse.json({ ok: true, id: leave.id }, { status: 201 });
    }

    if (payload.entityType === 'payroll') {
      const run = await businessPrisma.hrPayrollRun.create({
        data: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          periodStart: new Date(payload.periodStart),
          periodEnd: new Date(payload.periodEnd),
          payslips: {
            create: [
              {
                employeeId: payload.employeeId,
                netPay: payload.netPay,
              },
            ],
          },
        },
      });

      await businessPrisma.auditLog.create({
        data: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          module: 'hr',
          entityType: 'payroll_run',
          entityId: run.id,
          action: 'payroll_submitted',
          meta: { source: 'hr-module' },
        },
      });

      return NextResponse.json({ ok: true, id: run.id }, { status: 201 });
    }

    if (payload.entityType === 'candidate') {
      const candidate = await businessPrisma.hrCandidate.create({
        data: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          name: payload.name,
          stage: payload.stage,
          roleTitle: payload.roleTitle,
        },
      });

      return NextResponse.json({ ok: true, id: candidate.id }, { status: 201 });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported entity payload' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid HR payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to save HR operation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureBusinessTenant();
    const payload = patchSchema.parse(await request.json());

    if (payload.entityType === 'leave') {
      const leave = await businessPrisma.hrLeave.update({
        where: { id: payload.id },
        data: { status: payload.status },
      });

      return NextResponse.json({ ok: true, id: leave.id });
    }

    if (payload.entityType === 'candidate') {
      const candidate = await businessPrisma.hrCandidate.update({
        where: { id: payload.id },
        data: { stage: payload.stage },
      });

      return NextResponse.json({ ok: true, id: candidate.id });
    }

    if (payload.entityType === 'payroll') {
      await businessPrisma.auditLog.create({
        data: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          module: 'hr',
          entityType: 'payroll_run',
          entityId: payload.id,
          action: payload.approval === 'approved' ? 'payroll_approved' : 'payroll_rejected',
          meta: { source: 'hr-module' },
        },
      });

      return NextResponse.json({ ok: true, id: payload.id });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported patch payload' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid HR patch payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to update HR operation' }, { status: 500 });
  }
}
