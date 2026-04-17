"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Briefcase,
  Building2,
  CircleDollarSign,
  Headset,
  Package2,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildBusinessWorkspaceHref, matchesBusinessHref } from '@/lib/business-navigation';
import { useAppState } from '@/lib/store';

// Each dock entry is tied to a gate key so we can filter by the tenant's enabledModules.
// 'gate' values:
//   'always'   → always visible (HQ)
//   'hr'/'crm'/'restaurant'/'cosmetics' → initial onboarding modules
//   'finance'/'inventory'/'projects'/'procurement'/'support'/'analytics' → available later as add-ons
type DockEntry = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  gate: 'always' | 'hr' | 'crm' | 'restaurant' | 'cosmetics' | 'finance' | 'inventory' | 'projects' | 'procurement' | 'support' | 'analytics';
};

const DOCK_MODULES: DockEntry[] = [
  { href: '/business', label: 'HQ', icon: Building2, exact: true, gate: 'always' },
  { href: '/business/restaurant', label: 'Restaurant', icon: UtensilsCrossed, exact: true, gate: 'restaurant' },
  { href: '/business/cosmetics', label: 'Cosmetics', icon: Sparkles, exact: true, gate: 'cosmetics' },
  { href: buildBusinessWorkspaceHref('sales'), label: 'Sales & CRM', icon: ShoppingCart, gate: 'crm' },
  { href: buildBusinessWorkspaceHref('finance'), label: 'Finance', icon: CircleDollarSign, gate: 'finance' },
  { href: buildBusinessWorkspaceHref('hr'), label: 'HR', icon: Wallet, gate: 'hr' },
  { href: buildBusinessWorkspaceHref('inventory'), label: 'Inventory', icon: Package2, gate: 'inventory' },
  { href: buildBusinessWorkspaceHref('projects'), label: 'Projects', icon: Briefcase, gate: 'projects' },
  { href: buildBusinessWorkspaceHref('procurement'), label: 'Procurement', icon: ShoppingCart, gate: 'procurement' },
  { href: buildBusinessWorkspaceHref('support'), label: 'Support', icon: Headset, gate: 'support' },
  { href: buildBusinessWorkspaceHref('analytics'), label: 'Analytics', icon: BarChart3, gate: 'analytics' },
];

export function BusinessModuleDock() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentTenant } = useAppState();

  // Only render modules the tenant has enabled (set during onboarding or via add-ons).
  // If no enabledModules are stored (legacy tenants / projects mode), fall back to showing everything.
  const enabled = currentTenant?.enabledModules;
  const hasRestriction = Array.isArray(enabled) && enabled.length > 0;
  const enabledSet = new Set((enabled ?? []).map((m) => m.toLowerCase()));
  const visibleModules = DOCK_MODULES.filter(({ gate }) => {
    if (gate === 'always') return true;
    if (!hasRestriction) return true;
    return enabledSet.has(gate);
  });

  return (
    <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-full items-center gap-1 overflow-x-auto px-4 py-1.5 scrollbar-none">
        {visibleModules.map(({ href, label, icon: Icon, exact }) => {
          const isRestaurantLink = href === '/business/restaurant';
          const isCosmeticsLink = href === '/business/cosmetics';
          const isActive = isRestaurantLink
            ? pathname.startsWith('/business/restaurant')
            : isCosmeticsLink
              ? pathname.startsWith('/business/cosmetics')
              : exact
              ? pathname === href && !searchParams.get('module')
              : matchesBusinessHref(pathname, searchParams, href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-all duration-150 min-w-[60px]',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
