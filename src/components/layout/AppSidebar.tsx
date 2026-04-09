"use client";

import React, { useEffect, useMemo } from 'react';
import { ClipboardList, ListChecks, Plus, ShieldCheck, Workflow } from 'lucide-react';
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
import { usePathname, useRouter } from 'next/navigation';
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
  getAppProduct,
  type NavItemConfig,
  type NavSectionConfig,
} from '@/lib/navigation';

const matchesNavPath = (pathname: string, href: string) => {
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
  disableActive = false,
}: {
  title: string;
  items: NavItemConfig[];
  pathname: string;
  disableActive?: boolean;
}) => (
  <SidebarGroup>
    {title ? <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{title}</SidebarGroupLabel> : null}
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => (
          <AppNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            group={item.group}
            active={disableActive ? false : matchesNavPath(pathname, item.href)}
          />
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);

export const AppSidebar = () => {
  const { currentTenant, projects, currentUser, addProject, canManageProjects, canManageMembers } = useAppState();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const product = getAppProduct(pathname);

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
    if (pathname.startsWith('/business/inventory')) return 'Inventory Actions';
    if (pathname.startsWith('/business/finance') || pathname.startsWith('/business/accounting')) return 'Accounting Actions';
    if (pathname.startsWith('/business/hr') || pathname.startsWith('/business/payroll')) return 'HR Actions';
    if (pathname.startsWith('/business/sales')) return 'Sales Actions';
    if (pathname.startsWith('/business/crm') || pathname.startsWith('/business/sales')) return 'CRM Actions';
    if (pathname.startsWith('/business/procurement') || pathname.startsWith('/business/purchases')) return 'Procurement Actions';
    if (pathname.startsWith('/business/support')) return 'Support Actions';
    if (pathname.startsWith('/business/analytics') || pathname.startsWith('/business/reports')) return 'Analytics Actions';
    if (pathname.startsWith('/business/projects')) return 'Project Delivery Actions';
    return 'Module Actions';
  }, [pathname, product]);

  const businessActionItems = useMemo<NavItemConfig[]>(() => {
    if (product !== 'business') return [];

    if (pathname.startsWith('/business/sales')) {
      return [
        { label: 'Pricing & Promotions', href: '/business/sales#sales-pricing', icon: ClipboardList, group: 'Module Actions' },
        { label: 'Credit & Limits', href: '/business/sales#sales-credit', icon: ShieldCheck, group: 'Module Actions' },
        { label: 'POS & Split Payments', href: '/business/sales#sales-pos', icon: Workflow, group: 'Module Actions' },
        { label: 'Omnichannel Stock', href: '/business/sales#sales-channels', icon: ListChecks, group: 'Module Actions' },
        { label: 'Sales Operations Feed', href: '/business/sales#operations', icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (pathname.startsWith('/business/inventory')) {
      return [
        { label: 'Product Management', href: '/business/inventory#product-management', icon: ClipboardList, group: 'Module Actions' },
        { label: 'Inventory Structure', href: '/business/inventory#inventory-structure', icon: ClipboardList, group: 'Module Actions' },
        { label: 'Stock Types', href: '/business/inventory#stock-types', icon: ListChecks, group: 'Module Actions' },
        { label: 'Stock Tracking', href: '/business/inventory#stock-tracking', icon: Workflow, group: 'Module Actions' },
        { label: 'Live Transactions', href: '/business/inventory#live-transactions', icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (pathname.startsWith('/business/finance') || pathname.startsWith('/business/accounting')) {
      return [
        { label: 'Chart of Accounts & Journals', href: '/business/finance#core-objects', icon: ClipboardList, group: 'Module Actions' },
        { label: 'Invoicing & Reconciliation', href: '/business/finance#features', icon: ListChecks, group: 'Module Actions' },
        { label: 'Approval Flows & Dunning', href: '/business/finance#workflows', icon: Workflow, group: 'Module Actions' },
        { label: 'Tax Rules & Audit Trails', href: '/business/finance#compliance', icon: ShieldCheck, group: 'Module Actions' },
        { label: 'Live Finance Operation', href: '/business/finance#operations', icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (pathname.startsWith('/business/hr') || pathname.startsWith('/business/payroll')) {
      return [
        { label: 'Employees & Contracts', href: '/business/hr#core-objects', icon: ClipboardList, group: 'Module Actions' },
        { label: 'Attendance, Leave, Payroll', href: '/business/hr#features', icon: ListChecks, group: 'Module Actions' },
        { label: 'Hiring/Leave/Payroll Approvals', href: '/business/hr#workflows', icon: Workflow, group: 'Module Actions' },
        { label: 'Workforce Controls', href: '/business/hr#governance', icon: ShieldCheck, group: 'Module Actions' },
        { label: 'People Operations Queue', href: '/business/hr#operations', icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (pathname.startsWith('/business/crm') || pathname.startsWith('/business/sales')) {
      return [
        { label: 'Leads, Contacts, Accounts', href: '/business/crm#core-objects', icon: ClipboardList, group: 'Module Actions' },
        { label: 'Pipelines & Forecasting', href: '/business/crm#features', icon: ListChecks, group: 'Module Actions' },
        { label: 'Lead Assignment Flows', href: '/business/crm#workflows', icon: Workflow, group: 'Module Actions' },
        { label: 'Commercial Controls', href: '/business/crm#governance', icon: ShieldCheck, group: 'Module Actions' },
        { label: 'Pipeline Operations', href: '/business/crm#operations', icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (pathname.startsWith('/business/procurement') || pathname.startsWith('/business/purchases')) {
      return [
        { label: 'RFQs, POs, Receipts', href: '/business/procurement#core-objects', icon: ClipboardList, group: 'Module Actions' },
        { label: 'Vendor Comparison & Terms', href: '/business/procurement#features', icon: ListChecks, group: 'Module Actions' },
        { label: 'Purchase Approval Workflow', href: '/business/procurement#workflows', icon: Workflow, group: 'Module Actions' },
        { label: 'Procurement Controls', href: '/business/procurement#governance', icon: ShieldCheck, group: 'Module Actions' },
        { label: 'Sourcing Operations', href: '/business/procurement#operations', icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (pathname.startsWith('/business/support')) {
      return [
        { label: 'Tickets, SLAs, KB', href: '/business/support#core-objects', icon: ClipboardList, group: 'Module Actions' },
        { label: 'Escalations & Responses', href: '/business/support#features', icon: ListChecks, group: 'Module Actions' },
        { label: 'SLA Workflow', href: '/business/support#workflows', icon: Workflow, group: 'Module Actions' },
        { label: 'Service Controls', href: '/business/support#governance', icon: ShieldCheck, group: 'Module Actions' },
        { label: 'Support Queues', href: '/business/support#operations', icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (pathname.startsWith('/business/analytics') || pathname.startsWith('/business/reports')) {
      return [
        { label: 'Datasets & Reports', href: '/business/analytics#core-objects', icon: ClipboardList, group: 'Module Actions' },
        { label: 'KPI & Dashboard Features', href: '/business/analytics#features', icon: ListChecks, group: 'Module Actions' },
        { label: 'Reporting Workflows', href: '/business/analytics#workflows', icon: Workflow, group: 'Module Actions' },
        { label: 'Data Governance', href: '/business/analytics#governance', icon: ShieldCheck, group: 'Module Actions' },
        { label: 'Dashboard Operations', href: '/business/analytics#operations', icon: ListChecks, group: 'Module Actions' },
      ];
    }

    if (pathname.startsWith('/business/projects')) {
      return [
        { label: 'Projects, Tasks, Milestones', href: '/business/projects#core-objects', icon: ClipboardList, group: 'Module Actions' },
        { label: 'Execution Features', href: '/business/projects#features', icon: ListChecks, group: 'Module Actions' },
        { label: 'Delivery Workflows', href: '/business/projects#workflows', icon: Workflow, group: 'Module Actions' },
        { label: 'Delivery Controls', href: '/business/projects#governance', icon: ShieldCheck, group: 'Module Actions' },
        { label: 'Execution Operations', href: '/business/projects#operations', icon: ListChecks, group: 'Module Actions' },
      ];
    }

    return [];
  }, [pathname, product]);

  const prefetchTargets = useMemo(() => {
    const staticTargets = [
      ...switcherItems.map((item) => item.href),
      ...projectSections.flatMap((section) => section.items.map((item) => item.href)),
      ...BUSINESS_SECTIONS.flatMap((section) => section.items.map((item) => item.href)),
      ...projects.map((project) => `/projects/${project.id}`),
    ];

    return Array.from(new Set(staticTargets));
  }, [projectSections, projects, switcherItems]);

  useEffect(() => {
    prefetchTargets.forEach((href) => {
      router.prefetch(href);
    });
  }, [prefetchTargets, router]);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex h-16 items-center px-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${product === 'business' ? 'gradient-amber text-black' : 'gradient-pink-blue text-white'}`}>
            P
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <span className="font-headline text-xl font-bold">Pinkplan</span>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {product === 'business' ? 'Business OS' : 'Project OS'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSection title="Products" items={switcherItems} pathname={pathname} />

        {(product === 'business' ? BUSINESS_SECTIONS : projectSections).map((section) => (
          <SidebarSection key={section.title || 'general'} title={section.title} items={section.items} pathname={pathname} />
        ))}

        {product === 'business' && businessActionItems.length > 0 ? (
          <SidebarSection title={moduleActionsTitle} items={businessActionItems} pathname={pathname} disableActive />
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
                    active={matchesNavPath(pathname, `/projects/${project.id}`)}
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
      </SidebarFooter>
    </Sidebar>
  );
};
