"use client";

import Link from 'next/link';
import type { ComponentType } from 'react';
import { ArrowUpRight, CheckCircle2, ChefHat, ClipboardList, ConciergeBell, DollarSign, ShoppingBag, Store, Truck, Users2, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type OverviewSection = {
  title: string;
  description: string;
  items: string[];
  icon: ComponentType<{ className?: string }>;
};

const operatingDomains: OverviewSection[] = [
  {
    title: 'Front of House',
    description: 'Guest seating, reservations, service flow, and billing control.',
    items: ['Reservations and waitlist', 'Table map and occupancy', 'Waitstaff operations', 'Guest billing and service recovery'],
    icon: ConciergeBell,
  },
  {
    title: 'POS and Channels',
    description: 'Dine-in, takeaway, QR, delivery, and payment execution.',
    items: ['Counter, waiter, and table POS', 'Split bills and payment reconciliation', 'Takeaway, pickup, and delivery intake', 'Shift opening and closing'],
    icon: ShoppingBag,
  },
  {
    title: 'Kitchen and Production',
    description: 'KDS routing, prep timing, recipes, yields, and wastage.',
    items: ['Kitchen order tickets by station', 'Recipe and BOM-style ingredient mapping', 'Prep batches and portion control', 'Ready-to-serve and exception alerts'],
    icon: ChefHat,
  },
  {
    title: 'Inventory and Procurement',
    description: 'Store control from receiving to replenishment.',
    items: ['Raw material and packaging stock', 'Expiry, lot, and variance tracking', 'Low-stock replenishment signals', 'RFQ, PO, receipt, and vendor matching'],
    icon: Store,
  },
  {
    title: 'Finance and Compliance',
    description: 'Restaurant-ready reconciliation, journals, and branch performance.',
    items: ['POS settlement and cash drawer control', 'COGS and labor journal posting', 'Expenses, tax, and branch P&L', 'Audit logs and approval checkpoints'],
    icon: DollarSign,
  },
  {
    title: 'People, CRM, and Service',
    description: 'Workforce operations and customer retention on one stack.',
    items: ['Shift scheduling and attendance', 'Role-based permissions by outlet', 'Loyalty, offers, and visit history', 'Feedback, complaints, and customer reactivation'],
    icon: Users2,
  },
];

const coreModules = [
  'Core platform with company, branch, permissions, device setup, tax, currency, and audit controls',
  'Restaurant POS covering dine-in, takeaway, delivery, QR self-ordering, split billing, refunds, offline mode, and receipts',
  'Table and reservation management with floor plans, waitlist, seating events, and occupancy tracking',
  'Menu and product management with categories, combos, modifiers, time-based menus, branch pricing, allergens, and availability rules',
  'Kitchen display system with station routing, prep queues, firing order, ready alerts, and served tracking',
  'Recipe and production controls with yield management, ingredient consumption, batch prep, portion standards, and waste records',
  'Inventory and procurement controls with stock by location, transfers, counts, reorder rules, RFQs, POs, receipts, approvals, and vendor scorecards',
  'Sales channels, CRM, loyalty, accounting, HR, maintenance, and analytics for multi-branch restaurant operations',
];

const workflows = [
  'Dine-in guest: reservation or walk-in -> seating -> order -> kitchen -> service -> payment -> table release -> stock and sales update',
  'Delivery order: channel intake -> kitchen -> packing -> rider assignment or pickup -> completion -> settlement -> customer history update',
  'Procurement replenishment: low stock -> replenishment suggestion -> PO approval -> goods receipt -> quality check -> stock update -> vendor bill',
  'Daily branch close: session close -> cash count -> payment reconciliation -> waste capture -> manager sign-off -> finance reporting',
];

const roadmap = [
  'Phase 1: MVP foundation for one branch with POS, tables, kitchen, menu, basic inventory, roles, and sales reporting',
  'Phase 2: Operational control with recipes, stock movements, procurement, waste tracking, expenses, and shift close discipline',
  'Phase 3: Customer growth with CRM, loyalty, promotions, online ordering, reservations automation, feedback, and delivery expansion',
  'Phase 4: Multi-branch ERP with centralized procurement, transfers, consolidated controls, branch P&L, dashboards, and approvals',
  'Phase 5: Enterprise optimization with forecasting, labor planning, menu engineering, supplier scorecards, predictive replenishment, and AI insights',
];

const roleTiles = [
  { title: 'Cashier / Waiter', subtitle: 'Tables, orders, modifiers, payments, and quick item search' },
  { title: 'Kitchen Staff', subtitle: 'Station queue, prep status, and ready alerts' },
  { title: 'Storekeeper', subtitle: 'Receipts, counts, transfers, and wastage' },
  { title: 'Branch Manager', subtitle: 'Sales today, staff on shift, stock alerts, approvals, and complaints' },
  { title: 'HQ / Owner', subtitle: 'Revenue by branch, margin, procurement spend, labor cost, and P&L summary' },
  { title: 'Maintenance', subtitle: 'Equipment register, service history, and preventive maintenance tickets' },
];

export function RestaurantOperatingSystemOverview({
  businessType,
}: {
  businessType?: string | null;
}) {
  const normalizedType = (businessType ?? '').trim().toLowerCase();
  const brandLabel = normalizedType === 'coffee' ? 'Coffee Business OS' : 'Restaurant Business OS';
  const outletLabel = normalizedType === 'coffee' ? 'coffee shop or cafe' : 'restaurant';

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
          <Badge className="w-fit rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
            Industry Workspace
          </Badge>
          <CardTitle className="text-2xl md:text-3xl">{brandLabel}</CardTitle>
          <CardDescription className="max-w-3xl text-sm md:text-base">
            The current restaurant module already covers live branch operations. This overview extends it into a fuller Odoo-style operating model for every user selecting {normalizedType === 'coffee' ? '`Coffee`' : '`Restaurant`'}, so each {outletLabel} can run POS, kitchen, inventory, procurement, finance, workforce, CRM, and analytics from one connected system.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-6 md:flex-row">
          <Button asChild className="gradient-amber text-black font-semibold">
            <Link href="/business/restaurant">
              Open Restaurant Control Tower
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-white/10 bg-background/30">
            <Link href="/business/restaurant/pos">
              Launch Built-in POS
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-white/10 bg-background/30">
            <Link href="/business/restaurant/expo">
              Open Kitchen Expo
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="glass-card border-white/5 xl:col-span-2">
          <CardHeader>
            <CardTitle>Product Vision</CardTitle>
            <CardDescription>Run daily operations end to end from one branch-aware platform.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {['Dine-in', 'Takeaway', 'Delivery', 'Reservations', 'Kitchen ops', 'Inventory', 'Procurement', 'Finance', 'HR', 'Loyalty', 'Analytics', 'Multi-branch control'].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-white/5 bg-card/40 px-3 py-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Suggested Hierarchy</CardTitle>
            <CardDescription>Group {'->'} brand {'->'} branch {'->'} department / station.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-white/5 bg-card/40 p-3">
              <p className="font-medium text-foreground">Restaurant Group</p>
              <p>Own multiple brands and outlets from one control layer.</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-card/40 p-3">
              <p className="font-medium text-foreground">Brand</p>
              <p>Support brand-specific menus, pricing, promotions, and reporting.</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-card/40 p-3">
              <p className="font-medium text-foreground">Branch / Outlet</p>
              <p>Each outlet keeps its own stock, staff, floor plan, devices, taxes, and KPIs.</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-card/40 p-3">
              <p className="font-medium text-foreground">Department / Station</p>
              <p>Kitchen, bar, host stand, delivery desk, finance, and store rooms remain operationally distinct.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {operatingDomains.map(({ title, description, items, icon: Icon }) => (
          <Card key={title} className="glass-card border-white/5">
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="pt-2 text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Confirmed Core Modules</CardTitle>
            <CardDescription>The tailored module scope for restaurant and coffee operators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {coreModules.map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                <ClipboardList className="mt-0.5 h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>End-to-End Workflows</CardTitle>
            <CardDescription>How the restaurant ERP should move work across service, kitchen, stock, and finance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflows.map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Truck className="mt-0.5 h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Roadmap</CardTitle>
            <CardDescription>Recommended release sequence from one branch to enterprise optimization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {roadmap.map((item, index) => (
              <div key={item} className="rounded-xl border border-white/5 bg-card/40 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-primary">Phase {index + 1}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.replace(/^Phase \d+: /, '')}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Roles and Dashboards</CardTitle>
            <CardDescription>Mobile-first for service and ops, desktop-first for deep setup and accounting.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {roleTiles.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/5 bg-card/40 p-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  <p className="font-medium text-foreground">{item.title}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
