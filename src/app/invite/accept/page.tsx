"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/lib/store';
import type { UserRole } from '@/lib/types';
import { CheckCircle2, Eye, EyeOff, Lock, User } from 'lucide-react';

// ─── Password validation ──────────────────────────────────────────────────────
function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10) errors.push('At least 10 characters');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/\d/.test(password)) errors.push('One number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character');
  return errors;
}

type InviteData = {
  email: string;
  role: string;
  tenantId: string;
  tenantName: string;
  workspaceName: string;
  invitedByName: string;
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-500/20 text-purple-400',
  admin: 'bg-blue-500/20 text-blue-400',
  member: 'bg-green-500/20 text-green-400',
};

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { acceptEmailInvitation } = useAppState();

  const token = searchParams.get('token') ?? '';

  // ── Verification state ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [verifyError, setVerifyError] = useState('');
  const [invite, setInvite] = useState<InviteData | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);

  const passwordIssues = useMemo(() => validatePassword(password), [password]);

  // ── Load invite token ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setVerifyError('Missing invite token. Please use the link from your invitation email.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/invite/verify?token=${encodeURIComponent(token)}`);
        const data = await res.json() as { ok: boolean; error?: string } & Partial<InviteData>;
        if (!res.ok || !data.ok) throw new Error(data.error ?? 'Invalid invite link');
        if (cancelled) return;
        setInvite({
          email: data.email ?? '',
          role: data.role ?? 'member',
          tenantId: data.tenantId ?? '',
          tenantName: data.tenantName ?? '',
          workspaceName: data.workspaceName ?? '',
          invitedByName: data.invitedByName ?? '',
        });
      } catch (err) {
        if (!cancelled) setVerifyError(err instanceof Error ? err.message : 'Failed to verify invite');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void verify();
    return () => { cancelled = true; };
  }, [token]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;

    if (passwordIssues.length > 0) {
      setSubmitError('Please fix the password issues above.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }
    if (name.trim().length < 2) {
      setSubmitError('Please enter your full name.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      // Mark token as consumed server-side
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim() }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Failed to accept invitation');

      // Bootstrap local session so the user is immediately signed in
      acceptEmailInvitation({
        email: invite.email,
        name: name.trim(),
        password,
        role: invite.role as UserRole,
        tenantId: invite.tenantId,
        tenantName: invite.tenantName,
        workspaceName: invite.workspaceName,
      });

      setDone(true);
      // Redirect to dashboard after a brief success moment
      setTimeout(() => router.push('/'), 1800);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render: loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm">Verifying your invitation…</p>
        </div>
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────
  if (verifyError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <CardTitle>Invitation link invalid</CardTitle>
            <CardDescription>{verifyError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => router.push('/')}>
              Back to Airtyn
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: success ───────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-green-500/15 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome to {invite?.workspaceName}!</h2>
              <p className="text-sm text-muted-foreground mt-1">Signing you in…</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Header card */}
        <Card className="text-center">
          <CardContent className="pt-8 pb-6">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold mb-1">You've been invited!</h1>
            <p className="text-sm text-muted-foreground">
              <strong>{invite?.invitedByName}</strong> invited you to join{' '}
              <strong>{invite?.workspaceName}</strong>
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">{invite?.email}</span>
              <Badge className={`text-xs ${ROLE_COLORS[invite?.role ?? 'member']}`}>
                {invite?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Setup form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Set up your account</CardTitle>
            <CardDescription>Create a password to access the workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="invite-name">Full name</Label>
                <Input
                  id="invite-name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="invite-password">Create password</Label>
                <div className="relative">
                  <Input
                    id="invite-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 10 chars, mixed case, number, symbol"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength checklist */}
                {password.length > 0 && (
                  <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1.5">
                    {['At least 10 characters', 'One lowercase letter', 'One uppercase letter', 'One number', 'One special character'].map((req) => {
                      const ok = !passwordIssues.includes(req);
                      return (
                        <li key={req} className={`text-xs flex items-center gap-1 ${ok ? 'text-green-500' : 'text-muted-foreground'}`}>
                          <span>{ok ? '✓' : '·'}</span> {req}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="invite-confirm">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="invite-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || passwordIssues.length > 0 || password !== confirmPassword}
              >
                {submitting ? 'Setting up your account…' : `Join ${invite?.workspaceName ?? 'workspace'}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          By accepting, you agree to use this workspace in accordance with your organisation's policies.
        </p>
      </div>
    </div>
  );
}
