'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Minus,
  Search,
  LogOut,
  LogIn,
  Phone,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';

// Types
type OrderMode = 'counter' | 'dine-in' | 'takeaway' | 'delivery' | 'qr' | 'split';
type PaymentMethod = 'cash' | 'card' | 'mpesa' | 'split';
type OrderStatus = 'occupied' | 'available' | 'reserved' | 'priority' | 'cleaning';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
  notes?: string;
}

interface Order {
  id: string;
  tableNumber?: string;
  orderNumber: string;
  items: OrderItem[];
  pax: number;
  mode: OrderMode;
  status: 'active' | 'completed';
  createdAt: Date;
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
  description?: string;
}

interface TableStatus {
  number: string;
  status: OrderStatus;
  occupancy?: number;
}

// Mock Data
const MENU_ITEMS: MenuItem[] = [
  // Mains
  { id: 'm1', name: 'Nyama Choma Plate', category: 'Mains', price: 1200, emoji: '🍖', tags: ['popular'] },
  { id: 'm2', name: 'Fish & Chips', category: 'Mains', price: 950, emoji: '🐟', tags: [] },
  { id: 'm3', name: 'Chicken Stew', category: 'Mains', price: 850, emoji: '🍗', tags: ['popular'] },
  { id: 'm4', name: 'Beef Ugali', category: 'Mains', price: 750, emoji: '🍲', tags: ['veg'] },

  // Grills
  { id: 'g1', name: 'T-Bone Steak', category: 'Grills', price: 2200, emoji: '🥩', tags: ['popular'] },
  { id: 'g2', name: 'Grilled Chicken', category: 'Grills', price: 1400, emoji: '🍗', tags: [] },
  { id: 'g3', name: 'Lamb Ribs', category: 'Grills', price: 1800, emoji: '🍖', tags: [] },
  { id: 'g4', name: 'Mixed Grill', category: 'Grills', price: 2800, emoji: '🔥', tags: ['popular', 'spicy'] },

  // Pasta
  { id: 'p1', name: 'Spaghetti Carbonara', category: 'Pasta', price: 850, emoji: '🍝', tags: [] },
  { id: 'p2', name: 'Penne Arrabbiata', category: 'Pasta', price: 780, emoji: '🍝', tags: ['spicy', 'veg'] },
  { id: 'p3', name: 'Fettuccine Alfredo', category: 'Pasta', price: 920, emoji: '🍝', tags: ['veg'] },
  { id: 'p4', name: 'Lasagna', category: 'Pasta', price: 1050, emoji: '🧀', tags: [] },

  // Sides
  { id: 's1', name: 'French Fries', category: 'Sides', price: 350, emoji: '🍟', tags: ['veg', 'popular'] },
  { id: 's2', name: 'Coleslaw', category: 'Sides', price: 250, emoji: '🥗', tags: ['veg'] },
  { id: 's3', name: 'Grilled Vegetables', category: 'Sides', price: 450, emoji: '🥦', tags: ['veg'] },
  { id: 's4', name: 'Chapati', category: 'Sides', price: 150, emoji: '🥖', tags: ['veg', 'popular'] },

  // Desserts
  { id: 'd1', name: 'Chocolate Cake', category: 'Desserts', price: 350, emoji: '🍰', tags: [] },
  { id: 'd2', name: 'Fruit Salad', category: 'Desserts', price: 400, emoji: '🍓', tags: ['veg'] },
  { id: 'd3', name: 'Ice Cream', category: 'Desserts', price: 300, emoji: '🍦', tags: ['veg'] },
  { id: 'd4', name: 'Tiramisu', category: 'Desserts', price: 450, emoji: '🎂', tags: ['veg'] },

  // Drinks
  { id: 'dr1', name: 'Sodas', category: 'Drinks', price: 150, emoji: '🥤', tags: ['veg'] },
  { id: 'dr2', name: 'Fresh Juice', category: 'Drinks', price: 250, emoji: '🧃', tags: ['veg', 'popular'] },
  { id: 'dr3', name: 'Coffee', category: 'Drinks', price: 200, emoji: '☕', tags: ['veg'] },
  { id: 'dr4', name: 'Beer', category: 'Drinks', price: 350, emoji: '🍺', tags: [] },
];

const CATEGORIES = ['All', 'Mains', 'Grills', 'Pasta', 'Sides', 'Desserts', 'Drinks', 'Specials'];

const TABLE_STATUSES: TableStatus[] = Array.from({ length: 15 }, (_, i) => ({
  number: `T${String(i + 1).padStart(2, '0')}`,
  status: i === 3 ? 'occupied' : i === 7 ? 'reserved' : i === 11 ? 'priority' : i === 13 ? 'cleaning' : 'available',
  occupancy: i === 3 ? 4 : i === 7 ? 2 : undefined,
}));

export default function RestaurantPOS() {
  // State
  const [mode, setMode] = useState<OrderMode>('counter');
  const [activeTable, setActiveTable] = useState<string | null>('T01');
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      tableNumber: mode === 'dine-in' ? 'T01' : undefined,
      orderNumber: '#1001',
      items: [],
      pax: 2,
      mode,
      status: 'active',
      createdAt: new Date(),
      discount: 0,
      specialInstructions: '',
    },
  ]);
  const [currentOrderIdx, setCurrentOrderIdx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(true);
  const [tendered, setTendered] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const categoryMatch =
        selectedCategory === 'All' || item.category === selectedCategory;
      const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [selectedCategory, searchQuery]);

  // Current order
  const currentOrder = orders[currentOrderIdx] || orders[0];

  // Calculations
  const subtotal = useMemo(() => {
    return currentOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [currentOrder.items]);

  const taxAmount = useMemo(() => {
    return Math.round(subtotal * 0.16 * 100) / 100;
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal - currentOrder.discount + taxAmount;
  }, [subtotal, currentOrder.discount, taxAmount]);

  const change = useMemo(() => {
    const tender = parseFloat(tendered) || 0;
    return Math.max(0, tender - total);
  }, [tendered, total]);

  // Handlers
  const handleAddItem = useCallback(
    (item: MenuItem) => {
      setOrders((prev) => {
        const updated = [...prev];
        const existingItem = updated[currentOrderIdx].items.find(
          (i) => i.id === item.id
        );

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          updated[currentOrderIdx].items.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
          });
        }
        return updated;
      });
    },
    [currentOrderIdx]
  );

  const handleUpdateQuantity = useCallback(
    (itemId: string, delta: number) => {
      setOrders((prev) => {
        const updated = [...prev];
        const itemIdx = updated[currentOrderIdx].items.findIndex(
          (i) => i.id === itemId
        );

        if (itemIdx !== -1) {
          const newQty = updated[currentOrderIdx].items[itemIdx].quantity + delta;
          if (newQty <= 0) {
            updated[currentOrderIdx].items.splice(itemIdx, 1);
          } else {
            updated[currentOrderIdx].items[itemIdx].quantity = newQty;
          }
        }
        return updated;
      });
    },
    [currentOrderIdx]
  );

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      setOrders((prev) => {
        const updated = [...prev];
        updated[currentOrderIdx].items = updated[currentOrderIdx].items.filter(
          (i) => i.id !== itemId
        );
        return updated;
      });
    },
    [currentOrderIdx]
  );

  const handleApplyDiscount = useCallback(() => {
    const discountPercent = parseFloat(
      window.prompt('Enter discount percentage (0-100):') || '0'
    );
    if (discountPercent >= 0 && discountPercent <= 100) {
      setOrders((prev) => {
        const updated = [...prev];
        updated[currentOrderIdx].discount = Math.round(
          subtotal * (discountPercent / 100) * 100
        ) / 100;
        return updated;
      });
    }
  }, [subtotal, currentOrderIdx]);

  const handleConfirmPayment = useCallback(() => {
    // Mock payment confirmation
    alert(
      `Payment of KES ${total.toLocaleString()} processed via ${selectedPaymentMethod.toUpperCase()}`
    );
    setPaymentDialogOpen(false);
    setTendered('');

    // Create new order
    const newOrder: Order = {
      id: String(orders.length + 1),
      tableNumber:
        mode === 'dine-in' ? activeTable : undefined,
      orderNumber: `#${1001 + orders.length}`,
      items: [],
      pax: 2,
      mode,
      status: 'active',
      createdAt: new Date(),
      discount: 0,
      specialInstructions: '',
    };
    setOrders((prev) => [...prev, newOrder]);
    setCurrentOrderIdx(orders.length);
  }, [selectedPaymentMethod, total, mode, activeTable, orders.length]);

  const handleModeChange = useCallback((newMode: OrderMode) => {
    setMode(newMode);
    setOrders((prev) => [
      {
        id: '1',
        tableNumber: newMode === 'dine-in' ? activeTable : undefined,
        orderNumber: '#1001',
        items: [],
        pax: 2,
        mode: newMode,
        status: 'active',
        createdAt: new Date(),
        discount: 0,
        specialInstructions: '',
      },
    ]);
    setCurrentOrderIdx(0);
  }, [activeTable]);

  const handleTableSelect = useCallback(
    (tableNum: string) => {
      setActiveTable(tableNum);
      if (mode === 'dine-in') {
        const newOrder: Order = {
          id: String(orders.length + 1),
          tableNumber: tableNum,
          orderNumber: `#${1001 + orders.length}`,
          items: [],
          pax: 2,
          mode,
          status: 'active',
          createdAt: new Date(),
          discount: 0,
          specialInstructions: '',
        };
        setOrders((prev) => [...prev, newOrder]);
        setCurrentOrderIdx(orders.length);
      }
    },
    [mode, orders.length]
  );

  const getTableStatusColor = (status: OrderStatus): string => {
    const colors: Record<OrderStatus, string> = {
      occupied: 'bg-rose-500/20 text-rose-400',
      available: 'bg-cyan-500/20 text-cyan-400',
      reserved: 'bg-violet-500/20 text-violet-400',
      priority: 'bg-lime-300 text-black',
      cleaning: 'bg-amber-500/20 text-amber-400',
    };
    return colors[status];
  };

  // Stat mini cards
  const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-neutral-800 rounded-[24px] p-3 text-center">
      <div className="text-xs text-neutral-400 font-medium">{label}</div>
      <div className="text-xl font-light text-white mt-1">{value}</div>
    </div>
  );

  // Mode pill
  const ModePill = ({ label, value }: { label: string; value: OrderMode }) => (
    <button
      onClick={() => handleModeChange(value)}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        mode === value
          ? 'bg-lime-300 text-black'
          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="bg-neutral-900 rounded-[32px] p-4">
        <div className="grid lg:grid-cols-[320px_1fr_280px] gap-4 h-[calc(100vh-140px)]">
          {/* LEFT SIDEBAR */}
          <div className="bg-black rounded-[28px] p-4 text-white flex flex-col overflow-hidden">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-lime-300 rounded-2xl flex items-center justify-center text-black font-bold text-sm">
                ✳
              </div>
              <span className="text-sm font-semibold text-white">Pinkplan POS</span>
            </div>

            {/* Mode Selector */}
            <div className="space-y-2 mb-6">
              <div className="text-xs font-semibold text-neutral-400 px-1">MODE</div>
              <div className="grid grid-cols-2 gap-2">
                <ModePill label="Counter" value="counter" />
                <ModePill label="Dine-In" value="dine-in" />
                <ModePill label="Takeaway" value="takeaway" />
                <ModePill label="Delivery" value="delivery" />
                <ModePill label="QR" value="qr" />
                <ModePill label="Split" value="split" />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <StatCard label="Tables" value={TABLE_STATUSES.length} />
              <StatCard label="Orders" value={orders.length} />
              <StatCard label="Queue" value={currentOrder.items.length} />
              <StatCard label="Staff" value={4} />
            </div>

            {/* Table List */}
            {mode === 'dine-in' && (
              <div className="mb-6">
                <div className="text-xs font-semibold text-neutral-400 px-1 mb-2">
                  TABLES
                </div>
                <ScrollArea className="h-64">
                  <div className="grid grid-cols-3 gap-2 pr-3">
                    {TABLE_STATUSES.map((table) => (
                      <button
                        key={table.number}
                        onClick={() => handleTableSelect(table.number)}
                        className={`rounded-[16px] py-2 px-1 text-xs font-medium transition-all ${
                          activeTable === table.number
                            ? `${getTableStatusColor(table.status)} border-2 border-lime-300`
                            : getTableStatusColor(table.status)
                        }`}
                      >
                        {table.number}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Shift Control */}
            <div className="mt-auto pt-4 border-t border-neutral-800">
              <button
                onClick={() => setShiftDialogOpen(true)}
                className={`w-full rounded-full py-3 font-semibold text-sm transition-all ${
                  shiftOpen
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-lime-300 text-black'
                }`}
              >
                {shiftOpen ? (
                  <span className="flex items-center justify-center gap-2">
                    <LogOut size={16} /> Close Shift
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn size={16} /> Open Shift
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* CENTER PANEL - MENU */}
          <div className="flex flex-col bg-neutral-900 rounded-[28px] p-4 gap-4 overflow-hidden">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500" size={18} />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-neutral-800 bg-neutral-800 px-4 py-3 pl-12 text-white placeholder:text-neutral-500"
              />
            </div>

            {/* Category Tabs */}
            <ScrollArea className="w-full">
              <div className="flex gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-lime-300 text-black'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Menu Grid */}
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-3 gap-4 pr-4">
                {filteredMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    className="bg-neutral-800 rounded-[24px] p-4 text-left hover:ring-2 hover:ring-lime-300 transition-all hover:scale-105"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 bg-lime-300 rounded-full flex items-center justify-center text-lg">
                        {item.emoji}
                      </div>
                    </div>
                    <h3 className="font-medium text-white text-sm mb-2 line-clamp-2">
                      {item.name}
                    </h3>
                    <div className="flex gap-1 flex-wrap mb-3 min-h-6">
                      {item.tags.map((tag) => {
                        const tagEmoji: Record<string, string> = {
                          spicy: '🌶️',
                          veg: '🌿',
                          popular: '⭐',
                        };
                        return (
                          <span
                            key={tag}
                            className="text-xs bg-neutral-700 rounded-full px-2 py-1 text-neutral-300"
                          >
                            {tagEmoji[tag]}
                          </span>
                        );
                      })}
                    </div>
                    <div className="text-lg font-light text-white">
                      KES {item.price}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT PANEL - ORDER TICKET */}
          <div className="bg-neutral-900 rounded-[28px] p-4 flex flex-col">
            {/* Header */}
            <div className="mb-4">
              <div className="text-xs text-neutral-500 font-medium mb-1">
                {mode === 'dine-in' ? `TABLE ${activeTable}` : 'COUNTER ORDER'}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-medium text-white">
                  {currentOrder.orderNumber}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-neutral-400">PAX:</span>
                  <input
                    type="number"
                    min="1"
                    value={currentOrder.pax}
                    onChange={(e) => {
                      setOrders((prev) => {
                        const updated = [...prev];
                        updated[currentOrderIdx].pax = parseInt(e.target.value) || 1;
                        return updated;
                      });
                    }}
                    className="w-10 text-center border border-neutral-800 rounded-full bg-neutral-800 text-sm text-white"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-2 bg-neutral-800" />

            {/* Items */}
            <ScrollArea className="flex-1 -mx-4 px-4 mb-4">
              {currentOrder.items.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-neutral-500 text-sm">
                  No items added
                </div>
              ) : (
                <div className="space-y-2">
                  {currentOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-neutral-800 rounded-[24px] p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {item.name}
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-xs text-neutral-500 mt-1">
                            {item.modifiers.join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-neutral-700 rounded-full p-1">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-full bg-neutral-600 flex items-center justify-center hover:bg-neutral-500"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-xs font-medium text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-full bg-neutral-600 flex items-center justify-center hover:bg-neutral-500"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/30"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-2 bg-neutral-800" />

            {/* Pricing */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Subtotal</span>
                <span className="font-medium text-white">
                  KES {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <button
                  onClick={handleApplyDiscount}
                  className="text-lime-300 hover:text-lime-200 font-medium"
                >
                  Discount
                </button>
                <span className="font-medium text-white">
                  {currentOrder.discount > 0 ? `-KES ${currentOrder.discount.toLocaleString()}` : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Tax (16% VAT)</span>
                <span className="font-medium text-white">
                  KES {taxAmount.toLocaleString()}
                </span>
              </div>
              <Separator className="my-2 bg-neutral-800" />
              <div className="flex justify-between">
                <span className="font-semibold text-white">Total</span>
                <span className="font-light text-3xl text-white tracking-tight">
                  KES {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Special Instructions */}
            <textarea
              placeholder="Special instructions..."
              value={currentOrder.specialInstructions}
              onChange={(e) => {
                setOrders((prev) => {
                  const updated = [...prev];
                  updated[currentOrderIdx].specialInstructions = e.target.value;
                  return updated;
                });
              }}
              className="w-full rounded-[20px] bg-neutral-800 border border-neutral-700 p-3 text-xs text-white placeholder:text-neutral-500 mb-3 resize-none h-16"
            />

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={currentOrder.items.length === 0}
                className="w-full rounded-full bg-lime-300 text-black font-semibold py-4 text-lg hover:bg-lime-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Charge KES {total.toLocaleString()}
              </button>
              <div className="grid grid-cols-3 gap-2">
                <button className="rounded-full bg-neutral-800 text-white py-2 font-medium text-sm hover:bg-neutral-700">
                  Split
                </button>
                <button className="rounded-full bg-neutral-800 text-white py-2 font-medium text-sm hover:bg-neutral-700">
                  Comp
                </button>
                <button className="rounded-full bg-neutral-800 text-white py-2 font-medium text-sm hover:bg-neutral-700">
                  Void
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT DIALOG */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-neutral-900 rounded-[32px] border-0 p-6 max-w-md">
          <h2 className="text-2xl font-semibold text-white mb-6">Payment</h2>

          {/* Payment Method Tabs */}
          <Tabs
            value={selectedPaymentMethod}
            onValueChange={(val) => setSelectedPaymentMethod(val as PaymentMethod)}
            className="mb-6"
          >
            <TabsList className="grid grid-cols-4 bg-neutral-800 rounded-full p-1">
              <TabsTrigger
                value="cash"
                className="rounded-full data-[state=active]:bg-lime-300 data-[state=active]:text-black text-neutral-400"
              >
                Cash
              </TabsTrigger>
              <TabsTrigger
                value="card"
                className="rounded-full data-[state=active]:bg-lime-300 data-[state=active]:text-black text-neutral-400"
              >
                Card
              </TabsTrigger>
              <TabsTrigger
                value="mpesa"
                className="rounded-full data-[state=active]:bg-lime-300 data-[state=active]:text-black text-neutral-400"
              >
                M-Pesa
              </TabsTrigger>
              <TabsTrigger
                value="split"
                className="rounded-full data-[state=active]:bg-lime-300 data-[state=active]:text-black text-neutral-400"
              >
                Split
              </TabsTrigger>
            </TabsList>

            {/* Cash Method */}
            <TabsContent value="cash" className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-white">Amount</Label>
                <div className="text-4xl font-light text-white tracking-tight mb-4">
                  KES {total.toLocaleString()}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-white mb-2 block">
                  Tendered
                </Label>
                <input
                  type="number"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-[24px] border border-neutral-800 bg-neutral-800 px-4 py-3 text-white text-center text-xl font-light"
                />
              </div>
              {change > 0 && (
                <div className="bg-lime-300 rounded-[24px] p-4">
                  <div className="text-xs text-black/70 font-medium mb-1">Change</div>
                  <div className="text-3xl font-light text-black tracking-tight">
                    KES {change.toLocaleString()}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Card Method */}
            <TabsContent value="card" className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-white">Card Last 4</Label>
                <input
                  type="text"
                  placeholder="•••• •••• •••• 4242"
                  className="w-full rounded-[24px] border border-neutral-800 bg-neutral-800 px-4 py-3 text-white"
                />
              </div>
              <div className="bg-gradient-to-br from-neutral-800 to-neutral-700 rounded-[24px] p-6 text-white">
                <div className="text-xs font-medium opacity-70 mb-12">VISA</div>
                <div className="text-xl font-mono mb-6">•••• •••• •••• 4242</div>
                <div className="flex justify-between">
                  <div>
                    <div className="text-xs opacity-70">Cardholder</div>
                    <div className="font-medium">Your Name</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-70">Expires</div>
                    <div className="font-medium">12/26</div>
                  </div>
                </div>
              </div>
              <div className="text-center text-neutral-400 text-sm">
                Amount: KES {total.toLocaleString()}
              </div>
            </TabsContent>

            {/* M-Pesa Method */}
            <TabsContent value="mpesa" className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-white">Phone Number</Label>
                <input
                  type="tel"
                  placeholder="+254 712 123 456"
                  className="w-full rounded-[24px] border border-neutral-800 bg-neutral-800 px-4 py-3 text-white"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-white">M-Pesa Reference</Label>
                <input
                  type="text"
                  placeholder="Transaction reference"
                  className="w-full rounded-[24px] border border-neutral-800 bg-neutral-800 px-4 py-3 text-white"
                />
              </div>
              <div className="bg-cyan-500/20 rounded-[24px] p-4 border border-cyan-500/40">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Smartphone size={16} />
                  <span className="text-sm font-medium">
                    Amount: KES {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* Split Payment */}
            <TabsContent value="split" className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-white">Split between</Label>
                <select className="w-full rounded-[24px] border border-neutral-800 bg-neutral-800 px-4 py-3 text-white">
                  <option>2 ways</option>
                  <option>3 ways</option>
                  <option>4 ways</option>
                </select>
              </div>
              <div className="bg-neutral-800 rounded-[24px] p-4">
                <div className="text-sm font-medium text-white mb-3">Per Person</div>
                <div className="text-3xl font-light text-white tracking-tight">
                  KES {Math.round(total / 2).toLocaleString()}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmPayment}
            className="w-full rounded-full bg-lime-300 text-black font-semibold py-4 text-lg hover:bg-lime-200 transition-all"
          >
            Confirm Payment
          </button>
        </DialogContent>
      </Dialog>

      {/* SHIFT DIALOG */}
      <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
        <DialogContent className="bg-neutral-900 rounded-[32px] border-0 p-6 max-w-md">
          <h2 className="text-2xl font-semibold text-white mb-6">
            {shiftOpen ? 'Close Shift' : 'Open Shift'}
          </h2>

          {shiftOpen ? (
            // Close Shift Form
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-white mb-2 block">
                  Expected Amount
                </Label>
                <div className="text-3xl font-light text-white tracking-tight">
                  KES 45,200
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-white mb-2 block">
                  Actual Amount
                </Label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full rounded-[24px] border border-neutral-800 bg-neutral-800 px-4 py-3 text-white"
                />
              </div>

              <div className="bg-rose-500/20 rounded-[24px] p-4 border border-rose-500/40">
                <div className="text-xs text-rose-400 font-medium mb-1">Variance</div>
                <div className="text-2xl font-light text-rose-400">-KES 1,200</div>
              </div>

              <Separator className="bg-neutral-800" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Orders</span>
                  <span className="font-medium text-white">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Cash Revenue</span>
                  <span className="font-medium text-white">KES 32,500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Card Revenue</span>
                  <span className="font-medium text-white">KES 14,200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">M-Pesa Revenue</span>
                  <span className="font-medium text-white">KES 8,500</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShiftOpen(false);
                  setShiftDialogOpen(false);
                }}
                className="w-full rounded-full bg-lime-300 text-black font-semibold py-4 text-lg hover:bg-lime-200 transition-all mt-6"
              >
                Close Shift
              </button>
            </div>
          ) : (
            // Open Shift Form
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-white mb-2 block">
                  Float Amount
                </Label>
                <input
                  type="number"
                  placeholder="0"
                  defaultValue="5000"
                  className="w-full rounded-[24px] border border-neutral-800 bg-neutral-800 px-4 py-3 text-white"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-white mb-3 block">
                  Denominations
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '1000 KES', value: '0' },
                    { label: '500 KES', value: '0' },
                    { label: '100 KES', value: '0' },
                    { label: '50 KES', value: '0' },
                  ].map((denom) => (
                    <input
                      key={denom.label}
                      type="number"
                      placeholder={denom.label}
                      defaultValue={denom.value}
                      className="rounded-[20px] border border-neutral-800 bg-neutral-800 px-3 py-2 text-white text-sm"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setShiftOpen(true);
                  setShiftDialogOpen(false);
                }}
                className="w-full rounded-full bg-lime-300 text-black font-semibold py-4 text-lg hover:bg-lime-200 transition-all mt-6"
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
