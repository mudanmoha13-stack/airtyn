"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  CalendarDays,
  Tag,
  Star,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COSMETICS_SUBNAV = [
  { href: '/business/cosmetics', label: 'Hub', icon: LayoutDashboard, exact: true },
  { href: '/business/cosmetics/pos', label: 'POS', icon: ShoppingBag },
  { href: '/business/cosmetics/customers', label: 'Customers', icon: Users },
  { href: '/business/cosmetics/inventory', label: 'Inventory', icon: Package },
  { href: '/business/cosmetics/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/business/cosmetics/promotions', label: 'Promotions', icon: Tag },
  { href: '/business/cosmetics/loyalty', label: 'Loyalty', icon: Star },
  { href: '/business/cosmetics/staff', label: 'Staff', icon: UserCheck },
  { href: '/business/cosmetics/returns', label: 'Returns', icon: RotateCcw },
];

export default function CosmeticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-full">
      {/* Cosmetics sub-navigation */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-background/95 backdrop-blur-xl">
        <div className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-none py-1">
          {COSMETICS_SUBNAV.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 shrink-0 whitespace-nowrap',
                  isActive
                    ? 'bg-pink-500/15 text-pink-400 border border-pink-500/20'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
