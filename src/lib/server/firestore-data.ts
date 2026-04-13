import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/server/firebase-admin';

export const CORE_DEFAULT_TENANT_ID = process.env.CORE_DEFAULT_TENANT_ID ?? 'core-demo-tenant';
export const BUSINESS_DEFAULT_TENANT_ID = process.env.BUSINESS_DEFAULT_TENANT_ID ?? 'biz-demo-tenant';

export const col = {
  coreUsers: 'core_users',
  coreProjects: 'core_projects',
  coreTasks: 'core_tasks',
  coreMilestones: 'core_milestones',
  coreSubtasks: 'core_subtasks',
  coreTaskComments: 'core_task_comments',
  coreTenants: 'core_tenants',
  coreWorkspaces: 'core_workspaces',
  coreOnboardingTokens: 'core_onboarding_tokens',

  bizUsers: 'biz_users',
  bizEmployees: 'biz_employees',
  bizProducts: 'biz_products',
  bizProductCategories: 'biz_product_categories',
  bizProductVariants: 'biz_product_variants',
  bizProductBundles: 'biz_product_bundles',
  bizBundleItems: 'biz_bundle_items',
  bizUoms: 'biz_uoms',
  bizUomConversions: 'biz_uom_conversions',
  bizWarehouses: 'biz_warehouses',
  bizStockItems: 'biz_stock_items',
  bizStockMoves: 'biz_stock_moves',
  bizOrders: 'biz_orders',
  bizOrderLines: 'biz_order_lines',
  bizPayments: 'biz_payments',
  bizRestaurantBranches: 'biz_restaurant_branches',
  bizRestaurantTables: 'biz_restaurant_tables',
  bizRestaurantReservations: 'biz_restaurant_reservations',
  bizRestaurantPosSessions: 'biz_restaurant_pos_sessions',
  bizRestaurantKitchenTickets: 'biz_restaurant_kitchen_tickets',
  bizContracts: 'biz_contracts',
  bizAttendance: 'biz_attendance',
  bizLeaves: 'biz_leaves',
  bizPayrollRuns: 'biz_payroll_runs',
  bizPayslips: 'biz_payslips',
  bizCandidates: 'biz_candidates',
  bizAuditLogs: 'biz_audit_logs',
  bizCrmLeads: 'biz_crm_leads',
  bizFinanceExpenses: 'biz_finance_expenses',
  bizProcurementRfqs: 'biz_procurement_rfqs',
  bizSupportTickets: 'biz_support_tickets',
  bizProjects: 'biz_projects',
  bizTasks: 'biz_tasks',
  bizDatasets: 'biz_datasets',
  bizReports: 'biz_reports',
} as const;

export function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return undefined;
}

export function toIsoDateOnly(value: unknown): string | undefined {
  const iso = normalizeDate(value);
  return iso ? iso.slice(0, 10) : undefined;
}

export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function makeId(collectionName: string): string {
  return adminFirestore.collection(collectionName).doc().id;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export async function ensureBusinessTenantDoc(tenantId = BUSINESS_DEFAULT_TENANT_ID, ownerEmail?: string) {
  const ref = adminFirestore.collection(col.coreTenants).doc(tenantId);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      id: tenantId,
      name: tenantId === BUSINESS_DEFAULT_TENANT_ID ? 'Business Demo Tenant' : `Business Tenant ${tenantId}`,
      ownerEmail: ownerEmail?.toLowerCase() ?? null,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  if (ownerEmail) {
    await ref.set(
      {
        ownerEmail: ownerEmail.toLowerCase(),
        updatedAt: nowIso(),
      },
      { merge: true }
    );
  }
}

export function serverTimestamp() {
  return FieldValue.serverTimestamp();
}
