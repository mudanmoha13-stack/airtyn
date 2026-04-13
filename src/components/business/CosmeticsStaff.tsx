'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Star,
  TrendingUp,
  CalendarDays,
  DollarSign,
  Award,
  ChevronRight,
  Clock,
  Plus,
  X,
  Check,
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  specializations: string[];
  schedule: string[];
  sales: { today: number; week: number; month: number };
  commission: { rate: number; today: number; week: number; month: number };
  appointments: { today: number; month: number };
  rating: number;
  reviews: number;
  avatar: string;
  status: 'active' | 'off' | 'break';
}

const SPECIALIZATION_OPTIONS = ['Skincare', 'Foundation Match', 'Anti-Aging', 'Lip Artistry', 'Color Consulting', 'Eye Makeup', 'Brow Shaping', 'Lash Styling', 'Eye Treatments', 'Fragrance', 'Hair Care', 'Nail Art', 'Body Treatments'];
const ROLE_OPTIONS = ['Senior Beauty Consultant', 'Beauty Advisor', 'Brow & Lash Artist', 'Fragrance Specialist', 'Skincare Consultant', 'Makeup Artist', 'Retail Associate'];
const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AVATAR_COLORS: string[] = [
  'bg-pink-500/20 text-pink-400',
  'bg-fuchsia-500/20 text-fuchsia-400',
  'bg-purple-500/20 text-purple-400',
  'bg-rose-500/20 text-rose-400',
  'bg-amber-500/20 text-amber-400',
];

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  break: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  off: 'bg-neutral-700/50 text-neutral-500 border-neutral-700/50',
};

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 's1', name: 'Mia', role: 'Senior Beauty Consultant', email: 'mia@airtyn-beauty.com', phone: '+1 555 100 2211',
    specializations: ['Skincare', 'Foundation Match', 'Anti-Aging'],
    schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    sales: { today: 1840, week: 8420, month: 32400 },
    commission: { rate: 10, today: 184, week: 842, month: 3240 },
    appointments: { today: 8, month: 142 },
    rating: 4.9, reviews: 84, avatar: 'M', status: 'active',
  },
  {
    id: 's2', name: 'Jade', role: 'Beauty Advisor', email: 'jade@airtyn-beauty.com', phone: '+1 555 100 3322',
    specializations: ['Lip Artistry', 'Color Consulting', 'Eye Makeup'],
    schedule: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'],
    sales: { today: 1220, week: 5840, month: 21600 },
    commission: { rate: 10, today: 122, week: 584, month: 2160 },
    appointments: { today: 6, month: 98 },
    rating: 4.7, reviews: 62, avatar: 'J', status: 'active',
  },
  {
    id: 's3', name: 'Lena', role: 'Brow & Lash Artist', email: 'lena@airtyn-beauty.com', phone: '+1 555 100 4433',
    specializations: ['Brow Shaping', 'Lash Styling', 'Eye Treatments'],
    schedule: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    sales: { today: 640, week: 2840, month: 10800 },
    commission: { rate: 8, today: 51, week: 227, month: 864 },
    appointments: { today: 5, month: 76 },
    rating: 4.8, reviews: 51, avatar: 'L', status: 'break',
  },
];

interface NewStaffForm {
  name: string;
  role: string;
  email: string;
  phone: string;
  commissionRate: string;
  specializations: string[];
  schedule: string[];
  status: 'active' | 'off';
}

const EMPTY_FORM: NewStaffForm = {
  name: '', role: 'Beauty Advisor', email: '', phone: '',
  commissionRate: '10', specializations: [], schedule: [],
  status: 'active',
};

export default function CosmeticsStaff() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [selected, setSelected] = useState<StaffMember | null>(INITIAL_STAFF[0]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewStaffForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof NewStaffForm, string>>>({});

  const avatarColorFor = (index: number) => AVATAR_COLORS[index % AVATAR_COLORS.length];

  const totalSales = staff.reduce((s, st) => s + st.sales[period], 0);
  const totalCommission = staff.reduce((s, st) => s + st.commission[period], 0);

  const set = <K extends keyof NewStaffForm>(key: K, value: NewStaffForm[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const toggleSpec = (val: string) => {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(val)
        ? f.specializations.filter(s => s !== val)
        : [...f.specializations, val],
    }));
  };

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      schedule: f.schedule.includes(day)
        ? f.schedule.filter(d => d !== day)
        : [...f.schedule, day],
    }));
  };

  const validate = () => {
    const e: Partial<Record<keyof NewStaffForm, string>> = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (staff.some(s => s.email.toLowerCase() === form.email.toLowerCase())) e.email = 'Email already in use';
    if (!form.commissionRate || isNaN(Number(form.commissionRate))) e.commissionRate = 'Enter a number';
    if (form.specializations.length === 0) e.specializations = 'Select at least one';
    if (form.schedule.length === 0) e.schedule = 'Select at least one day';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const newMember: StaffMember = {
      id: `s${Date.now()}`,
      name: form.name.trim(),
      role: form.role,
      email: form.email.trim(),
      phone: form.phone.trim(),
      specializations: form.specializations,
      schedule: form.schedule,
      sales: { today: 0, week: 0, month: 0 },
      commission: {
        rate: Number(form.commissionRate),
        today: 0, week: 0, month: 0,
      },
      appointments: { today: 0, month: 0 },
      rating: 0,
      reviews: 0,
      avatar: form.name.trim()[0]?.toUpperCase() ?? 'S',
      status: form.status,
    };
    setStaff(prev => [...prev, newMember]);
    setSelected(newMember);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* LEFT: Staff list */}
      <div className="w-[280px] flex-shrink-0 border-r border-neutral-800 bg-neutral-950 flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-semibold text-white">Staff</span>
              <span className="text-xs text-neutral-600">({staff.length})</span>
            </div>
            <button onClick={() => { setForm(EMPTY_FORM); setErrors({}); setShowModal(true); }}
              className="w-7 h-7 rounded-full bg-pink-500/15 flex items-center justify-center hover:bg-pink-500/25 transition-colors">
              <Plus className="w-3.5 h-3.5 text-pink-400" />
            </button>
          </div>
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-full p-1">
            {(['today', 'week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`flex-1 py-1 rounded-full text-xs font-medium capitalize transition-all ${period === p ? 'bg-pink-500/20 text-pink-400' : 'text-neutral-500'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {staff.map((s, idx) => (
            <button key={s.id} onClick={() => setSelected(s)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-neutral-800/60 text-left hover:bg-neutral-800/40 transition-colors ${selected?.id === s.id ? 'bg-neutral-800/60' : ''}`}>
              <div className="relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${avatarColorFor(idx)}`}>
                  {s.avatar}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-neutral-950 ${s.status === 'active' ? 'bg-emerald-400' : s.status === 'break' ? 'bg-amber-400' : 'bg-neutral-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white">{s.name}</div>
                <div className="text-[10px] text-neutral-500 truncate">{s.role}</div>
                <div className="text-[10px] text-emerald-400 font-medium mt-0.5">${s.sales[period].toLocaleString()} sales</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
            </button>
          ))}
        </div>

        <div className="border-t border-neutral-800 p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Team Sales</span>
            <span className="font-bold text-white">${totalSales.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Total Commission</span>
            <span className="font-bold text-emerald-400">${totalCommission.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Staff detail */}
      {selected ? (
        <div className="flex-1 overflow-y-auto p-6 pb-20">
          {(() => {
            const idx = staff.findIndex(s => s.id === selected.id);
            const avatarColor = avatarColorFor(idx);
            return (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${avatarColor}`}>
                    {selected.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                    <div className="text-sm text-neutral-400">{selected.role}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs border rounded-full px-2 py-0.5 ${STATUS_COLOR[selected.status]}`}>{selected.status}</span>
                      {selected.reviews > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {selected.rating} ({selected.reviews} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { icon: TrendingUp, label: 'Sales', value: `$${selected.sales[period].toLocaleString()}`, color: 'text-white' },
                    { icon: DollarSign, label: `Commission (${selected.commission.rate}%)`, value: `$${selected.commission[period].toLocaleString()}`, color: 'text-emerald-400' },
                    { icon: CalendarDays, label: 'Appointments', value: (period === 'today' ? selected.appointments.today : selected.appointments.month).toString(), color: 'text-fuchsia-400' },
                    { icon: Award, label: 'Rating', value: selected.reviews > 0 ? selected.rating.toString() : '—', color: 'text-amber-400' },
                  ].map(k => (
                    <div key={k.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                      <div className="w-7 h-7 rounded-xl bg-neutral-800 flex items-center justify-center mb-2">
                        <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
                      </div>
                      <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{k.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.specializations.map(s => (
                        <span key={s} className="text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full px-3 py-1">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Weekly Schedule
                    </h3>
                    <div className="flex gap-1.5">
                      {DAY_ABBR.map(day => (
                        <div key={day} className={`flex-1 py-2 rounded-xl text-center text-[10px] font-medium ${selected.schedule.includes(day) ? 'bg-pink-500/15 text-pink-400 border border-pink-500/20' : 'bg-neutral-800 text-neutral-600'}`}>
                          {day[0]}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Contact</h3>
                    <div className="space-y-2 text-xs text-neutral-300">
                      <div>{selected.email}</div>
                      {selected.phone && <div>{selected.phone}</div>}
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Commission Breakdown</h3>
                    <div className="space-y-2">
                      {[
                        { period: 'Today', sales: selected.sales.today, comm: selected.commission.today },
                        { period: 'This Week', sales: selected.sales.week, comm: selected.commission.week },
                        { period: 'This Month', sales: selected.sales.month, comm: selected.commission.month },
                      ].map(row => (
                        <div key={row.period} className="flex justify-between text-xs">
                          <span className="text-neutral-500">{row.period}</span>
                          <span className="text-neutral-300">${row.sales.toLocaleString()} → <span className="text-emerald-400 font-semibold">${row.comm.toLocaleString()}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <UserCheck className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
            <div className="text-sm text-neutral-500">Select a staff member to view details</div>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-bold text-white">Add Staff Member</span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Full Name <span className="text-rose-400">*</span></label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Sophie"
                  className={`w-full bg-neutral-800 border rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none transition-colors ${errors.name ? 'border-rose-500/50' : 'border-neutral-700 focus:border-pink-500/50'}`} />
                {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
              </div>

              {/* Role */}
              <div>
                <label className="text-xs font-medium text-neutral-400 mb-2 block">Role</label>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_OPTIONS.map(r => (
                    <button key={r} type="button" onClick={() => set('role', r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.role === r ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Work Email <span className="text-rose-400">*</span></label>
                  <input value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="staff@store.com" type="email"
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

              {/* Commission rate + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Commission Rate (%) <span className="text-rose-400">*</span></label>
                  <input value={form.commissionRate} onChange={e => set('commissionRate', e.target.value)}
                    placeholder="10" type="number" min="0" max="100"
                    className={`w-full bg-neutral-800 border rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none transition-colors ${errors.commissionRate ? 'border-rose-500/50' : 'border-neutral-700 focus:border-pink-500/50'}`} />
                  {errors.commissionRate && <p className="text-[10px] text-rose-400 mt-1">{errors.commissionRate}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-2 block">Status</label>
                  <div className="flex gap-2">
                    {(['active', 'off'] as const).map(s => (
                      <button key={s} type="button" onClick={() => set('status', s)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-medium capitalize transition-all ${form.status === s ? (s === 'active' ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-neutral-700 border-neutral-600 text-neutral-300') : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div>
                <label className="text-xs font-medium text-neutral-400 mb-2 block">
                  Specializations <span className="text-rose-400">*</span>
                  <span className="text-neutral-600 font-normal"> (select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALIZATION_OPTIONS.map(spec => (
                    <button key={spec} type="button" onClick={() => toggleSpec(spec)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${form.specializations.includes(spec) ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white'}`}>
                      {form.specializations.includes(spec) && <Check className="w-3 h-3" />}
                      {spec}
                    </button>
                  ))}
                </div>
                {errors.specializations && <p className="text-[10px] text-rose-400 mt-1">{errors.specializations}</p>}
              </div>

              {/* Schedule */}
              <div>
                <label className="text-xs font-medium text-neutral-400 mb-2 block">
                  Working Days <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-1.5">
                  {DAY_ABBR.map(day => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${form.schedule.includes(day) ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-neutral-800 border border-neutral-700 text-neutral-500 hover:text-neutral-300'}`}>
                      {day[0]}
                    </button>
                  ))}
                </div>
                {errors.schedule && <p className="text-[10px] text-rose-400 mt-1">{errors.schedule}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm font-medium py-3 rounded-2xl hover:bg-neutral-700 transition-all">
                  Cancel
                </button>
                <button onClick={handleAdd}
                  className="flex-1 bg-pink-500 hover:bg-pink-400 text-black text-sm font-bold py-3 rounded-2xl transition-all">
                  Add Staff Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
