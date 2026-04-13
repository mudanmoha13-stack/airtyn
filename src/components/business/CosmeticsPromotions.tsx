'use client';

import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Gift,
  Zap,
  Percent,
  ShoppingBag,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
} from 'lucide-react';

interface Promotion {
  id: string;
  name: string;
  type: 'gwp' | 'bogo' | 'bundle' | 'percent' | 'flat';
  description: string;
  discount?: string;
  minSpend?: number;
  giftProduct?: string;
  buyQty?: number;
  getQty?: number;
  scope: 'all' | 'category' | 'product';
  scopeValue?: string;
  startDate: string;
  endDate: string;
  usageCount: number;
  maxUsage?: number;
  active: boolean;
}

const PROMOS: Promotion[] = [
  { id: 'pr1', name: 'Spend $100 Get Free Serum', type: 'gwp', description: 'Gift with purchase: free 15ml Hydra-Boost Serum sample with orders over $100', minSpend: 100, giftProduct: 'Hydra-Boost Serum Sample 15ml', scope: 'all', startDate: 'Apr 1', endDate: 'Apr 30', usageCount: 84, maxUsage: 200, active: true },
  { id: 'pr2', name: 'Buy 2 Lipsticks Get 1 Free', type: 'bogo', description: 'Buy any 2 lipstick shades, get the 3rd at no charge', buyQty: 2, getQty: 1, scope: 'category', scopeValue: 'Lips', startDate: 'Apr 10', endDate: 'Apr 20', usageCount: 31, active: true },
  { id: 'pr3', name: 'Skincare Starter Bundle 20% Off', type: 'bundle', description: 'Buy any 3 skincare items from PureSkin and get 20% off the bundle', discount: '20%', scope: 'category', scopeValue: 'Skincare', startDate: 'Apr 1', endDate: 'Apr 30', usageCount: 52, active: true },
  { id: 'pr4', name: 'Gold Members 15% Off Fragrance', type: 'percent', description: 'Gold and Platinum loyalty members get 15% off all fragrances', discount: '15%', scope: 'category', scopeValue: 'Fragrance', startDate: 'Mar 1', endDate: 'May 31', usageCount: 18, active: true },
  { id: 'pr5', name: 'Spring Flash: $10 Off $60+', type: 'flat', description: 'Flat $10 off any order over $60 during the spring weekend flash sale', discount: '$10', minSpend: 60, scope: 'all', startDate: 'Apr 12', endDate: 'Apr 13', usageCount: 142, maxUsage: 150, active: false },
];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  gwp: { icon: Gift, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', label: 'Gift With Purchase' },
  bogo: { icon: ShoppingBag, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'BOGO' },
  bundle: { icon: Zap, color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20', label: 'Bundle' },
  percent: { icon: Percent, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: '% Discount' },
  flat: { icon: Tag, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Flat Off' },
};

export default function CosmeticsPromotions() {
  const [promos, setPromos] = useState(PROMOS);
  const [filterType, setFilterType] = useState('all');

  const toggle = (id: string) => {
    setPromos(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const filtered = filterType === 'all' ? promos : promos.filter(p => p.type === filterType);

  const stats = {
    active: promos.filter(p => p.active).length,
    totalRedemptions: promos.reduce((s, p) => s + p.usageCount, 0),
    expiringSoon: 2,
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/15 flex items-center justify-center">
            <Tag className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Promotions</h1>
            <p className="text-xs text-neutral-500">GWP, BOGO, bundles, and discount campaigns</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/25 text-pink-400 text-xs font-medium px-4 py-2 rounded-full transition-all">
          <Plus className="w-3.5 h-3.5" /> New Promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
          <div className="text-xs text-neutral-500 mt-0.5">Active Promotions</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.totalRedemptions}</div>
          <div className="text-xs text-neutral-500 mt-0.5">Total Redemptions</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.expiringSoon}</div>
          <div className="text-xs text-neutral-500 mt-0.5">Expiring This Week</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { key: 'all', label: 'All' },
          { key: 'gwp', label: 'GWP' },
          { key: 'bogo', label: 'BOGO' },
          { key: 'bundle', label: 'Bundle' },
          { key: 'percent', label: '% Discount' },
          { key: 'flat', label: 'Flat Off' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterType(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterType === f.key ? 'bg-pink-500/20 text-pink-400 border border-pink-500/25' : 'bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Promotion cards */}
      <div className="space-y-3">
        {filtered.map(promo => {
          const { icon: TypeIcon, color, label } = TYPE_CONFIG[promo.type];
          const usagePct = promo.maxUsage ? (promo.usageCount / promo.maxUsage) * 100 : null;

          return (
            <div key={promo.id} className={`bg-neutral-900 border rounded-2xl p-4 transition-all ${promo.active ? 'border-neutral-800' : 'border-neutral-800/50 opacity-60'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${color}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{promo.name}</span>
                    <span className={`text-[10px] border rounded-full px-2 py-0.5 ${color}`}>{label}</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-3">{promo.description}</p>

                  <div className="flex items-center gap-4 text-[10px] text-neutral-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{promo.startDate} – {promo.endDate}</span>
                    <span>{promo.usageCount} redemptions{promo.maxUsage ? ` / ${promo.maxUsage}` : ''}</span>
                    {promo.scopeValue && <span className="bg-neutral-800 rounded-full px-2 py-0.5">{promo.scopeValue}</span>}
                  </div>

                  {usagePct !== null && (
                    <div className="mt-2">
                      <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${usagePct > 80 ? 'bg-rose-500' : 'bg-pink-500'}`}
                          style={{ width: `${usagePct}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <button onClick={() => toggle(promo.id)} className="text-neutral-500 hover:text-white transition-colors">
                    {promo.active ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button className="text-neutral-500 hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
