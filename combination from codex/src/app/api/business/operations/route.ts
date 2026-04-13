import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

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
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const parsed = operationQuerySchema.parse({ module: request.nextUrl.searchParams.get('module') ?? '' });

    if (parsed.module === 'sales') {
      return NextResponse.json({
        ok: false,
        error: 'Use /api/business/sales/orders for sales operations',
      }, { status: 400 });
    }

    const load = async (collectionName: string): Promise<Array<Record<string, unknown>>> => {
      const snap = await adminFirestore.collection(collectionName).where('tenantId', '==', tenantId).limit(50).get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Record<string, unknown>));
    };
    const [crmLeads, expenses, rfqs, tickets, tasks, reports, projects] = (await Promise.all([
      parsed.module === 'crm' ? load(col.bizCrmLeads) : Promise.resolve([]),
      parsed.module === 'finance' ? load(col.bizFinanceExpenses) : Promise.resolve([]),
      parsed.module === 'procurement' ? load(col.bizProcurementRfqs) : Promise.resolve([]),
      parsed.module === 'support' ? load(col.bizSupportTickets) : Promise.resolve([]),
      parsed.module === 'projects' ? load(col.bizTasks) : Promise.resolve([]),
      parsed.module === 'analytics' ? load(col.bizReports) : Promise.resolve([]),
      parsed.module === 'projects' ? load(col.bizProjects) : Promise.resolve([]),
    ])) as [
      Array<Record<string, unknown>>,
      Array<Record<string, unknown>>,
      Array<Record<string, unknown>>,
      Array<Record<string, unknown>>,
      Array<Record<string, unknown>>,
      Array<Record<string, unknown>>,
      Array<Record<string, unknown>>,
    ];
    const projectMap = new Map(projects.map((project) => [String(project.id), project]));

    const records = [
      ...crmLeads.map((lead) => ({
          id: String(lead['id'] ?? ''),
          title: `Lead ${String(lead['id'] ?? '').slice(0, 8)}`,
          subtitle: String(lead['source'] ?? 'Captured lead'),
          meta: `Score ${String(lead['score'] ?? '0')}`,
          status: String(lead['status'] ?? 'Open'),
        })),
      ...expenses.map((expense) => ({
        id: String(expense['id'] ?? ''),
        title: String(expense['category'] ?? 'Finance expense'),
        subtitle: 'Expense approval workflow',
        meta: `$${String(expense['amount'] ?? '0')}`,
        status: String(expense['status'] ?? 'submitted'),
      })),
      ...rfqs.map((rfq) => ({
        id: String(rfq['id'] ?? ''),
        title: String(rfq['title'] ?? ''),
        subtitle: 'RFQ workflow',
        meta: `Status ${String(rfq['status'] ?? 'open')}`,
        status: String(rfq['status'] ?? 'open'),
      })),
      ...tickets.map((ticket) => ({
        id: String(ticket['id'] ?? ''),
        title: String(ticket['subject'] ?? ''),
        subtitle: `Priority ${String(ticket['priority'] ?? 'medium')}`,
        meta: `Ticket ${String(ticket['id'] ?? '').slice(0, 8)}`,
        status: String(ticket['status'] ?? 'open'),
      })),
      ...tasks.map((task) => ({
        id: String(task['id'] ?? ''),
        title: String(task['title'] ?? ''),
        subtitle: String(projectMap.get(String(task['projectId'] ?? ''))?.['name'] ?? 'Business project'),
        meta: `Task ${String(task['id'] ?? '').slice(0, 8)}`,
        status: String(task['status'] ?? 'Open'),
      })),
      ...reports.map((report) => ({
        id: String(report['id'] ?? ''),
        title: String(report['name'] ?? ''),
        subtitle: 'Analytics report',
        meta: toModuleFromReportName(String(report['name'] ?? 'module:report')),
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
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = createOperationSchema.parse(await request.json());

    if (payload.module === 'sales') {
      return NextResponse.json({
        ok: false,
        error: 'Use /api/business/sales/orders for sales operations',
      }, { status: 400 });
    }

    if (payload.module === 'crm') {
      const id = makeId(col.bizCrmLeads);
      await adminFirestore.collection(col.bizCrmLeads).doc(id).set({ id, tenantId, source: payload.subtitle, status: payload.status, score: 0, createdAt: nowIso() });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.module === 'finance') {
      const parsedAmount = Number((payload.meta ?? '').replace(/[^0-9.-]+/g, ''));
      const amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;

      const id = makeId(col.bizFinanceExpenses);
      await adminFirestore.collection(col.bizFinanceExpenses).doc(id).set({ id, tenantId, amount, category: payload.title, status: 'submitted', submittedAt: nowIso() });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.module === 'procurement') {
      const id = makeId(col.bizProcurementRfqs);
      await adminFirestore.collection(col.bizProcurementRfqs).doc(id).set({ id, tenantId, title: payload.title, status: 'open', createdAt: nowIso() });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.module === 'support') {
      const id = makeId(col.bizSupportTickets);
      await adminFirestore.collection(col.bizSupportTickets).doc(id).set({ id, tenantId, subject: payload.title, status: 'open', priority: 'medium', createdAt: nowIso() });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.module === 'projects') {
      const projectQuery = await adminFirestore.collection(col.bizProjects).where('tenantId', '==', tenantId).limit(1).get();
      const projectId = projectQuery.empty ? makeId(col.bizProjects) : projectQuery.docs[0].id;
      if (projectQuery.empty) {
        await adminFirestore.collection(col.bizProjects).doc(projectId).set({ id: projectId, tenantId, name: 'Business Delivery Program', ownerId: 'system-owner', createdAt: nowIso() });
      }
      const id = makeId(col.bizTasks);
      await adminFirestore.collection(col.bizTasks).doc(id).set({ id, projectId, tenantId, title: payload.title, status: payload.status, createdAt: nowIso() });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.module === 'analytics') {
      const datasetQuery = await adminFirestore.collection(col.bizDatasets).where('tenantId', '==', tenantId).limit(1).get();
      const datasetId = datasetQuery.empty ? makeId(col.bizDatasets) : datasetQuery.docs[0].id;
      if (datasetQuery.empty) {
        await adminFirestore.collection(col.bizDatasets).doc(datasetId).set({ id: datasetId, tenantId, name: 'Business Master Dataset', queryDef: {}, createdAt: nowIso() });
      }
      const id = makeId(col.bizReports);
      await adminFirestore.collection(col.bizReports).doc(id).set({ id, tenantId, datasetId, name: payload.title, config: { subtitle: payload.subtitle, meta: payload.meta }, createdAt: nowIso() });
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
