"use client";

import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ClipboardList, ListChecks, LogOut, Plus, ShieldCheck, Workflow } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAppState } from '@/lib/store';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNavigationFeedback } from './NavigationFeedback';
import {
  BUSINESS_SECTIONS,
  PRODUCT_SWITCH_ITEMS,
  PROJECT_MENU_ITEMS,
  PROJECT_SCALE_ITEMS,
  PROJECT_SETTING_ITEMS,
  PROJECT_VIEW_ITEMS,
  filterBusinessSections,
  getAppProduct,
  type NavItemConfig,
  type NavSectionConfig,
} from '@/lib/navigation';
import { buildBusinessWorkspaceHref, matchesBusinessHref, resolveBusinessModuleKey } from '@/lib/business-navigation';

const matchesNavPath = (pathname: string, searchParams: URLSearchParams, href: string) => {
  if (href.startsWith('/business')) {
    return matchesBusinessHref(pathname, searchParams, href);
  }
  if (href === '/') return pathname === '/';
  if (href === '/business') return pathname === '/business';
  return pathname === href || pathname.startsWith(`${href}/`);
};

const AppNavItem = ({
  href,
  label,
  icon: Icon,
  active,
  group,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  group: string;
}) => {
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { beginNavigation, registerRecentPage, pendingHref } = useNavigationFeedback();
  const isActive = active || pendingHref === href;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={label}
        className="min-h-11 rounded-xl px-3 transition-all duration-150 active:scale-[0.985] touch-manipulation"
        asChild
      >
        <button
          type="button"
          onTouchStart={() => router.prefetch(href)}
          onMouseEnter={() => router.prefetch(href)}
          onClick={() => {
            router.prefetch(href);
            if (isMobile) {
              setOpenMobile(false);
            }
            registerRecentPage({ label, href, group });
            beginNavigation(href);
          }}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const SidebarSection = ({
  title,
  items,
  pathname,
  searchParams,
  disableActive = false,
}: {
  title: string;
  items: NavItemConfig[];
  pathname: string;
  searchParams: URLSearchParams;
  disableActive?: boolean;
}) => (
  <SidebarGroup>
    {title ? <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{title}</SidebarGroupLabel> : null}
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => (
          <AppNavItem
            key={`${item.group}-${item.label}-${item.href}`}
            href={item.href}
            label={item.label}
            icon={item.icon}
            group={item.group}
            active={disableActive ? false : matchesNavPath(pathname, searchParams, item.href)}
          />
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);

export const AppSidebar = () => {
  const { currentTenant, projects, currentUser, addProject, canManageProjects, canManageMembers, signOut } = useAppState();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const product = getAppProduct(pathname);
  const currentBusinessModule = useMemo(() => resolveBusinessModuleKey(pathname, searchParams), [pathname, searchParams]);

  const submit = () => {
    if (!name.trim() || !currentUser) return;
    addProject({
      name,
      description,
      status: 'active',
      progress: 0,
      ownerId: currentUser.id,
    });
    setName('');
    setDescription('');
    setOpen(false);
  };

  const projectSections = useMemo<NavSectionConfig[]>(() => [
    {
      title: '',
      items: canManageMembers
        ? [...PROJECT_MENU_ITEMS, { label: 'Admin', href: '/admin', icon: ShieldCheck, group: 'General' }]
        : PROJECT_MENU_ITEMS,
    },
    { title: 'Views', items: PROJECT_VIEW_ITEMS },
    { title: 'Scale', items: PROJECT_SCALE_ITEMS },
    { title: 'Configure', items: PROJECT_SETTING_ITEMS },
  ], [canManageMembers]);

  const switcherItems = useMemo(() => [PRODUCT_SWITCH_ITEMS.projects, PRODUCT_SWITCH_ITEMS.business], []);

  const moduleActionsTitle = useMemo(() => {
    if (product !== 'business') return 'Module Actions';
    if (currentBusinessModule === 'inventory') return 'Inventory Actions';
    if (currentBusinessModule === 'finance') return 'Accounting Actions';
    if (currentBusinessModule === 'hr') return 'HR Actions';
    if (currentBusinessModule === 'sales') return 'Sales & CRM Actions';
    if (currentBusinessModule === 'procurement') return 'Procurement Actions';
    if (currentBusinessModule === 'support') return 'Support Actions';
    if (currentBusinessModule === 'analytics') return 'Analytics Actions';
    if (currentBusinessModule === 'projects') return 'Project Delivery Actions';
    if (currentBusinessModule === 'cosmetics') return 'Cosmetics Actions';
    return 'Module Actions';
  }, [currentBusinessModule, product]);

  const businessActionItems = useMemo<NavItemConfig[]>(() => {
    if (product !== 'business') return [];

    if (currentBusinessModule === 'sales') {
      return [
        { label: 'Leads, Contacts, Accounts', href: buildBusinessWorkspaceHref('sales', 'crm-workbench'), icon: ClipboardList, group: 'Module Actions' },
        { label: 'Pipelines & Forecasting', href: buildBusinessWorkspaceHref('sales', 'crm-workbench'), icon: ListChecks, group: 'Module Actions' },
        { label: 'Pricing & Promotions', href: buildBusinessWorkspaceHref('sales', 'sales-pricing'), icon: ClipboardList, group: 'Module Actions' },
        { label: 'Credit & Limits', href: buildBusinessWorkspaceHref('sales', 'sales-credit'), icon: ShieldCheck, group: 'Module Actions' },
        { label: 'POS & Split Payments', href: buildBusinessWorkspaceHref('sales', 'sales-pos'), icon: Workflow, group: 'Module Actions' },
        { label: 'Omnichannel Stock', href: buildBusinessWorkspaceHref('sales', 'sales-channels'), icon: ListChecks, group: 'Module Actions' },
        { label: 'Sales Operations Feed', href: buildBusinessWorkspaceHref('sales', 'operations'), icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (currentBusinessModule === 'inventory') {
      return [
        { label: 'Product Management', href: buildBusinessWorkspaceHref('inventory', 'product-management'), icon: ClipboardList, group: 'Module Actions' },
        { label: 'Inventory Structure', href: buildBusinessWorkspaceHref('inventory', 'inventory-structure'), icon: ClipboardList, group: 'Module Actions' },
        { label: 'Stock Types', href: buildBusinessWorkspaceHref('inventory', 'stock-types'), icon: ListChecks, group: 'Module Actions' },
        { label: 'Stock Tracking', href: buildBusinessWorkspaceHref('inventory', 'stock-tracking'), icon: Workflow, group: 'Module Actions' },
        { label: 'Live Transactions', href: buildBusinessWorkspaceHref('inventory', 'live-transactions'), icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (currentBusinessModule === 'finance') {
      return [
        { label: 'Chart of Accounts & Journals', href: buildBusinessWorkspaceHref('finance', 'core-objects'), icon: ClipboardList, group: 'Module Actions' },
        { label: 'Invoicing & Reconciliation', href: buildBusinessWorkspaceHref('finance', 'features'), icon: ListChecks, group: 'Module Actions' },
        { label: 'Approval Flows & Dunning', href: buildBusinessWorkspaceHref('finance', 'workflows'), icon: Workflow, group: 'Module Actions' },
        { label: 'Tax Rules & Audit Trails', href: buildBusinessWorkspaceHref('finance', 'compliance'), icon: ShieldCheck, group: 'Module Actions' },
        { label: 'Live Finance Operation', href: buildBusinessWorkspaceHref('finance', 'operations'), icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (currentBusinessModule === 'hr') {
      return [
        { label: 'Employees & Contracts', href: buildBusinessWorkspaceHref('hr', 'core-objects'), icon: ClipboardList, group: 'Module Actions' },
        { label: 'Attendance, Leave, Payroll', href: buildBusinessWorkspaceHref('hr', 'features'), icon: ListChecks, group: 'Module Actions' },
        { label: 'Hiring/Leave/Payroll Approvals', href: buildBusinessWorkspaceHref('hr', 'workflows'), icon: Workflow, group: 'Module Actions' },
        { label: 'Workforce Controls', href: buildBusinessWorkspaceHref('hr', 'governance'), icon: ShieldCheck, group: 'Module Actions' },
        { label: 'People Operations Queue', href: buildBusinessWorkspaceHref('hr', 'operations'), icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (currentBusinessModule === 'procurement') {
      return [
        { label: 'RFQs, POs, Receipts', href: buildBusinessWorkspaceHref('procurement', 'core-objects'), icon: ClipboardList, group: 'Module Actions' },
        { label: 'Vendor Comparison & Terms', href: buildBusinessWorkspaceHref('procurement', 'features'), icon: ListChecks, group: 'Module Actions' },
        { label: 'Purchase Approval Workflow', href: buildBusinessWorkspaceHref('procurement', 'workflows'), icon: Workflow, group: 'Module Actions' },
        { label: 'Procurement Controls', href: buildBusinessWorkspaceHref('procurement', 'governance'), icon: ShieldCheck, group: 'Module Actions' },
        { label: 'Sourcing Operations', href: buildBusinessWorkspaceHref('procurement', 'operations'), icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (currentBusinessModule === 'support') {
      return [
        { label: 'Tickets, SLAs, KB', href: buildBusinessWorkspaceHref('support', 'core-objects'), icon: ClipboardList, group: 'Module Actions' },
        { label: 'Escalations & Responses', href: buildBusinessWorkspaceHref('support', 'features'), icon: ListChecks, group: 'Module Actions' },
        { label: 'SLA Workflow', href: buildBusinessWorkspaceHref('support', 'workflows'), icon: Workflow, group: 'Module Actions' },
        { label: 'Service Controls', href: buildBusinessWorkspaceHref('support', 'governance'), icon: ShieldCheck, group: 'Module Actions' },
        { label: 'Support Queues', href: buildBusinessWorkspaceHref('support', 'operations'), icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (currentBusinessModule === 'analytics') {
      return [
        { label: 'Datasets & Reports', href: buildBusinessWorkspaceHref('analytics', 'core-objects'), icon: ClipboardList, group: 'Module Actions' },
        { label: 'KPI & Dashboard Features', href: buildBusinessWorkspaceHref('analytics', 'features'), icon: ListChecks, group: 'Module Actions' },
        { label: 'Reporting Workflows', href: buildBusinessWorkspaceHref('analytics', 'workflows'), icon: Workflow, group: 'Module Actions' },
        { label: 'Data Governance', href: buildBusinessWorkspaceHref('analytics', 'governance'), icon: ShieldCheck, group: 'Module Actions' },
        { label: 'Dashboard Operations', href: buildBusinessWorkspaceHref('analytics', 'operations'), icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (currentBusinessModule === 'projects') {
      return [
        { label: 'Projects, Tasks, Milestones', href: buildBusinessWorkspaceHref('projects', 'core-objects'), icon: ClipboardList, group: 'Module Actions' },
        { label: 'Execution Features', href: buildBusinessWorkspaceHref('projects', 'features'), icon: ListChecks, group: 'Module Actions' },
        { label: 'Delivery Workflows', href: buildBusinessWorkspaceHref('projects', 'workflows'), icon: Workflow, group: 'Module Actions' },
        { label: 'Delivery Controls', href: buildBusinessWorkspaceHref('projects', 'governance'), icon: ShieldCheck, group: 'Module Actions' },
        { label: 'Execution Operations', href: buildBusinessWorkspaceHref('projects', 'operations'), icon: ListChecks, group: 'Module Actions' },
      ];
    }

    return [];
  }, [currentBusinessModule, product]);

  // Hide business sidebar items for modules the tenant has not enabled.
  // Common/general links (Business HQ, Automations, Integrations, Business Settings) and the Products
  // switcher stay visible regardless. Sections that end up empty are dropped entirely.
  const businessSections = useMemo(
    () => filterBusinessSections(BUSINESS_SECTIONS, currentTenant?.enabledModules),
    [currentTenant?.enabledModules],
  );

  const prefetchTargets = useMemo(() => {
    const staticTargets = [
      ...switcherItems.map((item) => item.href),
      ...projectSections.flatMap((section) => section.items.map((item) => item.href)),
      ...businessSections.flatMap((section) => section.items.map((item) => item.href)),
      ...projects.map((project) => `/projects/${project.id}`),
    ];

    return Array.from(new Set(staticTargets));
  }, [businessSections, projectSections, projects, switcherItems]);

  useEffect(() => {
    prefetchTargets.forEach((href) => {
      router.prefetch(href);
    });
  }, [prefetchTargets, router]);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex h-16 items-center px-4">
        <div className="flex items-center gap-3">
          <div className="group-data-[collapsible=icon]:hidden">
            <Image src="/airtyn-logo.png" alt="Airtyn" width={110} height={34} className="h-7 w-auto" priority />
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {product === 'business' ? 'Business OS' : 'Project OS'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSection title="Products" items={switcherItems} pathname={pathname} searchParams={searchParams} />

        {(product === 'business' ? businessSections : projectSections).map((section) => (
          <SidebarSection key={section.title || 'general'} title={section.title} items={section.items} pathname={pathname} searchParams={searchParams} />
        ))}

        {product === 'business' && businessActionItems.length > 0 ? (
          <SidebarSection title={moduleActionsTitle} items={businessActionItems} pathname={pathname} searchParams={searchParams} disableActive />
        ) : null}

        {product === 'projects' ? (
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.map((project) => (
                  <AppNavItem
                    key={project.id}
                    href={`/projects/${project.id}`}
                    label={project.name}
                    icon={PRODUCT_SWITCH_ITEMS.projects.icon}
                    group="Projects"
                    active={matchesNavPath(pathname, searchParams, `/projects/${project.id}`)}
                  />
                ))}
                <SidebarMenuItem>
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <SidebarMenuButton tooltip="New Project" className="min-h-11 rounded-xl px-3 text-muted-foreground hover:text-primary touch-manipulation" disabled={!canManageProjects}>
                        <Plus />
                        <span>New Project</span>
                      </SidebarMenuButton>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Project</DialogTitle>
                        <DialogDescription>Create a new project inside your workspace.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Project Name</Label>
                          <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <Button className="w-full" onClick={submit}>Create Project</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.avatarUrl} />
            <AvatarFallback>{currentUser?.name?.slice(0, 2) ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{currentUser?.name ?? 'Guest'}</span>
            <span className="truncate text-xs text-muted-foreground">{currentTenant?.name}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start gap-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center"
          onClick={() => {
            signOut();
            router.push('/');
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
