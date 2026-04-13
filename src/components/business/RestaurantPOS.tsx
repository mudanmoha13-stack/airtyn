'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Minus,
  Search,
  LogOut,
  LogIn,
  Smartphone,
  X,
  ChevronDown,
  ShoppingCart,
  Table2,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

// ─── Types ───────────────────────────────────────────────────────────────────
type OrderMode = 'counter' | 'dine-in' | 'takeaway' | 'delivery' | 'qr';
type PaymentMethod = 'cash' | 'card' | 'mpesa' | 'split';
type TableStatusType = 'occupied' | 'available' | 'reserved' | 'priority' | 'cleaning';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface Order {
  id: string;
  tableNumber?: string;
  orderNumber: string;
  items: OrderItem[];
  pax: number;
  mode: OrderMode;
  discount: number;
  specialInstructions: string;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  emoji: string;
  tags: string[];
}

interface TableStatus {
  number: string;
  status: TableStatusType;
  occupancy?: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MENU_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Nyama Choma Plate', category: 'Mains', price: 1200, emoji: '🍖', tags: ['popular'] },
  { id: 'm2', name: 'Fish & Chips', category: 'Mains', price: 950, emoji: '🐟', tags: [] },
  { id: 'm3', name: 'Chicken Stew', category: 'Mains', price: 850, emoji: '🍗', tags: ['popular'] },
  { id: 'm4', name: 'Beef Ugali', category: 'Mains', price: 750, emoji: '🍲', tags: ['veg'] },
  { id: 'g1', name: 'T-Bone Steak', category: 'Grills', price: 2200, emoji: '🥩', tags: ['popular'] },
  { id: 'g2', name: 'Grilled Chicken', category: 'Grills', price: 1400, emoji: '🍗', tags: [] },
  { id: 'g3', name: 'Lamb Ribs', category: 'Grills', price: 1800, emoji: '🍖', tags: [] },
  { id: 'g4', name: 'Mixed Grill', category: 'Grills', price: 2800, emoji: '🔥', tags: ['popular', 'spicy'] },
  { id: 'p1', name: 'Spaghetti Carbonara', category: 'Pasta', price: 850, emoji: '🍝', tags: [] },
  { id: 'p2', name: 'Penne Arrabbiata', category: 'Pasta', price: 780, emoji: '🍝', tags: ['spicy', 'veg'] },
  { id: 'p3', name: 'Fettuccine Alfredo', category: 'Pasta', price: 920, emoji: '🍝', tags: ['veg'] },
  { id: 'p4', name: 'Lasagna', category: 'Pasta', price: 1050, emoji: '🧀', tags: [] },
  { id: 's1', name: 'French Fries', category: 'Sides', price: 350, emoji: '🍟', tags: ['veg', 'popular'] },
  { id: 's2', name: 'Coleslaw', category: 'Sides', price: 250, emoji: '🥗', tags: ['veg'] },
  { id: 's3', name: 'Grilled Vegetables', category: 'Sides', price: 450, emoji: '🥦', tags: ['veg'] },
  { id: 's4', name: 'Chapati', category: 'Sides', price: 150, emoji: '🥖', tags: ['veg', 'popular'] },
  { id: 'd1', name: 'Chocolate Cake', category: 'Desserts', price: 350, emoji: '🍰', tags: [] },
  { id: 'd2', name: 'Fruit Salad', category: 'Desserts', price: 400, emoji: '🍓', tags: ['veg'] },
  { id: 'd3', name: 'Ice Cream', category: 'Desserts', price: 300, emoji: '🍦', tags: ['veg'] },
  { id: 'd4', name: 'Tiramisu', category: 'Desserts', price: 450, emoji: '🎂', tags: ['veg'] },
  { id: 'dr1', name: 'Sodas', category: 'Drinks', price: 150, emoji: '🥤', tags: ['veg'] },
  { id: 'dr2', name: 'Fresh Juice', category: 'Drinks', price: 250, emoji: '🧃', tags: ['veg', 'popular'] },
  { id: 'dr3', name: 'Coffee', category: 'Drinks', price: 200, emoji: '☕', tags: ['veg'] },
  { id: 'dr4', name: 'Beer', category: 'Drinks', price: 350, emoji: '🍺', tags: [] },
];

const CATEGORIES = ['All', 'Mains', 'Grills', 'Pasta', 'Sides', 'Desserts', 'Drinks'];

const MODES: { label: string; value: OrderMode; icon: string }[] = [
  { label: 'Counter', value: 'counter', icon: '🏪' },
  { label: 'Dine-In', value: 'dine-in', icon: '🍽️' },
  { label: 'Takeaway', value: 'takeaway', icon: '🥡' },
  { label: 'Delivery', value: 'delivery', icon: '🛵' },
  { label: 'QR Order', value: 'qr', icon: '📱' },
];

const TABLE_STATUSES: TableStatus[] = Array.from({ length: 15 }, (_, i) => ({
  number: `T${String(i + 1).padStart(2, '0')}`,
  status:
    i === 3 ? 'occupied' : i === 7 ? 'reserved' : i === 11 ? 'priority' : i === 13 ? 'cleaning' : 'available',
  occupancy: i === 3 ? 4 : i === 7 ? 2 : undefined,
}));

const TAG_LABELS: Record<string, string> = { spicy: '🌶️', veg: '🌿', popular: '⭐' };

function getTableColor(status: TableStatusType) {
  const map: Record<TableStatusType, string> = {
    available:  'bg-lime-300/10 text-lime-300 border border-lime-300/30',
    occupied:   'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    reserved:   'bg-violet-500/20 text-violet-400 border border-violet-500/30',
    priority:   'bg-lime-300 text-black',
    cleaning:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  };
  return map[status];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RestaurantPOS() {
  const [mode, setMode] = useState<OrderMode>('counter');
  const [activeTable, setActiveTable] = useState<string | null>('T01');
  const [showTables, setShowTables] = useState(false);
  const [orders, setOrders] = useState<Order[]>([{
    id: '1', orderNumber: '#1001', items: [], pax: 2, mode: 'counter', discount: 0, specialInstructions: '',
  }]);
  const [currentOrderIdx, setCurrentOrderIdx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(true);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [tendered, setTendered] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');

  const currentOrder = orders[currentOrderIdx] ?? orders[0];

  const filteredItems = useMemo(() =>
    MENU_ITEMS.filter(item =>
      (selectedCategory === 'All' || item.category === selectedCategory) &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [selectedCategory, searchQuery]);

  const subtotal = useMemo(() =>
    currentOrder.items.reduce((s, i) => s + i.price * i.quantity, 0),
    [currentOrder.items]);
  const tax = useMemo(() => Math.round(subtotal * 0.16 * 100) / 100, [subtotal]);
  const total = useMemo(() => subtotal - currentOrder.discount + tax, [subtotal, currentOrder.discount, tax]);
  const change = useMemo(() => Math.max(0, (parseFloat(tendered) || 0) - total), [tendered, total]);
  const itemCount = currentOrder.items.reduce((s, i) => s + i.quantity, 0);

  const handleAddItem = useCallback((item: MenuItem) => {
    setOrders(prev => {
      const updated = prev.map((o, idx) => {
        if (idx !== currentOrderIdx) return o;
        const existing = o.items.find(i => i.id === item.id);
        if (existing) {
          return { ...o, items: o.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
        }
        return { ...o, items: [...o.items, { id: item.id, name: item.name, price: item.price, quantity: 1 }] };
      });
      return updated;
    });
  }, [currentOrderIdx]);

  const handleQty = useCallback((itemId: string, delta: number) => {
    setOrders(prev => prev.map((o, idx) => {
      if (idx !== currentOrderIdx) return o;
      const items = o.items
        .map(i => i.id === itemId ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0);
      return { ...o, items };
    }));
  }, [currentOrderIdx]);

  const handleRemove = useCallback((itemId: string) => {
    setOrders(prev => prev.map((o, idx) =>
      idx !== currentOrderIdx ? o : { ...o, items: o.items.filter(i => i.id !== itemId) }
    ));
  }, [currentOrderIdx]);

  const handleModeChange = useCallback((m: OrderMode) => {
    setMode(m);
    setOrders([{ id: '1', orderNumber: '#1001', items: [], pax: 2, mode: m, discount: 0, specialInstructions: '' }]);
    setCurrentOrderIdx(0);
  }, []);

  const handleConfirmPayment = useCallback(() => {
    setPaymentOpen(false);
    setTendered('');
    const next: Order = {
      id: String(orders.length + 1),
      orderNumber: `#${1001 + orders.length}`,
      items: [], pax: 2, mode, discount: 0, specialInstructions: '',
      tableNumber: mode === 'dine-in' ? activeTable ?? undefined : undefined,
    };
    setOrders(prev => [...prev, next]);
    setCurrentOrderIdx(orders.length);
  }, [orders.length, mode, activeTable]);

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 bg-lime-300 rounded-xl flex items-center justify-center text-black font-bold text-sm">
            ✳
          </div>
          <span className="text-sm font-semibold text-white hidden sm:block">POS</span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 flex-1">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => handleModeChange(m.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                mode === m.value
                  ? 'bg-lime-300 text-black'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              <span>{m.icon}</span>
              <span className="hidden md:block">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Table picker (dine-in) */}
        {mode === 'dine-in' && (
          <button
            onClick={() => setShowTables(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full text-xs font-medium"
          >
            <Table2 size={14} />
            {activeTable ?? 'Select Table'}
            <ChevronDown size={12} />
          </button>
        )}

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-neutral-400">
          <span><span className="text-white font-medium">{orders.length}</span> orders</span>
          <span><span className="text-white font-medium">15</span> tables</span>
        </div>

        {/* Shift */}
        <button
          onClick={() => setShiftDialogOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ml-2 ${
            shiftOpen ? 'bg-rose-500/20 text-rose-400' : 'bg-lime-300 text-black'
          }`}
        >
          {shiftOpen ? <><LogOut size={13} /> Close Shift</> : <><LogIn size={13} /> Open Shift</>}
        </button>
      </div>

      {/* ── TABLE PICKER DROPDOWN ─────────────────────────────────────────── */}
      {showTables && mode === 'dine-in' && (
        <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex-shrink-0">
          <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-15 gap-2 max-w-3xl">
            {TABLE_STATUSES.map(t => (
              <button
                key={t.number}
                onClick={() => { setActiveTable(t.number); setShowTables(false); }}
                className={`py-2 px-1 rounded-[14px] text-xs font-medium transition-all ${getTableColor(t.status)} ${
                  activeTable === t.number ? 'ring-2 ring-lime-300' : ''
                }`}
              >
                {t.number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN BODY: MENU | ORDER COUNTER side by side ──────────────────── */}
      <div className="flex flex-1 overflow-hidden gap-0">

        {/* ══ LEFT: MENU PANEL ══════════════════════════════════════════════ */}
        <div className="flex flex-col flex-1 overflow-hidden bg-black">

          {/* Search + Categories */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input
                type="text"
                placeholder="Search menu…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-neutral-800 border border-neutral-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-lime-300/40"
              />
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full font-medium text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-lime-300 text-black'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Grid — scrollable, fills remaining height */}
          <ScrollArea className="flex-1 px-4 pb-4">
            {filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-neutral-500 text-sm">
                No items found
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredItems.map(item => {
                  const inOrder = currentOrder.items.find(i => i.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className={`bg-neutral-900 rounded-[24px] p-3 text-left hover:ring-2 hover:ring-lime-300/60 transition-all hover:scale-[1.02] relative ${
                        inOrder ? 'ring-2 ring-lime-300' : ''
                      }`}
                    >
                      {/* Badge qty */}
                      {inOrder && (
                        <span className="absolute top-2 right-2 bg-lime-300 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {inOrder.quantity}
                        </span>
                      )}
                      <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-xl mb-2">
                        {item.emoji}
                      </div>
                      <div className="font-medium text-white text-sm line-clamp-2 mb-1 leading-tight">
                        {item.name}
                      </div>
                      <div className="flex gap-1 flex-wrap mb-2 min-h-[20px]">
                        {item.tags.map(tag => (
                          <span key={tag} className="text-xs bg-neutral-800 rounded-full px-1.5 py-0.5 text-neutral-400">
                            {TAG_LABELS[tag]}
                          </span>
                        ))}
                      </div>
                      <div className="text-base font-light text-lime-300">
                        KES {item.price.toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ══ RIGHT: ORDER / COUNTER PANEL ═════════════════════════════════ */}
        <div className="w-[320px] xl:w-[360px] flex-shrink-0 bg-neutral-900 border-l border-neutral-800 flex flex-col overflow-hidden">

          {/* Order Header */}
          <div className="px-4 pt-4 pb-3 border-b border-neutral-800 flex-shrink-0">
            <div className="text-[10px] text-neutral-500 font-semibold tracking-widest uppercase mb-1">
              {mode === 'dine-in' ? `Table ${activeTable}` : mode.replace('-', ' ')}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-white">{currentOrder.orderNumber}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">PAX</span>
                <input
                  type="number"
                  min={1}
                  value={currentOrder.pax}
                  onChange={e => setOrders(prev => prev.map((o, i) =>
                    i !== currentOrderIdx ? o : { ...o, pax: parseInt(e.target.value) || 1 }
                  ))}
                  className="w-10 text-center bg-neutral-800 border border-neutral-700 rounded-full text-xs text-white py-0.5"
                />
              </div>
            </div>
          </div>

          {/* Items List */}
          <ScrollArea className="flex-1 px-4 py-3">
            {currentOrder.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-neutral-600 text-sm gap-2">
                <ShoppingCart size={24} />
                <span>Add items from menu</span>
              </div>
            ) : (
              <div className="space-y-2">
                {currentOrder.items.map(item => (
                  <div key={item.id} className="bg-neutral-800 rounded-[20px] px-3 py-2.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{item.name}</div>
                      <div className="text-xs text-neutral-500">KES {(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleQty(item.id, -1)}
                        className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600 text-white"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-xs font-medium text-white">{item.quantity}</span>
                      <button
                        onClick={() => handleQty(item.id, 1)}
                        className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600 text-white"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/30 ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Totals + Actions */}
          <div className="px-4 pb-4 pt-3 border-t border-neutral-800 flex-shrink-0 space-y-3">
            {/* Pricing rows */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span className="text-white">KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <button
                  onClick={() => {
                    const d = parseFloat(window.prompt('Discount %') || '0');
                    if (d >= 0 && d <= 100)
                      setOrders(prev => prev.map((o, i) =>
                        i !== currentOrderIdx ? o : { ...o, discount: Math.round(subtotal * d / 100) }
                      ));
                  }}
                  className="text-lime-300 hover:text-lime-200"
                >
                  Discount
                </button>
                <span className="text-white">{currentOrder.discount > 0 ? `-KES ${currentOrder.discount.toLocaleString()}` : '—'}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>VAT 16%</span>
                <span className="text-white">KES {tax.toLocaleString()}</span>
              </div>
              <Separator className="bg-neutral-800 my-1" />
              <div className="flex justify-between font-semibold">
                <span className="text-white">Total</span>
                <span className="text-2xl font-light text-white tracking-tight">KES {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Special instructions */}
            <textarea
              placeholder="Special instructions…"
              value={currentOrder.specialInstructions}
              onChange={e => setOrders(prev => prev.map((o, i) =>
                i !== currentOrderIdx ? o : { ...o, specialInstructions: e.target.value }
              ))}
              className="w-full rounded-[16px] bg-neutral-800 border border-neutral-700 p-2.5 text-xs text-white placeholder:text-neutral-600 resize-none h-12 outline-none"
            />

            {/* Action buttons */}
            <button
              onClick={() => setPaymentOpen(true)}
              disabled={currentOrder.items.length === 0}
              className="w-full rounded-full bg-lime-300 text-black font-semibold py-3.5 text-base hover:bg-lime-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Charge KES {total.toLocaleString()}
            </button>
            <div className="grid grid-cols-3 gap-2">
              {['Split', 'Comp', 'Void'].map(a => (
                <button key={a} className="rounded-full bg-neutral-800 text-neutral-300 py-2 text-xs font-medium hover:bg-neutral-700">
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ORDER PREVIEW BAR ──────────────────────────────────────── */}
      <div className="bg-neutral-900 border-t border-neutral-800 px-4 py-2.5 flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <ShoppingCart size={15} className="text-lime-300" />
          <span className="text-white font-medium">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Order chips */}
        <div className="flex-1 flex gap-2 overflow-x-auto">
          {currentOrder.items.slice(0, 6).map(item => (
            <span
              key={item.id}
              className="flex-shrink-0 bg-neutral-800 rounded-full px-3 py-1 text-xs text-neutral-300 whitespace-nowrap"
            >
              {item.quantity}× {item.name}
            </span>
          ))}
          {currentOrder.items.length > 6 && (
            <span className="flex-shrink-0 bg-neutral-800 rounded-full px-3 py-1 text-xs text-neutral-500">
              +{currentOrder.items.length - 6} more
            </span>
          )}
        </div>

        {/* Mini total */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-neutral-400 text-xs">
            {mode === 'dine-in' && activeTable ? `Table ${activeTable}` : mode}
          </span>
          <span className="text-white font-semibold text-sm">KES {total.toLocaleString()}</span>
          <button
            onClick={() => setPaymentOpen(true)}
            disabled={itemCount === 0}
            className="bg-lime-300 text-black text-xs font-bold px-4 py-1.5 rounded-full disabled:opacity-40 hover:bg-lime-200"
          >
            Pay
          </button>
        </div>
      </div>

      {/* ── PAYMENT DIALOG ────────────────────────────────────────────────── */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="bg-neutral-900 rounded-[32px] border-0 p-6 max-w-md">
          <h2 className="text-2xl font-semibold text-white mb-1">Payment</h2>
          <p className="text-neutral-400 text-sm mb-5">
            {currentOrder.orderNumber} · {itemCount} items
          </p>

          <Tabs value={payMethod} onValueChange={v => setPayMethod(v as PaymentMethod)} className="mb-5">
            <TabsList className="grid grid-cols-4 bg-neutral-800 rounded-full p-1 mb-4">
              {(['cash', 'card', 'mpesa', 'split'] as PaymentMethod[]).map(m => (
                <TabsTrigger
                  key={m}
                  value={m}
                  className="rounded-full capitalize data-[state=active]:bg-lime-300 data-[state=active]:text-black text-neutral-400 text-xs"
                >
                  {m === 'mpesa' ? 'M-Pesa' : m.charAt(0).toUpperCase() + m.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Cash */}
            <TabsContent value="cash" className="space-y-4">
              <div className="text-4xl font-light text-white tracking-tight">KES {total.toLocaleString()}</div>
              <div>
                <Label className="text-xs text-neutral-400 mb-1 block">Tendered Amount</Label>
                <input
                  type="number"
                  value={tendered}
                  onChange={e => setTendered(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-[20px] bg-neutral-800 border border-neutral-700 px-4 py-3 text-white text-center text-xl font-light outline-none"
                />
              </div>
              {change > 0 && (
                <div className="bg-lime-300 rounded-[20px] p-4">
                  <div className="text-xs text-black/60 font-medium">Change</div>
                  <div className="text-3xl font-light text-black">KES {change.toLocaleString()}</div>
                </div>
              )}
            </TabsContent>

            {/* Card */}
            <TabsContent value="card" className="space-y-4">
              <div className="text-4xl font-light text-white tracking-tight">KES {total.toLocaleString()}</div>
              <input
                type="text"
                placeholder="Last 4 digits"
                className="w-full rounded-[20px] bg-neutral-800 border border-neutral-700 px-4 py-3 text-white outline-none"
              />
              <div className="bg-neutral-800 rounded-[20px] p-4 text-white">
                <div className="text-xs text-neutral-400 mb-8">VISA</div>
                <div className="text-lg font-mono mb-4">•••• •••• •••• 4242</div>
                <div className="text-xs text-neutral-400">Tap card on reader to proceed</div>
              </div>
            </TabsContent>

            {/* M-Pesa */}
            <TabsContent value="mpesa" className="space-y-4">
              <div className="text-4xl font-light text-white tracking-tight">KES {total.toLocaleString()}</div>
              <input
                type="tel"
                placeholder="+254 712 123 456"
                className="w-full rounded-[20px] bg-neutral-800 border border-neutral-700 px-4 py-3 text-white outline-none"
              />
              <div className="bg-cyan-500/10 rounded-[20px] p-4 border border-cyan-500/30">
                <div className="flex items-center gap-2 text-cyan-400 text-sm">
                  <Smartphone size={15} />
                  STK push will be sent to number above
                </div>
              </div>
            </TabsContent>

            {/* Split */}
            <TabsContent value="split" className="space-y-4">
              <div className="text-4xl font-light text-white tracking-tight">KES {total.toLocaleString()}</div>
              <select className="w-full rounded-[20px] bg-neutral-800 border border-neutral-700 px-4 py-3 text-white outline-none">
                {[2, 3, 4].map(n => <option key={n}>{n} ways</option>)}
              </select>
              <div className="bg-neutral-800 rounded-[20px] p-4">
                <div className="text-xs text-neutral-400 mb-1">Per person</div>
                <div className="text-3xl font-light text-white">KES {Math.round(total / 2).toLocaleString()}</div>
              </div>
            </TabsContent>
          </Tabs>

          <button
            onClick={handleConfirmPayment}
            className="w-full rounded-full bg-lime-300 text-black font-semibold py-4 text-base hover:bg-lime-200 transition-all"
          >
            Confirm Payment · KES {total.toLocaleString()}
          </button>
        </DialogContent>
      </Dialog>

      {/* ── SHIFT DIALOG ─────────────────────────────────────────────────── */}
      <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
        <DialogContent className="bg-neutral-900 rounded-[32px] border-0 p-6 max-w-md">
          <h2 className="text-2xl font-semibold text-white mb-5">
            {shiftOpen ? 'Close Shift' : 'Open Shift'}
          </h2>
          {shiftOpen ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-neutral-400 mb-1">Expected</div>
                <div className="text-3xl font-light text-white">KES 45,200</div>
              </div>
              <div>
                <Label className="text-xs text-neutral-400 mb-1 block">Actual Count</Label>
                <input type="number" placeholder="0" className="w-full rounded-[20px] bg-neutral-800 border border-neutral-700 px-4 py-3 text-white outline-none" />
              </div>
              <div className="bg-rose-500/10 rounded-[20px] p-4 border border-rose-500/20">
                <div className="text-xs text-rose-400 mb-1">Variance</div>
                <div className="text-2xl font-light text-rose-400">-KES 1,200</div>
              </div>
              <Separator className="bg-neutral-800" />
              {[['Orders', '24'], ['Cash', 'KES 32,500'], ['Card', 'KES 14,200'], ['M-Pesa', 'KES 8,500']].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-neutral-400">{k}</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
              <button
                onClick={() => { setShiftOpen(false); setShiftDialogOpen(false); }}
                className="w-full rounded-full bg-lime-300 text-black font-semibold py-4 mt-2 hover:bg-lime-200"
              >
                Confirm Close Shift
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-neutral-400 mb-1 block">Opening Float</Label>
                <input type="number" defaultValue="5000" className="w-full rounded-[20px] bg-neutral-800 border border-neutral-700 px-4 py-3 text-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['1000 KES', '500 KES', '100 KES', '50 KES'].map(d => (
                  <input key={d} type="number" placeholder={d} defaultValue="0"
                    className="rounded-[16px] bg-neutral-800 border border-neutral-700 px-3 py-2 text-white text-sm outline-none" />
                ))}
              </div>
              <button
                onClick={() => { setShiftOpen(true); setShiftDialogOpen(false); }}
                className="w-full rounded-full bg-lime-300 text-black font-semibold py-4 mt-2 hover:bg-lime-200"
              >
                Open Shift
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
