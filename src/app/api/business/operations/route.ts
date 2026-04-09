import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { businessPrisma, ensureBusinessTenant, BUSINESS_DEFAULT_TENANT_ID } from '@/lib/server/business-prisma';

const operationQuerySchema = z.object({
  module: z.string().min(1),
});

const createOperationSchema = z.object({
  module: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  meta: z.string().default('N/A'),
  status: z.string().default('Open'),
});

function toModuleFromReportName(name: string) {
  const lower = name.toLowerCase();
  const parts = lower.split(':');
  if (parts.length > 1) {
    return parts[0] ?? 'module';
  }
  return 'module';
}

export async function GET(request: NextRequest) {
  try {
    await ensureBusinessTenant();
    const parsed = operationQuerySchema.parse({ module: request.nextUrl.searchParams.get('module') ?? '' });

    if (parsed.module === 'sales') {
      return NextResponse.json({
        ok: false,
        error: 'Use /api/business/sales/orders for sales operations',
      }, { status: 400 });
    }

    const [crmLeads, expenses, rfqs, tickets, tasks, reports] = await Promise.all([
      parsed.module === 'crm'
        ? businessPrisma.crmLead.findMany({ where: { tenantId: BUSINESS_DEFAULT_TENANT_ID }, orderBy: { createdAt: 'desc' }, take: 50 })
        : Promise.resolve([]),
      parsed.module === 'finance'
        ? businessPrisma.financeExpense.findMany({ where: { tenantId: BUSINESS_DEFAULT_TENANT_ID }, orderBy: { submittedAt: 'desc' }, take: 50 })
        : Promise.resolve([]),
      parsed.module === 'procurement'
        ? businessPrisma.procurementRfq.findMany({ where: { tenantId: BUSINESS_DEFAULT_TENANT_ID }, orderBy: { createdAt: 'desc' }, take: 50 })
        : Promise.resolve([]),
      parsed.module === 'support'
        ? businessPrisma.supportTicket.findMany({ where: { tenantId: BUSINESS_DEFAULT_TENANT_ID }, orderBy: { createdAt: 'desc' }, take: 50 })
        : Promise.resolve([]),
      parsed.module === 'projects'
        ? businessPrisma.bizTask.findMany({
            where: { project: { tenantId: BUSINESS_DEFAULT_TENANT_ID } },
            include: { project: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : Promise.resolve([]),
      parsed.module === 'analytics'
        ? businessPrisma.biReport.findMany({ where: { tenantId: BUSINESS_DEFAULT_TENANT_ID }, orderBy: { id: 'desc' }, take: 50 })
        : Promise.resolve([]),
    ]);

    const records = [
      ...crmLeads.map((lead) => ({
          id: lead.id,
          title: `Lead ${lead.id.slice(0, 8)}`,
          subtitle: lead.source ?? 'Captured lead',
          meta: `Score ${lead.score}`,
          status: lead.status,
        })),
      ...expenses.map((expense) => ({
        id: expense.id,
        title: expense.category ?? 'Finance expense',
        subtitle: 'Expense approval workflow',
        meta: `$${expense.amount.toString()}`,
        status: expense.status,
      })),
      ...rfqs.map((rfq) => ({
        id: rfq.id,
        title: rfq.title,
        subtitle: 'RFQ workflow',
        meta: `Status ${rfq.status}`,
        status: rfq.status,
      })),
      ...tickets.map((ticket) => ({
        id: ticket.id,
        title: ticket.subject,
        subtitle: `Priority ${ticket.priority}`,
        meta: `Ticket ${ticket.id.slice(0, 8)}`,
        status: ticket.status,
      })),
      ...tasks.map((task) => ({
        id: task.id,
        title: task.title,
        subtitle: task.project.name,
        meta: `Task ${task.id.slice(0, 8)}`,
        status: task.status,
      })),
      ...reports.map((report) => ({
        id: report.id,
        title: report.name,
        subtitle: 'Analytics report',
        meta: toModuleFromReportName(report.name),
        status: 'Open',
      })),
    ];

    return NextResponse.json({ ok: true, records });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid query', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list operations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBusinessTenant();
    const payload = createOperationSchema.parse(await request.json());

    if (payload.module === 'sales') {
      return NextResponse.json({
        ok: false,
        error: 'Use /api/business/sales/orders for sales operations',
      }, { status: 400 });
    }

    if (payload.module === 'crm') {
      const lead = await businessPrisma.crmLead.create({
        data: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          source: payload.subtitle,
          status: payload.status,
          score: 0,
        },
      });
      return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
    }

    if (payload.module === 'finance') {
      const parsedAmount = Number((payload.meta ?? '').replace(/[^0-9.-]+/g, ''));
      const amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;

      const expense = await businessPrisma.financeExpense.create({
        data: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          amount,
          category: payload.title,
          status: 'submitted',
        },
      });
      return NextResponse.json({ ok: true, id: expense.id }, { status: 201 });
    }

    if (payload.module === 'procurement') {
      const rfq = await businessPrisma.procurementRfq.create({
        data: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          title: payload.title,
          status: 'open',
        },
      });
      return NextResponse.json({ ok: true, id: rfq.id }, { status: 201 });
    }

    if (payload.module === 'support') {
      const ticket = await businessPrisma.supportTicket.create({
        data: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          subject: payload.title,
          status: 'open',
          priority: 'medium',
        },
      });
      return NextResponse.json({ ok: true, id: ticket.id }, { status: 201 });
    }

    if (payload.module === 'projects') {
      let project = await businessPrisma.bizProject.findFirst({ where: { tenantId: BUSINESS_DEFAULT_TENANT_ID }, orderBy: { createdAt: 'desc' } });
      if (!project) {
        project = await businessPrisma.bizProject.create({
          data: {
            tenantId: BUSINESS_DEFAULT_TENANT_ID,
            name: 'Business Delivery Program',
            ownerId: 'system-owner',
          },
        });
      }

      const task = await businessPrisma.bizTask.create({
        data: {
          projectId: project.id,
          title: payload.title,
          status: payload.status,
        },
      });
      return NextResponse.json({ ok: true, id: task.id }, { status: 201 });
    }

    if (payload.module === 'analytics') {
      let dataset = await businessPrisma.biDataset.findFirst({ where: { tenantId: BUSINESS_DEFAULT_TENANT_ID }, orderBy: { id: 'desc' } });
      if (!dataset) {
        dataset = await businessPrisma.biDataset.create({
          data: {
            tenantId: BUSINESS_DEFAULT_TENANT_ID,
            name: 'Business Master Dataset',
            queryDef: {},
          },
        });
      }

      const report = await businessPrisma.biReport.create({
        data: {
          tenantId: BUSINESS_DEFAULT_TENANT_ID,
          datasetId: dataset.id,
          name: payload.title,
          config: { subtitle: payload.subtitle, meta: payload.meta },
        },
      });
      return NextResponse.json({ ok: true, id: report.id }, { status: 201 });
    }

    return NextResponse.json({ ok: false, error: `Module ${payload.module} is not supported by this endpoint` }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid operation payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create operation' }, { status: 500 });
  }
}
