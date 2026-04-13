"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Hash, History, Pin, Search, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppState } from '@/lib/store';
import { useNavigationFeedback } from './NavigationFeedback';
import { buildQuickNavItems, getAppProduct, PRODUCT_SWITCH_ITEMS, type NavItemConfig } from '@/lib/navigation';

type QuickNavItem = NavItemConfig;

const matchesNavPath = (pathname: string, href: string) => {
  if (href === '/') return pathname === '/';
  if (href === '/business') return pathname === '/business';
  return pathname === href || pathname.startsWith(`${href}/`);
};

const SectionTitle = ({
  icon: Icon,
  title,
  meta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  meta?: string;
}) => (
  <div className="flex items-center justify-between px-2 pb-1 pt-2">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>{title}</span>
    </div>
    {meta ? <span className="text-[10px] text-muted-foreground">{meta}</span> : null}
  </div>
);

const QuickNavRow = ({
  item,
  active,
  pinned,
  onSelect,
  onPin,
}: {
  item: QuickNavItem;
  active: boolean;
  pinned: boolean;
  onSelect: (item: QuickNavItem) => void;
  onPin: (href: string) => void;
}) => {
  const router = useRouter();

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-2xl px-2 py-1 transition-all duration-150',
        active ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/50'
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(item)}
        onMouseEnter={() => router.prefetch(item.href)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left touch-manipulation active:scale-[0.99]"
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl border border-white/10',
            active ? 'bg-primary/15 text-primary' : 'bg-card/70 text-muted-foreground'
          )}
        >
          <item.icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{item.label}</span>
            <Badge variant="outline" className="hidden border-white/10 text-[10px] text-muted-foreground sm:inline-flex">
              {item.group}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{item.href}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onPin(item.href)}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 transition-all touch-manipulation',
          pinned ? 'bg-primary/15 text-primary' : 'bg-card/60 text-muted-foreground opacity-70 hover:opacity-100'
        )}
        aria-label={pinned ? 'Unpin action' : 'Pin action'}
      >
        <Pin className={cn('h-4 w-4', pinned && 'fill-current')} />
      </button>
    </div>
  );
};

export const QuickNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const product = getAppProduct(pathname);
  const currentProduct = PRODUCT_SWITCH_ITEMS[product];
  const { projects, canManageMembers } = useAppState();
  const {
    quickNavOpen,
    closeQuickNav,
    openQuickNav,
    beginNavigation,
    recentPages,
    pinnedActions,
    registerRecentPage,
    togglePinnedAction,
    pendingHref,
  } = useNavigationFeedback();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openQuickNav();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openQuickNav]);

  useEffect(() => {
    if (!quickNavOpen) {
      setQuery('');
    }
  }, [quickNavOpen]);

  const items = useMemo<QuickNavItem[]>(() => {
    const baseItems = buildQuickNavItems({
      projects: projects.map((project) => ({ id: project.id, name: project.name })),
      canManageMembers,
    });

    return baseItems.filter((item) => {
      if (!query.trim()) return true;
      const target = `${item.label} ${item.group} ${item.href}`.toLowerCase();
      return target.includes(query.toLowerCase());
    });
  }, [canManageMembers, projects, query]);

  const itemsByHref = useMemo(() => new Map(items.map((item) => [item.href, item])), [items]);

  const pinnedItems = useMemo(
    () => pinnedActions.map((href) => itemsByHref.get(href)).filter((item): item is QuickNavItem => Boolean(item)),
    [itemsByHref, pinnedActions]
  );

  const recentItems = useMemo(
    () => recentPages
      .map((recent) => itemsByHref.get(recent.href) ?? { ...recent, icon: Hash })
      .filter((item): item is QuickNavItem => Boolean(item)),
    [itemsByHref, recentPages]
  );

  const discoverItems = useMemo(
    () => items.filter((item) => !pinnedActions.includes(item.href)).slice(0, 20),
    [items, pinnedActions]
  );

  useEffect(() => {
    if (quickNavOpen) {
      items.slice(0, 12).forEach((item) => router.prefetch(item.href));
    }
  }, [items, quickNavOpen, router]);

  const handleSelect = (item: QuickNavItem) => {
    closeQuickNav();
    registerRecentPage({ label: item.label, href: item.href, group: item.group });
    beginNavigation(item.href);
  };

  return (
    <Dialog open={quickNavOpen} onOpenChange={(open) => !open && closeQuickNav()}>
      <DialogContent className="glass-card overflow-hidden border-primary/20 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-white/5 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-primary" />
            {currentProduct.label} Launcher
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={product === 'business' ? 'Search business modules, finance, payroll...' : 'Search projects, teams, reports, settings...'}
              className="h-11 rounded-2xl border-white/10 bg-background/60 pl-10 pr-24"
            />
            <Badge variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 border-white/10 bg-white/5 text-[10px] text-muted-foreground">
              Ctrl/Cmd + K
            </Badge>
          </div>
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-3 pb-3">
          <div className="space-y-3">
            {!query.trim() && pinnedItems.length > 0 && (
              <div>
                <SectionTitle icon={Pin} title="Pinned" meta={`${pinnedItems.length} saved`} />
                <div className="space-y-1">
                  {pinnedItems.map((item) => (
                    <QuickNavRow
                      key={`pinned-${item.href}`}
                      item={item}
                      active={matchesNavPath(pathname, item.href) || pendingHref === item.href}
                      pinned={pinnedActions.includes(item.href)}
                      onPin={togglePinnedAction}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>
            )}

            {!query.trim() && recentItems.length > 0 && (
              <div>
                <SectionTitle icon={History} title="Recent Pages" meta={`${recentItems.length} recent`} />
                <div className="space-y-1">
                  {recentItems.map((item) => (
                    <QuickNavRow
                      key={`recent-${item.href}`}
                      item={item}
                      active={matchesNavPath(pathname, item.href) || pendingHref === item.href}
                      pinned={pinnedActions.includes(item.href)}
                      onPin={togglePinnedAction}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionTitle
                icon={Sparkles}
                title={query.trim() ? 'Search Results' : 'All Screens'}
                meta={query.trim() ? `${items.length} matches` : `${discoverItems.length} visible`}
              />
              <div className="space-y-1">
                {(query.trim() ? items : discoverItems).map((item) => (
                  <QuickNavRow
                    key={`${item.group}-${item.href}`}
                    item={item}
                    active={matchesNavPath(pathname, item.href) || pendingHref === item.href}
                    pinned={pinnedActions.includes(item.href)}
                    onPin={togglePinnedAction}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>

            {items.length === 0 && (
              <div className="rounded-2xl border border-white/5 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
                No screens matched "{query}".
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
