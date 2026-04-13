"use client";

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { NavigationFeedbackProvider } from './NavigationFeedback';
import { QuickNav } from './QuickNav';
import { RouteProgressBar } from './RouteProgressBar';
import { TopBar } from './TopBar';
import { useAppState } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, FolderKanban, Layers } from 'lucide-react';
import { getAppProduct } from '@/lib/navigation';

// ─── Business type options shown during BOS onboarding ───────────────────────
const BUSINESS_TYPES = [
  { value: 'crm',         label: 'Sales & CRM' },
  { value: 'finance',     label: 'Finance & Accounting' },
  { value: 'hr',          label: 'HR & Payroll' },
  { value: 'inventory',   label: 'Inventory & Supply Chain' },
  { value: 'procurement', label: 'Procurement & Vendors' },
  { value: 'support',     label: 'Customer Support' },
  { value: 'analytics',   label: 'Analytics & BI' },
  { value: 'full',        label: 'Full Business OS (All Modules)' },
];

// ─── Project OS lane (left card) ─────────────────────────────────────────────
type ProjectMode = 'idle' | 'signin' | 'setup';

const ProjectOSCard = () => {
  const { signIn } = useAppState();
  const [mode, setMode] = useState<ProjectMode>('idle');

  const [signinEmail, setSigninEmail]       = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinError, setSigninError]       = useState('');

  const [setupEmail, setSetupEmail] = useState('');
  const [setupSending, setSetupSending] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');
  const [setupError, setSetupError] = useState('');

  const onSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signIn(signinEmail, signinPassword);
    if (!result.ok) {
      setSigninError(result.message ?? 'Unable to sign in.');
      return;
    }
    setSigninError('');
  };

  const onSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupSending(true);
    setSetupError('');
    setSetupMessage('');

    try {
      const response = await fetch('/api/onboarding/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: setupEmail, mode: 'projects' }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? 'Failed to send confirmation link');
      }
      setSetupMessage('Confirmation link sent. Check your email to continue onboarding.');
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : 'Failed to send confirmation link');
    } finally {
      setSetupSending(false);
    }
  };

  return (
    <Card className="glass-card overflow-hidden border-primary/20 flex flex-col h-full">
      <CardContent className="p-8 lg:p-10 flex flex-col gap-6 flex-1">
        {/* Badge */}
        <div className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          SaaS Project Management
        </div>

        {/* Hero */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary/60">
            <FolderKanban className="w-5 h-5" />
            <span className="text-xs font-medium uppercase tracking-wider">Project OS</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
            Project management that ships work, not noise.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Pinkplan helps teams onboard fast, organize projects, run Kanban workflows, and stay aligned from day one.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* Action area */}
        {mode === 'idle' && (
          <div className="space-y-3 mt-auto">
            <Button className="w-full gradient-pink-blue" onClick={() => setMode('setup')}>
              Get Started Free
            </Button>
            <Button className="w-full" variant="outline" onClick={() => setMode('signin')}>
              Sign In
            </Button>
            <p className="text-xs text-muted-foreground text-center pt-1">
              Account saved locally — pick up where you left off.
            </p>
          </div>
        )}

        {mode === 'signin' && (
          <form className="space-y-4" onSubmit={onSignIn}>
            <div className="space-y-2">
              <Label htmlFor="pm-email">Email</Label>
              <Input id="pm-email" type="email" value={signinEmail} onChange={e => setSigninEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pm-password">Password</Label>
              <Input id="pm-password" type="password" value={signinPassword} onChange={e => setSigninPassword(e.target.value)} required />
            </div>
            {signinError && <p className="text-sm text-destructive">{signinError}</p>}
            <Button className="w-full gradient-pink-blue" type="submit">Sign In to Projects</Button>
            <Button className="w-full" variant="ghost" type="button" onClick={() => setMode('idle')}>Back</Button>
          </form>
        )}

        {mode === 'setup' && (
          <form className="space-y-4" onSubmit={onSetup}>
            <div className="space-y-1.5">
              <Label htmlFor="pm-owner-email">Work Email</Label>
              <Input id="pm-owner-email" type="email" value={setupEmail} onChange={e => setSetupEmail(e.target.value)} required />
            </div>
            {setupError && <p className="text-sm text-destructive">{setupError}</p>}
            {setupMessage && <p className="text-sm text-emerald-400">{setupMessage}</p>}
            <div className="space-y-2">
              <Button className="w-full gradient-pink-blue" type="submit" disabled={setupSending}>
                {setupSending ? 'Sending confirmation...' : 'Send Confirmation Link'}
              </Button>
              <Button className="w-full" variant="ghost" type="button" onClick={() => setMode('idle')}>Back</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Business OS lane (right card) ───────────────────────────────────────────
type BusinessMode = 'idle' | 'signin' | 'setup';

const BusinessOSCard = () => {
  const { signIn } = useAppState();
  const router = useRouter();
  const [mode, setMode] = useState<BusinessMode>('idle');

  const [signinEmail, setSigninEmail]       = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinError, setSigninError]       = useState('');

  const [setupEmail, setSetupEmail] = useState('');
  const [setupSending, setSetupSending] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');
  const [setupError, setSetupError] = useState('');

  const onSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signIn(signinEmail, signinPassword);
    if (!result.ok) {
      setSigninError(result.message ?? 'Unable to sign in.');
      return;
    }
    router.push('/business');
  };

  const onSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupSending(true);
    setSetupError('');
    setSetupMessage('');

    try {
      const response = await fetch('/api/onboarding/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: setupEmail, mode: 'business' }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? 'Failed to send confirmation link');
      }
      setSetupMessage('Confirmation link sent. Check your email to continue onboarding.');
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : 'Failed to send confirmation link');
    } finally {
      setSetupSending(false);
    }
  };

  return (
    <Card className="glass-card overflow-hidden border-amber-500/20 flex flex-col h-full">
      <CardContent className="p-8 lg:p-10 flex flex-col gap-6 flex-1">
        {/* Badge */}
        <div className="inline-flex w-fit items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
          Business OS
        </div>

        {/* Hero */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-400/60">
            <Building2 className="w-5 h-5" />
            <span className="text-xs font-medium uppercase tracking-wider">Business OS</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
            Run your entire business from one place.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            CRM, Finance, HR, Inventory, Procurement, Support and Analytics — unified in one dashboard.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* Action area */}
        {mode === 'idle' && (
          <div className="space-y-3 mt-auto">
            <Button
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              onClick={() => setMode('setup')}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Set Up Business OS
            </Button>
            <Button className="w-full" variant="outline" onClick={() => setMode('signin')}>
              Sign In to Business
            </Button>
            <p className="text-xs text-muted-foreground text-center pt-1">
              Go straight to your business dashboard after sign-in.
            </p>
          </div>
        )}

        {mode === 'signin' && (
          <form className="space-y-4" onSubmit={onSignIn}>
            <div className="space-y-2">
              <Label htmlFor="biz-email">Email</Label>
              <Input id="biz-email" type="email" value={signinEmail} onChange={e => setSigninEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-password">Password</Label>
              <Input id="biz-password" type="password" value={signinPassword} onChange={e => setSigninPassword(e.target.value)} required />
            </div>
            {signinError && <p className="text-sm text-destructive">{signinError}</p>}
            <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold" type="submit">
              Sign In → Business Dashboard
            </Button>
            <Button className="w-full" variant="ghost" type="button" onClick={() => setMode('idle')}>Back</Button>
          </form>
        )}

        {mode === 'setup' && (
          <form className="space-y-4" onSubmit={onSetup}>
            <div className="space-y-1.5">
              <Label htmlFor="biz-owner-email">Work Email</Label>
              <Input id="biz-owner-email" type="email" value={setupEmail} onChange={e => setSetupEmail(e.target.value)} required />
            </div>
            {setupError && <p className="text-sm text-destructive">{setupError}</p>}
            {setupMessage && <p className="text-sm text-emerald-400">{setupMessage}</p>}
            <div className="space-y-2">
              <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold" type="submit" disabled={setupSending}>
                {setupSending ? 'Sending confirmation...' : 'Send Confirmation Link'}
              </Button>
              <Button className="w-full" variant="ghost" type="button" onClick={() => setMode('idle')}>Back</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Public gate shown when not authenticated ─────────────────────────────────
const PublicLandingGate = () => {
  return (
    <div className="min-h-screen min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-5 sm:p-6 lg:p-10">
      {/* Brand header */}
      <header className="mb-6 flex flex-wrap items-center gap-2.5 sm:mb-8">
        <Layers className="w-5 h-5 text-primary" />
        <span className="text-lg font-bold tracking-tight">Airtyn</span>
        <span className="ml-2 text-xs text-muted-foreground">Choose your workspace to get started</span>
      </header>

      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        <ProjectOSCard />
        <BusinessOSCard />
      </div>
    </div>
  );
};

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isHydrated, isAuthenticated, currentTenant, currentWorkspace } = useAppState();
  const pathname = usePathname();
  const product = getAppProduct(pathname);

  // Routes that render standalone — no sidebar/topbar needed
  const isStandaloneRoute = pathname.startsWith('/onboarding') || pathname.startsWith('/api') || pathname.startsWith('/invite');
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