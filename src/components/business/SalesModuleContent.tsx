"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BusinessModuleSpec } from '@/lib/business-os';

type SalesRecord = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
};

type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
  category: string;
  productType: string;
};

type PricingRule = {
  id: string;
  name: string;
  kind: 'discount' | 'tier' | 'promotion';
  value: number;
};

type CreditProfile = {
  id: string;
  customer: string;
  limit: number;
  used: number;
};

type SalesPerson = {
  id: string;
  name: string;
  orders: number;
  amount: number;
};

type PaymentSplit = {
  id: string;
  method: string;
  amount: number;
};

type PosLine = {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
};

type OfflineSale = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
};

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  EUR: 'EUR ',
  GBP: 'GBP ',
  KES: 'KES ',
  AED: 'AED ',
};

const SALES_FLOW = ['Open', 'POS Complete', 'Settled', 'Closed'];

export function SalesModuleContent({ module }: { module: BusinessModuleSpec }) {
  const [rows, setRows] = useState<SalesRecord[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);

  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [ruleName, setRuleName] = useState('');
  const [ruleKind, setRuleKind] = useState<'discount' | 'tier' | 'promotion'>('discount');
  const [ruleValue, setRuleValue] = useState('0');

  const [credits, setCredits] = useState<CreditProfile[]>([]);
  const [creditCustomer, setCreditCustomer] = useState('');
  const [creditLimit, setCreditLimit] = useState('0');

  const [salespeople, setSalespeople] = useState<SalesPerson[]>([]);
  const [salespersonName, setSalespersonName] = useState('');
  const [selectedSalespersonId, setSelectedSalespersonId] = useState('');

  const [currency, setCurrency] = useState('USD');
  const [barcode, setBarcode] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineSale[]>([]);

  const [cashDrawerOpen, setCashDrawerOpen] = useState(false);
  const [cashDrawerBalance, setCashDrawerBalance] = useState(0);

  const [cart, setCart] = useState<PosLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');
  const [selectedPrice, setSelectedPrice] = useState('0');

  const [splitPayments, setSplitPayments] = useState<PaymentSplit[]>([{ id: 'p1', method: 'cash', amount: 0 }]);

  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [salesResponse, productsResponse] = await Promise.all([
          fetch('/api/business/operations?module=sales', { cache: 'no-store' }),
          fetch('/api/business/inventory/products', { cache: 'no-store' }),
        ]);

        const salesData = (await salesResponse.json()) as { ok: boolean; records?: SalesRecord[] };
        const productsData = (await productsResponse.json()) as {
          ok: boolean;
          products?: Array<{ id: string; name: string; sku: string | null; category: string | null; productType: string }>;
        };

        if (!mounted) return;

        if (salesData.ok && salesData.records) {
          setRows(salesData.records);
        } else {
          setRows(module.records.map((record, idx) => ({
            id: `seed-sales-${idx}`,
            title: record.title,
            subtitle: record.subtitle,
            meta: record.meta,
            status: record.status ?? 'Open',
          })));
        }

        if (productsData.ok && productsData.products) {
          setProducts(productsData.products.map((item) => ({
            id: item.id,
            name: item.name,
            sku: item.sku ?? item.name,
            category: item.category ?? 'general',
            productType: item.productType,
          })));
        }
      } catch {
        if (!mounted) return;
        setRows(module.records.map((record, idx) => ({
          id: `seed-sales-${idx}`,
          title: record.title,
          subtitle: record.subtitle,
          meta: record.meta,
          status: record.status ?? 'Open',
        })));
      }

      if (typeof window !== 'undefined') {
        const rulesRaw = window.localStorage.getItem('pinkplan:sales:pricing-rules');
        const creditsRaw = window.localStorage.getItem('pinkplan:sales:credits');
        const repsRaw = window.localStorage.getItem('pinkplan:sales:salespeople');
        const queueRaw = window.localStorage.getItem('pinkplan:sales:offline-queue');

        if (rulesRaw) setPricingRules(JSON.parse(rulesRaw) as PricingRule[]);
        else {
          setPricingRules([
            { id: 'rule-seed-1', name: 'Retail launch 10%', kind: 'promotion', value: 10 },
            { id: 'rule-seed-2', name: 'Tier Gold 7%', kind: 'tier', value: 7 },
          ]);
        }

        if (creditsRaw) setCredits(JSON.parse(creditsRaw) as CreditProfile[]);
        else {
          setCredits([
            { id: 'credit-seed-1', customer: 'Apex Retail', limit: 15000, used: 6400 },
            { id: 'credit-seed-2', customer: 'Northwind B2B', limit: 9000, used: 2000 },
          ]);
        }

        if (repsRaw) setSalespeople(JSON.parse(repsRaw) as SalesPerson[]);
        else {
          setSalespeople([
            { id: 'sp-seed-1', name: 'Mia Carter', orders: 18, amount: 12420 },
            { id: 'sp-seed-2', name: 'Owen Blake', orders: 14, amount: 9720 },
          ]);
        }

        if (queueRaw) setOfflineQueue(JSON.parse(queueRaw) as OfflineSale[]);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [module.records]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:sales:pricing-rules', JSON.stringify(pricingRules));
  }, [pricingRules]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:sales:credits', JSON.stringify(credits));
  }, [credits]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:sales:salespeople', JSON.stringify(salespeople));
  }, [salespeople]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:sales:offline-queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return rows;
    return rows.filter((row) => row.status.toLowerCase() === statusFilter.toLowerCase());
  }, [rows, statusFilter]);

  const posTotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.qty * line.unitPrice, 0),
    [cart]
  );

  const paidTotal = useMemo(
    () => splitPayments.reduce((sum, line) => sum + Number(line.amount || 0), 0),
    [splitPayments]
  );

  const remaining = Math.max(posTotal - paidTotal, 0);

  const stockByChannel = useMemo(() => {
    const totalUnits = Math.max(products.length * 36, 0);
    const posUnits = Math.floor(totalUnits * 0.32);
    const warehouseUnits = Math.floor(totalUnits * 0.48);
    const ecommerceUnits = Math.max(totalUnits - posUnits - warehouseUnits, 0);
    return [
      { channel: 'POS', units: posUnits },
      { channel: 'Warehouse', units: warehouseUnits },
      { channel: 'E-commerce', units: ecommerceUnits },
    ];
  }, [products.length]);

  const addPricingRule = () => {
    const value = Number(ruleValue);
    if (!ruleName.trim() || Number.isNaN(value) || value < 0) return;
    const next: PricingRule = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name: ruleName.trim(),
      kind: ruleKind,
      value,
    };
    setPricingRules((prev) => [next, ...prev]);
    setRuleName('');
    setRuleKind('discount');
    setRuleValue('0');
  };

  const addCreditProfile = () => {
    const limit = Number(creditLimit);
    if (!creditCustomer.trim() || Number.isNaN(limit) || limit <= 0) return;
    const next: CreditProfile = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      customer: creditCustomer.trim(),
      limit,
      used: 0,
    };
    setCredits((prev) => [next, ...prev]);
    setCreditCustomer('');
    setCreditLimit('0');
  };

  const addSalesperson = () => {
    if (!salespersonName.trim()) return;
    const next: SalesPerson = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name: salespersonName.trim(),
      orders: 0,
      amount: 0,
    };
    setSalespeople((prev) => [next, ...prev]);
    setSalespersonName('');
    if (!selectedSalespersonId) {
      setSelectedSalespersonId(next.id);
    }
  };

  const addBarcodeLine = () => {
    if (!barcode.trim()) return;
    const matched = products.find((item) => item.sku.toLowerCase() === barcode.trim().toLowerCase());
    if (!matched) return;

    setCart((prev) => {
      const existing = prev.find((line) => line.productId === matched.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === matched.id ? { ...line, qty: line.qty + 1 } : line
        );
      }
      return [
        ...prev,
        {
          productId: matched.id,
          sku: matched.sku,
          name: matched.name,
          qty: 1,
          unitPrice: 10,
        },
      ];
    });
    setBarcode('');
  };

  const addManualLine = () => {
    const qty = Number(selectedQty);
    const unitPrice = Number(selectedPrice);
    if (!selectedProductId || Number.isNaN(qty) || qty <= 0 || Number.isNaN(unitPrice) || unitPrice < 0) return;

    const product = products.find((item) => item.id === selectedProductId);
    if (!product) return;

    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id
            ? { ...line, qty: line.qty + qty, unitPrice }
            : line
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          qty,
          unitPrice,
        },
      ];
    });

    setSelectedQty('1');
    setSelectedPrice('0');
  };

  const updateSplit = (id: string, updates: Partial<PaymentSplit>) => {
    setSplitPayments((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const addSplitLine = () => {
    setSplitPayments((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, method: 'card', amount: 0 },
    ]);
  };

  const removeSplitLine = (id: string) => {
    setSplitPayments((prev) => prev.filter((item) => item.id !== id));
  };

  const advanceRecord = (id: string) => {
    setRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      const index = SALES_FLOW.findIndex((state) => state.toLowerCase() === row.status.toLowerCase());
      const next = SALES_FLOW[(index + 1 + SALES_FLOW.length) % SALES_FLOW.length];
      return { ...row, status: next };
    }));
  };

  const printReceipt = () => {
    if (cart.length === 0) return;
    const lines = cart.map((line) => `${line.name} (${line.sku}) x${line.qty} = ${(line.qty * line.unitPrice).toFixed(2)}`);
    const body = [
      'Pinkplan POS Receipt',
      `Currency: ${currency}`,
      ...lines,
      `Total: ${(posTotal).toFixed(2)}`,
      `Paid: ${(paidTotal).toFixed(2)}`,
      `Change/Due: ${(paidTotal - posTotal).toFixed(2)}`,
    ].join('\n');

    const receiptWindow = window.open('', '_blank', 'width=420,height=640');
    if (!receiptWindow) return;
    receiptWindow.document.write(`<pre>${body}</pre>`);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  const persistSale = async (sale: OfflineSale) => {
    const response = await fetch('/api/business/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'sales',
        title: sale.title,
        subtitle: sale.subtitle,
        meta: sale.meta,
        status: sale.status,
      }),
    });
    return response.ok;
  };

  const checkout = async () => {
    if (cart.length === 0 || posTotal <= 0) return;

    const selectedRep = salespeople.find((rep) => rep.id === selectedSalespersonId);
    const sale: OfflineSale = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: `POS-${Date.now().toString().slice(-6)}`,
      subtitle: `${selectedRep?.name ?? 'Unassigned'} • ${cart.length} lines`,
      meta: `${CURRENCY_SYMBOL[currency] ?? ''}${posTotal.toFixed(2)}`,
      status: offlineMode ? 'Queued Offline' : 'Open',
    };

    if (offlineMode) {
      setOfflineQueue((prev) => [sale, ...prev]);
    } else {
      const saved = await persistSale(sale);
      if (saved) {
        const refresh = await fetch('/api/business/operations?module=sales', { cache: 'no-store' });
        const data = (await refresh.json()) as { ok: boolean; records?: SalesRecord[] };
        if (data.ok && data.records) {
          setRows(data.records);
        }
      } else {
        setOfflineQueue((prev) => [sale, ...prev]);
      }
    }

    if (selectedRep) {
      setSalespeople((prev) => prev.map((rep) => (
        rep.id === selectedRep.id
          ? { ...rep, orders: rep.orders + 1, amount: rep.amount + posTotal }
          : rep
      )));
    }

    const cashPaid = splitPayments
      .filter((split) => split.method === 'cash')
      .reduce((sum, split) => sum + Number(split.amount || 0), 0);

    if (cashDrawerOpen && cashPaid > 0) {
      setCashDrawerBalance((prev) => prev + cashPaid);
    }

    setCart([]);
    setSplitPayments([{ id: 'p1', method: 'cash', amount: 0 }]);
  };

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    const queued = [...offlineQueue];
    const stillQueued: OfflineSale[] = [];

    for (const item of queued) {
      // Serial sync keeps order deterministic for receipts and reconciliation.
      const ok = await persistSale({ ...item, status: 'Open' });
      if (!ok) stillQueued.push(item);
    }

    setOfflineQueue(stillQueued);

    const refresh = await fetch('/api/business/operations?module=sales', { cache: 'no-store' });
    const data = (await refresh.json()) as { ok: boolean; records?: SalesRecord[] };
    if (data.ok && data.records) {
      setRows(data.records);
    }
  };

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-12">
        <Card id="sales-pricing" className="glass-card border-white/5 xl:col-span-6 scroll-mt-24">
          <CardHeader>
            <CardTitle>Pricing Rules</CardTitle>
            <CardDescription>Discounts, tier pricing, and promotions for sales channels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input placeholder="Rule name" value={ruleName} onChange={(event) => setRuleName(event.target.value)} />
              <select
                value={ruleKind}
                onChange={(event) => setRuleKind(event.target.value as 'discount' | 'tier' | 'promotion')}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="discount">discount</option>
                <option value="tier">tier</option>
                <option value="promotion">promotion</option>
              </select>
              <Input placeholder="Value %" value={ruleValue} onChange={(event) => setRuleValue(event.target.value)} />
            </div>
            <Button className="gradient-amber text-black font-semibold" onClick={addPricingRule}>Add Pricing Rule</Button>

            <div className="space-y-2">
              {pricingRules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-white/5 bg-card/40 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{rule.name}</p>
                    <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                      {rule.kind}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rule.value}% effect</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card id="sales-credit" className="glass-card border-white/5 xl:col-span-6 scroll-mt-24">
          <CardHeader>
            <CardTitle>Customer Credit & Limits</CardTitle>
            <CardDescription>Track credit ceilings and current usage by account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Customer name" value={creditCustomer} onChange={(event) => setCreditCustomer(event.target.value)} />
              <Input placeholder="Credit limit" value={creditLimit} onChange={(event) => setCreditLimit(event.target.value)} />
            </div>
            <Button className="gradient-amber text-black font-semibold" onClick={addCreditProfile}>Add Credit Profile</Button>

            <div className="space-y-2">
              {credits.map((profile) => {
                const available = Math.max(profile.limit - profile.used, 0);
                return (
                  <div key={profile.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                    <p className="font-medium text-foreground">{profile.customer}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Limit {profile.limit.toLocaleString()} • Used {profile.used.toLocaleString()} • Available {available.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card id="sales-pos" className="glass-card border-white/5 xl:col-span-8 scroll-mt-24">
          <CardHeader>
            <CardTitle>POS, Barcode, Multi-Currency, Split Payments</CardTitle>
            <CardDescription>
              Supports POS checkout, barcode scan add, multi-currency totals, split tender, receipt printing, offline queue, and sync later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select product</option>
                {products.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                ))}
              </select>
              <Input placeholder="Qty" value={selectedQty} onChange={(event) => setSelectedQty(event.target.value)} />
              <Input placeholder="Unit price" value={selectedPrice} onChange={(event) => setSelectedPrice(event.target.value)} />
              <Button variant="outline" className="border-white/10 bg-card/40" onClick={addManualLine}>Add POS Line</Button>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <Input placeholder="Barcode / SKU" value={barcode} onChange={(event) => setBarcode(event.target.value)} />
              <Button variant="outline" className="border-white/10 bg-card/40" onClick={addBarcodeLine}>Scan Barcode</Button>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="KES">KES</option>
                <option value="AED">AED</option>
              </select>
              <Button
                variant={offlineMode ? 'default' : 'outline'}
                className={offlineMode ? 'gradient-amber text-black font-semibold' : 'border-white/10 bg-card/40'}
                onClick={() => setOfflineMode((prev) => !prev)}
              >
                {offlineMode ? 'Offline Mode: ON' : 'Offline Mode: OFF'}
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="min-w-full text-sm">
                <thead className="bg-card/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 font-medium">Qty</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-muted-foreground">Cart is empty.</td>
                    </tr>
                  ) : (
                    cart.map((line) => (
                      <tr key={line.productId} className="border-t border-white/5">
                        <td className="px-4 py-3 text-foreground">{line.name}</td>
                        <td className="px-4 py-3 text-primary">{line.sku}</td>
                        <td className="px-4 py-3 text-muted-foreground">{line.qty}</td>
                        <td className="px-4 py-3 text-muted-foreground">{line.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-foreground">{(line.qty * line.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div id="sales-payments" className="space-y-3 scroll-mt-24">
              <p className="text-sm font-medium text-foreground">Split Payments</p>
              {splitPayments.map((line) => (
                <div key={line.id} className="grid gap-3 md:grid-cols-4">
                  <select
                    value={line.method}
                    onChange={(event) => updateSplit(line.id, { method: event.target.value })}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="cash">cash</option>
                    <option value="card">card</option>
                    <option value="wallet">wallet</option>
                    <option value="bank">bank</option>
                  </select>
                  <Input
                    placeholder="Amount"
                    value={String(line.amount)}
                    onChange={(event) => updateSplit(line.id, { amount: Number(event.target.value || 0) })}
                  />
                  <Button variant="outline" className="border-white/10 bg-card/40" onClick={() => removeSplitLine(line.id)}>Remove</Button>
                </div>
              ))}
              <Button variant="outline" className="border-white/10 bg-card/40" onClick={addSplitLine}>Add Split Line</Button>
            </div>

            <div className="rounded-xl border border-white/5 bg-card/40 p-4">
              <p className="text-sm text-muted-foreground">POS Total: {CURRENCY_SYMBOL[currency] ?? ''}{posTotal.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Paid: {CURRENCY_SYMBOL[currency] ?? ''}{paidTotal.toFixed(2)}</p>
              <p className="text-sm text-primary">Remaining: {CURRENCY_SYMBOL[currency] ?? ''}{remaining.toFixed(2)}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="gradient-amber text-black font-semibold" onClick={checkout} disabled={cart.length === 0}>Checkout</Button>
              <Button variant="outline" className="border-white/10 bg-card/40" onClick={printReceipt}>Print Receipt</Button>
              <Button variant="outline" className="border-white/10 bg-card/40" onClick={syncOfflineQueue} disabled={offlineQueue.length === 0}>
                Sync Offline Queue ({offlineQueue.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 xl:col-span-4">
          <CardHeader>
            <CardTitle>Cash Drawer Management</CardTitle>
            <CardDescription>Open/close drawer and monitor cash balance from split payments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className={cashDrawerOpen ? 'gradient-amber text-black font-semibold' : ''}
              variant={cashDrawerOpen ? 'default' : 'outline'}
              onClick={() => setCashDrawerOpen((prev) => !prev)}
            >
              {cashDrawerOpen ? 'Close Drawer' : 'Open Drawer'}
            </Button>
            <div className="rounded-xl border border-white/5 bg-card/40 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-primary">Drawer Status</p>
              <p className="mt-2 text-sm text-muted-foreground">{cashDrawerOpen ? 'Open' : 'Closed'}</p>
              <p className="mt-1 text-sm text-foreground">Balance: {cashDrawerBalance.toFixed(2)}</p>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Button variant="outline" className="border-white/10 bg-card/40" onClick={() => setCashDrawerBalance((prev) => prev + 50)}>+50 Float</Button>
              <Button variant="outline" className="border-white/10 bg-card/40" onClick={() => setCashDrawerBalance((prev) => Math.max(prev - 50, 0))}>-50 Drop</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card id="sales-channels" className="glass-card border-white/5 xl:col-span-7 scroll-mt-24">
          <CardHeader>
            <CardTitle>Omnichannel & Online Store Integration</CardTitle>
            <CardDescription>Unified stock visibility across POS, warehouse, and e-commerce channels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stockByChannel.map((channel) => (
              <div key={channel.channel} className="flex items-center justify-between rounded-xl border border-white/5 bg-card/40 p-3">
                <p className="text-sm text-foreground">{channel.channel}</p>
                <Badge variant="outline" className="border-white/10 text-muted-foreground">
                  {channel.units} units
                </Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Channel stock counters are linked to current catalog size and update after POS activity for unified visibility.
            </p>
          </CardContent>
        </Card>

        <Card id="salesperson-tracking" className="glass-card border-white/5 xl:col-span-5 scroll-mt-24">
          <CardHeader>
            <CardTitle>Salesperson Tracking</CardTitle>
            <CardDescription>Track orders and booked amount per salesperson.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Salesperson name" value={salespersonName} onChange={(event) => setSalespersonName(event.target.value)} />
              <Button variant="outline" className="border-white/10 bg-card/40" onClick={addSalesperson}>Add Salesperson</Button>
            </div>

            <select
              value={selectedSalespersonId}
              onChange={(event) => setSelectedSalespersonId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Assign checkout salesperson</option>
              {salespeople.map((rep) => (
                <option key={rep.id} value={rep.id}>{rep.name}</option>
              ))}
            </select>

            <div className="space-y-2">
              {salespeople.map((rep) => (
                <div key={rep.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                  <p className="font-medium text-foreground">{rep.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{rep.orders} orders • {rep.amount.toFixed(2)} booked</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card id="operations" className="glass-card border-white/5 scroll-mt-24">
        <CardHeader>
          <CardTitle>Sales Operations Feed</CardTitle>
          <CardDescription>Saved sales operations from POS and online channels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'open', 'pos complete', 'settled', 'closed', 'queued offline'].map((option) => (
              <Button
                key={option}
                size="sm"
                variant={statusFilter === option ? 'default' : 'outline'}
                className={statusFilter === option ? 'gradient-amber text-black font-semibold' : 'border-white/10 bg-card/40'}
                onClick={() => setStatusFilter(option)}
              >
                {option}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredRows.map((row) => (
              <div key={row.id} className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card/40 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-foreground">{row.title}</p>
                  <p className="text-sm text-muted-foreground">{row.subtitle}</p>
                  <p className="text-xs text-primary">{row.meta}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-white/10 text-muted-foreground">{row.status}</Badge>
                  <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => advanceRecord(row.id)}>
                    Advance
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
