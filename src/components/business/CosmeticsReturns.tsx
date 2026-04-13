'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Package,
  DollarSign,
  Filter,
} from 'lucide-react';

interface Return {
  id: string;
  rmaId: string;
  date: string;
  customer: string;
  product: string;
  sku: string;
  qty: number;
  reason: string;
  condition: 'unopened' | 'opened' | 'damaged' | 'defective';
  refundAmount: number;
  refundMethod: 'cash' | 'card' | 'store_credit' | 'loyalty_points';
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  notes?: string;
}

const RETURNS: Return[] = [
  { id: 'r1', rmaId: 'RTN-0089', date: 'Apr 12, 2026', customer: 'Sarah K.', product: 'Hydra-Boost Serum 50ml', sku: 'SKN-HBS-050', qty: 1, reason: 'Adverse skin reaction', condition: 'opened', refundAmount: 74, refundMethod: 'store_credit', status: 'pending', notes: 'Client reported redness after 2nd use. Recommend patch test consultation.' },
  { id: 'r2', rmaId: 'RTN-0088', date: 'Apr 11, 2026', customer: 'Emma L.', product: 'Velvet Matte Lipstick – Coral Kiss', sku: 'LIP-012-COR', qty: 2, reason: 'Wrong shade delivered', condition: 'unopened', refundAmount: 44, refundMethod: 'card', status: 'approved', notes: 'Exchange for Ruby Red accepted.' },
  { id: 'r3', rmaId: 'RTN-0087', date: 'Apr 10, 2026', customer: 'Priya M.', product: 'Mineral Foundation SPF30 – Sand', sku: 'FDN-MIN-SND', qty: 1, reason: 'Shade too light', condition: 'opened', refundAmount: 34, refundMethod: 'store_credit', status: 'completed' },
  { id: 'r4', rmaId: 'RTN-0086', date: 'Apr 9, 2026', customer: 'Alice T.', product: 'SPF 50 Sunscreen Fluid', sku: 'SKN-SUN-050', qty: 1, reason: 'Product damaged on delivery', condition: 'damaged', refundAmount: 42, refundMethod: 'card', status: 'completed' },
  { id: 'r5', rmaId: 'RTN-0085', date: 'Apr 8, 2026', customer: 'Nadia R.', product: 'Rose Gold Highlighter Palette', sku: 'PLT-HLG-RG', qty: 1, reason: 'Defective — pan cracked', condition: 'defective', refundAmount: 44, refundMethod: 'loyalty_points', status: 'rejected', notes: 'Physical damage appears to be from misuse. Policy: no refund on physically damaged items.' },
  { id: 'r6', rmaId: 'RTN-0084', date: 'Apr 7, 2026', customer: 'Sophie W.', product: 'Waterproof Mascara', sku: 'EYE-MAS-BLK', qty: 1, reason: 'Dried out on first use', condition: 'defective', refundAmount: 28, refundMethod: 'card', status: 'approved' },
];

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertCircle, label: 'Pending Review' },
  approved: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: XCircle, label: 'Rejected' },
  processing: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock, label: 'Processing' },
  completed: { color: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20', icon: CheckCircle2, label: 'Completed' },
};

const CONDITION_COLOR: Record<string, string> = {
  unopened: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  opened: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  damaged: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  defective: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const REFUND_METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  card: 'Card Refund',
  store_credit: 'Store Credit',
  loyalty_points: 'Loyalty Points',
};

export default function CosmeticsReturns() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<Return | null>(null);

  const filtered = RETURNS.filter(r => {
    const matchSearch = !search || r.customer.toLowerCase().includes(search.toLowerCase()) || r.rmaId.toLowerCase().includes(search.toLowerCase()) || r.product.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    pending: RETURNS.filter(r => r.status === 'pending').length,
    totalRefunded: RETURNS.filter(r => r.status === 'completed').reduce((s, r) => s + r.refundAmount, 0),
    approved: RETURNS.filter(r => r.status === 'approved').length,
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Returns & RMA</h1>
            <p className="text-xs text-neutral-500">Return management, condition grading, and refund processing</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/25 text-rose-400 text-xs font-medium px-4 py-2 rounded-full transition-all">
          <Plus className="w-3.5 h-3.5" /> New Return
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
          <div className="text-xs text-neutral-500 mt-0.5">Pending Review</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.approved}</div>
          <div className="text-xs text-neutral-500 mt-0.5">Approved This Week</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-white">${stats.totalRefunded}</div>
          <div className="text-xs text-neutral-500 mt-0.5">Refunded This Week</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT: Return list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search RMA, customer, product…"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-rose-500/40" />
            </div>
            <div className="flex gap-1">
              {['all', 'pending', 'approved', 'completed', 'rejected'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                    filterStatus === s ? 'bg-rose-500/20 text-rose-400 border border-rose-500/25' : 'bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}>
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Return cards */}
          {filtered.map(ret => {
            const { color, icon: StatusIcon, label: statusLabel } = STATUS_CONFIG[ret.status];
            return (
              <button key={ret.id} onClick={() => setSelected(ret)}
                className={`w-full bg-neutral-900 border rounded-2xl p-4 text-left transition-all hover:border-rose-500/30 ${
                  selected?.id === ret.id ? 'border-rose-500/40 bg-neutral-800/60' : 'border-neutral-800'
                }`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-rose-400">{ret.rmaId}</span>
                      <span className="text-[10px] text-neutral-500">{ret.date}</span>
                    </div>
                    <div className="text-xs font-semibold text-white">{ret.product}</div>
                    <div className="text-[10px] text-neutral-500">{ret.sku} · {ret.customer}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 flex items-center gap-1 ${color}`}>
                      <StatusIcon className="w-3 h-3" /> {statusLabel}
                    </span>
                    <span className="text-sm font-bold text-white">${ret.refundAmount}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 capitalize ${CONDITION_COLOR[ret.condition]}`}>{ret.condition}</span>
                  <span className="text-[10px] text-neutral-500">{ret.reason}</span>
                  <span className="text-[10px] text-neutral-600 ml-auto">{REFUND_METHOD_LABEL[ret.refundMethod]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT: Detail panel */}
        <div>
          {selected ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-rose-400">{selected.rmaId}</span>
                <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${STATUS_CONFIG[selected.status].color}`}>
                  {STATUS_CONFIG[selected.status].label}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-[10px] text-neutral-500 mb-0.5">Customer</div>
                  <div className="text-xs font-semibold text-white">{selected.customer}</div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-500 mb-0.5">Product</div>
                  <div className="text-xs text-white">{selected.product}</div>
                  <div className="text-[10px] text-neutral-500">{selected.sku}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-0.5">Quantity</div>
                    <div className="text-xs font-semibold text-white">{selected.qty}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-0.5">Condition</div>
                    <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 capitalize ${CONDITION_COLOR[selected.condition]}`}>
                      {selected.condition}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-500 mb-0.5">Reason</div>
                  <div className="text-xs text-neutral-300">{selected.reason}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-0.5">Refund Amount</div>
                    <div className="text-sm font-bold text-white">${selected.refundAmount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-0.5">Method</div>
                    <div className="text-xs text-white">{REFUND_METHOD_LABEL[selected.refundMethod]}</div>
                  </div>
                </div>
                {selected.notes && (
                  <div className="bg-neutral-800 rounded-xl p-2.5">
                    <div className="text-[10px] text-neutral-500 mb-1">Notes</div>
                    <div className="text-xs text-neutral-300">{selected.notes}</div>
                  </div>
                )}
              </div>

              {selected.status === 'pending' && (
                <div className="flex gap-2">
                  <button className="flex-1 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-semibold py-2.5 rounded-full hover:bg-emerald-500/25 transition-all">
                    Approve
                  </button>
                  <button className="flex-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold py-2.5 rounded-full hover:bg-rose-500/20 transition-all">
                    Reject
                  </button>
                </div>
              )}
              {selected.status === 'approved' && (
                <button className="w-full bg-pink-500/15 border border-pink-500/25 text-pink-400 text-xs font-semibold py-2.5 rounded-full hover:bg-pink-500/25 transition-all">
                  Process Refund
                </button>
              )}
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
              <RotateCcw className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
              <div className="text-xs text-neutral-500">Select a return to view details</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
