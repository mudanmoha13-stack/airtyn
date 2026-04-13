"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/lib/store';

type Product = { id: string; name?: string; basePrice?: number; category?: string };
type TableRecord = { id: string; code?: string; name?: string; floor?: string; status?: string; capacity?: number };
type OrderLine = { productId: string; productName: string; quantity: number; unitPrice: number; lineTotal: number };

const toCurrency = (value: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 2 }).format(value || 0);

type POSMode = 'table-select' | 'order-build' | 'payment' | 'complete';

export function RestaurantBuiltInPOS({ branchId, onOrderComplete }: { branchId: string; onOrderComplete?: (orderId: string) => void }) {
  const { currentTenant, currentUser } = useAppState();
  const [mode, setMode] = useState<POSMode>('table-select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Data
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // User selections
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null);
  const [waiterName, setWaiterName] = useState(currentUser?.name ?? '');

  // Order building
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Payment
  const [payments, setPayments] = useState({ cash: 0, card: 0, wallet: 0, bank: 0 });

  const apiHeaders = useMemo(
    () => ({ 'Content-Type': 'application/json', ...(currentTenant?.id ? { 'x-tenant-id': currentTenant.id } : {}), ...(currentUser?.email ? { 'x-owner-email': currentUser.email } : {}) }),
    [currentTenant?.id, currentUser?.email]
  );

  const apiFetch = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const response = await fetch(path, { ...init, headers: { ...apiHeaders, ...(init?.headers ?? {}) } });
      const data = (await response.json()) as { ok?: boolean; error?: string } & T;
      if (!response.ok || data.ok === false) throw new Error(data.error ?? `Request failed: ${response.status}`);
      return data as T;
    },
    [apiHeaders]
  );

  // Load tables and products
  const loadData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [tableRes, productRes] = await Promise.all([apiFetch<{ tables: TableRecord[] }>(`/api/business/restaurant/tables?branchId=${encodeURIComponent(branchId)}`), apiFetch<{ products: Product[] }>('/api/business/products')]);
      setTables(tableRes.tables ?? []);
      setProducts(productRes.products ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load POS data');
    } finally {
      setLoading(false);
    }
  }, [branchId, apiFetch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle table selection
  const onSelectTable = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (table) {
      setSelectedTableId(tableId);
      setSelectedTable(table);
      setOrderLines([]);
      setCustomerName('');
      setPayments({ cash: 0, card: 0, wallet: 0, bank: 0 });
      setMode('order-build');
      setError(null);
      setMessage(null);
    }
  };

  // Handle adding product to order
  const onAddProduct = (product: Product) => {
    const existing = orderLines.find((line) => line.productId === product.id);
    if (existing) {
      setOrderLines((current) => current.map((line) => (line.productId === product.id ? { ...line, quantity: line.quantity + 1, lineTotal: (line.quantity + 1) * line.unitPrice } : line)));
    } else {
      setOrderLines((current) => [...current, { productId: product.id, productName: product.name ?? product.id, quantity: 1, unitPrice: Number(product.basePrice ?? 0), lineTotal: Number(product.basePrice ?? 0) }]);
    }
  };

  // Handle line modifications
  const updateLineQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderLines((current) => current.filter((line) => line.productId !== productId));
    } else {
      setOrderLines((current) =>
        current.map((line) =>
          line.productId === productId
            ? {
                ...line,
                quantity,
                lineTotal: quantity * line.unitPrice,
              }
            : line
        )
      );
    }
  };

  const removeLine = (productId: string) => {
    setOrderLines((current) => current.filter((line) => line.productId !== productId));
  };

  // Calculate totals
  const orderTotal = useMemo(() => orderLines.reduce((sum, line) => sum + line.lineTotal, 0), [orderLines]);
  const paidTotal = useMemo(() => payments.cash + payments.card + payments.wallet + payments.bank, [payments]);
  const change = Math.max(0, paidTotal - orderTotal);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'all') return products;
    return products.filter((p) => p.category === categoryFilter);
  }, [products, categoryFilter]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))), [products]);

  // Complete order
  const onCompleteOrder = async () => {
    if (!selectedTableId || orderLines.length === 0 || !currentUser?.id) {
      setError('Invalid order state');
      return;
    }

    if (paidTotal < orderTotal) {
      setError(`Insufficient payment. Total ${toCurrency(orderTotal)}, paid ${toCurrency(paidTotal)}.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        sessionId: `session-${Date.now()}`,
        branchId,
        tableId: selectedTableId,
        servedByEmployeeId: currentUser.id,
        customer: {
          name: customerName.trim() || selectedTable?.name || 'Walk-in Guest',
        },
        lines: orderLines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
        payments: [
          { method: 'cash', amount: payments.cash },
          { method: 'card', amount: payments.card },
          { method: 'wallet', amount: payments.wallet },
          { method: 'bank', amount: payments.bank },
        ].filter((p) => p.amount > 0),
        notes: `Waiter: ${waiterName}`,
      };

      const response = await apiFetch<{ orderId: string; orderNo: string; change: number }>('/api/business/restaurant/dine-in/close', { method: 'POST', body: JSON.stringify(payload) });

      setMessage(`✓ Order ${response.orderNo} completed. Change: ${toCurrency(response.change)}`);
      setMode('complete');
      if (onOrderComplete) onOrderComplete(response.orderId);

      // Reset after 2 seconds
      setTimeout(() => {
        setSelectedTableId('');
        setSelectedTable(null);
        setOrderLines([]);
        setCustomerName('');
        setPayments({ cash: 0, card: 0, wallet: 0, bank: 0 });
        setMode('table-select');
        setMessage(null);
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete order');
      setMode('order-build');
    } finally {
      setLoading(false);
    }
  };

  // Render based on mode
  if (mode === 'complete') {
    return (
      <Card className="glass-card border-white/5">
        <CardContent className="pt-6 text-center">
          <div className="text-4xl font-bold text-green-500 mb-2">✓</div>
          <p className="text-lg font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">Returning to table selection...</p>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'table-select') {
    return (
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle>Restaurant Built-In POS</CardTitle>
          <CardDescription>Select table to open order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Available Tables</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {tables.map((table) => (
                <Button
                  key={table.id}
                  variant={table.status === 'available' ? 'outline' : 'ghost'}
                  disabled={table.status !== 'available' || loading}
                  onClick={() => onSelectTable(table.id)}
                  className="h-24 flex-col"
                >
                  <p className="font-medium text-sm">{table.name ?? table.code ?? 'Table'}</p>
                  <p className="text-xs text-muted-foreground">{table.floor ?? 'Floor'}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {table.status ?? 'unknown'}
                  </Badge>
                </Button>
              ))}
            </div>
            {tables.length === 0 && <p className="text-sm text-muted-foreground">No tables configured for this branch.</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'order-build') {
    return (
      <div className="space-y-4">
        <Card className="glass-card border-white/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedTable?.name ?? 'Table'}</CardTitle>
                <CardDescription>{selectedTable?.floor ?? 'Floor'}</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setMode('table-select')} disabled={loading}>
                Change Table
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Customer name (optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <Input placeholder="Waiter name" value={waiterName} onChange={(e) => setWaiterName(e.target.value)} />
            </div>

            {/* Product Catalog */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Menu Items</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button variant={categoryFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('all')}>
                  All
                </Button>
                {categories.map((cat) => (
                  <Button key={cat} variant={categoryFilter === cat ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter(cat)}>
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {filteredProducts.map((product) => (
                  <Button key={product.id} variant="outline" className="h-20 flex-col" onClick={() => onAddProduct(product)}>
                    <p className="text-xs font-medium line-clamp-2">{product.name ?? product.id}</p>
                    <p className="text-xs text-primary font-bold mt-1">{toCurrency(product.basePrice ?? 0)}</p>
                  </Button>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <Card className="border-white/10 bg-background/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orderLines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items added yet</p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {orderLines.map((line) => (
                        <div key={line.productId} className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{line.productName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateLineQuantity(line.productId, line.quantity - 1)}>
                                -
                              </Button>
                              <span className="text-xs w-6 text-center">{line.quantity}</span>
                              <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateLineQuantity(line.productId, line.quantity + 1)}>
                                +
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 ml-auto text-destructive" onClick={() => removeLine(line.productId)}>
                                ✕
                              </Button>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <p className="font-medium">{toCurrency(line.lineTotal)}</p>
                            <p className="text-xs text-muted-foreground">{toCurrency(line.unitPrice)} ea</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">{toCurrency(orderTotal)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">{toCurrency(orderTotal)}</span>
                      </div>
                    </div>

                    <Button onClick={() => setMode('payment')} disabled={loading} className="w-full">
                      Proceed to Payment
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment mode
  return (
    <Card className="glass-card border-white/5">
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>Process payment for order at {selectedTable?.name ?? 'table'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <Card className="border-white/10 bg-background/20">
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Total:</span>
              <span className="font-bold">{toCurrency(orderTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Received:</span>
              <span className="font-bold">{toCurrency(paidTotal)}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <span className="font-medium">Change:</span>
              <span className={`font-bold ${change >= 0 ? 'text-green-500' : 'text-destructive'}`}>{toCurrency(change)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Payment Methods</p>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Cash</label>
              <Input type="number" min={0} step="0.01" value={payments.cash} onChange={(e) => setPayments((c) => ({ ...c, cash: Number(e.target.value || 0) }))} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Card</label>
              <Input type="number" min={0} step="0.01" value={payments.card} onChange={(e) => setPayments((c) => ({ ...c, card: Number(e.target.value || 0) }))} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Wallet/Mobile</label>
              <Input type="number" min={0} step="0.01" value={payments.wallet} onChange={(e) => setPayments((c) => ({ ...c, wallet: Number(e.target.value || 0) }))} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Bank Transfer</label>
              <Input type="number" min={0} step="0.01" value={payments.bank} onChange={(e) => setPayments((c) => ({ ...c, bank: Number(e.target.value || 0) }))} placeholder="0.00" />
            </div>
          </div>
        </div>

        <div className="grid gap-2 pt-4">
          <Button onClick={onCompleteOrder} disabled={loading || paidTotal < orderTotal} className="w-full bg-green-600 hover:bg-green-700">
            Complete Order
          </Button>
          <Button onClick={() => setMode('order-build')} variant="outline" disabled={loading} className="w-full">
            Back to Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
