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
  UtensilsCrossed,
  Radio,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
  Webhook,
  Workflow,
  Zap,
} from 'lucide-react';
import { buildBusinessWorkspaceHref } from '@/lib/business-navigation';

export type AppProduct = 'projects' | 'business';

/**
 * Gate keys used to decide whether a business nav item should be visible based on the
 * tenant's enabledModules. Items without a gate (or with gate 'always') are always shown.
 * 'general' is an alias for 'always' used to label utility/common links (Business Settings,
 * Integrations, Automations, Business HQ).
 */
export type BusinessNavGate =
  | 'always'
  | 'general'
  | 'hr'
  | 'crm'
  | 'restaurant'
  | 'cosmetics'
  | 'finance'
  | 'inventory'
  | 'projects'
  | 'procurement'
  | 'support'
  | 'analytics';

export type NavItemConfig = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
  gate?: BusinessNavGate;
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
  { icon: Star, label: 'My Tasks', href: '/my-tasks', group: 'General' },
  { icon: Activity, label: 'Activity', href: '/activity', group: 'General' },
  { icon: Users, label: 'Teams', href: '/teams', group: 'General' },
];

export const PROJECT_VIEW_ITEMS: NavItemConfig[] = [
  { icon: Calendar, label: 'Calendar', href: '/calendar', group: 'Views' },
  { icon: GanttChartSquare, label: 'Timeline', href: '/timeline', group: 'Views' },
  { icon: UsersRound, label: 'Workload', href: '/workload', group: 'Views' },
  { icon: BarChart3, label: 'Reports', href: '/reports', group: 'Views' },
  { icon: Zap, label: 'Sprints', href: '/sprints', group: 'Views' },
  { icon: Target, label: 'Goals & OKRs', href: '/goals', group: 'Views' },
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
  { icon: Building2, label: 'Business HQ', href: '/business', group: 'Overview', gate: 'general' },
  { icon: Briefcase, label: 'Projects', href: buildBusinessWorkspaceHref('projects'), group: 'Overview', gate: 'projects' },
  { icon: Workflow, label: 'Automations', href: '/business/automations', group: 'Overview', gate: 'general' },
];

export const BUSINESS_COMMERCIAL_ITEMS: NavItemConfig[] = [
  { icon: ShoppingCart, label: 'Sales & CRM', href: buildBusinessWorkspaceHref('sales'), group: 'Commercial', gate: 'crm' },
  { icon: Headset, label: 'Support', href: buildBusinessWorkspaceHref('support'), group: 'Commercial', gate: 'support' },
  { icon: BarChart3, label: 'Analytics', href: buildBusinessWorkspaceHref('analytics'), group: 'Commercial', gate: 'analytics' },
];

export const BUSINESS_OPERATIONS_ITEMS: NavItemConfig[] = [
  { icon: UtensilsCrossed, label: 'Restaurant', href: '/business/restaurant', group: 'Operations', gate: 'restaurant' },
  { icon: Sparkles, label: 'Cosmetics', href: '/business/cosmetics', group: 'Operations', gate: 'cosmetics' },
  { icon: Package2, label: 'Inventory', href: buildBusinessWorkspaceHref('inventory'), group: 'Operations', gate: 'inventory' },
  { icon: ShoppingCart, label: 'Procurement', href: buildBusinessWorkspaceHref('procurement'), group: 'Operations', gate: 'procurement' },
  { icon: Wallet, label: 'HR', href: buildBusinessWorkspaceHref('hr'), group: 'Operations', gate: 'hr' },
];

export const BUSINESS_FINANCE_ITEMS: NavItemConfig[] = [
  { icon: CircleDollarSign, label: 'Accounting', href: buildBusinessWorkspaceHref('finance'), group: 'Finance', gate: 'finance' },
  { icon: Webhook, label: 'Integrations', href: '/business/integrations', group: 'Finance', gate: 'general' },
  { icon: Settings, label: 'Business Settings', href: '/business/settings', group: 'Finance', gate: 'general' },
];

export const BUSINESS_BOTTOM_NAV_ITEMS: NavItemConfig[] = [
  { href: '/business', label: 'HQ', icon: Building2, group: 'Overview', gate: 'general' },
  { href: buildBusinessWorkspaceHref('sales'), label: 'Sales', icon: ShoppingCart, group: 'Commercial', gate: 'crm' },
  { href: buildBusinessWorkspaceHref('finance'), label: 'Accounting', icon: CircleDollarSign, group: 'Finance', gate: 'finance' },
  { href: buildBusinessWorkspaceHref('inventory'), label: 'Stock', icon: Package2, group: 'Operations', gate: 'inventory' },
  { href: buildBusinessWorkspaceHref('hr'), label: 'HR', icon: Wallet, group: 'Operations', gate: 'hr' },
];

/**
 * Filter any flat nav item list (e.g. the mobile bottom nav) by the tenant's enabledModules.
 * Same gating semantics as {@link filterBusinessSections}.
 */
export function filterBusinessNavItems(
  items: NavItemConfig[],
  enabledModules?: string[] | null,
): NavItemConfig[] {
  if (!enabledModules || enabledModules.length === 0) return items;
  const enabledSet = new Set(enabledModules.map((m) => m.toLowerCase()));
  return items.filter((item) => {
    const gate = item.gate ?? 'always';
    if (gate === 'always' || gate === 'general') return true;
    return enabledSet.has(gate);
  });
}

export const BUSINESS_SECTIONS: NavSectionConfig[] = [
  { title: 'Overview', items: BUSINESS_OVERVIEW_ITEMS },
  { title: 'Commercial', items: BUSINESS_COMMERCIAL_ITEMS },
  { title: 'Operations', items: BUSINESS_OPERATIONS_ITEMS },
  { title: 'Finance', items: BUSINESS_FINANCE_ITEMS },
];

/**
 * Filter business sidebar sections so the tenant only sees:
 *   - Items gated 'always' or 'general' (common links like Business HQ, Automations, Integrations, Business Settings).
 *   - Items gated to a module that is in `enabledModules`.
 * Sections that end up with no items are dropped entirely.
 *
 * If `enabledModules` is empty/undefined (legacy tenants or projects mode), no filtering is applied.
 */
export function filterBusinessSections(
  sections: NavSectionConfig[],
  enabledModules?: string[] | null,
): NavSectionConfig[] {
  if (!enabledModules || enabledModules.length === 0) return sections;
  const enabledSet = new Set(enabledModules.map((m) => m.toLowerCase()));

  return sections
    .map((section) => {
      const items = section.items.filter((item) => {
        const gate = item.gate ?? 'always';
        if (gate === 'always' || gate === 'general') return true;
        return enabledSet.has(gate);
      });
      return { ...section, items };
    })
    .filter((section) => section.items.length > 0);
}

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
  { label: 'Sprints', href: '/sprints', icon: Zap, group: 'PM' },
  { label: 'Goals & OKRs', href: '/goals', icon: Target, group: 'PM' },
  { label: 'My Tasks', href: '/my-tasks', icon: Star, group: 'PM' },
];
