"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { NavigationFeedbackProvider } from './NavigationFeedback';
import { QuickNav } from './QuickNav';
import { RouteProgressBar } from './RouteProgressBar';
import { TopBar } from './TopBar';
import { useAppState } from '@/lib/store';
import { Building2, FolderKanban, Layers } from 'lucide-react';
import { getAppProduct } from '@/lib/navigation';

// ─── Public gate — product chooser, routes to dedicated signup pages ──────────
const PublicLandingGate = () => {
  const router = useRouter();

  const PRODUCTS = [
    {
      id: 'projects',
      label: 'Project OS',
      badge: 'Project Management',
      icon: FolderKanban,
      accent: 'text-primary',
      accentBg: 'bg-primary/10',
      accentBorder: 'border-primary/20',
      ctaPrimary: 'gradient-pink-blue text-white',
      ctaHover: '',
      desc: 'Kanban boards, sprints, task tracking and team collaboration — built for teams that ship fast.',
      bullets: ['Kanban & Sprint boards', 'Task assignments & timelines', 'Workload & velocity reports'],
      href: '/signup/projects',
    },
    {
      id: 'business',
      label: 'Business OS',
      badge: 'Business Suite',
      icon: Building2,
      accent: 'text-amber-400',
      accentBg: 'bg-amber-500/10',
      accentBorder: 'border-amber-500/20',
      ctaPrimary: 'bg-amber-500 hover:bg-amber-400 text-black',
      ctaHover: '',
      desc: 'CRM, Finance, HR, Inventory, Restaurant POS, Support and Analytics — all in one dashboard.',
      bullets: ['CRM & Sales pipeline', 'Finance, HR & Payroll', 'Restaurant POS & Inventory'],
      href: '/signup/business',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand header */}
      <div className="flex items-center gap-2.5 mb-16">
        <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Airtyn</span>
      </div>

      {/* Headline */}
      <div className="text-center mb-12 max-w-lg">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Choose your workspace</h1>
        <p className="text-neutral-400 text-base">
          Two powerful products. One platform. Pick the one that fits your team.
        </p>
      </div>

      {/* Product cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl">
        {PRODUCTS.map(p => (
          <div
            key={p.id}
            className={`bg-neutral-900 border ${p.accentBorder} rounded-[28px] p-7 flex flex-col gap-5 hover:border-opacity-60 transition-all group`}
          >
            {/* Header */}
            <div>
              <div className={`inline-flex items-center gap-1.5 rounded-full border ${p.accentBorder} ${p.accentBg} px-3 py-1 text-xs font-medium ${p.accent} mb-4`}>
                <p.icon className="w-3.5 h-3.5" />
                {p.badge}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{p.label}</h2>
              <p className="text-sm text-neutral-400 leading-relaxed">{p.desc}</p>
            </div>

            {/* Bullets */}
            <ul className="space-y-2 flex-1">
              {p.bullets.map(b => (
                <li key={b} className="flex items-center gap-2 text-sm text-neutral-300">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.accentBg.replace('/10', '')} flex-shrink-0`} />
                  {b}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => router.push(p.href)}
                className={`w-full py-3 rounded-full font-semibold text-sm transition-all ${p.ctaPrimary}`}
              >
                Get Started
              </button>
              <button
                onClick={() => router.push(`${p.href}?mode=signin`)}
                className="w-full py-3 rounded-full font-medium text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all border border-neutral-700"
              >
                Sign In
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-neutral-600 mt-10">
        Data saved locally in your browser — no cloud required to get started.
      </p>
    </div>
  );
};

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isHydrated, isAuthenticated, currentTenant, currentWorkspace } = useAppState();
  const pathname = usePathname();
  const product = getAppProduct(pathname);

  // Routes that render standalone — no sidebar/topbar needed
  const isStandaloneRoute =
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/signup');
  if (isStandaloneRoute) return <>{children}</>;

  if (!isHydrated) {
    return <div className="h-screen w-full flex items-center justify-center">Loading workspace...</div>;
  }

  if (!isAuthenticated || !currentTenant || !currentWorkspace) {
    return <PublicLandingGate />;
  }

  return (
    <SidebarProvider>
      <NavigationFeedbackProvider>
        <RouteProgressBar />
        <QuickNav />
        <div data-product={product} className="flex h-screen min-h-[100dvh] w-full overflow-hidden bg-background">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <TopBar />
            {/* No key={pathname} here — we never want to unmount/remount children on navigation.
                Doing so was the primary cause of perceived navigation lag. */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 pb-24 pt-4 scrollbar-hide md:p-6 md:pb-6">
              {children}
            </main>
            <MobileBottomNav />
          </SidebarInset>
        </div>
      </NavigationFeedbackProvider>
    </SidebarProvider>
  );
};