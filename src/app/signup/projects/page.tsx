'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppState } from '@/lib/store';
import {
  FolderKanban,
  CheckCircle2,
  Kanban,
  Users,
  BarChart3,
  Zap,
  ArrowLeft,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react';

type Mode = 'choose' | 'signin' | 'signup';

const FEATURES = [
  { icon: Kanban,      title: 'Kanban & Sprints',    desc: 'Drag-and-drop boards, sprint planning, and backlog management.' },
  { icon: Users,       title: 'Team Collaboration',  desc: 'Assign tasks, share timelines, and keep everyone aligned.' },
  { icon: BarChart3,   title: 'Reports & Analytics', desc: 'Track velocity, workload, and project health in real time.' },
  { icon: Zap,         title: 'Automations',         desc: 'Automate status changes, notifications, and recurring tasks.' },
];

export default function ProjectsSignupPage() {
  const { signIn, emailExists } = useAppState();

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
    if (!result.ok) setError(result.message ?? 'Invalid credentials.');
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
        body: JSON.stringify({ email, mode: 'projects' }),
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
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 mb-16 group w-fit">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-white">Airtyn</span>
        </Link>

        {/* Hero text */}
        <div className="flex-1 flex flex-col justify-center max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary w-fit mb-6">
            <FolderKanban className="w-3.5 h-3.5" />
            Project OS
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Project management<br />
            <span className="text-primary">that ships work.</span>
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed mb-10">
            Onboard fast, organize projects, run Kanban workflows, and keep your team aligned — from day one.
          </p>

          {/* Features */}
          <div className="space-y-5">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating mock card */}
        <div className="mt-10 bg-neutral-900 rounded-[20px] border border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-neutral-400 tracking-wider">ACTIVE PROJECTS</span>
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">Live</span>
          </div>
          <div className="space-y-2">
            {['Website Redesign', 'Mobile App v2', 'API Integration'].map((p, i) => (
              <div key={p} className="flex items-center gap-3 bg-neutral-800 rounded-[14px] px-3 py-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                <span className="text-sm text-white flex-1">{p}</span>
                <div className="flex -space-x-1">
                  {[1, 2, 3].slice(0, i + 1).map(n => (
                    <div key={n} className="w-5 h-5 rounded-full bg-neutral-600 border border-neutral-800 text-[9px] flex items-center justify-center text-neutral-300">
                      {String.fromCharCode(64 + n)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT AUTH PANEL ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        {/* Mobile brand */}
        <div className="lg:hidden flex items-center gap-2 mb-8 self-start">
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <span className="text-base font-bold text-white">Airtyn</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Back to chooser */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 mb-8 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All products
          </Link>

          {/* Product badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-neutral-500 font-medium">Airtyn</div>
              <div className="text-sm font-semibold text-white">Project OS</div>
            </div>
          </div>

          {/* Choose mode */}
          {mode === 'choose' && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white mb-1">Get started</h2>
              <p className="text-neutral-400 text-sm mb-6">Create your project workspace or sign in to continue.</p>
              <button
                onClick={() => setMode('signup')}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-full transition-all text-sm"
              >
                Create Free Account
              </button>
              <button
                onClick={() => setMode('signin')}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3.5 rounded-full transition-all text-sm border border-neutral-700"
              >
                Sign In
              </button>
              <p className="text-center text-xs text-neutral-600 pt-2">
                Looking for Business OS?{' '}
                <Link href="/signup/business" className="text-amber-400 hover:text-amber-300">Switch →</Link>
              </p>
            </div>
          )}

          {/* Sign In */}
          {mode === 'signin' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
              <p className="text-neutral-400 text-sm mb-6">Sign in to your Project OS workspace.</p>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-full px-4 py-3 text-white text-sm placeholder:text-neutral-600 outline-none focus:ring-2 focus:ring-primary/40"
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
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-full px-4 py-3 pr-12 text-white text-sm placeholder:text-neutral-600 outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-[34px] text-neutral-500 hover:text-neutral-300">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {error && <p className="text-sm text-rose-400">{error}</p>}
                <button type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-full text-sm transition-all">
                  Sign In to Projects
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
              <h2 className="text-2xl font-bold text-white mb-1">Create workspace</h2>
              <p className="text-neutral-400 text-sm mb-6">Enter your work email — we'll send a confirmation link.</p>
              {sent ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[20px] p-5 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <div className="text-sm font-semibold text-white mb-1">Check your email</div>
                  <div className="text-xs text-neutral-400">
                    We sent a confirmation link to <span className="text-white">{email}</span>. Click it to finish setting up your workspace.
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
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-full px-4 py-3 text-white text-sm placeholder:text-neutral-600 outline-none focus:ring-2 focus:ring-primary/40"
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
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-full text-sm disabled:opacity-50 transition-all"
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
