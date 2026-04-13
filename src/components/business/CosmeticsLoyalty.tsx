'use client';

import React, { useState } from 'react';
import {
  Star,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ChevronRight,
  TrendingUp,
  Gift,
} from 'lucide-react';

const TIERS = [
  { name: 'Bronze', min: 0, max: 999, color: 'text-amber-700', bg: 'bg-amber-700/10 border-amber-700/20', members: 842, perks: ['5% birthday discount', 'Early product access', 'Monthly newsletter'] },
  { name: 'Silver', min: 1000, max: 2499, color: 'text-neutral-300', bg: 'bg-neutral-400/10 border-neutral-400/20', members: 614, perks: ['8% birthday discount', '1 free consultation/yr', 'Exclusive event invites', 'Free samples on orders'] },
  { name: 'Gold', min: 2500, max: 4999, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', members: 286, perks: ['12% birthday discount', '2 free consultations/yr', 'Priority booking', 'Free gift wrap', '15% off fragrance'] },
  { name: 'Platinum', min: 5000, max: Infinity, color: 'text-fuchsia-300', bg: 'bg-fuchsia-400/10 border-fuchsia-400/20', members: 100, perks: ['20% birthday discount', 'Unlimited consultations', 'VIP event access', 'Free express shipping', 'Dedicated beauty advisor'] },
];

const LEDGER = [
  { date: 'Apr 12', member: 'Sarah K.', type: 'Earn', amount: +100, balance: 2840, note: 'Purchase #POS-0882' },
  { date: 'Apr 12', member: 'Emma L.', type: 'Redeem', amount: -200, balance: 6200, note: 'Redeemed at POS' },
  { date: 'Apr 11', member: 'Nadia R.', type: 'Earn', amount: +68, balance: 3100, note: 'Purchase #POS-0874' },
  { date: 'Apr 11', member: 'Emma L.', type: 'Earn', amount: +148, balance: 6400, note: 'Purchase #POS-0870' },
  { date: 'Apr 10', member: 'Priya M.', type: 'Earn', amount: +44, balance: 1240, note: 'Purchase #POS-0862' },
  { date: 'Apr 9', member: 'Alice T.', type: 'Bonus', amount: +50, balance: 380, note: 'Welcome bonus for new member' },
  { date: 'Apr 7', member: 'Sarah K.', type: 'Adjustment', amount: -20, balance: 2740, note: 'Correction for duplicate entry' },
  { date: 'Apr 5', member: 'Nadia R.', type: 'Upgrade', amount: +200, balance: 3032, note: 'Tier upgrade bonus: Silver → Gold' },
];

const MEMBERS_PREVIEW = [
  { name: 'Emma L.', email: 'emma.l@example.com', tier: 'Platinum', points: 6200, spend: '$6,200', joined: 'Jan 2024' },
  { name: 'Nadia R.', email: 'nadia.r@example.com', tier: 'Gold', points: 3100, spend: '$3,100', joined: 'Mar 2024' },
  { name: 'Sarah K.', email: 'sarah.k@example.com', tier: 'Gold', points: 2840, spend: '$2,840', joined: 'Jun 2024' },
  { name: 'Priya M.', email: 'priya.m@example.com', tier: 'Silver', points: 1240, spend: '$1,240', joined: 'Nov 2024' },
  { name: 'Alice T.', email: 'alice.t@example.com', tier: 'Bronze', points: 380, spend: '$380', joined: 'Apr 2026' },
];

const TIER_COLOR_MAP: Record<string, string> = {
  Bronze: 'text-amber-700 bg-amber-700/10 border-amber-700/20',
  Silver: 'text-neutral-300 bg-neutral-400/10 border-neutral-400/20',
  Gold: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Platinum: 'text-fuchsia-300 bg-fuchsia-400/10 border-fuchsia-400/20',
};

export default function CosmeticsLoyalty() {
  const [tab, setTab] = useState<'overview' | 'members' | 'ledger'>('overview');
  const [search, setSearch] = useState('');

  const totalMembers = TIERS.reduce((s, t) => s + t.members, 0);

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 flex items-center justify-center">
            <Star className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Loyalty Program</h1>
            <p className="text-xs text-neutral-500">Tiers, points ledger, and member management</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-full p-1">
          {(['overview', 'members', 'ledger'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${tab === t ? 'bg-purple-500/20 text-purple-400' : 'text-neutral-500 hover:text-neutral-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Members', value: totalMembers.toLocaleString(), delta: '+34 this month', up: true },
          { label: 'Points Issued', value: '184,200', delta: '+12% MoM', up: true },
          { label: 'Points Redeemed', value: '48,400', delta: '26% redemption rate', up: true },
          { label: 'Tier Upgrades', value: '34', delta: '+8 vs last month', up: true },
        ].map(s => (
          <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
            <div className="text-xs font-medium text-neutral-300">{s.label}</div>
            <div className={`flex items-center gap-0.5 text-[10px] mt-0.5 ${s.up ? 'text-emerald-400' : 'text-rose-400'}`}>
              {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {s.delta}
            </div>
          </div>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {TIERS.map(tier => (
            <div key={tier.name} className={`bg-neutral-900 border rounded-2xl p-5 ${tier.bg}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star className={`w-5 h-5 ${tier.color} fill-current`} />
                  <span className={`text-lg font-bold ${tier.color}`}>{tier.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{tier.members.toLocaleString()}</div>
                  <div className="text-[10px] text-neutral-500">members</div>
                </div>
              </div>
              <div className="text-xs text-neutral-400 mb-3">
                {tier.max === Infinity ? `${tier.min.toLocaleString()}+ points` : `${tier.min.toLocaleString()} – ${tier.max.toLocaleString()} points`}
              </div>
              <div className="space-y-1">
                {tier.perks.map(perk => (
                  <div key={perk} className="flex items-center gap-2 text-xs text-neutral-300">
                    <Gift className="w-3 h-3 text-pink-400 flex-shrink-0" />
                    {perk}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Distribution chart */}
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Member Distribution</h3>
            </div>
            <div className="space-y-3">
              {TIERS.map(tier => {
                const pct = Math.round((tier.members / totalMembers) * 100);
                return (
                  <div key={tier.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={tier.color}>{tier.name}</span>
                      <span className="text-neutral-400">{tier.members} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${tier.name === 'Platinum' ? 'bg-fuchsia-400' : tier.name === 'Gold' ? 'bg-amber-400' : tier.name === 'Silver' ? 'bg-neutral-400' : 'bg-amber-700'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search member…"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-purple-500/40" />
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-neutral-800 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              <span>Member</span><span>Tier</span><span>Points</span><span>Total Spend</span><span>Joined</span>
            </div>
            {MEMBERS_PREVIEW.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase())).map(m => (
              <div key={m.email} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-neutral-800/60 items-center hover:bg-neutral-800/30 transition-colors">
                <div>
                  <div className="text-xs font-semibold text-white">{m.name}</div>
                  <div className="text-[10px] text-neutral-500">{m.email}</div>
                </div>
                <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${TIER_COLOR_MAP[m.tier]}`}>{m.tier}</span>
                <span className="text-xs font-bold text-purple-400">{m.points.toLocaleString()}</span>
                <span className="text-xs text-neutral-300">{m.spend}</span>
                <span className="text-[10px] text-neutral-500">{m.joined}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_1fr] gap-4 px-4 py-3 border-b border-neutral-800 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            <span>Date</span><span>Member</span><span>Type</span><span>Points</span><span>Note</span>
          </div>
          {LEDGER.map((entry, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_1fr] gap-4 px-4 py-3 border-b border-neutral-800/60 items-center hover:bg-neutral-800/30 transition-colors">
              <span className="text-[10px] text-neutral-500">{entry.date}</span>
              <span className="text-xs text-white">{entry.member}</span>
              <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                entry.type === 'Earn' ? 'bg-emerald-500/10 text-emerald-400' :
                entry.type === 'Redeem' ? 'bg-rose-500/10 text-rose-400' :
                entry.type === 'Bonus' ? 'bg-purple-500/10 text-purple-400' :
                entry.type === 'Upgrade' ? 'bg-fuchsia-500/10 text-fuchsia-400' :
                'bg-neutral-700 text-neutral-400'
              }`}>{entry.type}</span>
              <span className={`text-xs font-bold ${entry.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {entry.amount > 0 ? '+' : ''}{entry.amount}
              </span>
              <span className="text-[10px] text-neutral-500">{entry.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
