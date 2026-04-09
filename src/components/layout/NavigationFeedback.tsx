"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const RECENT_PAGES_KEY = 'pinkplan-recent-pages-v1';
const PINNED_ACTIONS_KEY = 'pinkplan-pinned-actions-v1';

export type NavLauncherItem = {
  label: string;
  href: string;
  group: string;
};

type NavigationFeedbackContextValue = {
  loading: boolean;
  pendingHref: string | null;
  openQuickNav: () => void;
  closeQuickNav: () => void;
  quickNavOpen: boolean;
  beginNavigation: (href: string) => void;
  recentPages: NavLauncherItem[];
  pinnedActions: string[];
  registerRecentPage: (item: NavLauncherItem) => void;
  togglePinnedAction: (href: string) => void;
};

const NavigationFeedbackContext = createContext<NavigationFeedbackContextValue | undefined>(undefined);

export const NavigationFeedbackProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const [recentPages, setRecentPages] = useState<NavLauncherItem[]>([]);
  const [pinnedActions, setPinnedActions] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedRecent = window.localStorage.getItem(RECENT_PAGES_KEY);
      const storedPinned = window.localStorage.getItem(PINNED_ACTIONS_KEY);
      setRecentPages(storedRecent ? JSON.parse(storedRecent) as NavLauncherItem[] : []);
      setPinnedActions(storedPinned ? JSON.parse(storedPinned) as string[] : []);
    } catch {
      setRecentPages([]);
      setPinnedActions([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(recentPages));
  }, [recentPages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PINNED_ACTIONS_KEY, JSON.stringify(pinnedActions));
  }, [pinnedActions]);

  const beginNavigation = useCallback((href: string) => {
    setLoading(true);
    setPendingHref(href);
    router.push(href);
  }, [router]);

  const registerRecentPage = useCallback((item: NavLauncherItem) => {
    setRecentPages((prev) => {
      const next = [item, ...prev.filter((entry) => entry.href !== item.href)];
      return next.slice(0, 8);
    });
  }, []);

  const togglePinnedAction = useCallback((href: string) => {
    setPinnedActions((prev) => (
      prev.includes(href) ? prev.filter((item) => item !== href) : [href, ...prev].slice(0, 8)
    ));
  }, []);

  useEffect(() => {
    setPendingHref(null);
    const timeout = window.setTimeout(() => setLoading(false), 180);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  const value = useMemo<NavigationFeedbackContextValue>(() => ({
    loading,
    pendingHref,
    quickNavOpen,
    recentPages,
    pinnedActions,
    openQuickNav: () => setQuickNavOpen(true),
    closeQuickNav: () => setQuickNavOpen(false),
    beginNavigation,
    registerRecentPage,
    togglePinnedAction,
  }), [beginNavigation, loading, pendingHref, pinnedActions, quickNavOpen, recentPages, registerRecentPage, togglePinnedAction]);

  return (
    <NavigationFeedbackContext.Provider value={value}>
      {children}
    </NavigationFeedbackContext.Provider>
  );
};

export const useNavigationFeedback = () => {
  const context = useContext(NavigationFeedbackContext);
  if (!context) {
    throw new Error('useNavigationFeedback must be used inside NavigationFeedbackProvider');
  }
  return context;
};
