'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Star,
  Tag,
  Gift,
  CreditCard,
  Banknote,
  ChevronDown,
  X,
  Zap,
} from 'lucide-react';

type Category = 'All' | 'Skincare' | 'Foundation' | 'Lips' | 'Eyes' | 'Fragrance' | 'Hair';
type SkinFilter = 'All' | 'Dry' | 'Oily' | 'Combination' | 'Sensitive';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: Category;
  shades?: { name: string; hex: string }[];
  skinType?: SkinFilter[];
  stock: number;
  loyalty: number;
}

interface CartItem {
  product: Product;
  qty: number;
  shade?: { name: string; hex: string };
}

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Velvet Matte Lipstick', brand: 'LuxéColor', price: 22, category: 'Lips', shades: [{ name: 'Ruby Red', hex: '#9B1B30' }, { name: 'Dusty Rose', hex: '#C87E82' }, { name: 'Nude Beige', hex: '#C9A882' }, { name: 'Coral Kiss', hex: '#E2726E' }], stock: 42, loyalty: 22 },
  { id: 'p2', name: 'Hydra-Boost Serum', brand: 'DermLab', price: 78, category: 'Skincare', skinType: ['Dry', 'Combination'], stock: 18, loyalty: 78 },
  { id: 'p3', name: 'Mineral Foundation SPF30', brand: 'PureSkin', price: 68, category: 'Foundation', shades: [{ name: 'Porcelain', hex: '#F5E6D0' }, { name: 'Ivory', hex: '#EDD5B0' }, { name: 'Sand', hex: '#D4A87A' }, { name: 'Caramel', hex: '#B07850' }, { name: 'Espresso', hex: '#6B3E26' }], skinType: ['Oily', 'Combination'], stock: 28, loyalty: 68 },
  { id: 'p4', name: 'Rose Gold Highlighter', brand: 'GlowStudio', price: 44, category: 'Eyes', shades: [{ name: 'Rose Gold', hex: '#B76E79' }, { name: 'Champagne', hex: '#D4AF80' }], stock: 24, loyalty: 44 },
  { id: 'p5', name: 'Collagen Eye Cream', brand: 'DermLab', price: 52, category: 'Skincare', skinType: ['Dry', 'Sensitive'], stock: 11, loyalty: 52 },
  { id: 'p6', name: 'Vitamin C Brightening Toner', brand: 'PureSkin', price: 38, category: 'Skincare', skinType: ['All', 'Oily'], stock: 4, loyalty: 38 },
  { id: 'p7', name: 'Waterproof Mascara', brand: 'LuxéColor', price: 28, category: 'Eyes', stock: 32, loyalty: 28 },
  { id: 'p8', name: 'Midnight Bloom EDP 50ml', brand: 'AuraScent', price: 120, category: 'Fragrance', stock: 8, loyalty: 120 },
  { id: 'p9', name: 'Argan Oil Hair Serum', brand: 'SilkRoots', price: 36, category: 'Hair', skinType: ['Dry'], stock: 2, loyalty: 36 },
  { id: 'p10', name: 'Matte Liquid Eyeliner', brand: 'LuxéColor', price: 18, category: 'Eyes', shades: [{ name: 'Jet Black', hex: '#111111' }, { name: 'Brown', hex: '#5C3D2E' }], stock: 40, loyalty: 18 },
  { id: 'p11', name: 'Plumping Lip Gloss', brand: 'GlowStudio', price: 26, category: 'Lips', shades: [{ name: 'Clear', hex: '#F9E4E4' }, { name: 'Berry', hex: '#8E3A59' }, { name: 'Peach', hex: '#FFBE8A' }], stock: 20, loyalty: 26 },
  { id: 'p12', name: 'SPF 50 Sunscreen Fluid', brand: 'PureSkin', price: 42, category: 'Skincare', skinType: ['Oily', 'Sensitive'], stock: 7, loyalty: 42 },
];

const CATEGORIES: Category[] = ['All', 'Skincare', 'Foundation', 'Lips', 'Eyes', 'Fragrance', 'Hair'];
const SKIN_FILTERS: SkinFilter[] = ['All', 'Dry', 'Oily', 'Combination', 'Sensitive'];

const LOYALTY_CUSTOMER = { name: 'Sarah K.', tier: 'Gold', points: 2840, email: 'sarah.k@example.com' };

export default function CosmeticsPOS() {
  const [category, setCategory] = useState<Category>('All');
  const [skinFilter, setSkinFilter] = useState<SkinFilter>('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedShade, setSelectedShade] = useState<{ name: string; hex: string } | null>(null);
  const [loyaltyAttached, setLoyaltyAttached] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [payMethod, setPayMethod] = useState<'card' | 'cash'>('card');

  const filtered = PRODUCTS.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    const matchSkin = skinFilter === 'All' || (p.skinType && (p.skinType.includes(skinFilter) || p.skinType.includes('All')));
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSkin && matchSearch;
  });

  const addToCart = (product: Product, shade?: { name: string; hex: string }) => {
    setCart(prev => {
      const key = `${product.id}-${shade?.name ?? ''}`;
      const existing = prev.find(c => `${c.product.id}-${c.shade?.name ?? ''}` === key);
      if (existing) return prev.map(c => c === existing ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1, shade }];
    });
    setSelectedProduct(null);
    setSelectedShade(null);
  };

  const updateQty = (index: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      next[index] = { ...next[index], qty: Math.max(0, next[index].qty + delta) };
      return next.filter(c => c.qty > 0);
    });
  };

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.qty, 0);
  const pointsDiscount = usePoints && loyaltyAttached ? Math.min(20, subtotal * 0.1) : 0;
  const promoDiscount = promoApplied ? subtotal * 0.15 : 0;
  const total = subtotal - pointsDiscount - promoDiscount;
  const earnedPoints = Math.floor(total);
  const giftWrapEligible = subtotal >= 80;

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">

      {/* TOP BAR */}
      <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-pink-400" />
          </div>
          <span className="text-sm font-bold text-white">Beauty POS</span>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 mx-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                category === cat ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Skin filter */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-neutral-500">Skin:</span>
          <div className="flex items-center gap-0.5">
            {SKIN_FILTERS.map(s => (
              <button key={s} onClick={() => setSkinFilter(s)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  skinFilter === s ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-neutral-500 hover:text-neutral-300'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: MENU PANEL */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="px-4 py-2 border-b border-neutral-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products or brands…"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-pink-500/40"
              />
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(product => (
                <button key={product.id} onClick={() => {
                  if (product.shades && product.shades.length > 0) {
                    setSelectedProduct(product);
                    setSelectedShade(null);
                  } else {
                    addToCart(product);
                  }
                }}
                  className={`bg-neutral-900 border rounded-2xl p-3 text-left transition-all hover:border-pink-500/40 hover:bg-neutral-800/80 ${
                    product.stock <= 5 ? 'border-rose-500/20' : 'border-neutral-800'
                  }`}>
                  {/* Shade preview row */}
                  {product.shades && (
                    <div className="flex gap-1 mb-2">
                      {product.shades.slice(0, 5).map(sh => (
                        <div key={sh.name} className="w-4 h-4 rounded-full border border-neutral-700 flex-shrink-0"
                          style={{ backgroundColor: sh.hex }} title={sh.name} />
                      ))}
                      {product.shades.length > 5 && <span className="text-[9px] text-neutral-500 self-center">+{product.shades.length - 5}</span>}
                    </div>
                  )}

                  <div className="text-xs font-semibold text-white leading-tight mb-0.5 line-clamp-2">{product.name}</div>
                  <div className="text-[10px] text-neutral-500 mb-2">{product.brand}</div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">${product.price}</span>
                    {product.stock <= 5 && (
                      <span className="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-1.5 py-0.5">
                        Low: {product.stock}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-pink-400/70 mt-1">+{product.loyalty} pts</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: ORDER COUNTER */}
        <div className="w-[320px] xl:w-[360px] flex flex-col bg-neutral-900 border-l border-neutral-800">

          {/* Loyalty customer */}
          <div className="px-4 py-3 border-b border-neutral-800">
            {loyaltyAttached ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">
                    {LOYALTY_CUSTOMER.name[0]}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{LOYALTY_CUSTOMER.name}</div>
                    <div className="text-[10px] text-purple-400 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-purple-400" /> {LOYALTY_CUSTOMER.tier} · {LOYALTY_CUSTOMER.points.toLocaleString()} pts
                    </div>
                  </div>
                </div>
                <button onClick={() => { setLoyaltyAttached(false); setUsePoints(false); }}
                  className="text-neutral-500 hover:text-neutral-300"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => setLoyaltyAttached(true)}
                className="w-full flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors">
                <Star className="w-3.5 h-3.5 text-purple-400" />
                <span>Attach loyalty member…</span>
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-8 h-8 text-neutral-700 mb-2" />
                <div className="text-xs text-neutral-600">Tap a product to add to cart</div>
              </div>
            ) : (
              cart.map((item, i) => (
                <div key={i} className="bg-neutral-800 rounded-xl p-2.5">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white line-clamp-1">{item.product.name}</div>
                      {item.shade && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="w-3 h-3 rounded-full border border-neutral-600" style={{ backgroundColor: item.shade.hex }} />
                          <span className="text-[10px] text-neutral-400">{item.shade.name}</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => updateQty(i, -item.qty)} className="text-neutral-600 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(i, -1)} className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600">
                        <Minus className="w-3 h-3 text-white" />
                      </button>
                      <span className="text-xs font-bold text-white w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(i, 1)} className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600">
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-white">${(item.product.price * item.qty).toFixed(0)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order summary & checkout */}
          <div className="border-t border-neutral-800 px-4 py-3 space-y-2.5">
            {/* Promo code */}
            <div className="flex gap-1.5">
              <input
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
                placeholder="Promo code…"
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-pink-500/40"
              />
              <button onClick={() => promoCode.length > 0 && setPromoApplied(!promoApplied)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${promoApplied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>
                {promoApplied ? '✓ Applied' : 'Apply'}
              </button>
            </div>

            {/* Loyalty points toggle */}
            {loyaltyAttached && (
              <button onClick={() => setUsePoints(v => !v)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                  usePoints ? 'bg-purple-500/10 border-purple-500/25 text-purple-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}>
                <span className="text-xs font-medium flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Redeem points (-${pointsDiscount.toFixed(0)})
                </span>
                <div className={`w-8 h-4 rounded-full transition-all ${usePoints ? 'bg-purple-500' : 'bg-neutral-700'} relative`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${usePoints ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </button>
            )}

            {/* Gift wrap */}
            {giftWrapEligible && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/5 border border-pink-500/15 rounded-xl">
                <Gift className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[10px] text-pink-400 font-medium">Free gift wrap eligible on this order</span>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Promo (15%)</span><span>-${promoDiscount.toFixed(2)}</span>
                </div>
              )}
              {usePoints && (
                <div className="flex justify-between text-xs text-purple-400">
                  <span>Points redemption</span><span>-${pointsDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white border-t border-neutral-700 pt-1.5 mt-1.5">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
              {loyaltyAttached && cart.length > 0 && (
                <div className="text-[10px] text-purple-400 text-right">+{earnedPoints} points earned</div>
              )}
            </div>

            {/* Payment method */}
            <div className="flex gap-1.5">
              <button onClick={() => setPayMethod('card')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all ${payMethod === 'card' ? 'bg-pink-500/15 border-pink-500/30 text-pink-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}>
                <CreditCard className="w-3.5 h-3.5" /> Card
              </button>
              <button onClick={() => setPayMethod('cash')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all ${payMethod === 'cash' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}>
                <Banknote className="w-3.5 h-3.5" /> Cash
              </button>
            </div>

            {/* Charge button */}
            <button
              disabled={cart.length === 0}
              onClick={() => setPaymentStep(true)}
              className="w-full bg-pink-500 hover:bg-pink-400 disabled:opacity-40 text-black font-bold py-3 rounded-2xl text-sm transition-all">
              Charge ${total.toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM ORDER PREVIEW BAR */}
      {cart.length > 0 && (
        <div className="bg-neutral-900 border-t border-neutral-800 px-4 py-2.5 flex items-center gap-3">
          <ShoppingBag className="w-4 h-4 text-pink-400 flex-shrink-0" />
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1">
            {cart.map((item, i) => (
              <div key={i} className="flex items-center gap-1 bg-neutral-800 rounded-full px-2.5 py-1 flex-shrink-0">
                {item.shade && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.shade.hex }} />}
                <span className="text-[10px] text-white">{item.product.name.split(' ').slice(0, 2).join(' ')}</span>
                <span className="text-[10px] text-neutral-500">×{item.qty}</span>
              </div>
            ))}
          </div>
          <div className="text-sm font-bold text-white flex-shrink-0">${total.toFixed(2)}</div>
        </div>
      )}

      {/* SHADE PICKER MODAL */}
      {selectedProduct && selectedProduct.shades && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-white">{selectedProduct.name}</div>
                <div className="text-xs text-neutral-500">{selectedProduct.brand} · ${selectedProduct.price}</div>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-400 mb-3">Select a shade:</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {selectedProduct.shades.map(sh => (
                <button key={sh.name} onClick={() => setSelectedShade(sh)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
                    selectedShade?.name === sh.name ? 'border-pink-500/50 bg-pink-500/10' : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                  }`}>
                  <div className="w-6 h-6 rounded-full border border-neutral-600 flex-shrink-0" style={{ backgroundColor: sh.hex }} />
                  <span className="text-xs text-white font-medium">{sh.name}</span>
                </button>
              ))}
            </div>
            <button
              disabled={!selectedShade}
              onClick={() => addToCart(selectedProduct, selectedShade ?? undefined)}
              className="w-full bg-pink-500 hover:bg-pink-400 disabled:opacity-40 text-black font-bold py-3 rounded-2xl text-sm transition-all">
              Add to Cart{selectedShade ? ` — ${selectedShade.name}` : ''}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
