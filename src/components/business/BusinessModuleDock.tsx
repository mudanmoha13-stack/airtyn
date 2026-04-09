"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Briefcase,
  Building2,
  CircleDollarSign,
  Headset,
  Package2,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DOCK_MODULES = [
  { href: '/business', label: 'HQ', icon: Building2, exact: true },
  { href: '/business/sales', label: 'Sales & CRM', icon: ShoppingCart },
  { href: '/business/finance', label: 'Finance', icon: CircleDollarSign },
  { href: '/business/hr', label: 'HR', icon: Wallet },
  { href: '/business/inventory', label: 'Inventory', icon: Package2 },
  { href: '/business/projects', label: 'Projects', icon: Briefcase },
  { href: '/business/procurement', label: 'Procurement', icon: ShoppingCart },
  { href: '/business/support', label: 'Support', icon: Headset },
  { href: '/business/analytics', label: 'Analytics', icon: BarChart3 },
];

export function BusinessModuleDock() {
  const pathname = usePathname();

  return (
    <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-full items-center gap-1 overflow-x-auto px-4 py-1.5 scrollbar-none">
        {DOCK_MODULES.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

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
