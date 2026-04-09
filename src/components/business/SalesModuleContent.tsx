"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BusinessModuleSpec } from '@/lib/business-os';

type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
  category: string;
  productType: string;
  basePrice: number;
};

type Employee = {
  id: string;
  name: string;
  email: string;
};

type SalesOrderRow = {
  id: string;
  orderNo: string;
  employeeId: string | null;
  employeeName: string;
  currency: string;
  channel: 'pos' | 'warehouse' | 'ecommerce';
  status: 'draft' | 'open' | 'settled' | 'closed' | 'canceled';
  total: number;
  createdAt: string;
  lines: Array<{
    id: string;
    productId: string;
    productName: string;
    productSku: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  payments: Array<{
    id: string;
    method: 'cash' | 'card' | 'wallet' | 'bank';
    amount: number;
    reference?: string | null;
  }>;
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

type PaymentSplit = {
  id: string;
  method: 'cash' | 'card' | 'wallet' | 'bank';
  amount: number;
};

const isPaymentMethod = (value: string): value is PaymentSplit['method'] => (
  value === 'cash' || value === 'card' || value === 'wallet' || value === 'bank'
);

type PosLine = {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
};

type OfflineSale = {
  id: string;
  employeeId: string;
  currency: string;
  channel: 'pos' | 'warehouse' | 'ecommerce';
  status: 'draft' | 'open' | 'settled' | 'closed' | 'canceled';
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  payments: Array<{
    method: 'cash' | 'card' | 'wallet' | 'bank';
    amount: number;
  }>;
};

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  EUR: 'EUR ',
  GBP: 'GBP ',
  KES: 'KES ',
  AED: 'AED ',
};

const SALES_FLOW: Array<'draft' | 'open' | 'settled' | 'closed' | 'canceled'> = ['draft', 'open', 'settled', 'closed', 'canceled'];

export function SalesModuleContent({ module }: { module: BusinessModuleSpec }) {
  const [rows, setRows] = useState<SalesOrderRow[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [ruleName, setRuleName] = useState('');
  const [ruleKind, setRuleKind] = useState<'discount' | 'tier' | 'promotion'>('discount');
  const [ruleValue, setRuleValue] = useState('0');

  const [credits, setCredits] = useState<CreditProfile[]>([]);
  const [creditCustomer, setCreditCustomer] = useState('');
  const [creditLimit, setCreditLimit] = useState('0');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [currency, setCurrency] = useState('USD');
  const [channel, setChannel] = useState<'pos' | 'warehouse' | 'ecommerce'>('pos');
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
        const [salesResponse, productsResponse, employeesResponse] = await Promise.all([
          fetch('/api/business/sales/orders', { cache: 'no-store' }),
          fetch('/api/business/products', { cache: 'no-store' }),
          fetch('/api/business/hr/operations', { cache: 'no-store' }),
        ]);

        const salesData = (await salesResponse.json()) as { ok: boolean; orders?: SalesOrderRow[] };
        const productsData = (await productsResponse.json()) as {
          ok: boolean;
          products?: Array<{ id: string; name: string; sku: string | null; category: string | null; productType: string; basePrice: number | null }>;
        };
        const employeesData = (await employeesResponse.json()) as {
          ok: boolean;
          employees?: Array<{ id: string; name: string; email: string }>;
        };

        if (!mounted) return;

        if (salesData.ok && salesData.orders) {
          setRows(salesData.orders);
        } else {
          setRows([]);
        }

        if (productsData.ok && productsData.products) {
          setProducts(productsData.products.map((item) => ({
            id: item.id,
            name: item.name,
            sku: item.sku ?? item.name,
            category: item.category ?? 'general',
            productType: item.productType,
            basePrice: item.basePrice ?? 0,
          })));
        }

        if (employeesData.ok && employeesData.employees) {
          setEmployees(employeesData.employees);
        }
      } catch {
        if (!mounted) return;
        setRows([]);
      }

      if (typeof window !== 'undefined') {
        const rulesRaw = window.localStorage.getItem('pinkplan:sales:pricing-rules');
        const creditsRaw = window.localStorage.getItem('pinkplan:sales:credits');
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
    window.localStorage.setItem('pinkplan:sales:offline-queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    if (!selectedProductId) return;
    const product = products.find((item) => item.id === selectedProductId);
    if (product) {
      setSelectedPrice(String(product.basePrice));
    }
  }, [selectedProductId, products]);

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

  const salespersonTracking = useMemo(() => {
    return employees.map((employee) => {
      const employeeOrders = rows.filter((order) => order.employeeId === employee.id);
      return {
        id: employee.id,
        name: employee.name,
        orders: employeeOrders.length,
        amount: employeeOrders.reduce((sum, order) => sum + order.total, 0),
      };
    });
  }, [employees, rows]);

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
          unitPrice: matched.basePrice,
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
    setSelectedPrice(String(product.basePrice));
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
      const index = SALES_FLOW.findIndex((state) => state === row.status);
      const next = SALES_FLOW[(index + 1 + SALES_FLOW.length) % SALES_FLOW.length];
      void fetch('/api/business/sales/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, status: next }),
      });
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
    const response = await fetch('/api/business/sales/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale),
    });
    return response.ok;
  };

  const checkout = async () => {
    if (cart.length === 0 || posTotal <= 0 || !selectedEmployeeId) return;

    const sale: OfflineSale = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      employeeId: selectedEmployeeId,
      currency,
      channel,
      status: offlineMode ? 'draft' : 'open',
      lines: cart.map((line) => ({
        productId: line.productId,
        quantity: line.qty,
        unitPrice: line.unitPrice,
      })),
      payments: splitPayments.map((payment) => ({
        method: payment.method,
        amount: Number(payment.amount || 0),
      })),
    };

    if (offlineMode) {
      setOfflineQueue((prev) => [sale, ...prev]);
    } else {
      const saved = await persistSale(sale);
      if (saved) {
        const refresh = await fetch('/api/business/sales/orders', { cache: 'no-store' });
        const data = (await refresh.json()) as { ok: boolean; orders?: SalesOrderRow[] };
        if (data.ok && data.orders) {
          setRows(data.orders);
        }
      } else {
        setOfflineQueue((prev) => [sale, ...prev]);
      }
    }

    const cashPaid = splitPayments
      .filter((split) => split.method === 'cash')
      .reduce((sum, split) => sum + Number(split.amount || 0), 0);

    if (cashDrawerOpen && cashPaid > 0) {
      setCashDrawerBalance((prev) => prev + cashPaid);
    }

    setCart([]);
    setSplitPayments([{ id: 'p1', method: 'cash', amount: 0 }]);
    setSelectedEmployeeId('');
  };

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    const queued = [...offlineQueue];
    const stillQueued: OfflineSale[] = [];

    for (const item of queued) {
      // Serial sync keeps order deterministic for receipts and reconciliation.
      const ok = await persistSale({ ...item, status: 'open' });
      if (!ok) stillQueued.push(item);
    }

    setOfflineQueue(stillQueued);

    const refresh = await fetch('/api/business/sales/orders', { cache: 'no-store' });
    const data = (await refresh.json()) as { ok: boolean; orders?: SalesOrderRow[] };
    if (data.ok && data.orders) {
      setRows(data.orders);
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

            <div className="grid gap-3 md:grid-cols-5">
              <Input placeholder="Barcode / SKU" value={barcode} onChange={(event) => setBarcode(event.target.value)} />
              <Button variant="outline" className="border-white/10 bg-card/40" onClick={addBarcodeLine}>Scan Barcode</Button>
              <select
                value={selectedEmployeeId}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select employee ID</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.id.slice(0, 8)} • {employee.name}</option>
                ))}
              </select>
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
              <select
                value={channel}
                onChange={(event) => setChannel(event.target.value as 'pos' | 'warehouse' | 'ecommerce')}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="pos">POS</option>
                <option value="warehouse">Warehouse</option>
                <option value="ecommerce">E-commerce</option>
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
                    onChange={(event) => {
                      const method = event.target.value;
                      if (isPaymentMethod(method)) {
                        updateSplit(line.id, { method });
                      }
                    }}
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
              <Button className="gradient-amber text-black font-semibold" onClick={checkout} disabled={cart.length === 0 || !selectedEmployeeId}>Checkout</Button>
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
            <CardDescription>Computed from Sales Orders linked to employee IDs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {salespersonTracking.map((rep) => (
                <div key={rep.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                  <p className="font-medium text-foreground">{rep.name} ({rep.id.slice(0, 8)})</p>
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
          <CardDescription>Relational sales orders linked to employees and products.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'draft', 'open', 'settled', 'closed', 'canceled'].map((option) => (
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
                  <p className="font-medium text-foreground">{row.orderNo} • {row.employeeName}</p>
                  <p className="text-sm text-muted-foreground">{row.channel.toUpperCase()} • {new Date(row.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-primary">{CURRENCY_SYMBOL[row.currency] ?? ''}{row.total.toFixed(2)} • {row.lines.length} lines</p>
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
