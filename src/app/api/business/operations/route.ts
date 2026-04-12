import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { BUSINESS_DEFAULT_TENANT_ID, col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';

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
    await ensureBusinessTenantDoc();
    const parsed = operationQuerySchema.parse({ module: request.nextUrl.searchParams.get('module') ?? '' });

    if (parsed.module === 'sales') {
      return NextResponse.json({
        ok: false,
        error: 'Use /api/business/sales/orders for sales operations',
      }, { status: 400 });
    }

    const load = async (collectionName: string) => {
      const snap = await adminFirestore.collection(collectionName).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).limit(50).get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    };
    const [crmLeads, expenses, rfqs, tickets, tasks, reports, projects] = await Promise.all([
      parsed.module === 'crm' ? load(col.bizCrmLeads) : Promise.resolve([]),
      parsed.module === 'finance' ? load(col.bizFinanceExpenses) : Promise.resolve([]),
      parsed.module === 'procurement' ? load(col.bizProcurementRfqs) : Promise.resolve([]),
      parsed.module === 'support' ? load(col.bizSupportTickets) : Promise.resolve([]),
      parsed.module === 'projects' ? load(col.bizTasks) : Promise.resolve([]),
      parsed.module === 'analytics' ? load(col.bizReports) : Promise.resolve([]),
      parsed.module === 'projects' ? load(col.bizProjects) : Promise.resolve([]),
    ]);
    const projectMap = new Map(projects.map((project) => [String(project.id), project]));

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
        subtitle: String(projectMap.get(String(task.projectId))?.name ?? 'Business project'),
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
    await ensureBusinessTenantDoc();
    const payload = createOperationSchema.parse(await request.json());

    if (payload.module === 'sales') {
      return NextResponse.json({
        ok: false,
        error: 'Use /api/business/sales/orders for sales operations',
      }, { status: 400 });
    }

    if (payload.module === 'crm') {
      const id = makeId(col.bizCrmLeads);
      await adminFirestore.collection(col.bizCrmLeads).doc(id).set({ id, tenantId: BUSINESS_DEFAULT_TENANT_ID, source: payload.subtitle, status: payload.status, score: 0, createdAt: nowIso() });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.module === 'finance') {
      const parsedAmount = Number((payload.meta ?? '').replace(/[^0-9.-]+/g, ''));
      const amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;

      const id = makeId(col.bizFinanceExpenses);
      await adminFirestore.collection(col.bizFinanceExpenses).doc(id).set({ id, tenantId: BUSINESS_DEFAULT_TENANT_ID, amount, category: payload.title, status: 'submitted', submittedAt: nowIso() });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.module === 'procurement') {
      const id = makeId(col.bizProcurementRfqs);
      await adminFirestore.collection(col.bizProcurementRfqs).doc(id).set({ id, tenantId: BUSINESS_DEFAULT_TENANT_ID, title: payload.title, status: 'open', createdAt: nowIso() });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.module === 'support') {
      const id = makeId(col.bizSupportTickets);
      await adminFirestore.collection(col.bizSupportTickets).doc(id).set({ id, tenantId: BUSINESS_DEFAULT_TENANT_ID, subject: payload.title, status: 'open', priority: 'medium', createdAt: nowIso() });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.module === 'projects') {
      const projectQuery = await adminFirestore.collection(col.bizProjects).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).limit(1).get();
      const projectId = projectQuery.empty ? makeId(col.bizProjects) : projectQuery.docs[0].id;
      if (projectQuery.empty) {
        await adminFirestore.collection(col.bizProjects).doc(projectId).set({ id: projectId, tenantId: BUSINESS_DEFAULT_TENANT_ID, name: 'Business Delivery Program', ownerId: 'system-owner', createdAt: nowIso() });
      }
      const id = makeId(col.bizTasks);
      await adminFirestore.collection(col.bizTasks).doc(id).set({ id, projectId, tenantId: BUSINESS_DEFAULT_TENANT_ID, title: payload.title, status: payload.status, createdAt: nowIso() });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.module === 'analytics') {
      const datasetQuery = await adminFirestore.collection(col.bizDatasets).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).limit(1).get();
      const datasetId = datasetQuery.empty ? makeId(col.bizDatasets) : datasetQuery.docs[0].id;
      if (datasetQuery.empty) {
        await adminFirestore.collection(col.bizDatasets).doc(datasetId).set({ id: datasetId, tenantId: BUSINESS_DEFAULT_TENANT_ID, name: 'Business Master Dataset', queryDef: {}, createdAt: nowIso() });
      }
      const id = makeId(col.bizReports);
      await adminFirestore.collection(col.bizReports).doc(id).set({ id, tenantId: BUSINESS_DEFAULT_TENANT_ID, datasetId, name: payload.title, config: { subtitle: payload.subtitle, meta: payload.meta }, createdAt: nowIso() });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    return NextResponse.json({ ok: false, error: `Module ${payload.module} is not supported by this endpoint` }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid operation payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create operation' }, { status: 500 });
  }
}
