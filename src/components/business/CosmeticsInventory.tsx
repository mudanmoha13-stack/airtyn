'use client';

import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Clock,
  X,
  AlertTriangle,
} from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  brand: string;
  sku: string;
  category: string;
  stock: number;
  reserved: number;
  minStock: number;
  expiryDate?: string;
  batchLot?: string;
  location: string;
  unitCost: number;
  status: 'ok' | 'low' | 'critical' | 'expiring';
}

const CATEGORIES = ['Skincare', 'Foundation', 'Lips', 'Eyes', 'Fragrance', 'Hair', 'Body', 'Tools'];
const LOCATIONS = ['Shelf A1', 'Shelf A2', 'Shelf A3', 'Shelf A4', 'Shelf B1', 'Shelf B2', 'Shelf B3', 'Shelf B4', 'Shelf C1', 'Shelf C2', 'Shelf C3', 'Shelf D1', 'Shelf D2', 'Shelf E1', 'Stockroom'];

const INITIAL_ITEMS: StockItem[] = [
  { id: 'i1', name: 'Hydra-Boost Serum 50ml', brand: 'DermLab', sku: 'SKN-HBS-050', category: 'Skincare', stock: 18, reserved: 3, minStock: 20, location: 'Shelf A2', unitCost: 32, status: 'low' },
  { id: 'i2', name: 'Velvet Matte Lipstick – Ruby Red', brand: 'LuxéColor', sku: 'LIP-012-RUB', category: 'Lips', stock: 42, reserved: 5, minStock: 25, location: 'Shelf B1', unitCost: 9, status: 'ok' },
  { id: 'i3', name: 'Mineral Foundation SPF30 – Porcelain', brand: 'PureSkin', sku: 'FDN-MIN-PRC', category: 'Foundation', stock: 28, reserved: 8, minStock: 20, location: 'Shelf C3', unitCost: 28, status: 'ok' },
  { id: 'i4', name: 'Vitamin C Brightening Toner', brand: 'PureSkin', sku: 'SKN-TON-VTC', category: 'Skincare', stock: 4, reserved: 0, minStock: 20, expiryDate: '2026-07-15', batchLot: 'L2024-0482', location: 'Shelf A1', unitCost: 15, status: 'critical' },
  { id: 'i5', name: 'SPF 50 Sunscreen Fluid', brand: 'PureSkin', sku: 'SKN-SUN-050', category: 'Skincare', stock: 7, reserved: 1, minStock: 20, expiryDate: '2026-05-12', batchLot: 'L2024-0388', location: 'Shelf A3', unitCost: 17, status: 'expiring' },
  { id: 'i6', name: 'Argan Oil Hair Serum', brand: 'SilkRoots', sku: 'HAI-SER-ARG', category: 'Hair', stock: 2, reserved: 0, minStock: 15, expiryDate: '2026-04-28', batchLot: 'L2023-0911', location: 'Shelf D2', unitCost: 14, status: 'critical' },
  { id: 'i7', name: 'Rose Gold Highlighter Palette', brand: 'GlowStudio', sku: 'PLT-HLG-RG', category: 'Eyes', stock: 24, reserved: 2, minStock: 15, location: 'Shelf B4', unitCost: 18, status: 'ok' },
  { id: 'i8', name: 'Collagen Eye Cream 15g', brand: 'DermLab', sku: 'SKN-EYE-015', category: 'Skincare', stock: 11, reserved: 2, minStock: 20, expiryDate: '2026-06-20', batchLot: 'L2024-0512', location: 'Shelf A4', unitCost: 21, status: 'low' },
  { id: 'i9', name: 'Midnight Bloom EDP 50ml', brand: 'AuraScent', sku: 'FRG-MBL-050', category: 'Fragrance', stock: 8, reserved: 1, minStock: 10, location: 'Shelf E1', unitCost: 48, status: 'low' },
  { id: 'i10', name: 'Waterproof Mascara', brand: 'LuxéColor', sku: 'EYE-MAS-BLK', category: 'Eyes', stock: 9, reserved: 0, minStock: 25, location: 'Shelf B2', unitCost: 11, status: 'critical' },
];

const STAT_CARDS = [
  { label: 'Total SKUs', value: '486', sub: '94 variants tracked', color: 'pink' },
  { label: 'Low Stock', value: '12', sub: 'Below reorder threshold', color: 'amber' },
  { label: 'Expiring Soon', value: '5', sub: 'Within 30 days', color: 'rose' },
  { label: 'Stock Value', value: '$48,420', sub: 'At cost price', color: 'purple' },
];

const statusBadge: Record<string, string> = {
  ok: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  low: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  expiring: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};
const statusLabel: Record<string, string> = { ok: 'In Stock', low: 'Low Stock', critical: 'Critical', expiring: 'Expiring' };

function deriveStatus(stock: number, minStock: number, expiryDate?: string): StockItem['status'] {
  if (expiryDate) {
    const daysLeft = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
    if (daysLeft <= 30) return 'expiring';
  }
  if (stock === 0) return 'critical';
  if (stock <= minStock / 2) return 'critical';
  if (stock <= minStock) return 'low';
  return 'ok';
}

interface NewProductForm {
  name: string;
  brand: string;
  sku: string;
  category: string;
  stock: string;
  minStock: string;
  unitCost: string;
  location: string;
  expiryDate: string;
  batchLot: string;
}

const EMPTY_FORM: NewProductForm = {
  name: '', brand: '', sku: '', category: 'Skincare',
  stock: '', minStock: '20', unitCost: '', location: 'Shelf A1',
  expiryDate: '', batchLot: '',
};

export default function CosmeticsInventory() {
  const [items, setItems] = useState<StockItem[]>(INITIAL_ITEMS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'expiry'>('stock');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewProductForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<NewProductForm>>({});

  const filtered = items
    .filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || item.status === filterStatus.toLowerCase();
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let compare = 0;
      if (sortBy === 'name') compare = a.name.localeCompare(b.name);
      else if (sortBy === 'stock') compare = a.stock - b.stock;
      else if (sortBy === 'expiry') compare = (a.expiryDate ?? 'z').localeCompare(b.expiryDate ?? 'z');
      return sortDir === 'asc' ? compare : -compare;
    });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const set = (key: keyof NewProductForm, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Partial<NewProductForm> = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.brand.trim()) e.brand = 'Required';
    if (!form.sku.trim()) e.sku = 'Required';
    if (!form.stock || isNaN(Number(form.stock))) e.stock = 'Enter a number';
    if (!form.unitCost || isNaN(Number(form.unitCost))) e.unitCost = 'Enter a number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const stock = Number(form.stock);
    const minStock = Number(form.minStock) || 20;
    const newItem: StockItem = {
      id: `i${Date.now()}`,
      name: form.name.trim(),
      brand: form.brand.trim(),
      sku: form.sku.trim(),
      category: form.category,
      stock,
      reserved: 0,
      minStock,
      unitCost: Number(form.unitCost),
      location: form.location,
      expiryDate: form.expiryDate || undefined,
      batchLot: form.batchLot || undefined,
      status: deriveStatus(stock, minStock, form.expiryDate || undefined),
    };
    setItems(prev => [newItem, ...prev]);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/15 flex items-center justify-center">
            <Package className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Inventory</h1>
            <p className="text-xs text-neutral-500">Stock levels, expiry tracking, and reorder management</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setErrors({}); setShowModal(true); }}
          className="flex items-center gap-2 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/25 text-pink-400 text-xs font-medium px-4 py-2 rounded-full transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> New Product
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <div className={`text-2xl font-bold mb-1 ${s.color === 'pink' ? 'text-white' : s.color === 'amber' ? 'text-amber-400' : s.color === 'rose' ? 'text-rose-400' : 'text-purple-400'}`}>{s.value}</div>
            <div className="text-xs font-medium text-white">{s.label}</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search product or SKU…"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-pink-500/40" />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {['All', 'Critical', 'Low', 'Expiring', 'Ok'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterStatus === s ? 'bg-pink-500/20 text-pink-400 border border-pink-500/25' : 'bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}>
              {s}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs px-3 py-2 rounded-full hover:text-neutral-200">
          <RefreshCw className="w-3.5 h-3.5" /> Sync
        </button>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-neutral-800 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-left hover:text-neutral-300">
            Product {sortBy === 'name' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
          </button>
          <button onClick={() => toggleSort('stock')} className="flex items-center gap-1 hover:text-neutral-300">
            Stock {sortBy === 'stock' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
          </button>
          <span>Reserved</span>
          <span>Location</span>
          <button onClick={() => toggleSort('expiry')} className="flex items-center gap-1 hover:text-neutral-300">
            Expiry {sortBy === 'expiry' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
          </button>
          <span>Status</span>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-neutral-600 text-sm">No products match your filters.</div>
        )}

        {filtered.map(item => (
          <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-neutral-800/60 items-center hover:bg-neutral-800/30 transition-colors">
            <div>
              <div className="text-xs font-medium text-white">{item.name}</div>
              <div className="text-[10px] text-neutral-500">{item.sku} · {item.brand} · {item.category}</div>
              {item.batchLot && <div className="text-[10px] text-neutral-600">Lot: {item.batchLot}</div>}
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${item.stock <= item.minStock / 2 ? 'text-rose-400' : item.stock <= item.minStock ? 'text-amber-400' : 'text-white'}`}>
                {item.stock}
              </div>
              <div className="text-[10px] text-neutral-600">min {item.minStock}</div>
            </div>
            <div className="text-xs text-neutral-400 text-center">{item.reserved}</div>
            <div className="text-[10px] text-neutral-500">{item.location}</div>
            <div className="text-right">
              {item.expiryDate ? (
                <div className={`text-[10px] flex items-center gap-1 ${item.status === 'expiring' ? 'text-orange-400' : 'text-neutral-500'}`}>
                  <Clock className="w-3 h-3" /> {item.expiryDate}
                </div>
              ) : <span className="text-[10px] text-neutral-700">—</span>}
            </div>
            <div>
              <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${statusBadge[item.status]}`}>
                {statusLabel[item.status]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-bold text-white">Add New Product</span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Product Name <span className="text-rose-400">*</span></label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Hydra-Boost Serum 50ml"
                  className={`w-full bg-neutral-800 border rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none transition-colors ${errors.name ? 'border-rose-500/50 focus:border-rose-500' : 'border-neutral-700 focus:border-pink-500/50'}`} />
                {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
              </div>

              {/* Brand + SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Brand <span className="text-rose-400">*</span></label>
                  <input value={form.brand} onChange={e => set('brand', e.target.value)}
                    placeholder="e.g. DermLab"
                    className={`w-full bg-neutral-800 border rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none transition-colors ${errors.brand ? 'border-rose-500/50' : 'border-neutral-700 focus:border-pink-500/50'}`} />
                  {errors.brand && <p className="text-[10px] text-rose-400 mt-1">{errors.brand}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1.5 block">SKU <span className="text-rose-400">*</span></label>
                  <input value={form.sku} onChange={e => set('sku', e.target.value)}
                    placeholder="e.g. SKN-HBS-050"
                    className={`w-full bg-neutral-800 border rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none transition-colors ${errors.sku ? 'border-rose-500/50' : 'border-neutral-700 focus:border-pink-500/50'}`} />
                  {errors.sku && <p className="text-[10px] text-rose-400 mt-1">{errors.sku}</p>}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => set('category', cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.category === cat ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock + Min Stock + Cost */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Stock Qty <span className="text-rose-400">*</span></label>
                  <input value={form.stock} onChange={e => set('stock', e.target.value)}
                    placeholder="0" type="number" min="0"
                    className={`w-full bg-neutral-800 border rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none transition-colors ${errors.stock ? 'border-rose-500/50' : 'border-neutral-700 focus:border-pink-500/50'}`} />
                  {errors.stock && <p className="text-[10px] text-rose-400 mt-1">{errors.stock}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Min Stock</label>
                  <input value={form.minStock} onChange={e => set('minStock', e.target.value)}
                    placeholder="20" type="number" min="0"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-pink-500/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Unit Cost ($) <span className="text-rose-400">*</span></label>
                  <input value={form.unitCost} onChange={e => set('unitCost', e.target.value)}
                    placeholder="0.00" type="number" min="0" step="0.01"
                    className={`w-full bg-neutral-800 border rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none transition-colors ${errors.unitCost ? 'border-rose-500/50' : 'border-neutral-700 focus:border-pink-500/50'}`} />
                  {errors.unitCost && <p className="text-[10px] text-rose-400 mt-1">{errors.unitCost}</p>}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Storage Location</label>
                <div className="flex flex-wrap gap-1.5">
                  {LOCATIONS.map(loc => (
                    <button key={loc} type="button" onClick={() => set('location', loc)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${form.location === loc ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white'}`}>
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry + Batch (optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Expiry Date <span className="text-neutral-600">(optional)</span></label>
                  <input value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)}
                    type="date"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-pink-500/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Batch / Lot <span className="text-neutral-600">(optional)</span></label>
                  <input value={form.batchLot} onChange={e => set('batchLot', e.target.value)}
                    placeholder="e.g. L2024-0482"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-pink-500/50 transition-colors" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm font-medium py-3 rounded-2xl hover:bg-neutral-700 transition-all">
                  Cancel
                </button>
                <button onClick={handleAdd}
                  className="flex-1 bg-pink-500 hover:bg-pink-400 text-black text-sm font-bold py-3 rounded-2xl transition-all">
                  Add Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
