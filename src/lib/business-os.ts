import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Briefcase,
  Building2,
  CircleDollarSign,
  Headset,
  Package2,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

export type BusinessModuleKey =
  | 'crm'
  | 'finance'
  | 'hr'
  | 'inventory'
  | 'projects'
  | 'procurement'
  | 'support'
  | 'analytics';

export type BusinessStat = {
  label: string;
  value: string;
  delta: string;
};

export type BusinessRecord = {
  title: string;
  subtitle: string;
  meta: string;
  status?: string;
};

export type BusinessModuleSpec = {
  key: BusinessModuleKey;
  title: string;
  eyebrow: string;
  route: string;
  icon: LucideIcon;
  summary: string;
  coreObjects: string[];
  features: string[];
  workflows: string[];
  governance: string[];
  stats: BusinessStat[];
  records: BusinessRecord[];
};

export const BUSINESS_EXECUTIVE_SUMMARY = {
  title: 'Unified Business Operating System',
  description:
    'A modular, multi-tenant operating layer for CRM, Finance, HR, Inventory, Projects, Procurement, Support, and Analytics. Built to reuse the same tenant, auth, caching, navigation, and workflow infrastructure already running inside Pinkplan.',
  stats: [
    { label: 'Core domains', value: '8', delta: 'CRM to analytics on one stack' },
    { label: 'Shared platform', value: '100%', delta: 'Auth, tenants, caching, nav reused' },
    { label: 'Automation ready', value: '34 flows', delta: 'Cross-module triggers supported' },
    { label: 'Enterprise posture', value: 'Multi-tenant', delta: 'Isolation-first architecture' },
  ] as BusinessStat[],
};

export const BUSINESS_MODULE_SPECS: BusinessModuleSpec[] = [
  {
    key: 'crm',
    title: 'CRM and Sales',
    eyebrow: 'Revenue engine',
    route: '/business/crm',
    icon: TrendingUp,
    summary:
      'Manage leads, contacts, accounts, deals, activities, forecasting, and territory logic from one revenue workspace.',
    coreObjects: ['Leads', 'Contacts', 'Accounts', 'Deals', 'Activities'],
    features: [
      'Lead capture from forms, imports, and API intake',
      'Custom pipeline stages and weighted forecasting',
      'Email sync hooks for IMAP, SMTP, and OAuth providers',
      'Territory management and lead ownership rules',
    ],
    workflows: [
      'Lead scoring and automated assignment',
      'Stage-based triggers for follow-up and escalation',
      'Territory-based routing and quota management',
    ],
    governance: [
      'Field-level security on commercial data',
      'Territory-scoped access and ownership rules',
      'Audit trail for pipeline changes and approvals',
    ],
    stats: [
      { label: 'Pipeline value', value: '$1.42M', delta: '32 active deals' },
      { label: 'Lead velocity', value: '184', delta: '+14% this month' },
      { label: 'Win rate', value: '28%', delta: '+3 pts QoQ' },
      { label: 'Forecast confidence', value: '87%', delta: 'Weighted by stage health' },
    ],
    records: [
      { title: 'Apex Retail Expansion', subtitle: 'Enterprise deal in proposal stage', meta: '$180k ARR', status: 'Proposal' },
      { title: 'Northwind Inbound', subtitle: 'Lead auto-assigned to West territory', meta: 'Score 82', status: 'Qualified' },
      { title: 'BluePeak Renewal', subtitle: 'Renewal opportunity due this week', meta: '$42k ARR', status: 'Negotiation' },
    ],
  },
  {
    key: 'finance',
    title: 'Finance & Accounting',
    eyebrow: 'Financial control',
    route: '/business/finance',
    icon: CircleDollarSign,
    summary:
      'Run double-entry accounting, invoicing, payment reconciliation, bank feeds, and financial reporting from one finance workspace.',
    coreObjects: ['Chart of Accounts', 'Journals', 'Invoices', 'Payments', 'Expenses'],
    features: [
      'Double-entry ledger',
      'Invoicing (recurring, taxes, discounts)',
      'Payment reconciliation',
      'Bank feeds (via integrations)',
      'Financial reports (P&L, Balance Sheet, Cashflow)',
      'Inventory valuation methods (FIFO, LIFO, Weighted Average, Standard Cost)',
      'Landed cost calculation (shipping, duties, taxes)',
      'Real-time inventory valuation with accounting sync',
      'Integration with accounting (GL posting)',
    ],
    workflows: [
      'Invoice approvals',
      'Expense approvals',
      'Dunning',
      'Inventory valuation journal posting to GL',
    ],
    governance: [
      'Tax rules per region',
      'Audit trails',
    ],
    stats: [
      { label: 'Invoices issued', value: '214', delta: '$642k billed this month' },
      { label: 'Cash collected', value: '$426k', delta: '+8.1% vs last month' },
      { label: 'Open payables', value: '$126k', delta: '14 due this week' },
      { label: 'Close readiness', value: '82%', delta: '2 blockers remaining' },
    ],
    records: [
      { title: 'INV-10482', subtitle: 'Quarterly services invoice awaiting payment', meta: '$18,240', status: 'Open' },
      { title: 'Bank reconciliation', subtitle: 'Feed imported from treasury connector', meta: '43 unmatched lines', status: 'Review' },
      { title: 'Expense batch APR-2', subtitle: 'Manager approvals complete', meta: '$6,842', status: 'Ready to pay' },
    ],
  },
  {
    key: 'hr',
    title: 'HR & Payroll',
    eyebrow: 'People operations',
    route: '/business/hr',
    icon: Wallet,
    summary:
      'Manage employee profiles, attendance, leave, payroll, and recruitment in one approval-driven people operations workspace.',
    coreObjects: ['Employees', 'Contracts', 'Attendance', 'Leave', 'Payroll Runs'],
    features: [
      'Employee profiles (skills, role, org unit)',
      'Time & attendance (clock-in, shifts)',
      'Leave management (policies)',
      'Payroll (earnings, deductions, payslips)',
      'Recruitment (candidates, stages)',
    ],
    workflows: [
      'Hiring approvals',
      'Leave approvals',
      'Payroll approvals',
    ],
    governance: [
      'Role-based access for compensation data',
      'Approval chains for hiring and payroll changes',
      'Audit visibility into attendance and leave edits',
    ],
    stats: [
      { label: 'Employees', value: '412', delta: '28 departments covered' },
      { label: 'Payroll due', value: '$842k', delta: 'Run closes tomorrow' },
      { label: 'Open leave requests', value: '17', delta: '5 urgent approvals' },
      { label: 'Hiring stages', value: '26', delta: 'Across 9 open roles' },
    ],
    records: [
      { title: 'Payroll Run May-1', subtitle: 'Gross payroll ready for finance approval', meta: '$842,114', status: 'Pending approval' },
      { title: 'Nina Joseph', subtitle: 'Senior Ops Manager annual review due', meta: 'Comp cycle Q2', status: 'Action needed' },
      { title: 'Leave Request LR-203', subtitle: 'Parental leave request from fulfillment team', meta: '14 working days', status: 'Manager review' },
    ],
  },
  {
    key: 'inventory',
    title: 'Product Management & Inventory',
    eyebrow: 'Catalog and stock operations',
    route: '/business/inventory',
    icon: Package2,
    summary:
      'Manage the full product master, variants, SKU logic, units, bundles, lifecycle status, warehouses, and stock operations in one unified module.',
    coreObjects: [
      'Product Master',
      'Product Variants',
      'SKUs',
      'Units of Measure',
      'Categories',
      'Bundles / Kits',
      'Warehouses',
      'Storage Locations',
      'Stock Types',
      'Inventory Ownership',
      'Stock Moves',
      'Stock Move Lines',
      'Batches / Lots',
      'Serial Numbers',
      'Inventory Adjustments',
      'Stock Snapshots',
      'Warehouse Hierarchy',
      'Inter-Warehouse Transfers',
      'Cross-Docking Routes',
      'Smart Routing Rules',
      'Inventory Reservations',
      'ATP / CTP Commitments',
      'Reordering Rules',
      'Demand Forecasts',
      'MRP Plans',
      'Cycle Counts',
      'Transit Locations',
      'Returns (RMA)',
      'Scrap and Write-Offs',
      'Bills of Materials (BOM)',
      'Work Orders',
      'Production Consumption Logs',
    ],
    features: [
      'Product Master (physical, digital, service)',
      'Product Variants (size, color, etc.)',
      'SKU auto-generation rules',
      'Units of Measure (UoM conversions)',
      'Product Categories & Hierarchies',
      'Product Bundles / Kits (BOM-lite)',
      'Product Lifecycle Status (active, discontinued, seasonal)',
      'Warehouses (multi-location support)',
      'Storage Locations (zones, bins, shelves)',
      'Stock Types (On-hand, Reserved, Available, In-transit)',
      'Inventory Ownership (company, consignment, vendor-owned)',
      'Stock Moves (every movement logged)',
      'Stock Move Lines (granular tracking)',
      'Batches / Lots',
      'Serial Numbers (per unit tracking)',
      'Inventory Adjustments (manual + automated)',
      'Stock Snapshots (historical states)',
      'Warehouse hierarchy (region → warehouse → bin)',
      'Inter-warehouse transfers',
      'Cross-docking',
      'Smart routing rules (shortest path / cost optimization)',
      'Live stock levels (event-driven updates)',
      'Inventory reservations (sales / production)',
      'Available-to-Promise (ATP)',
      'Capable-to-Promise (CTP)',
      'Reordering rules: Min/Max, Safety stock, EOQ (Economic Order Quantity)',
      'Demand forecasting (AI/ML optional)',
      'Automatic purchase suggestions',
      'MRP (Material Requirements Planning)',
      'Seasonal demand adjustments',
      'Forward & backward traceability',
      'Expiry date tracking (FEFO/FIFO)',
      'Recall management',
      'Compliance tracking (pharma/food-grade ready)',
      'Barcode / QR scanning support',
      'Batch picking & wave picking',
      'Putaway strategies: Fixed bin, Random, Nearest location',
      'Cycle counting (ABC classification)',
      'Automated stock reconciliation',
      'Stock transfers (intra/inter warehouse)',
      'Transit locations tracking',
      'Delivery route planning',
      'Fleet/logistics integration',
      'Purchase returns',
      'Customer returns (RMA)',
      'Repair/refurbish workflows',
      'Scrap & write-offs',
      'Bill of Materials (BOM)',
      'Work Orders',
      'Component reservations',
      'Production consumption tracking',
    ],
    workflows: [
      'Product onboarding from draft to active catalog',
      'Variant and SKU generation during item setup',
      'Stock transfer routing across warehouses',
      'Reservation and allocation flows from available stock',
      'Adjustment and snapshot reconciliation across tracked stock states',
      'Cross-dock routing and inter-warehouse optimization decisions',
      'Automated replenishment and purchase suggestion cycles',
      'Traceability and recall workflows for lots and serials',
      'Return, repair/refurbish, and write-off handling',
      'Optional manufacturing workflow from BOM to work order consumption',
    ],
    governance: [
      'Warehouse-level permissions and movement audit trail',
      'Lifecycle controls for active, seasonal, and discontinued items',
      'Policy checks on adjustment, bundle, and catalog edits',
      'Compliance controls for FEFO/FIFO and regulated traceability',
    ],
    stats: [
      { label: 'SKUs tracked', value: '3,284', delta: '214 low-stock items' },
      { label: 'Warehouses', value: '6', delta: '2 cross-region nodes' },
      { label: 'Fill rate', value: '97.3%', delta: '+1.1% vs last month' },
      { label: 'Inventory turns', value: '6.8x', delta: 'Healthy for current demand' },
    ],
    records: [
      { title: 'SKU-A19 Recharge Unit', subtitle: 'Critical low-stock threshold breached', meta: '18 units on hand', status: 'Reorder' },
      { title: 'Transfer TR-492', subtitle: 'West to Central replenishment shipment', meta: '126 cartons', status: 'In transit' },
      { title: 'Batch B-8821', subtitle: 'Lot-tracked inbound electronics receipt', meta: 'QC pending', status: 'Inspection' },
    ],
  },
  {
    key: 'projects',
    title: 'Projects and Tasks',
    eyebrow: 'Delivery execution',
    route: '/business/projects',
    icon: Briefcase,
    summary:
      'Reuse the existing project execution stack for delivery, milestones, dependencies, time tracking, resource planning, and billing alignment.',
    coreObjects: ['Projects', 'Tasks', 'Milestones', 'Time Entries'],
    features: [
      'Kanban, list, and timeline planning views',
      'Dependencies, sprint planning, and delivery milestones',
      'Time tracking and billable effort capture',
      'Resource allocation across workstreams',
    ],
    workflows: [
      'Task approvals and stage transitions',
      'SLA alerts for overdue work and milestones',
      'Billing sync from tracked effort and project delivery',
    ],
    governance: [
      'Project membership and task assignment controls',
      'Audit logging on operational milestones',
      'Cross-product linkage without route overlap',
    ],
    stats: [
      { label: 'Active projects', value: '24', delta: 'Shared with Project OS' },
      { label: 'Open tasks', value: '186', delta: '42 due this week' },
      { label: 'Logged time', value: '1,284h', delta: 'Across active delivery work' },
      { label: 'Utilization', value: '78%', delta: 'Balanced across key teams' },
    ],
    records: [
      { title: 'Implementation Sprint 14', subtitle: 'Customer delivery milestone due Friday', meta: '78% complete', status: 'On track' },
      { title: 'Finance Automation Rollout', subtitle: 'Cross-functional BOS project', meta: '43 tasks', status: 'In progress' },
      { title: 'Resource Review', subtitle: 'Staffing alignment across delivery pods', meta: '6 conflicts detected', status: 'Needs rebalance' },
    ],
  },
  {
    key: 'procurement',
    title: 'Procurement and Vendors',
    eyebrow: 'Procurement control',
    route: '/business/procurement',
    icon: ShoppingCart,
    summary:
      'Manage vendor relationships, RFQs, purchase orders, receipts, contracts, and supplier performance in one procurement workspace.',
    coreObjects: ['Vendors', 'RFQs', 'Vendor Comparison Matrix', 'Purchase Orders', 'Goods Receipt Notes (GRN)', 'Receipts', 'Quality Inspections'],
    features: [
      'RFQ (Request for Quotation)',
      'Vendor comparison matrix',
      'RFQ to PO to receipt to bill flow orchestration',
      'Vendor performance and SLA tracking',
      'Commercial terms and contract management',
      'Spend controls and purchasing visibility',
      'Partial deliveries and backorders',
      'Goods Receipt Notes (GRN)',
      'Quality inspection on receipt',
    ],
    workflows: [
      'Purchase approvals workflow',
      'Purchase approval routing by threshold and policy',
      'Receipt matching against approved POs',
      'Supplier escalation for SLA and quality issues',
      'Backorder and partial-delivery follow-up workflow',
    ],
    governance: [
      'Policy-based purchasing approvals',
      'Vendor access and commercial audit trail',
      'Contract lifecycle visibility and exceptions',
    ],
    stats: [
      { label: 'Open RFQs', value: '24', delta: '7 urgent sourcing events' },
      { label: 'Open POs', value: '58', delta: '11 awaiting approval' },
      { label: 'Vendor SLA', value: '94%', delta: 'Across top 20 suppliers' },
      { label: 'Spend this month', value: '$188k', delta: 'Within budget guardrail' },
    ],
    records: [
      { title: 'RFQ-209 Office expansion', subtitle: 'Three qualified vendor responses received', meta: '$48k expected', status: 'Comparing quotes' },
      { title: 'PO-8812', subtitle: 'Electronics replenishment for warehouse west', meta: '$22,190', status: 'Awaiting approval' },
      { title: 'Vendor Atlas Supply', subtitle: 'Lead time drift against contract SLA', meta: '3 late receipts', status: 'At risk' },
    ],
  },
  {
    key: 'support',
    title: 'Customer Support',
    eyebrow: 'Service operations',
    route: '/business/support',
    icon: Headset,
    summary:
      'Operate a multi-channel helpdesk with SLA timers, escalations, canned responses, and knowledge workflows.',
    coreObjects: ['Tickets', 'SLAs', 'Knowledge Base'],
    features: [
      'Ticket intake by email, chat, and API hooks',
      'SLA timers, breach alerts, and escalations',
      'Canned responses and knowledge-base reuse',
      'Queue and priority views for support teams',
    ],
    workflows: [
      'Escalation routing on SLA breach risk',
      'Auto-classification and assignment rules',
      'Knowledge suggestions during response drafting',
    ],
    governance: [
      'Queue-level access controls',
      'SLA policy configuration and audit history',
      'Customer communication logging',
    ],
    stats: [
      { label: 'Open tickets', value: '146', delta: '18 due in next 4 hours' },
      { label: 'SLA attainment', value: '96.4%', delta: '+1.7 pts this month' },
      { label: 'First response', value: '22 min', delta: 'Below target' },
      { label: 'KB reuse', value: '41%', delta: 'Higher than last month' },
    ],
    records: [
      { title: 'TKT-18492', subtitle: 'Billing issue escalated from chat', meta: 'P1 customer', status: 'Escalated' },
      { title: 'Warehouse sync error', subtitle: 'Integration incident impacting stock updates', meta: '7 linked accounts', status: 'Investigating' },
      { title: 'KB-14 Returns policy', subtitle: 'Top referenced article this week', meta: '182 views', status: 'Healthy' },
    ],
  },
  {
    key: 'analytics',
    title: 'Analytics and BI',
    eyebrow: 'Decision intelligence',
    route: '/business/analytics',
    icon: BarChart3,
    summary:
      'Combine datasets, dashboards, scheduled reports, and exports across commercial, operational, and financial domains.',
    coreObjects: ['Datasets', 'Reports', 'Dashboards'],
    features: [
      'Prebuilt dashboards for sales, finance, HR, and operations',
      'Custom report builder and KPI configuration',
      'Scheduled report generation and delivery',
      'CSV and PDF export-ready surfaces',
    ],
    workflows: [
      'Scheduled reporting and executive packs',
      'Metric threshold alerts and anomaly follow-up',
      'Cross-domain analysis with reusable datasets',
    ],
    governance: [
      'Role-scoped data access and report sharing',
      'Export traceability and distribution history',
      'Tenant-safe dataset boundaries',
    ],
    stats: [
      { label: 'Tracked KPIs', value: '48', delta: 'Across 7 business domains' },
      { label: 'Executive packs', value: '12', delta: 'Auto-generated weekly' },
      { label: 'Scheduled reports', value: '64', delta: '92% opened by recipients' },
      { label: 'Forecast confidence', value: '89%', delta: 'Based on last 90 days' },
    ],
    records: [
      { title: 'Finance Pulse', subtitle: 'Cash, burn, collections, and payables dashboard', meta: 'Refreshed 11m ago', status: 'Live' },
      { title: 'Ops Scorecard', subtitle: 'Warehouse, procurement, and SLA health', meta: '12 widgets', status: 'Live' },
      { title: 'Quarterly Board Pack', subtitle: 'Scheduled executive report bundle', meta: 'Next send Friday', status: 'Scheduled' },
    ],
  },
];

export const BUSINESS_MODULES_BY_KEY = Object.fromEntries(
  BUSINESS_MODULE_SPECS.map((module) => [module.key, module])
) as Record<BusinessModuleKey, BusinessModuleSpec>;

export const BUSINESS_MODULE_SUMMARIES = BUSINESS_MODULE_SPECS.map((module) => ({
  key: module.key,
  title: module.title,
  summary: module.summary,
  route: module.route,
  icon: module.icon,
}));

export const BUSINESS_PLATFORM_PILLARS = [
  'Single tenant, workspace, and auth foundation across both products',
  'Product-separated routing under one domain using shared shell infrastructure',
  'Module-ready automation, caching, and API patterns already in place',
  'Isolation-first posture for SMB through enterprise scale',
];

export const BUSINESS_IMPLEMENTATION_STEPS = [
  'Foundation: shared product shell, BOS module routing, executive overview',
  'Domain layer: CRM, Finance, HR, Inventory, Procurement, Support, Analytics objects',
  'Operational workflows: approvals, SLAs, assignments, reconciliation, automation',
  'Persistence: PostgreSQL schema, REST routes, Redis hot-path caching, background jobs',
];
