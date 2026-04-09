import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  BarChartHorizontalBig,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  CircleDollarSign,
  CreditCard,
  Database,
  FileCheck2,
  FolderKanban,
  GanttChartSquare,
  Globe2,
  Headset,
  Hash,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  Package2,
  Radio,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
  Webhook,
  Workflow,
} from 'lucide-react';

export type AppProduct = 'projects' | 'business';

export type NavItemConfig = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
};

export type NavSectionConfig = {
  title: string;
  items: NavItemConfig[];
};

export const getAppProduct = (pathname: string): AppProduct => (
  pathname.startsWith('/business') ? 'business' : 'projects'
);

export const PRODUCT_SWITCH_ITEMS: Record<AppProduct, NavItemConfig> = {
  projects: { href: '/', label: 'Project OS', icon: FolderKanban, group: 'Products' },
  business: { href: '/business', label: 'Business OS', icon: Building2, group: 'Products' },
};

export const PROJECT_MENU_ITEMS: NavItemConfig[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', group: 'General' },
  { icon: Activity, label: 'Activity', href: '/activity', group: 'General' },
  { icon: Users, label: 'Teams', href: '/teams', group: 'General' },
];

export const PROJECT_VIEW_ITEMS: NavItemConfig[] = [
  { icon: Calendar, label: 'Calendar', href: '/calendar', group: 'Views' },
  { icon: GanttChartSquare, label: 'Timeline', href: '/timeline', group: 'Views' },
  { icon: UsersRound, label: 'Workload', href: '/workload', group: 'Views' },
  { icon: BarChart3, label: 'Reports', href: '/reports', group: 'Views' },
];

export const PROJECT_SCALE_ITEMS: NavItemConfig[] = [
  { icon: Brain, label: 'Intelligence', href: '/intelligence', group: 'Scale' },
  { icon: KeyRound, label: 'Identity', href: '/scale/identity', group: 'Scale' },
  { icon: Shield, label: 'Roles', href: '/scale/roles', group: 'Scale' },
  { icon: Workflow, label: 'Automation', href: '/scale/automation', group: 'Scale' },
  { icon: Briefcase, label: 'Portfolio', href: '/scale/portfolio', group: 'Scale' },
  { icon: Building2, label: 'Departments', href: '/scale/departments', group: 'Scale' },
  { icon: Globe2, label: 'Regions', href: '/scale/regions', group: 'Scale' },
  { icon: Radio, label: 'Events', href: '/scale/events', group: 'Scale' },
  { icon: FileCheck2, label: 'Compliance', href: '/scale/compliance', group: 'Scale' },
  { icon: BarChartHorizontalBig, label: 'Analytics', href: '/scale/analytics', group: 'Scale' },
  { icon: Database, label: 'Warehouse Export', href: '/scale/exports', group: 'Scale' },
];

export const PROJECT_SETTING_ITEMS: NavItemConfig[] = [
  { icon: LayoutTemplate, label: 'Templates', href: '/templates', group: 'Settings' },
  { icon: Webhook, label: 'Integrations', href: '/integrations', group: 'Settings' },
  { icon: Settings, label: 'Settings', href: '/settings', group: 'Settings' },
  { icon: CreditCard, label: 'Billing', href: '/billing', group: 'Settings' },
];

export const BUSINESS_OVERVIEW_ITEMS: NavItemConfig[] = [
  { icon: Building2, label: 'Business HQ', href: '/business', group: 'Overview' },
  { icon: Briefcase, label: 'Projects', href: '/business/projects', group: 'Overview' },
  { icon: Workflow, label: 'Automations', href: '/business/automations', group: 'Overview' },
];

export const BUSINESS_COMMERCIAL_ITEMS: NavItemConfig[] = [
  { icon: TrendingUp, label: 'CRM', href: '/business/crm', group: 'Commercial' },
  { icon: ShoppingCart, label: 'Sales', href: '/business/sales', group: 'Commercial' },
  { icon: Headset, label: 'Support', href: '/business/support', group: 'Commercial' },
  { icon: BarChart3, label: 'Analytics', href: '/business/analytics', group: 'Commercial' },
];

export const BUSINESS_OPERATIONS_ITEMS: NavItemConfig[] = [
  { icon: Package2, label: 'Inventory', href: '/business/inventory', group: 'Operations' },
  { icon: ShoppingCart, label: 'Procurement', href: '/business/procurement', group: 'Operations' },
  { icon: Wallet, label: 'HR', href: '/business/hr', group: 'Operations' },
];

export const BUSINESS_FINANCE_ITEMS: NavItemConfig[] = [
  { icon: CircleDollarSign, label: 'Accounting', href: '/business/finance', group: 'Finance' },
  { icon: Webhook, label: 'Integrations', href: '/business/integrations', group: 'Finance' },
  { icon: Settings, label: 'Business Settings', href: '/business/settings', group: 'Finance' },
];

export const BUSINESS_BOTTOM_NAV_ITEMS: NavItemConfig[] = [
  { href: '/business', label: 'HQ', icon: Building2, group: 'Overview' },
  { href: '/business/crm', label: 'CRM', icon: TrendingUp, group: 'Commercial' },
  { href: '/business/sales', label: 'Sales', icon: ShoppingCart, group: 'Commercial' },
  { href: '/business/finance', label: 'Accounting', icon: CircleDollarSign, group: 'Finance' },
  { href: '/business/inventory', label: 'Stock', icon: Package2, group: 'Operations' },
  { href: '/business/hr', label: 'HR', icon: Wallet, group: 'Operations' },
];

export const BUSINESS_SECTIONS: NavSectionConfig[] = [
  { title: 'Overview', items: BUSINESS_OVERVIEW_ITEMS },
  { title: 'Commercial', items: BUSINESS_COMMERCIAL_ITEMS },
  { title: 'Operations', items: BUSINESS_OPERATIONS_ITEMS },
  { title: 'Finance', items: BUSINESS_FINANCE_ITEMS },
];

export const buildQuickNavItems = ({
  projects,
  canManageMembers,
}: {
  projects: Array<{ id: string; name: string }>;
  canManageMembers: boolean;
}): NavItemConfig[] => [
  PRODUCT_SWITCH_ITEMS.projects,
  PRODUCT_SWITCH_ITEMS.business,
  ...PROJECT_MENU_ITEMS,
  ...PROJECT_VIEW_ITEMS,
  ...PROJECT_SCALE_ITEMS,
  ...PROJECT_SETTING_ITEMS,
  ...BUSINESS_OVERVIEW_ITEMS,
  ...BUSINESS_COMMERCIAL_ITEMS,
  ...BUSINESS_OPERATIONS_ITEMS,
  ...BUSINESS_FINANCE_ITEMS,
  ...(canManageMembers ? [{ label: 'Admin', href: '/admin', icon: ShieldCheck, group: 'General' }] : []),
  ...projects.map((project) => ({ label: project.name, href: `/projects/${project.id}`, icon: Hash, group: 'Projects' })),
];
