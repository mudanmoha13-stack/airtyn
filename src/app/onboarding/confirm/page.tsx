"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppState } from '@/lib/store';

type OnboardingMode = 'projects' | 'business';
type Step = 'password' | 'details';

type SessionResponse = {
  ok: boolean;
  email?: string;
  mode?: OnboardingMode;
  expiresAt?: string;
  error?: string;
};

const BUSINESS_TYPES = [
  { value: 'crm', label: 'Sales & CRM' },
  { value: 'finance', label: 'Finance & Accounting' },
  { value: 'hr', label: 'HR & Payroll' },
  { value: 'inventory', label: 'Inventory & Supply Chain' },
  { value: 'procurement', label: 'Procurement & Vendors' },
  { value: 'support', label: 'Customer Support' },
  { value: 'analytics', label: 'Analytics & BI' },
  { value: 'full', label: 'Full Business OS (All Modules)' },
];

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10) errors.push('At least 10 characters');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/\d/.test(password)) errors.push('At least one number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('At least one special character');
  return errors;
}

function normalizeSubdomain(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function isValidSubdomain(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(value);
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
  const [businessType, setBusinessType] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [subdomainMessage, setSubdomainMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const passwordIssues = useMemo(() => validatePassword(password), [password]);
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() || 'airtyn.com';

  const checkSubdomainAvailability = async (candidateRaw: string): Promise<boolean> => {
    const candidate = normalizeSubdomain(candidateRaw);
    if (!isValidSubdomain(candidate)) {
      setSubdomainStatus('invalid');
      setSubdomainMessage('Use 3-32 characters, letters/numbers, and hyphens in the middle only.');
      return false;
    }

    setSubdomainStatus('checking');
    setSubdomainMessage('Checking availability...');

    const response = await fetch(`/api/onboarding/subdomain/availability?subdomain=${encodeURIComponent(candidate)}`);
    const data = (await response.json()) as { ok: boolean; available?: boolean; error?: string };

    if (!response.ok || !data.ok) {
      setSubdomainStatus('invalid');
      setSubdomainMessage(data.error ?? 'Failed to verify subdomain.');
      return false;
    }

    if (!data.available) {
      setSubdomainStatus('taken');
      setSubdomainMessage('That subdomain is already taken.');
      return false;
    }

    setSubdomainStatus('available');
    setSubdomainMessage('Subdomain is available.');
    return true;
  };

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

  useEffect(() => {
    if (mode !== 'business' || step !== 'details') return;
    const candidate = normalizeSubdomain(subdomain);
    if (!candidate) {
      setSubdomainStatus('idle');
      setSubdomainMessage('');
      return;
    }

    const handle = window.setTimeout(() => {
      void checkSubdomainAvailability(candidate);
    }, 350);

    return () => window.clearTimeout(handle);
  }, [mode, step, subdomain]);

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

      const normalizedSubdomain = mode === 'business' ? normalizeSubdomain(subdomain) : '';

      if (mode === 'business') {
        const available = await checkSubdomainAvailability(normalizedSubdomain);
        if (!available) {
          throw new Error('Pick an available subdomain to continue.');
        }
      }

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
          subdomain: mode === 'business' ? normalizedSubdomain : undefined,
          password,
        }),
      });

      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? 'Failed to complete onboarding');
      }

      completeOnboarding({
        tenantName: businessName,
        workspaceName: finalWorkspaceName,
        name: ownerName,
        email,
        password,
        mode,
        businessType: mode === 'business' ? businessType : undefined,
        subdomain: mode === 'business' ? normalizedSubdomain : undefined,
      });

      if (mode === 'business' && normalizedSubdomain) {
        const hostname = window.location.hostname.toLowerCase();
        const canResolveSubdomainHost =
          hostname === rootDomain || hostname.endsWith(`.${rootDomain}`);

        if (canResolveSubdomainHost) {
          window.location.href = `https://${normalizedSubdomain}.${rootDomain}`;
          return;
        }

        router.push(`/?tenant=${encodeURIComponent(normalizedSubdomain)}&signin=business`);
        return;
      }

      router.push('/');
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
                <>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="business-subdomain">Business Subdomain</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="business-subdomain"
                        value={subdomain}
                        onChange={(e) => setSubdomain(normalizeSubdomain(e.target.value))}
                        placeholder="your-company"
                        required
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">.{rootDomain}</span>
                    </div>
                    {subdomainMessage && (
                      <p className={`text-xs ${subdomainStatus === 'available' ? 'text-emerald-500' : subdomainStatus === 'checking' ? 'text-muted-foreground' : 'text-destructive'}`}>
                        {subdomainMessage}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="business-type">Primary Business Focus</Label>
                    <Select value={businessType} onValueChange={setBusinessType}>
                      <SelectTrigger id="business-type">
                        <SelectValue placeholder="Select your primary focus..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {submitError && <p className="col-span-2 text-sm text-destructive">{submitError}</p>}

              <div className="col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => setStep('password')}>
                  Back
                </Button>
                <Button type="submit" disabled={submitting}>
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
