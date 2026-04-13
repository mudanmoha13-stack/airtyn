'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  CalendarDays,
  Star,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
  Droplets,
} from 'lucide-react';

const KPI_CARDS = [
  { label: 'Revenue Today', value: '$4,820', delta: '+12.4%', up: true, icon: TrendingUp, color: 'pink' },
  { label: 'Orders Today', value: '86', delta: '+8', up: true, icon: ShoppingBag, color: 'rose' },
  { label: 'Appointments', value: '28', delta: '3 pending', up: true, icon: CalendarDays, color: 'fuchsia' },
  { label: 'Loyalty Members', value: '1,842', delta: '+34 this month', up: true, icon: Star, color: 'purple' },
];

const TOP_PRODUCTS = [
  { name: 'Velvet Matte Lipstick – #12 Ruby', sku: 'LIP-012-RUB', sold: 42, revenue: '$840', badge: 'Trending' },
  { name: 'Hydra-Boost Serum 50ml', sku: 'SKN-HBS-050', sold: 31, revenue: '$2,170', badge: 'Top' },
  { name: 'Mineral Foundation SPF30 – Porcelain', sku: 'FDN-MIN-PRC', sold: 28, revenue: '$1,960', badge: null },
  { name: 'Rose Gold Highlighter Palette', sku: 'PLT-HLG-RG', sold: 24, revenue: '$1,080', badge: null },
  { name: 'Collagen Eye Cream 15g', sku: 'SKN-EYE-015', sold: 19, revenue: '$665', badge: null },
];

const LOW_STOCK_ALERTS = [
  { name: 'Vitamin C Brightening Toner', sku: 'SKN-TON-VTC', stock: 4, threshold: 20, expiry: null, severity: 'critical' },
  { name: 'SPF 50 Sunscreen Fluid', sku: 'SKN-SUN-050', stock: 7, threshold: 20, expiry: '2026-05-12', severity: 'warning' },
  { name: 'Lash Volumizer Mascara – Black', sku: 'EYE-MAS-BLK', stock: 9, threshold: 25, expiry: null, severity: 'warning' },
  { name: 'Argan Oil Hair Serum', sku: 'HAI-SER-ARG', stock: 2, threshold: 15, expiry: '2026-04-28', severity: 'critical' },
];

const UPCOMING_APPOINTMENTS = [
  { time: '10:00', client: 'Sarah K.', service: 'Skin Consultation', staff: 'Mia', duration: '45 min', status: 'confirmed' },
  { time: '11:30', client: 'Emma L.', service: 'Shade Match & Makeover', staff: 'Jade', duration: '60 min', status: 'confirmed' },
  { time: '13:00', client: 'Priya M.', service: 'Facial Glow Treatment', staff: 'Mia', duration: '60 min', status: 'pending' },
  { time: '14:30', client: 'Alice T.', service: 'Brow & Lash Styling', staff: 'Lena', duration: '30 min', status: 'confirmed' },
  { time: '16:00', client: 'Nadia R.', service: 'Anti-Aging Consultation', staff: 'Jade', duration: '45 min', status: 'pending' },
];

const STAFF_PERFORMANCE = [
  { name: 'Mia', role: 'Senior Consultant', sales: '$1,840', commissions: '$184', appointments: 8, rating: 4.9 },
  { name: 'Jade', role: 'Beauty Advisor', sales: '$1,220', commissions: '$122', appointments: 6, rating: 4.7 },
  { name: 'Lena', role: 'Brow & Lash Artist', sales: '$640', commissions: '$64', appointments: 5, rating: 4.8 },
];

const colorMap: Record<string, string> = {
  pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};
const iconBg: Record<string, string> = {
  pink: 'bg-pink-500/10',
  rose: 'bg-rose-500/10',
  fuchsia: 'bg-fuchsia-500/10',
  purple: 'bg-purple-500/10',
};

export default function CosmeticsHub() {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today');

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Cosmetics Hub</h1>
            <p className="text-xs text-neutral-500">Beauty Retail Overview · Mon 13 Apr 2026</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-full p-1">
          {(['today', 'week', 'month'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === t ? 'bg-pink-500/20 text-pink-400' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPI_CARDS.map(({ label, value, delta, up, icon: Icon, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-xl ${iconBg[color]} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${colorMap[color].split(' ')[1]}`} />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {delta}
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Main 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Top Products */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Top Products</h2>
            <button className="text-xs text-pink-400 flex items-center gap-1 hover:text-pink-300">View all <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-2">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.sku} className="flex items-center gap-3 bg-neutral-800 rounded-xl px-3 py-2.5">
                <span className="text-xs font-bold text-neutral-600 w-4">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                  <Droplets className="w-4 h-4 text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{p.name}</div>
                  <div className="text-[10px] text-neutral-500">{p.sku}</div>
                </div>
                {p.badge && (
                  <span className="text-[10px] bg-pink-500/15 text-pink-400 border border-pink-500/20 rounded-full px-2 py-0.5">
                    {p.badge}
                  </span>
                )}
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-semibold text-white">{p.revenue}</div>
                  <div className="text-[10px] text-neutral-500">{p.sold} sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Stock Alerts
            </h2>
            <span className="text-xs bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-full px-2 py-0.5">
              {LOW_STOCK_ALERTS.length} items
            </span>
          </div>
          <div className="space-y-2">
            {LOW_STOCK_ALERTS.map(item => (
              <div key={item.sku} className={`rounded-xl p-3 border ${item.severity === 'critical' ? 'bg-rose-500/5 border-rose-500/15' : 'bg-amber-500/5 border-amber-500/15'}`}>
                <div className="text-xs font-medium text-white mb-1 leading-tight">{item.name}</div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold ${item.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {item.stock} left / min {item.threshold}
                  </span>
                  {item.expiry && (
                    <span className="text-[10px] text-neutral-500 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {item.expiry}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Upcoming Appointments */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-fuchsia-400" />
              Today's Appointments
            </h2>
            <button className="text-xs text-fuchsia-400 flex items-center gap-1 hover:text-fuchsia-300">
              Full calendar <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {UPCOMING_APPOINTMENTS.map(apt => (
              <div key={`${apt.time}-${apt.client}`} className="flex items-center gap-3 bg-neutral-800 rounded-xl px-3 py-2.5">
                <div className="text-xs font-bold text-fuchsia-400 w-10 flex-shrink-0">{apt.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white">{apt.client}</div>
                  <div className="text-[10px] text-neutral-500">{apt.service} · {apt.staff} · {apt.duration}</div>
                </div>
                <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${
                  apt.status === 'confirmed'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                }`}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Performance */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Staff Performance
            </h2>
            <span className="text-xs text-neutral-500">Today</span>
          </div>
          <div className="space-y-3">
            {STAFF_PERFORMANCE.map(s => (
              <div key={s.name} className="bg-neutral-800 rounded-xl px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-pink-500/20 flex items-center justify-center text-xs font-bold text-pink-400">
                      {s.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{s.name}</div>
                      <div className="text-[10px] text-neutral-500">{s.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" /> {s.rating}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xs font-bold text-white">{s.sales}</div>
                    <div className="text-[10px] text-neutral-500">Sales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-emerald-400">{s.commissions}</div>
                    <div className="text-[10px] text-neutral-500">Commission</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-fuchsia-400">{s.appointments}</div>
                    <div className="text-[10px] text-neutral-500">Apts</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
