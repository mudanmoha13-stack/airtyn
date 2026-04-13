"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChefHat,
  LayoutDashboard,
  Monitor,
  ShoppingBag,
  Map,
  CalendarDays,
  UtensilsCrossed,
  Tablet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const RESTAURANT_SUBNAV = [
  { href: '/business/restaurant', label: 'Hub', icon: LayoutDashboard, exact: true },
  { href: '/business/restaurant/pos', label: 'POS', icon: ShoppingBag },
  { href: '/business/restaurant/floor', label: 'Floor', icon: Map },
  { href: '/business/restaurant/kitchen', label: 'Kitchen', icon: ChefHat },
  { href: '/business/restaurant/reservations', label: 'Reservations', icon: CalendarDays },
  { href: '/business/restaurant/waiter', label: 'Waiter', icon: Tablet },
  { href: '/business/restaurant/expo', label: 'Expo', icon: Monitor },
];

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-full">
      {/* Restaurant sub-navigation */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-background/95 backdrop-blur-xl">
        <div className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-none py-1">
          {/* Module label */}
          <div className="flex items-center gap-1.5 mr-3 shrink-0">
            <UtensilsCrossed className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Restaurant</span>
          </div>
          <div className="w-px h-5 bg-white/10 mr-2 shrink-0" />

          {RESTAURANT_SUBNAV.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 shrink-0 whitespace-nowrap',
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
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
