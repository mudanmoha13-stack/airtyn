'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/store';
import {
  Building2,
  ShoppingCart,
  Users,
  BarChart3,
  Layers,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Wallet,
  Package,
  HeadphonesIcon,
} from 'lucide-react';

type Mode = 'choose' | 'signin' | 'signup';

const FEATURES = [
  { icon: ShoppingCart, title: 'Sales & CRM',        desc: 'Manage leads, deals, pipelines, and customer relationships.' },
  { icon: Wallet,       title: 'Finance & Accounting', desc: 'Invoicing, expenses, payroll and real-time financial reports.' },
  { icon: Package,      title: 'Inventory & Supply',  desc: 'Stock control, purchase orders, vendors and logistics.' },
  { icon: HeadphonesIcon, title: 'Customer Support', desc: 'Ticketing, SLAs, live chat and customer satisfaction tracking.' },
  { icon: Users,        title: 'HR & Payroll',        desc: 'Employee records, leave, attendance and payroll automation.' },
  { icon: BarChart3,    title: 'Analytics & BI',      desc: 'Real-time dashboards across every department in one view.' },
];

const MODULES = ['CRM', 'Finance', 'HR', 'Inventory', 'Restaurant', 'Support', 'Analytics'];

export default function BusinessSignupPage() {
  const { signIn, emailExists } = useAppState();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = signIn(email, password);
    if (!result.ok) { setError(result.message ?? 'Invalid credentials.'); return; }
    router.push('/business');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ── Duplicate email guard ─────────────────────────────────────────────
    if (emailExists(email)) {
      setError(
        'An account already exists for this email address. Please sign in instead, or use a different email to create a new workspace.'
      );
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/onboarding/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mode: 'business' }),
      });
      const data = await res.json() as { ok: boolean; error?: string; emailExists?: boolean };
      if (data.emailExists) {
        setError('An account already exists for this email address. Please sign in instead.');
        return;
      }
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Failed');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex overflow-hidden">

      {/* ── LEFT HERO ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[52%] bg-neutral-950 border-r border-neutral-800 p-12 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 mb-16 group w-fit">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-lg font-bold text-white">Airtyn</span>
        </Link>

        {/* Hero text */}
        <div className="flex-1 flex flex-col justify-center max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 w-fit mb-6">
            <Building2 className="w-3.5 h-3.5" />
            Business OS
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Run your entire<br />
            <span className="text-amber-400">business from one place.</span>
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed mb-8">
            CRM, Finance, HR, Inventory, Restaurant POS, Support and Analytics — unified in one powerful dashboard.
          </p>

          {/* Module chips */}
          <div className="flex flex-wrap gap-2 mb-10">
            {MODULES.map(m => (
              <span key={m} className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1">
                {m}
              </span>
            ))}
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{f.title}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-10 bg-neutral-900 rounded-[20px] border border-neutral-800 p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[['12+', 'Modules'], ['Real-time', 'Analytics'], ['Multi-tenant', 'Workspaces']].map(([val, label]) => (
              <div key={label}>
                <div className="text-lg font-bold text-amber-400">{val}</div>
                <div className="text-[11px] text-neutral-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT AUTH PANEL ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile brand */}
        <div className="lg:hidden flex items-center gap-2 mb-8 self-start">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-base font-bold text-white">Airtyn</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Back */}
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 mb-8 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            All products
          </Link>

          {/* Product badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-neutral-500 font-medium">Airtyn</div>
              <div className="text-sm font-semibold text-white">Business OS</div>
            </div>
          </div>

          {/* Choose */}
          {mode === 'choose' && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white mb-1">Get started</h2>
              <p className="text-neutral-400 text-sm mb-6">Set up your business workspace or sign in to continue.</p>
              <button
                onClick={() => setMode('signup')}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3.5 rounded-full transition-all text-sm"
              >
                Set Up Business OS
              </button>
              <button
                onClick={() => setMode('signin')}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3.5 rounded-full transition-all text-sm border border-neutral-700"
              >
                Sign In
              </button>
              <p className="text-center text-xs text-neutral-600 pt-2">
                Looking for Project OS?{' '}
                <Link href="/signup/projects" className="text-primary hover:text-primary/80">Switch →</Link>
              </p>
            </div>
          )}

          {/* Sign In */}
          {mode === 'signin' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
              <p className="text-neutral-400 text-sm mb-6">Sign in to your Business OS workspace.</p>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-full px-4 py-3 text-white text-sm placeholder:text-neutral-600 outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-full px-4 py-3 pr-12 text-white text-sm placeholder:text-neutral-600 outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-[34px] text-neutral-500 hover:text-neutral-300">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {error && <p className="text-sm text-rose-400">{error}</p>}
                <button type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3.5 rounded-full text-sm transition-all">
                  Sign In → Business Dashboard
                </button>
                <button type="button" onClick={() => setMode('choose')}
                  className="w-full text-neutral-500 hover:text-neutral-300 text-sm py-2 transition-colors">
                  ← Back
                </button>
              </form>
            </div>
          )}

          {/* Sign Up */}
          {mode === 'signup' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Set up workspace</h2>
              <p className="text-neutral-400 text-sm mb-6">Enter your work email — we'll send a confirmation link.</p>
              {sent ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[20px] p-5 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <div className="text-sm font-semibold text-white mb-1">Check your email</div>
                  <div className="text-xs text-neutral-400">
                    We sent a confirmation link to <span className="text-white">{email}</span>. Click it to finish setting up your Business OS workspace.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">Work Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-full px-4 py-3 text-white text-sm placeholder:text-neutral-600 outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-[16px] p-3.5">
                      <p className="text-sm text-rose-400 mb-2">{error}</p>
                      {emailExists(email) && (
                        <button
                          type="button"
                          onClick={() => { setError(''); setMode('signin'); }}
                          className="text-xs font-semibold text-white underline underline-offset-2 hover:text-neutral-300"
                        >
                          Sign in to existing account →
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3.5 rounded-full text-sm disabled:opacity-50 transition-all"
                  >
                    {sending ? 'Sending…' : 'Send Confirmation Link'}
                  </button>
                  <button type="button" onClick={() => setMode('choose')}
                    className="w-full text-neutral-500 hover:text-neutral-300 text-sm py-2 transition-colors">
                    ← Back
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
