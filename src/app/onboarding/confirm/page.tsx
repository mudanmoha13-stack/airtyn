"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/lib/store';
import { Users, ShoppingCart, UtensilsCrossed, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type OnboardingMode = 'projects' | 'business';
type Step = 'password' | 'details';

type SessionResponse = {
  ok: boolean;
  email?: string;
  mode?: OnboardingMode;
  expiresAt?: string;
  error?: string;
};

type ModuleGroup = 'foundational' | 'vertical';

type InitialModuleOption = {
  value: 'hr' | 'crm' | 'restaurant' | 'cosmetics';
  label: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
  group: ModuleGroup;
};

// Only four modules are eligible at onboarding. Users can add more later from the dashboard as add-ons.
// Selection rules:
//   - HR and CRM are "foundational" — can be selected together.
//   - Restaurant and Cosmetics are "vertical" — mutually exclusive, and cannot be mixed with foundational.
const INITIAL_MODULE_OPTIONS: InitialModuleOption[] = [
  { value: 'hr', label: 'HRM', summary: 'Employee records, payroll, attendance, and people ops.', icon: Users, group: 'foundational' },
  { value: 'crm', label: 'CRM', summary: 'Leads, contacts, deals, pipelines, and sales activity.', icon: ShoppingCart, group: 'foundational' },
  { value: 'restaurant', label: 'Restaurant POS', summary: 'POS, kitchen, tables, menus, and hospitality flows.', icon: UtensilsCrossed, group: 'vertical' },
  { value: 'cosmetics', label: 'Cosmetics Shop', summary: 'Beauty retail POS, appointments, loyalty, and inventory.', icon: Sparkles, group: 'vertical' },
];

function applyModuleToggle(
  current: InitialModuleOption['value'][],
  toggled: InitialModuleOption['value'],
): InitialModuleOption['value'][] {
  const option = INITIAL_MODULE_OPTIONS.find((opt) => opt.value === toggled);
  if (!option) return current;
  const hasToggled = current.includes(toggled);

  if (option.group === 'vertical') {
    // Verticals are mutually exclusive and clear any foundational picks.
    return hasToggled ? [] : [toggled];
  }
  // Foundational: clear any vertical; toggle within the foundational set.
  const withoutVerticals = current.filter((val) => {
    const opt = INITIAL_MODULE_OPTIONS.find((o) => o.value === val);
    return opt?.group === 'foundational';
  });
  return hasToggled
    ? withoutVerticals.filter((val) => val !== toggled)
    : Array.from(new Set([...withoutVerticals, toggled]));
}

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10) errors.push('At least 10 characters');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/\d/.test(password)) errors.push('At least one number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('At least one special character');
  return errors;
}

export default function ConfirmOnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { completeOnboarding } = useAppState();

  const token = searchParams.get('token') ?? '';

  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<OnboardingMode>('projects');

  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedModules, setSelectedModules] = useState<InitialModuleOption['value'][]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Primary businessType = the first selected module (kept for legacy template activation like 'restaurant').
  const businessType = selectedModules[0] ?? '';

  const passwordIssues = useMemo(() => validatePassword(password), [password]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      if (!token) {
        setSessionError('Missing confirmation token. Please use the link from your email.');
        setLoadingSession(false);
        return;
      }

      try {
        const response = await fetch(`/api/onboarding/session?token=${encodeURIComponent(token)}`);
        const data = (await response.json()) as SessionResponse;
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? 'Invalid confirmation link');
        }
        if (cancelled) return;
        setEmail(data.email ?? '');
        setMode((data.mode ?? 'projects') as OnboardingMode);
      } catch (error) {
        if (cancelled) return;
        setSessionError(error instanceof Error ? error.message : 'Failed to validate confirmation link');
      } finally {
        if (!cancelled) setLoadingSession(false);
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onPasswordContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordIssues.length > 0) {
      setPasswordError('Password is not strong enough.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordError('');
    setStep('details');
  };

  const onComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const finalWorkspaceName = mode === 'business'
        ? `${businessName} Business`
        : workspaceName.trim();

      if (!finalWorkspaceName) {
        throw new Error('Workspace name is required.');
      }

      if (mode === 'business' && selectedModules.length === 0) {
        throw new Error('Please select at least one module to get started.');
      }

      completeOnboarding({
        tenantName: businessName,
        workspaceName: finalWorkspaceName,
        name: ownerName,
        email,
        password,
        mode,
        businessType: mode === 'business' ? businessType : undefined,
        enabledModules: mode === 'business' ? selectedModules : undefined,
      });

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          mode,
          ownerName,
          businessName,
          workspaceName: finalWorkspaceName,
          businessType: mode === 'business' ? businessType : undefined,
          enabledModules: mode === 'business' ? selectedModules : undefined,
          password,
        }),
      });

      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? 'Failed to complete onboarding');
      }

      router.push(mode === 'business' ? '/business' : '/');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to complete onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center">Validating confirmation link...</div>;
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Confirmation link invalid</CardTitle>
            <CardDescription>{sessionError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/')}>Back to Airtyn</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-10 flex items-start justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Complete your Airtyn onboarding</CardTitle>
          <CardDescription>
            {mode === 'business' ? 'Business Management' : 'Project Management'} account for {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'password' ? (
            <form className="space-y-4" onSubmit={onPasswordContinue}>
              <div className="space-y-2">
                <Label htmlFor="new-password">Create password</Label>
                <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {passwordIssues.map((issue) => (
                  <li key={issue}>- {issue}</li>
                ))}
                {passwordIssues.length === 0 && <li>- Password strength looks good.</li>}
              </ul>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              <Button className="w-full" type="submit">Continue to business setup</Button>
            </form>
          ) : (
            <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={onComplete}>
              <div className="space-y-1.5">
                <Label htmlFor="owner-name">Your Name</Label>
                <Input id="owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="business-name">Business Name</Label>
                <Input id="business-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
              </div>

              {mode === 'projects' ? (
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input id="workspace-name" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} required />
                </div>
              ) : (
                <div className="col-span-2 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Label>Which module do you want to start with?</Label>
                    <span className="text-[11px] text-muted-foreground">
                      HRM + CRM can be combined • Restaurant or Cosmetics only
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {INITIAL_MODULE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedModules.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setSelectedModules((current) => applyModuleToggle(current, option.value))
                          }
                          aria-pressed={isSelected}
                          className={cn(
                            'group relative flex items-start gap-3 rounded-lg border p-3 text-left transition-all',
                            isSelected
                              ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/40'
                              : 'border-input bg-background hover:border-primary/30 hover:bg-accent/40',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md transition-colors',
                              isSelected
                                ? 'bg-primary/15 text-primary'
                                : 'bg-muted text-muted-foreground group-hover:text-foreground',
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{option.label}</span>
                              <span className="rounded-full border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                {option.group === 'foundational' ? 'Combinable' : 'Exclusive'}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">{option.summary}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    You can add other modules later from the dashboard as add-ons.
                  </p>
                </div>
              )}

              {submitError && <p className="col-span-2 text-sm text-destructive">{submitError}</p>}

              <div className="col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => setStep('password')}>
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || (mode === 'business' && selectedModules.length === 0)}
                >
                  {submitting ? 'Finishing onboarding...' : 'Finish onboarding'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
