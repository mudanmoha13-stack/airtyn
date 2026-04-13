'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Star,
  Droplets,
  Heart,
  CalendarDays,
  ChevronRight,
  Plus,
  ShoppingBag,
  Phone,
  Mail,
  X,
  Check,
} from 'lucide-react';

interface SkinProfile {
  type: string;
  tone: string;
  concerns: string[];
  allergies: string[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  points: number;
  totalSpend: number;
  lastVisit: string;
  skinProfile: SkinProfile;
  wishlist: string[];
  purchaseCount: number;
  notes: string;
}

const TIER_COLOR: Record<string, string> = {
  Bronze: 'text-amber-700 bg-amber-700/10 border-amber-700/20',
  Silver: 'text-neutral-300 bg-neutral-400/10 border-neutral-400/20',
  Gold: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Platinum: 'text-fuchsia-300 bg-fuchsia-400/10 border-fuchsia-400/20',
};

const SKIN_TYPES = ['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal'];
const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Medium-Deep', 'Deep', 'Rich'];
const CONCERN_OPTIONS = ['Acne', 'Redness', 'Fine Lines', 'Pores', 'Dullness', 'Dehydration', 'Hyperpigmentation', 'Sensitivity', 'Shine Control', 'Anti-Aging', 'Uneven Tone', 'Dark Circles'];
const ALLERGY_OPTIONS = ['Fragrance', 'Parabens', 'Alcohol', 'Sulfates', 'Synthetic Dyes', 'Lanolin', 'Formaldehyde', 'Nickel'];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1', name: 'Sarah K.', email: 'sarah.k@example.com', phone: '+1 555 010 2838',
    tier: 'Gold', points: 2840, totalSpend: 2840, lastVisit: 'Apr 12, 2026', purchaseCount: 38,
    skinProfile: { type: 'Combination', tone: 'Medium', concerns: ['Redness', 'Pores', 'Hydration'], allergies: ['Fragrance', 'Parabens'] },
    wishlist: ['Vitamin C Serum', 'Hydra-Boost Serum', 'SPF 50 Sunscreen'],
    notes: 'Prefers fragrance-free products. Sensitive around eye area.',
  },
  {
    id: 'c2', name: 'Emma L.', email: 'emma.l@example.com', phone: '+1 555 020 4421',
    tier: 'Platinum', points: 6200, totalSpend: 6200, lastVisit: 'Apr 11, 2026', purchaseCount: 84,
    skinProfile: { type: 'Dry', tone: 'Fair', concerns: ['Fine Lines', 'Dullness', 'Dehydration'], allergies: ['Alcohol'] },
    wishlist: ['Collagen Eye Cream', 'Rose Gold Highlighter'],
    notes: 'Top client. Prefers collagen-boosting treatments.',
  },
  {
    id: 'c3', name: 'Priya M.', email: 'priya.m@example.com', phone: '+1 555 031 9871',
    tier: 'Silver', points: 1240, totalSpend: 1240, lastVisit: 'Mar 28, 2026', purchaseCount: 17,
    skinProfile: { type: 'Oily', tone: 'Deep', concerns: ['Acne', 'Shine Control', 'Uneven Tone'], allergies: [] },
    wishlist: ['Mineral Foundation SPF30', 'Matte Liquid Eyeliner'],
    notes: 'Looking for matte, long-wear formulas.',
  },
  {
    id: 'c4', name: 'Alice T.', email: 'alice.t@example.com', phone: '+1 555 044 6712',
    tier: 'Bronze', points: 380, totalSpend: 380, lastVisit: 'Apr 9, 2026', purchaseCount: 5,
    skinProfile: { type: 'Sensitive', tone: 'Light', concerns: ['Redness', 'Sensitivity'], allergies: ['Sulfates', 'Synthetic Dyes'] },
    wishlist: ['SPF 50 Sunscreen', 'Collagen Eye Cream'],
    notes: 'New client. Referred by Emma.',
  },
  {
    id: 'c5', name: 'Nadia R.', email: 'nadia.r@example.com', phone: '+1 555 058 3302',
    tier: 'Gold', points: 3100, totalSpend: 3100, lastVisit: 'Apr 7, 2026', purchaseCount: 42,
    skinProfile: { type: 'Combination', tone: 'Medium-Deep', concerns: ['Anti-Aging', 'Hyperpigmentation'], allergies: [] },
    wishlist: ['Hydra-Boost Serum', 'Vitamin C Brightening Toner'],
    notes: 'Interested in anti-aging consultation package.',
  },
];

interface NewCustomerForm {
  name: string;
  email: string;
  phone: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  skinType: string;
  skinTone: string;
  concerns: string[];
  allergies: string[];
  notes: string;
}

const EMPTY_FORM: NewCustomerForm = {
  name: '', email: '', phone: '', tier: 'Bronze',
  skinType: 'Combination', skinTone: 'Medium',
  concerns: [], allergies: [], notes: '',
};

export default function CosmeticsCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<string>('All');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [tab, setTab] = useState<'profile' | 'history' | 'wishlist'>('profile');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewCustomerForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof NewCustomerForm, string>>>({});
  const [step, setStep] = useState<1 | 2>(1);

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === 'All' || c.tier === filterTier;
    return matchSearch && matchTier;
  });

  const set = <K extends keyof NewCustomerForm>(key: K, value: NewCustomerForm[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const toggleMulti = (key: 'concerns' | 'allergies', val: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val],
    }));
  };

  const validateStep1 = () => {
    const e: Partial<Record<keyof NewCustomerForm, string>> = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (customers.some(c => c.email.toLowerCase() === form.email.toLowerCase())) e.email = 'Email already exists';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };

  const handleAdd = () => {
    const newCustomer: Customer = {
      id: `c${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      tier: form.tier,
      points: 0,
      totalSpend: 0,
      lastVisit: 'Today',
      purchaseCount: 0,
      skinProfile: {
        type: form.skinType,
        tone: form.skinTone,
        concerns: form.concerns,
        allergies: form.allergies,
      },
      wishlist: [],
      notes: form.notes.trim(),
    };
    setCustomers(prev => [newCustomer, ...prev]);
    setSelected(newCustomer);
    setTab('profile');
    setForm(EMPTY_FORM);
    setErrors({});
    setStep(1);
    setShowModal(false);
  };

  const openModal = () => { setForm(EMPTY_FORM); setErrors({}); setStep(1); setShowModal(true); };

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* LEFT: CUSTOMER LIST */}
      <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-neutral-800 bg-neutral-950">
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-semibold text-white">Customers</span>
              <span className="text-xs text-neutral-600">({customers.length})</span>
            </div>
            <button onClick={openModal} className="w-7 h-7 rounded-full bg-pink-500/15 flex items-center justify-center hover:bg-pink-500/25 transition-colors">
              <Plus className="w-3.5 h-3.5 text-pink-400" />
            </button>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-pink-500/40" />
          </div>
          <div className="flex gap-1">
            {['All', 'Platinum', 'Gold', 'Silver', 'Bronze'].map(t => (
              <button key={t} onClick={() => setFilterTier(t)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${filterTier === t ? 'bg-pink-500/20 text-pink-400' : 'text-neutral-500 hover:text-neutral-300'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(c => (
            <button key={c.id} onClick={() => { setSelected(c); setTab('profile'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-neutral-800/60 text-left transition-colors hover:bg-neutral-800/40 ${selected?.id === c.id ? 'bg-neutral-800/60' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-pink-500/15 flex items-center justify-center text-sm font-bold text-pink-400 flex-shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white">{c.name}</div>
                <div className="text-[10px] text-neutral-500 truncate">{c.email}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-medium border rounded-full px-1.5 py-0.5 ${TIER_COLOR[c.tier]}`}>{c.tier}</span>
                  <span className="text-[10px] text-neutral-600">{c.points.toLocaleString()} pts</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-neutral-600 text-xs">No customers found.</div>
          )}
        </div>
      </div>

      {/* RIGHT: CUSTOMER DETAIL */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-start justify-between p-6 border-b border-neutral-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/15 flex items-center justify-center text-2xl font-bold text-pink-400">
                {selected.name[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-medium border rounded-full px-2 py-0.5 flex items-center gap-1 ${TIER_COLOR[selected.tier]}`}>
                    <Star className="w-3 h-3 fill-current" /> {selected.tier} Member
                  </span>
                  <span className="text-xs text-neutral-500">{selected.points.toLocaleString()} points</span>
                  <span className="text-xs text-neutral-500">Last: {selected.lastVisit}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-neutral-800">
            {[
              { label: 'Total Spend', value: `$${selected.totalSpend.toLocaleString()}`, color: 'text-white' },
              { label: 'Purchases', value: selected.purchaseCount.toString(), color: 'text-pink-400' },
              { label: 'Wishlist', value: selected.wishlist.length.toString(), color: 'text-fuchsia-400' },
            ].map(s => (
              <div key={s.label} className="bg-neutral-900 rounded-xl p-3 text-center border border-neutral-800">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-1 px-6 pt-4">
            {(['profile', 'history', 'wishlist'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${tab === t ? 'bg-pink-500/20 text-pink-400 border border-pink-500/25' : 'text-neutral-500 hover:text-neutral-300'}`}>
                {t === 'history' ? 'Purchase History' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'profile' && (
              <div className="space-y-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Contact</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-neutral-300"><Mail className="w-3.5 h-3.5 text-neutral-500" />{selected.email}</div>
                    {selected.phone && <div className="flex items-center gap-2 text-xs text-neutral-300"><Phone className="w-3.5 h-3.5 text-neutral-500" />{selected.phone}</div>}
                  </div>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-semibold text-white">Skin Profile</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-neutral-800 rounded-xl p-2.5">
                      <div className="text-[10px] text-neutral-500 mb-1">Skin Type</div>
                      <div className="text-xs font-semibold text-white">{selected.skinProfile.type}</div>
                    </div>
                    <div className="bg-neutral-800 rounded-xl p-2.5">
                      <div className="text-[10px] text-neutral-500 mb-1">Skin Tone</div>
                      <div className="text-xs font-semibold text-white">{selected.skinProfile.tone}</div>
                    </div>
                  </div>
                  {selected.skinProfile.concerns.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[10px] text-neutral-500 mb-1.5">Concerns</div>
                      <div className="flex flex-wrap gap-1">
                        {selected.skinProfile.concerns.map(c => (
                          <span key={c} className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full px-2 py-0.5">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.skinProfile.allergies.length > 0 && (
                    <div>
                      <div className="text-[10px] text-neutral-500 mb-1.5">Allergies / Avoid</div>
                      <div className="flex flex-wrap gap-1">
                        {selected.skinProfile.allergies.map(a => (
                          <span key={a} className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full px-2 py-0.5">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {selected.notes && (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Consultant Notes</h3>
                    <p className="text-xs text-neutral-300 leading-relaxed">{selected.notes}</p>
                  </div>
                )}
              </div>
            )}
            {tab === 'history' && (
              <div className="space-y-2">
                {selected.purchaseCount === 0 ? (
                  <div className="py-12 text-center text-neutral-600 text-xs">No purchases yet.</div>
                ) : (
                  [
                    { date: 'Apr 12, 2026', items: ['Hydra-Boost Serum', 'Velvet Matte Lipstick – Ruby Red'], total: '$100', pts: '+100' },
                    { date: 'Mar 24, 2026', items: ['Mineral Foundation SPF30 – Porcelain'], total: '$68', pts: '+68' },
                  ].map((tx, i) => (
                    <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-white">{tx.date}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-purple-400">{tx.pts} pts</span>
                          <span className="text-sm font-bold text-white">{tx.total}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tx.items.map(item => (
                          <span key={item} className="text-[10px] bg-neutral-800 text-neutral-400 rounded-full px-2 py-0.5">{item}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === 'wishlist' && (
              <div className="space-y-2">
                {selected.wishlist.length === 0 ? (
                  <div className="py-12 text-center text-neutral-600 text-xs">Wishlist is empty.</div>
                ) : selected.wishlist.map(item => (
                  <div key={item} className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                    <Heart className="w-4 h-4 text-pink-400 fill-pink-400 flex-shrink-0" />
                    <span className="text-xs text-white flex-1">{item}</span>
                    <button className="text-xs text-pink-400 flex items-center gap-1 hover:text-pink-300">
                      <ShoppingBag className="w-3 h-3" /> Add to POS
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <Users className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
            <div className="text-sm text-neutral-500">Select a customer to view their profile</div>
            <button onClick={openModal} className="mt-4 flex items-center gap-2 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/25 text-pink-400 text-xs font-medium px-4 py-2 rounded-full transition-all mx-auto">
              <Plus className="w-3.5 h-3.5" /> Add First Customer
            </button>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-bold text-white">New Customer</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Step indicator */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-pink-400' : 'bg-neutral-700'}`} />
                  <div className="w-4 h-px bg-neutral-700" />
                  <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-pink-400' : 'bg-neutral-700'}`} />
                </div>
                <button onClick={() => { setShowModal(false); setStep(1); }} className="text-neutral-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-500">Step 1 of 2 — Basic info & loyalty tier</p>

                  {/* Name */}
                  <div>
                    <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Full Name <span className="text-rose-400">*</span></label>
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="e.g. Sarah K."
                      className={`w-full bg-neutral-800 border rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none transition-colors ${errors.name ? 'border-rose-500/50' : 'border-neutral-700 focus:border-pink-500/50'}`} />
                    {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Email <span className="text-rose-400">*</span></label>
                      <input value={form.email} onChange={e => set('email', e.target.value)}
                        placeholder="email@example.com" type="email"
                        className={`w-full bg-neutral-800 border rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none transition-colors ${errors.email ? 'border-rose-500/50' : 'border-neutral-700 focus:border-pink-500/50'}`} />
                      {errors.email && <p className="text-[10px] text-rose-400 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Phone</label>
                      <input value={form.phone} onChange={e => set('phone', e.target.value)}
                        placeholder="+1 555 000 0000"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-pink-500/50 transition-colors" />
                    </div>
                  </div>

                  {/* Loyalty Tier */}
                  <div>
                    <label className="text-xs font-medium text-neutral-400 mb-2 block">Loyalty Tier</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['Bronze', 'Silver', 'Gold', 'Platinum'] as const).map(tier => (
                        <button key={tier} type="button" onClick={() => set('tier', tier)}
                          className={`py-2 rounded-xl border text-xs font-medium transition-all ${form.tier === tier ? `${TIER_COLOR[tier]} border-current` : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'}`}>
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Consultant Notes</label>
                    <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                      placeholder="Any preferences, sensitivities, or referral info…"
                      rows={3}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-pink-500/50 transition-colors resize-none" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowModal(false)}
                      className="flex-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm font-medium py-3 rounded-2xl hover:bg-neutral-700 transition-all">
                      Cancel
                    </button>
                    <button onClick={handleNext}
                      className="flex-1 bg-pink-500 hover:bg-pink-400 text-black text-sm font-bold py-3 rounded-2xl transition-all">
                      Next: Skin Profile →
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-500">Step 2 of 2 — Skin profile</p>

                  {/* Skin Type */}
                  <div>
                    <label className="text-xs font-medium text-neutral-400 mb-2 block">Skin Type</label>
                    <div className="flex flex-wrap gap-1.5">
                      {SKIN_TYPES.map(t => (
                        <button key={t} type="button" onClick={() => set('skinType', t)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.skinType === t ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skin Tone */}
                  <div>
                    <label className="text-xs font-medium text-neutral-400 mb-2 block">Skin Tone</label>
                    <div className="flex flex-wrap gap-1.5">
                      {SKIN_TONES.map(t => (
                        <button key={t} type="button" onClick={() => set('skinTone', t)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.skinTone === t ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Concerns */}
                  <div>
                    <label className="text-xs font-medium text-neutral-400 mb-2 block">Skin Concerns <span className="text-neutral-600">(select all that apply)</span></label>
                    <div className="flex flex-wrap gap-1.5">
                      {CONCERN_OPTIONS.map(c => (
                        <button key={c} type="button" onClick={() => toggleMulti('concerns', c)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${form.concerns.includes(c) ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white'}`}>
                          {form.concerns.includes(c) && <Check className="w-3 h-3" />}
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <label className="text-xs font-medium text-neutral-400 mb-2 block">Allergies / Ingredients to Avoid</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALLERGY_OPTIONS.map(a => (
                        <button key={a} type="button" onClick={() => toggleMulti('allergies', a)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${form.allergies.includes(a) ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white'}`}>
                          {form.allergies.includes(a) && <Check className="w-3 h-3" />}
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setStep(1)}
                      className="flex-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm font-medium py-3 rounded-2xl hover:bg-neutral-700 transition-all">
                      ← Back
                    </button>
                    <button onClick={handleAdd}
                      className="flex-1 bg-pink-500 hover:bg-pink-400 text-black text-sm font-bold py-3 rounded-2xl transition-all">
                      Add Customer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
