"use client";

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Plus, Bell, Command, LogOut, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppState } from '@/lib/store';
import { useNavigationFeedback } from './NavigationFeedback';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PRODUCT_SWITCH_ITEMS, getAppProduct } from '@/lib/navigation';

export const TopBar = () => {
  const pathname = usePathname();
  const product = getAppProduct(pathname);
  const { emailNotifications, signOut } = useAppState();
  const { openQuickNav, beginNavigation, registerRecentPage } = useNavigationFeedback();
  const currentProduct = PRODUCT_SWITCH_ITEMS[product];
  const productTargets = useMemo(
    () => Object.values(PRODUCT_SWITCH_ITEMS).filter((item) => item.href !== currentProduct.href),
    [currentProduct.href]
  );

  const searchPlaceholder = product === 'business'
    ? 'Search sales, inventory, payroll, finance...'
    : 'Search projects, tasks, teams, reports...';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/40 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 md:max-w-3xl md:gap-4">
        <SidebarTrigger className="h-10 w-10 rounded-xl touch-manipulation" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="hidden h-10 rounded-xl border-white/10 bg-background/40 px-3 sm:inline-flex">
              <currentProduct.icon className="mr-2 h-4 w-4 text-primary" />
              {currentProduct.label}
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="glass-card w-64 border-white/10">
            <DropdownMenuLabel>Switch product</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {productTargets.map((item) => (
              <DropdownMenuItem
                key={item.href}
                onClick={() => {
                  registerRecentPage({ label: item.label, href: item.href, group: item.group });
                  beginNavigation(item.href);
                }}
              >
                <item.icon className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.href}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={openQuickNav}
          className="relative hidden flex-1 text-left sm:block"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            readOnly
            placeholder={searchPlaceholder}
            className="h-10 cursor-pointer rounded-xl border-none bg-background/50 pl-10 pr-24 focus-visible:ring-primary"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </button>
      </div>

      <div className="ml-3 flex items-center gap-2 md:gap-4">
        <Button size="sm" className={`${product === 'business' ? 'gradient-amber text-black shadow-amber-500/20' : 'gradient-pink-blue text-white shadow-primary/20'} hidden h-10 rounded-xl px-4 font-medium shadow-lg sm:inline-flex`}>
          <Plus className="mr-2 h-4 w-4" />
          {product === 'business' ? 'New Workflow' : 'Create'}
        </Button>
        <div className="mx-1 hidden h-8 w-px bg-border md:block" />
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground touch-manipulation">
          <Bell className="h-5 w-5" />
          {emailNotifications.length > 0 ? (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] leading-5 text-primary-foreground">
              {emailNotifications.length}
            </span>
          ) : null}
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground touch-manipulation" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};
