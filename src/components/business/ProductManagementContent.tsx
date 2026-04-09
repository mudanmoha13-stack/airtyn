"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, ChevronDown, ChevronRight, Layers, Package, Ruler, Tag, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductLifecycle = 'draft' | 'active' | 'discontinued' | 'seasonal' | 'archived';
type ProductType = 'physical' | 'digital' | 'service' | 'bundle';

type Product = {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  skuPrefix?: string | null;
  category?: string | null;
  categoryId?: string | null;
  baseUomId?: string | null;
  lifecycle: ProductLifecycle;
  productType: ProductType;
  basePrice?: string | number | null;
  tags?: string[] | null;
  productCategory?: { id: string; name: string; code?: string | null } | null;
  baseUom?: { id: string; name: string; symbol: string } | null;
  variants?: ProductVariant[];
};

type ProductVariant = {
  id: string;
  sku: string;
  attributeValues: Record<string, string>;
  additionalPrice?: string | number | null;
  lifecycle: ProductLifecycle;
  product?: { id: string; name: string; sku?: string | null };
};

type Category = {
  id: string;
  name: string;
  code?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  children?: { id: string; name: string; code?: string | null }[];
  _count?: { products: number };
};

type UoM = {
  id: string;
  name: string;
  symbol: string;
  category?: string | null;
};

type UoMConversion = {
  id: string;
  fromUomId: string;
  toUomId: string;
  factor: string | number;
  fromUom?: { id: string; name: string; symbol: string };
  toUom?: { id: string; name: string; symbol: string };
};

type Bundle = {
  id: string;
  name: string;
  description?: string | null;
  product: { id: string; name: string; sku?: string | null; lifecycle: ProductLifecycle };
  items: {
    id: string;
    quantity: string | number;
    notes?: string | null;
    componentProduct: { id: string; name: string; sku?: string | null; productType: ProductType };
  }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LIFECYCLE_COLORS: Record<ProductLifecycle, string> = {
  draft:        'border-slate-500/30 bg-slate-500/10 text-slate-400',
  active:       'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  discontinued: 'border-red-500/30 bg-red-500/10 text-red-400',
  seasonal:     'border-amber-500/30 bg-amber-500/10 text-amber-400',
  archived:     'border-zinc-500/30 bg-zinc-500/10 text-zinc-500',
};

const TYPE_COLORS: Record<ProductType, string> = {
  physical: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  digital:  'border-purple-500/30 bg-purple-500/10 text-purple-400',
  service:  'border-teal-500/30 bg-teal-500/10 text-teal-400',
  bundle:   'border-orange-500/30 bg-orange-500/10 text-orange-400',
};

const LIFECYCLE_CYCLE: ProductLifecycle[] = ['draft', 'active', 'seasonal', 'discontinued', 'archived'];

const COMMON_CATEGORY_PRESETS = [
  'Electronics',
  'Fashion',
  'Grocery',
  'Home & Kitchen',
  'Health & Beauty',
  'Office Supplies',
  'Services',
  'Digital Goods',
];

const COMMON_UOM_PRESETS: Array<{ name: string; symbol: string; category: string }> = [
  { name: 'Piece', symbol: 'pc', category: 'qty' },
  { name: 'Box', symbol: 'box', category: 'qty' },
  { name: 'Kilogram', symbol: 'kg', category: 'weight' },
  { name: 'Gram', symbol: 'g', category: 'weight' },
  { name: 'Liter', symbol: 'l', category: 'volume' },
  { name: 'Milliliter', symbol: 'ml', category: 'volume' },
  { name: 'Meter', symbol: 'm', category: 'length' },
  { name: 'Hour', symbol: 'hr', category: 'time' },
];

function advanceLifecycle(current: ProductLifecycle): ProductLifecycle {
  const idx = LIFECYCLE_CYCLE.indexOf(current);
  return LIFECYCLE_CYCLE[(idx + 1) % LIFECYCLE_CYCLE.length];
}

// ─── Catalog Tab ──────────────────────────────────────────────────────────────

const CatalogTab = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUoms] = useState<UoM[]>([]);
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  // Form state
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [skuPrefix, setSkuPrefix]     = useState('');
  const [productType, setProductType] = useState<ProductType>('physical');
  const [lifecycle, setLifecycle]     = useState<ProductLifecycle>('active');
  const [basePrice, setBasePrice]     = useState('');
  const [categoryId, setCategoryId]   = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [baseUomId, setBaseUomId]     = useState('');
  const [uomSymbol, setUomSymbol]     = useState('');
  const [tagsInput, setTagsInput]     = useState('');
  const [saving, setSaving]           = useState(false);

  const load = useCallback(async () => {
    try {
      const [prodRes, catRes, uomRes] = await Promise.all([
        fetch('/api/business/products', { cache: 'no-store' }),
        fetch('/api/business/products/categories', { cache: 'no-store' }),
        fetch('/api/business/products/uom', { cache: 'no-store' }),
      ]);
      const [prodData, catData, uomData] = await Promise.all([prodRes.json(), catRes.json(), uomRes.json()]) as [
        { ok: boolean; products?: Product[] },
        { ok: boolean; categories?: Category[] },
        { ok: boolean; uoms?: UoM[] },
      ];
      if (prodData.ok && prodData.products) setProducts(prodData.products);
      if (catData.ok && catData.categories) setCategories(catData.categories);
      if (uomData.ok && uomData.uoms) setUoms(uomData.uoms);
    } catch {
      // Offline – show empty state gracefully
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const ensureCategoryId = useCallback(async (rawName: string) => {
    const normalized = rawName.trim();
    if (!normalized) return '';

    const existing = categories.find((item) => item.name.toLowerCase() === normalized.toLowerCase());
    if (existing) return existing.id;

    const response = await fetch('/api/business/products/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: normalized }),
    });

    if (!response.ok) return '';
    const data = (await response.json()) as { ok: boolean; category?: { id: string; name: string } };
    if (data.ok && data.category) {
      const createdCategory = data.category;
      setCategories((prev) => [
        ...prev,
        { id: createdCategory.id, name: createdCategory.name },
      ]);
      return createdCategory.id;
    }
    return '';
  }, [categories]);

  const ensureUomId = useCallback(async (rawSymbol: string) => {
    const normalized = rawSymbol.trim().toLowerCase();
    if (!normalized) return '';

    const existing = uoms.find((item) => item.symbol.toLowerCase() === normalized);
    if (existing) return existing.id;

    const preset = COMMON_UOM_PRESETS.find((item) => item.symbol === normalized);
    const response = await fetch('/api/business/products/uom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: preset?.name ?? normalized.toUpperCase(),
        symbol: normalized,
        category: preset?.category,
      }),
    });

    if (!response.ok) return '';
    const data = (await response.json()) as { ok: boolean; uom?: UoM };
    if (data.ok && data.uom) {
      setUoms((prev) => [...prev, data.uom as UoM]);
      return data.uom.id;
    }
    return '';
  }, [uoms]);

  const addProduct = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      const resolvedCategoryId = categoryId || await ensureCategoryId(categoryName);
      const resolvedUomId = baseUomId || await ensureUomId(uomSymbol);
      const res = await fetch('/api/business/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          skuPrefix: skuPrefix.trim() || undefined,
          productType,
          lifecycle,
          basePrice: basePrice ? parseFloat(basePrice) : undefined,
          categoryId: resolvedCategoryId || undefined,
          baseUomId: resolvedUomId || undefined,
          tags: tags.length ? tags : undefined,
        }),
      });
      if (res.ok) {
        await load();
        setName(''); setDescription(''); setSkuPrefix('');
        setProductType('physical'); setLifecycle('active');
        setBasePrice(''); setCategoryId(''); setCategoryName(''); setBaseUomId(''); setUomSymbol(''); setTagsInput('');
      }
    } finally {
      setSaving(false);
    }
  };

  const setProductLifecycle = async (id: string, newLifecycle: ProductLifecycle) => {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, lifecycle: newLifecycle } : p));
    try {
      await fetch(`/api/business/products?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lifecycle: newLifecycle }),
      });
    } catch {
      // optimistic update already applied
    }
  };

  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter((p) => {
      if (lifecycleFilter !== 'all' && p.lifecycle !== lifecycleFilter) return false;
      if (typeFilter !== 'all' && p.productType !== typeFilter) return false;
      if (q) {
        const text = `${p.name} ${p.sku ?? ''} ${p.category ?? ''} ${p.productCategory?.name ?? ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [products, lifecycleFilter, typeFilter, query]);

  const lifecycleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    for (const p of products) counts[p.lifecycle] = (counts[p.lifecycle] ?? 0) + 1;
    return counts;
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Summary counters */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {(['all', 'active', 'draft', 'seasonal', 'discontinued'] as const).map((lc) => (
          <button
            key={lc}
            type="button"
            onClick={() => setLifecycleFilter(lc)}
            className={`rounded-xl border p-3 text-left transition-all ${lifecycleFilter === lc ? 'border-primary/40 bg-primary/10' : 'border-white/5 bg-card/40 hover:border-white/10'}`}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{lc}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{lifecycleCounts[lc] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs border-white/10 bg-card/40"
        />
        <div className="flex gap-2">
          {(['all', 'physical', 'digital', 'service', 'bundle'] as const).map((t) => (
            <Button key={t} size="sm" variant={typeFilter === t ? 'default' : 'outline'}
              className={typeFilter === t ? 'gradient-amber text-black font-semibold' : 'border-white/10 bg-card/40'}
              onClick={() => setTypeFilter(t)}>
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Create form */}
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Add Product to Master</CardTitle>
          <CardDescription>SKU is auto-generated from prefix if omitted. Leave prefix blank to use first 3 letters of name.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Name *</Label>
              <Input placeholder="e.g. Running Shoe Pro" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">SKU Prefix (for auto-gen)</Label>
              <Input placeholder="e.g. RSH" value={skuPrefix} onChange={(e) => setSkuPrefix(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Base Price</Label>
              <Input type="number" placeholder="0.00" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Product Type</Label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="w-full rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground"
              >
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
                <option value="service">Service</option>
                <option value="bundle">Bundle / Kit</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Lifecycle Status</Label>
              <select
                value={lifecycle}
                onChange={(e) => setLifecycle(e.target.value as ProductLifecycle)}
                className="w-full rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="seasonal">Seasonal</option>
                <option value="discontinued">Discontinued</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <select
                value={categoryId}
                onChange={(e) => {
                  const value = e.target.value;
                  setCategoryId(value);
                  const selected = categories.find((item) => item.id === value);
                  setCategoryName(selected?.name ?? '');
                }}
                className="w-full rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground"
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.parent ? `↳ ${c.name}` : c.name}</option>
                ))}
              </select>
              <Input
                placeholder="Or add new category"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  if (categoryId) setCategoryId('');
                }}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_CATEGORY_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 border-white/10 bg-card/40 px-2 text-[11px]"
                    onClick={() => {
                      const existing = categories.find((item) => item.name.toLowerCase() === preset.toLowerCase());
                      setCategoryName(preset);
                      setCategoryId(existing?.id ?? '');
                    }}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Base Unit of Measure</Label>
              <select
                value={baseUomId}
                onChange={(e) => {
                  const value = e.target.value;
                  setBaseUomId(value);
                  const selected = uoms.find((item) => item.id === value);
                  setUomSymbol(selected?.symbol ?? '');
                }}
                className="w-full rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground"
              >
                <option value="">— None —</option>
                {uoms.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                ))}
              </select>
              <Input
                placeholder="Or add measurement (e.g. kg, pc, l)"
                value={uomSymbol}
                onChange={(e) => {
                  setUomSymbol(e.target.value.toLowerCase());
                  if (baseUomId) setBaseUomId('');
                }}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_UOM_PRESETS.map((preset) => (
                  <Button
                    key={preset.symbol}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 border-white/10 bg-card/40 px-2 text-[11px]"
                    onClick={() => {
                      const existing = uoms.find((item) => item.symbol.toLowerCase() === preset.symbol.toLowerCase());
                      setUomSymbol(preset.symbol);
                      setBaseUomId(existing?.id ?? '');
                    }}
                  >
                    {preset.symbol}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input placeholder="Short description…" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tags (comma-separated)</Label>
              <Input placeholder="new-arrival, promo" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <Button className="gradient-amber text-black font-semibold" onClick={addProduct} disabled={saving}>
              {saving ? 'Saving…' : 'Add Product'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product list */}
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-card/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Lifecycle</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">UoM</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Variants</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">No products match the active filter.</td></tr>
            ) : filteredProducts.map((p) => (
              <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{p.name}</p>
                  {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                  {Array.isArray(p.tags) && p.tags.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {p.tags.map((t) => <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">{t}</span>)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-primary">{p.sku ?? '—'}</td>
                <td className="px-4 py-3"><Badge variant="outline" className={TYPE_COLORS[p.productType]}>{p.productType}</Badge></td>
                <td className="px-4 py-3"><Badge variant="outline" className={LIFECYCLE_COLORS[p.lifecycle]}>{p.lifecycle}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground">{p.productCategory?.name ?? p.category ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.baseUom ? `${p.baseUom.name} (${p.baseUom.symbol})` : '—'}</td>
                <td className="px-4 py-3 text-primary">{p.basePrice ? `$${Number(p.basePrice).toFixed(2)}` : '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.variants?.length ?? 0}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" className="border-white/10 bg-card/40 text-xs"
                    onClick={() => void setProductLifecycle(p.id, advanceLifecycle(p.lifecycle))}>
                    Advance
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Variants Tab ─────────────────────────────────────────────────────────────

const VariantsTab = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [attrKey, setAttrKey]           = useState('color');
  const [attrValue, setAttrValue]       = useState('');
  const [extraAttrKey, setExtraAttrKey] = useState('');
  const [extraAttrValue, setExtraAttrValue] = useState('');
  const [addlPrice, setAddlPrice]       = useState('');
  const [saving, setSaving]             = useState(false);

  const load = useCallback(async () => {
    try {
      const [prodRes, varRes] = await Promise.all([
        fetch('/api/business/products', { cache: 'no-store' }),
        fetch('/api/business/products/variants', { cache: 'no-store' }),
      ]);
      const [prodData, varData] = await Promise.all([prodRes.json(), varRes.json()]) as [
        { ok: boolean; products?: Product[] },
        { ok: boolean; variants?: ProductVariant[] },
      ];
      if (prodData.ok && prodData.products) setProducts(prodData.products);
      if (varData.ok && varData.variants)   setVariants(varData.variants);
    } catch {
      // offline
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addVariant = async () => {
    if (!selectedProductId || !attrValue.trim()) return;
    setSaving(true);
    try {
      const attributeValues: Record<string, string> = { [attrKey.trim()]: attrValue.trim() };
      if (extraAttrKey.trim() && extraAttrValue.trim()) attributeValues[extraAttrKey.trim()] = extraAttrValue.trim();

      const res = await fetch('/api/business/products/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          attributeValues,
          additionalPrice: addlPrice ? parseFloat(addlPrice) : undefined,
        }),
      });
      if (res.ok) {
        await load();
        setAttrValue(''); setExtraAttrKey(''); setExtraAttrValue(''); setAddlPrice('');
      }
    } finally {
      setSaving(false);
    }
  };

  const visibleVariants = selectedProductId
    ? variants.filter((v) => v.product?.id === selectedProductId)
    : variants;

  const COMMON_ATTRS = ['color', 'size', 'material', 'finish', 'flavor', 'weight', 'style'];

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Add Product Variant</CardTitle>
          <CardDescription>Define size, color, or any custom attribute combination. SKU is auto-generated.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Parent Product *</Label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground"
              >
                <option value="">— Select product —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku ?? 'no-sku'})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Attribute 1 Key</Label>
              <select
                value={attrKey}
                onChange={(e) => setAttrKey(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground"
              >
                {COMMON_ATTRS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Attribute 1 Value *</Label>
              <Input placeholder="e.g. Red" value={attrValue} onChange={(e) => setAttrValue(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Attribute 2 Key (optional)</Label>
              <Input placeholder="e.g. size" value={extraAttrKey} onChange={(e) => setExtraAttrKey(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Attribute 2 Value (optional)</Label>
              <Input placeholder="e.g. XL" value={extraAttrValue} onChange={(e) => setExtraAttrValue(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Additional Price</Label>
              <Input type="number" placeholder="0.00" value={addlPrice} onChange={(e) => setAddlPrice(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <Button className="gradient-amber text-black font-semibold" onClick={addVariant} disabled={saving}>
              {saving ? 'Saving…' : 'Add Variant'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={selectedProductId === '' ? 'default' : 'outline'}
          className={selectedProductId === '' ? 'gradient-amber text-black font-semibold' : 'border-white/10 bg-card/40'}
          onClick={() => setSelectedProductId('')}>All products</Button>
        {products.map((p) => (
          <Button key={p.id} size="sm" variant={selectedProductId === p.id ? 'default' : 'outline'}
            className={selectedProductId === p.id ? 'gradient-amber text-black font-semibold' : 'border-white/10 bg-card/40'}
            onClick={() => setSelectedProductId(p.id)}>{p.name}</Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-card/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Parent Product</th>
              <th className="px-4 py-3 font-medium">Variant SKU</th>
              <th className="px-4 py-3 font-medium">Attributes</th>
              <th className="px-4 py-3 font-medium">Add&apos;l Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleVariants.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No variants yet.</td></tr>
            ) : visibleVariants.map((v) => (
              <tr key={v.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-foreground">{v.product?.name ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-primary">{v.sku}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(v.attributeValues as Record<string, string>).map(([k, val]) => (
                      <span key={k} className="rounded-full border border-white/10 bg-card/40 px-2 py-0.5 text-xs text-muted-foreground">
                        {k}: {val}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-primary">
                  {v.additionalPrice ? `+$${Number(v.additionalPrice).toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3"><Badge variant="outline" className={LIFECYCLE_COLORS[v.lifecycle]}>{v.lifecycle}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Categories Tab ───────────────────────────────────────────────────────────

const CategoriesTab = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName]       = useState('');
  const [code, setCode]       = useState('');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving]   = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/business/products/categories', { cache: 'no-store' });
      const data = (await res.json()) as { ok: boolean; categories?: Category[] };
      if (data.ok && data.categories) setCategories(data.categories);
    } catch { /* offline */ }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addCategory = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/business/products/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), code: code.trim() || undefined, parentId: parentId || undefined }),
      });
      if (res.ok) { await load(); setName(''); setCode(''); setParentId(''); }
    } finally { setSaving(false); }
  };

  const rootCategories = categories.filter((c) => !c.parentId);
  const toggle = (id: string) => setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Add Product Category</CardTitle>
          <CardDescription>Build hierarchical category trees. Leave parent blank for root categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Category Name *</Label>
              <Input placeholder="e.g. Footwear" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Code (auto if blank)</Label>
              <Input placeholder="e.g. FW" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Parent Category</Label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground"
              >
                <option value="">— Root (no parent) —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button className="gradient-amber text-black font-semibold" onClick={addCategory} disabled={saving}>
              {saving ? 'Saving…' : 'Add Category'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle>Category Hierarchy</CardTitle>
          <CardDescription>Expandable tree showing parent → child relationships and product counts.</CardDescription>
        </CardHeader>
        <CardContent>
          {rootCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet. Add your first root category above.</p>
          ) : (
            <div className="space-y-1">
              {rootCategories.map((root) => (
                <div key={root.id}>
                  <div
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-white/5 bg-card/40 px-4 py-2.5 hover:bg-white/[0.03]"
                    onClick={() => toggle(root.id)}
                  >
                    <div className="flex items-center gap-2">
                      {(root.children?.length ?? 0) > 0
                        ? (expanded.has(root.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />)
                        : <span className="h-4 w-4" />
                      }
                      <span className="font-medium text-foreground">{root.name}</span>
                      {root.code && <span className="rounded bg-white/5 px-1.5 py-0.5 text-xs font-mono text-primary">{root.code}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{root._count?.products ?? 0} products</span>
                  </div>
                  {expanded.has(root.id) && root.children && root.children.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-white/5 pl-4">
                      {root.children.map((child) => (
                        <div key={child.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-card/30 px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{child.name}</span>
                            {child.code && <span className="rounded bg-white/5 px-1.5 py-0.5 text-xs font-mono text-primary">{child.code}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── UoM Tab ──────────────────────────────────────────────────────────────────

const UoMTab = () => {
  const [uoms, setUoms]             = useState<UoM[]>([]);
  const [conversions, setConversions] = useState<UoMConversion[]>([]);
  const [uomName, setUomName]       = useState('');
  const [uomSymbol, setUomSymbol]   = useState('');
  const [uomCategory, setUomCategory] = useState('');
  const [fromId, setFromId]         = useState('');
  const [toId, setToId]             = useState('');
  const [factor, setFactor]         = useState('');
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/business/products/uom?conversions=true', { cache: 'no-store' });
      const data = (await res.json()) as {
        ok: boolean;
        uoms?: (UoM & { fromConversions?: ({ toUom: UoM } & { id: string; factor: string | number })[]; toConversions?: ({ fromUom: UoM } & { id: string; factor: string | number })[] })[];
      };
      if (data.ok && data.uoms) {
        setUoms(data.uoms.map(({ fromConversions: _f, toConversions: _t, ...u }) => u));
        const seen = new Set<string>();
        const convs: UoMConversion[] = [];
        for (const u of data.uoms) {
          for (const c of u.fromConversions ?? []) {
            if (!seen.has(c.id)) { seen.add(c.id); convs.push({ id: c.id, fromUomId: u.id, toUomId: c.toUom.id, factor: c.factor, fromUom: u as UoM, toUom: c.toUom }); }
          }
        }
        setConversions(convs);
      }
    } catch { /* offline */ }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addUoM = async () => {
    if (!uomName.trim() || !uomSymbol.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/business/products/uom', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: uomName.trim(), symbol: uomSymbol.trim(), category: uomCategory.trim() || undefined }),
      });
      if (res.ok) { await load(); setUomName(''); setUomSymbol(''); setUomCategory(''); }
    } finally { setSaving(false); }
  };

  const addConversion = async () => {
    if (!fromId || !toId || !factor) return;
    setSaving(true);
    try {
      const res = await fetch('/api/business/products/uom?conversion=true', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUomId: fromId, toUomId: toId, factor: parseFloat(factor) }),
      });
      if (res.ok) { await load(); setFromId(''); setToId(''); setFactor(''); }
    } finally { setSaving(false); }
  };

  const UOM_CATEGORIES = ['qty', 'weight', 'volume', 'length', 'area', 'time'];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /> Add Unit of Measure</CardTitle>
            <CardDescription>Define measurement units for product quantities and conversions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Name *</Label>
                <Input placeholder="e.g. Kilogram" value={uomName} onChange={(e) => setUomName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Symbol *</Label>
                <Input placeholder="e.g. kg" value={uomSymbol} onChange={(e) => setUomSymbol(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <select value={uomCategory} onChange={(e) => setUomCategory(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground">
                  <option value="">— None —</option>
                  {UOM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <Button className="mt-4 gradient-amber text-black font-semibold" onClick={addUoM} disabled={saving}>
              {saving ? 'Saving…' : 'Add UoM'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Add Conversion Rule</CardTitle>
            <CardDescription>e.g. 1 kg = 1000 g. Factor is the multiplier from → to.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From UoM *</Label>
                <select value={fromId} onChange={(e) => setFromId(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground">
                  <option value="">— Select —</option>
                  {uoms.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To UoM *</Label>
                <select value={toId} onChange={(e) => setToId(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground">
                  <option value="">— Select —</option>
                  {uoms.filter((u) => u.id !== fromId).map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Factor *</Label>
                <Input type="number" placeholder="e.g. 1000" value={factor} onChange={(e) => setFactor(e.target.value)} />
              </div>
            </div>
            <Button className="mt-4 gradient-amber text-black font-semibold" onClick={addConversion} disabled={saving}>
              {saving ? 'Saving…' : 'Add Conversion'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card border-white/5">
          <CardHeader><CardTitle className="text-base">Units of Measure</CardTitle></CardHeader>
          <CardContent>
            {uoms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No UoMs defined yet.</p>
            ) : (
              <div className="space-y-2">
                {uoms.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-card/40 px-3 py-2">
                    <span className="text-sm text-foreground">{u.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary">{u.symbol}</span>
                      {u.category && <Badge variant="outline" className="border-white/10 text-xs text-muted-foreground">{u.category}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader><CardTitle className="text-base">Conversion Table</CardTitle></CardHeader>
          <CardContent>
            {conversions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conversions defined yet.</p>
            ) : (
              <div className="space-y-2">
                {conversions.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-card/40 px-3 py-2 text-sm text-muted-foreground">
                    <span className="text-foreground">1 {c.fromUom?.symbol ?? '?'}</span>
                    <span>=</span>
                    <span className="text-primary">{Number(c.factor).toLocaleString()} {c.toUom?.symbol ?? '?'}</span>
                    <span className="ml-auto text-xs">({c.fromUom?.name} → {c.toUom?.name})</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─── Bundles / Kits Tab ───────────────────────────────────────────────────────

const BundlesTab = () => {
  const [products, setProducts]  = useState<Product[]>([]);
  const [bundles, setBundles]    = useState<Bundle[]>([]);
  const [bundleProductId, setBundleProductId] = useState('');
  const [bundleName, setBundleName]           = useState('');
  const [bundleDesc, setBundleDesc]           = useState('');
  const [components, setComponents] = useState<{ componentProductId: string; quantity: string; notes: string }[]>([
    { componentProductId: '', quantity: '1', notes: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [prodRes, bundleRes] = await Promise.all([
        fetch('/api/business/products', { cache: 'no-store' }),
        fetch('/api/business/products/bundles', { cache: 'no-store' }),
      ]);
      const [prodData, bundleData] = await Promise.all([prodRes.json(), bundleRes.json()]) as [
        { ok: boolean; products?: Product[] },
        { ok: boolean; bundles?: Bundle[] },
      ];
      if (prodData.ok && prodData.products) setProducts(prodData.products);
      if (bundleData.ok && bundleData.bundles) setBundles(bundleData.bundles);
    } catch { /* offline */ }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addComponent = () => setComponents((prev) => [...prev, { componentProductId: '', quantity: '1', notes: '' }]);
  const updateComponent = (idx: number, field: 'componentProductId' | 'quantity' | 'notes', value: string) => {
    setComponents((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };
  const removeComponent = (idx: number) => setComponents((prev) => prev.filter((_, i) => i !== idx));

  const createBundle = async () => {
    if (!bundleProductId || !bundleName.trim()) return;
    const validComponents = components.filter((c) => c.componentProductId && parseFloat(c.quantity) > 0);
    if (validComponents.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/business/products/bundles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: bundleProductId,
          name: bundleName.trim(),
          description: bundleDesc.trim() || undefined,
          items: validComponents.map((c) => ({
            componentProductId: c.componentProductId,
            quantity: parseFloat(c.quantity),
            notes: c.notes.trim() || undefined,
          })),
        }),
      });
      if (res.ok) {
        await load();
        setBundleProductId(''); setBundleName(''); setBundleDesc('');
        setComponents([{ componentProductId: '', quantity: '1', notes: '' }]);
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Boxes className="h-4 w-4 text-primary" /> Create Product Bundle / Kit</CardTitle>
          <CardDescription>Define BOM-lite bills of materials. The bundle product must already exist in the catalog.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bundle Product *</Label>
              <select value={bundleProductId} onChange={(e) => setBundleProductId(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground">
                <option value="">— Select bundle product —</option>
                {products.filter((p) => p.productType === 'bundle').map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {products.filter((p) => p.productType === 'bundle').length === 0 && (
                <p className="text-xs text-amber-400">No bundle-type products yet. Create one in Catalog tab first.</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bundle Name *</Label>
              <Input placeholder="e.g. Starter Kit" value={bundleName} onChange={(e) => setBundleName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input placeholder="Short note…" value={bundleDesc} onChange={(e) => setBundleDesc(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Bill of Materials (Components)</Label>
              <Button size="sm" variant="outline" className="border-white/10 bg-card/40 text-xs" onClick={addComponent}>+ Add Component</Button>
            </div>
            {components.map((comp, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_1fr_32px] gap-2 items-end">
                <select value={comp.componentProductId} onChange={(e) => updateComponent(idx, 'componentProductId', e.target.value)}
                  className="rounded-md border border-white/10 bg-card/40 px-3 py-2 text-sm text-foreground">
                  <option value="">— Select component —</option>
                  {products.filter((p) => p.id !== bundleProductId).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku ?? 'no-sku'})</option>
                  ))}
                </select>
                <Input type="number" placeholder="Qty" value={comp.quantity} onChange={(e) => updateComponent(idx, 'quantity', e.target.value)} className="text-center" />
                <Input placeholder="Notes" value={comp.notes} onChange={(e) => updateComponent(idx, 'notes', e.target.value)} />
                <Button size="sm" variant="outline" className="border-white/10 bg-card/40 px-2 text-muted-foreground hover:text-red-400"
                  onClick={() => removeComponent(idx)} disabled={components.length === 1}>✕</Button>
              </div>
            ))}
          </div>

          <Button className="gradient-amber text-black font-semibold" onClick={createBundle} disabled={saving}>
            {saving ? 'Saving…' : 'Create Bundle'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {bundles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bundles yet.</p>
        ) : bundles.map((b) => (
          <Card key={b.id} className="glass-card border-white/5">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{b.name}</CardTitle>
                  {b.description && <CardDescription>{b.description}</CardDescription>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={LIFECYCLE_COLORS[b.product.lifecycle]}>{b.product.lifecycle}</Badge>
                  <span className="text-xs text-muted-foreground">{b.product.name}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-white/5">
                <table className="min-w-full text-sm">
                  <thead className="bg-card/30 text-left text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Component</th>
                      <th className="px-3 py-2 font-medium">SKU</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Qty</th>
                      <th className="px-3 py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.items.map((item) => (
                      <tr key={item.id} className="border-t border-white/5">
                        <td className="px-3 py-2 text-foreground">{item.componentProduct.name}</td>
                        <td className="px-3 py-2 font-mono text-xs text-primary">{item.componentProduct.sku ?? '—'}</td>
                        <td className="px-3 py-2"><Badge variant="outline" className={TYPE_COLORS[item.componentProduct.productType]}>{item.componentProduct.productType}</Badge></td>
                        <td className="px-3 py-2 text-foreground">{Number(item.quantity).toLocaleString()}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.notes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── SKU Rules Tab ────────────────────────────────────────────────────────────

const SkuRulesTab = () => {
  const [prefix, setPrefix]         = useState('PRD');
  const [categoryCode, setCategoryCode] = useState('GEN');
  const [sequenceLength, setSeqLen] = useState('5');
  const [separator, setSeparator]   = useState('-');
  const [preview, setPreview]       = useState('');

  useEffect(() => {
    const seq = Math.random().toString(36).slice(2, 2 + Math.max(1, parseInt(sequenceLength, 10) || 5)).toUpperCase();
    const parts = [prefix, categoryCode, seq].filter(Boolean);
    setPreview(parts.join(separator || '-'));
  }, [prefix, categoryCode, sequenceLength, separator]);

  const EXAMPLES = [
    { label: 'Footwear – Running', prefix: 'FW', cat: 'RUN', len: '5', sep: '-', example: 'FW-RUN-A3K2P' },
    { label: 'Electronics – Laptop', prefix: 'EL', cat: 'LAP', len: '6', sep: '-', example: 'EL-LAP-B4R9QZ' },
    { label: 'Digital – SaaS License', prefix: 'DIG', cat: 'SAAS', len: '4', sep: '_', example: 'DIG_SAAS_9XA1' },
    { label: 'Service – Consulting', prefix: 'SVC', cat: 'CNSLT', len: '4', sep: '-', example: 'SVC-CNSLT-K8M2' },
  ];

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> SKU Auto-Generation Rules</CardTitle>
          <CardDescription>
            Configure how SKUs are auto-generated when no explicit SKU is provided during product creation.
            Format: <code className="rounded bg-white/5 px-1 font-mono text-xs text-primary">[PREFIX][SEP][CATEGORY_CODE][SEP][RANDOM]</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Prefix</Label>
              <Input placeholder="e.g. PRD" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} />
              <p className="text-xs text-muted-foreground">2–6 chars, Product family code</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Category Code Override</Label>
              <Input placeholder="e.g. GEN" value={categoryCode} onChange={(e) => setCategoryCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))} />
              <p className="text-xs text-muted-foreground">Auto-filled from category code</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Random Sequence Length</Label>
              <Input type="number" min={3} max={10} value={sequenceLength} onChange={(e) => setSeqLen(e.target.value)} />
              <p className="text-xs text-muted-foreground">3–10 chars of entropy</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Separator</Label>
              <Input placeholder="-" maxLength={1} value={separator} onChange={(e) => setSeparator(e.target.value)} />
              <p className="text-xs text-muted-foreground">Typically - or _</p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-widest text-primary">Live preview</p>
            <p className="mt-2 font-mono text-2xl font-bold text-foreground">{preview}</p>
            <p className="mt-1 text-xs text-muted-foreground">Each product generation produces a unique random segment. Prefix + category code are derived from form inputs.</p>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Example patterns across categories</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {EXAMPLES.map((ex) => (
                <div key={ex.label} className="flex items-center justify-between rounded-lg border border-white/5 bg-card/40 px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">{ex.label}</span>
                  <span className="font-mono text-sm text-primary">{ex.example}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="text-base">SKU Generation Rules in Effect</CardTitle>
          <CardDescription>These rules are applied server-side in <code className="font-mono text-xs">/api/business/products</code> and <code className="font-mono text-xs">/api/business/products/variants</code>.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            {[
              'If POST body includes sku field → use as-is (uppercased)',
              'If skuPrefix is set → PREFIX-RANDOM(5)',
              'If neither → first 3 chars of product name (uppercased) + "-" + RANDOM(5)',
              'For variants → ParentSKU[8] + "-" + first 2 chars per attribute value (uppercased)',
              'All generated SKUs are unique-constrained per tenant in the database',
              'Collision → auto-retry with fresh random segment (handled in API)',
            ].map((rule) => (
              <div key={rule} className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">→</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export function ProductManagementContent() {
  return (
    <div id="product-management" className="scroll-mt-24 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Product Management</h2>
        <p className="text-sm text-muted-foreground">
          Unified product catalog, variants, categories, units of measure, bundles, and SKU generation rules.
        </p>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="mb-4 flex h-auto flex-wrap gap-1 bg-card/40 p-1">
          <TabsTrigger value="catalog" className="data-[state=active]:gradient-amber data-[state=active]:text-black">
            <Package className="mr-1.5 h-3.5 w-3.5" /> Catalog
          </TabsTrigger>
          <TabsTrigger value="variants" className="data-[state=active]:gradient-amber data-[state=active]:text-black">
            <Layers className="mr-1.5 h-3.5 w-3.5" /> Variants
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:gradient-amber data-[state=active]:text-black">
            <Tag className="mr-1.5 h-3.5 w-3.5" /> Categories
          </TabsTrigger>
          <TabsTrigger value="uom" className="data-[state=active]:gradient-amber data-[state=active]:text-black">
            <Ruler className="mr-1.5 h-3.5 w-3.5" /> Units of Measure
          </TabsTrigger>
          <TabsTrigger value="bundles" className="data-[state=active]:gradient-amber data-[state=active]:text-black">
            <Boxes className="mr-1.5 h-3.5 w-3.5" /> Bundles &amp; Kits
          </TabsTrigger>
          <TabsTrigger value="sku" className="data-[state=active]:gradient-amber data-[state=active]:text-black">
            <Wrench className="mr-1.5 h-3.5 w-3.5" /> SKU Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog"  className="mt-0"><CatalogTab /></TabsContent>
        <TabsContent value="variants" className="mt-0"><VariantsTab /></TabsContent>
        <TabsContent value="categories" className="mt-0"><CategoriesTab /></TabsContent>
        <TabsContent value="uom"      className="mt-0"><UoMTab /></TabsContent>
        <TabsContent value="bundles"  className="mt-0"><BundlesTab /></TabsContent>
        <TabsContent value="sku"      className="mt-0"><SkuRulesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
