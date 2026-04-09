"use client";

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Brain, Calendar, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/lib/store';
import { useNavigationFeedback } from './NavigationFeedback';
import { BUSINESS_BOTTOM_NAV_ITEMS, getAppProduct } from '@/lib/navigation';

export const MobileBottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { beginNavigation, registerRecentPage, pendingHref } = useNavigationFeedback();
  const { projects } = useAppState();
  const product = getAppProduct(pathname);

  const primaryProjectHref = useMemo(() => {
    const currentProject = projects.find((project) => pathname.startsWith(`/projects/${project.id}`));
    return currentProject ? `/projects/${currentProject.id}` : projects[0] ? `/projects/${projects[0].id}` : '/';
  }, [pathname, projects]);

  const items = useMemo(
    () => product === 'business'
      ? BUSINESS_BOTTOM_NAV_ITEMS
      : [
          { href: '/', label: 'Home', icon: FolderKanban, group: 'General' },
          { href: primaryProjectHref, label: 'Projects', icon: FolderKanban, group: 'Projects' },
          { href: '/calendar', label: 'Calendar', icon: Calendar, group: 'Views' },
          { href: '/reports', label: 'Reports', icon: BarChart3, group: 'Views' },
          { href: '/intelligence', label: 'AI', icon: Brain, group: 'Scale' },
        ],
    [primaryProjectHref, product]
  );

  useEffect(() => {
    items.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [items, router]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/92 px-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 rounded-2xl border border-white/10 bg-card/80 p-1.5 shadow-lg shadow-black/10">
        {items.map((item) => {
          const isActive = ((item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`))
            || pendingHref === item.href);

          return (
            <button
              key={item.label}
              type="button"
              onTouchStart={() => router.prefetch(item.href)}
              onMouseEnter={() => router.prefetch(item.href)}
              onClick={() => {
                router.prefetch(item.href);
                registerRecentPage({ label: item.label, href: item.href, group: item.group });
                beginNavigation(item.href);
              }}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center rounded-xl px-1 py-2 text-[11px] font-medium transition-all duration-150 active:scale-[0.97]',
                'touch-manipulation select-none',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              <item.icon className="mb-1 h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
