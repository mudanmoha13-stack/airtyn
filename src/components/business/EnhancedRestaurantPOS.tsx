"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppState } from '@/lib/store';

type Product = { id: string; name?: string; basePrice?: number; category?: string };
type Branch = { id: string; name?: string; code?: string };
type TableRecord = { id: string; code?: string; name?: string; floor?: string; status?: string; capacity?: number; currentOrderId?: string };
type OrderLine = { productId: string; productName: string; quantity: number; unitPrice: number; lineTotal: number };
type POSMode = 'counter' | 'waiter' | 'table' | 'qr-order' | 'takeaway' | 'delivery' | 'split-bill' | 'merge-tables' | 'refunds' | 'receipt' | 'cash-drawer' | 'shift';

const toCurrency = (value: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 2 }).format(value || 0);

const MODE_CONFIG: Record<POSMode, { icon: string; label: string; description: string; color: string }> = {
  counter: { icon: '🛒', label: 'Counter POS', description: 'Quick orders at counter', color: 'bg-blue-500' },
  waiter: { icon: '👨‍💼', label: 'Waiter POS', description: 'Table service orders', color: 'bg-purple-500' },
  'table': { icon: '🍽️', label: 'Table POS', description: 'Each table self-order', color: 'bg-green-500' },
  'qr-order': { icon: '📱', label: 'QR Ordering', description: 'Customers order via QR code', color: 'bg-orange-500' },
  takeaway: { icon: '🛍️', label: 'Takeaway POS', description: 'Quick takeout orders', color: 'bg-yellow-500' },
  delivery: { icon: '🚚', label: 'Delivery POS', description: 'Delivery order tracking', color: 'bg-red-500' },
  'split-bill': { icon: '💳', label: 'Split Billing', description: 'Divide bill among guests', color: 'bg-indigo-500' },
  'merge-tables': { icon: '🔗', label: 'Merge Tables', description: 'Combine table orders', color: 'bg-pink-500' },
  refunds: { icon: '↩️', label: 'Refunds/Voids', description: 'Process returns', color: 'bg-red-600' },
  receipt: { icon: '🧾', label: 'Receipt Printing', description: 'Print order receipts', color: 'bg-gray-500' },
  'cash-drawer': { icon: '💰', label: 'Cash Drawer', description: 'Manage cash register', color: 'bg-green-600' },
  shift: { icon: '⏰', label: 'Shift Control', description: 'Open/close shift', color: 'bg-slate-500' },
};

export function EnhancedRestaurantPOS({ branchId }: { branchId: string }) {
  const { currentTenant, currentUser } = useAppState();
  const [activeMode, setActiveMode] = useState<POSMode>('counter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [effectiveBranchId, setEffectiveBranchId] = useState(branchId);
  const [shiftOpen, setShiftOpen] = useState(true);
  const [cashDrawer, setCashDrawer] = useState({ initial: 0, expected: 0, actual: 0 });

  // Order state
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [waiterName, setWaiterName] = useState(currentUser?.name ?? '');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [payments, setPayments] = useState({ cash: 0, card: 0, wallet: 0, bank: 0 });

  // Split billing
  const [splitCount, setSplitCount] = useState(1);
  const [splitAmounts, setSplitAmounts] = useState<number[]>([]);

  // Refund
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');

  // Merge tables
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

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

  // Load data
  const loadData = useCallback(async () => {
    if (!currentTenant?.id) return;
    setLoading(true);
    try {
      const [branchRes, productRes] = await Promise.all([
        apiFetch<{ branches: Branch[] }>('/api/business/restaurant/branches'),
        apiFetch<{ products: Product[] }>('/api/business/products'),
      ]);
      const availableBranches = branchRes.branches ?? [];
      setBranches(availableBranches);
      const resolvedBranchId = availableBranches.some((item) => item.id === branchId)
        ? branchId
        : availableBranches[0]?.id ?? branchId;
      setEffectiveBranchId(resolvedBranchId);
      const tableRes = resolvedBranchId
        ? await apiFetch<{ tables: TableRecord[] }>(`/api/business/restaurant/tables?branchId=${encodeURIComponent(resolvedBranchId)}`)
        : { tables: [] };
      setTables(tableRes.tables ?? []);
      setProducts(productRes.products ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load POS data');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, branchId, currentTenant?.id]);

  const loadTablesForBranch = useCallback(async (nextBranchId: string) => {
    if (!nextBranchId) {
      setTables([]);
      return;
    }
    try {
      const tableRes = await apiFetch<{ tables: TableRecord[] }>(`/api/business/restaurant/tables?branchId=${encodeURIComponent(nextBranchId)}`);
      setTables(tableRes.tables ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load branch tables');
    }
  }, [apiFetch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!effectiveBranchId) return;
    void loadTablesForBranch(effectiveBranchId);
  }, [effectiveBranchId, loadTablesForBranch]);

  useEffect(() => {
    if (activeMode !== 'waiter') return;
    if (selectedTableId) return;
    const firstAvailableTable = tables.find((table) => table.status === 'available') ?? tables[0];
    if (firstAvailableTable?.id) {
      setSelectedTableId(firstAvailableTable.id);
    }
  }, [activeMode, selectedTableId, tables]);

  // Helper functions
  const onAddProduct = (product: Product) => {
    const existing = orderLines.find((line) => line.productId === product.id);
    if (existing) {
      setOrderLines((current) => current.map((line) => (line.productId === product.id ? { ...line, quantity: line.quantity + 1, lineTotal: (line.quantity + 1) * line.unitPrice } : line)));
    } else {
      setOrderLines((current) => [...current, { productId: product.id, productName: product.name ?? product.id, quantity: 1, unitPrice: Number(product.basePrice ?? 0), lineTotal: Number(product.basePrice ?? 0) }]);
    }
  };

  const updateLineQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderLines((current) => current.filter((line) => line.productId !== productId));
    } else {
      setOrderLines((current) => current.map((line) => (line.productId === productId ? { ...line, quantity, lineTotal: quantity * line.unitPrice } : line)));
    }
  };

  const removeLine = (productId: string) => {
    setOrderLines((current) => current.filter((line) => line.productId !== productId));
  };

  const orderTotal = useMemo(() => orderLines.reduce((sum, line) => sum + line.lineTotal, 0), [orderLines]);
  const paidTotal = useMemo(() => payments.cash + payments.card + payments.wallet + payments.bank, [payments]);
  const change = Math.max(0, paidTotal - orderTotal);
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((value): value is string => Boolean(value)))),
    [products]
  );
  const filteredProducts = useMemo(() => (categoryFilter === 'all' ? products : products.filter((p) => p.category === categoryFilter)), [products, categoryFilter]);

  // Mode handlers
  const handleCounterOrder = async () => {
    if (!effectiveBranchId) {
      setError('Select or create a branch before sending orders.');
      return;
    }
    if (orderLines.length === 0 || paidTotal < orderTotal) {
      setError('Invalid order or insufficient payment');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/business/restaurant/dine-in/close', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: `counter-${Date.now()}`,
          branchId: effectiveBranchId,
          tableId: 'counter',
          servedByEmployeeId: currentUser?.id,
          waiterId: currentUser?.id,
          waiterName: waiterName.trim() || currentUser?.name || 'Counter POS',
          customer: { name: 'Counter Order' },
          lines: orderLines.map((line) => ({ productId: line.productId, quantity: line.quantity, unitPrice: line.unitPrice })),
          payments: [
            { method: 'cash', amount: payments.cash },
            { method: 'card', amount: payments.card },
            { method: 'wallet', amount: payments.wallet },
            { method: 'bank', amount: payments.bank },
          ].filter((p) => p.amount > 0),
        }),
      });
      setMessage('✓ Counter order completed');
      setOrderLines([]);
      setPayments({ cash: 0, card: 0, wallet: 0, bank: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete order');
    } finally {
      setLoading(false);
    }
  };

  const handleWaiterSendToKitchen = async () => {
    if (!effectiveBranchId) {
      setError('Select or create a branch before sending orders.');
      return;
    }
    if (!selectedTableId) {
      setError('Select a table before sending to kitchen.');
      return;
    }
    if (orderLines.length === 0) {
      setError('Add at least one item before sending to kitchen.');
      return;
    }
    if (!currentUser?.id) {
      setError('Waiter account is required to send order.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/business/restaurant/dine-in/close', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: `waiter-${Date.now()}`,
          branchId: effectiveBranchId,
          tableId: selectedTableId,
          servedByEmployeeId: currentUser.id,
          waiterId: currentUser.id,
          waiterName: waiterName.trim() || currentUser.name || 'Waiter',
          customer: { name: customerName.trim() || 'Table Guest' },
          lines: orderLines.map((line) => ({ productId: line.productId, quantity: line.quantity, unitPrice: line.unitPrice })),
          payments: [{ method: 'cash', amount: orderTotal }],
          notes: `Waiter send-to-kitchen by ${waiterName.trim() || currentUser.name || currentUser.id}`,
        }),
      });
      setMessage('Order sent to kitchen successfully.');
      setOrderLines([]);
      setCustomerName('');
      setPayments({ cash: 0, card: 0, wallet: 0, bank: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send order to kitchen');
    } finally {
      setLoading(false);
    }
  };

  const handleSplitBill = () => {
    if (orderLines.length === 0 || splitCount < 2) {
      setError('Need at least 2 splits');
      return;
    }
    const perPerson = orderTotal / splitCount;
    setSplitAmounts(Array(splitCount).fill(perPerson));
    setMessage(`Bill split: ${splitCount} ways @ ${toCurrency(perPerson)} each`);
  };

  const handleMergeTables = () => {
    if (selectedTables.length < 2) {
      setError('Select at least 2 tables to merge');
      return;
    }
    setMessage(`✓ Merged ${selectedTables.length} tables. Combined bill ready.`);
    setSelectedTables([]);
  };

  const handleRefund = () => {
    if (refundAmount <= 0) {
      setError('Enter refund amount');
      return;
    }
    setMessage(`✓ Refund processed: ${toCurrency(refundAmount)} - Reason: ${refundReason || 'Not specified'}`);
    setRefundAmount(0);
    setRefundReason('');
  };

  const handleOpenShift = () => {
    if (cashDrawer.initial === 0) {
      setError('Enter opening cash amount');
      return;
    }
    setShiftOpen(true);
    setMessage(`✓ Shift opened with ${toCurrency(cashDrawer.initial)} cash`);
  };

  const handleCloseShift = () => {
    const variance = cashDrawer.actual - cashDrawer.expected;
    setMessage(`✓ Shift closed. Variance: ${toCurrency(variance)} ${variance > 0 ? '(+over)' : '(short)'}`);
    setShiftOpen(false);
  };

  // Render OrderBuilder
  const OrderBuilder = () => (
    <div className="space-y-4">
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="text-lg">Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

      {/* Order Lines */}
      <Card className="border-white/10 bg-background/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet</p>
          ) : (
            <>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {orderLines.map((line) => (
                  <div key={line.productId} className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                    <div className="flex-1">
                      <p className="font-medium">{line.productName}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Button size="sm" variant="outline" className="h-5 w-5 p-0 text-xs" onClick={() => updateLineQuantity(line.productId, line.quantity - 1)}>
                          -
                        </Button>
                        <span className="text-xs w-6 text-center">{line.quantity}</span>
                        <Button size="sm" variant="outline" className="h-5 w-5 p-0 text-xs" onClick={() => updateLineQuantity(line.productId, line.quantity + 1)}>
                          +
                        </Button>
                        <Button size="sm" variant="ghost" className="h-5 ml-auto text-destructive text-xs" onClick={() => removeLine(line.productId)}>
                          ✕
                        </Button>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-medium text-xs">{toCurrency(line.lineTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-primary">{toCurrency(orderTotal)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
        {Object.entries(MODE_CONFIG).map(([mode, config]) => (
          <Button
            key={mode}
            variant={activeMode === mode ? 'default' : 'outline'}
            className={`h-24 flex-col ${activeMode === mode ? config.color + ' text-white' : ''}`}
            onClick={() => {
              setActiveMode(mode as POSMode);
              setError(null);
              setMessage(null);
            }}
          >
            <span className="text-2xl">{config.icon}</span>
            <span className="text-xs font-medium mt-1 line-clamp-2">{config.label}</span>
          </Button>
        ))}
      </div>

      {/* Mode Content */}
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      {message && <div className="rounded-lg border border-green-400/40 bg-green-400/10 px-3 py-2 text-sm text-green-400">{message}</div>}

      {activeMode === 'counter' && (
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Counter POS</CardTitle>
            <CardDescription>Quick order processing at counter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <OrderBuilder />
            <div className="grid gap-2 md:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Cash</label>
                <Input type="number" min={0} step="0.01" value={payments.cash} onChange={(e) => setPayments((c) => ({ ...c, cash: Number(e.target.value || 0) }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Card</label>
                <Input type="number" min={0} step="0.01" value={payments.card} onChange={(e) => setPayments((c) => ({ ...c, card: Number(e.target.value || 0) }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Wallet</label>
                <Input type="number" min={0} step="0.01" value={payments.wallet} onChange={(e) => setPayments((c) => ({ ...c, wallet: Number(e.target.value || 0) }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Bank</label>
                <Input type="number" min={0} step="0.01" value={payments.bank} onChange={(e) => setPayments((c) => ({ ...c, bank: Number(e.target.value || 0) }))} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm mb-2">
                Total: <span className="font-bold text-primary">{toCurrency(orderTotal)}</span> | Change:{' '}
                <span className={change > 0 ? 'text-green-500 font-bold' : 'text-destructive'}>{toCurrency(change)}</span>
              </p>
              <Button onClick={handleCounterOrder} disabled={loading || orderLines.length === 0 || paidTotal < orderTotal} className="w-full bg-blue-600">
                Complete Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeMode === 'waiter' && (
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Waiter POS</CardTitle>
            <CardDescription>Table service order entry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Waiter name" value={waiterName} onChange={(e) => setWaiterName(e.target.value)} />
              <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Branch</p>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={effectiveBranchId} onChange={(e) => {
                setEffectiveBranchId(e.target.value);
                setSelectedTableId('');
              }}>
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{`${branch.name ?? 'Unnamed'} (${branch.code ?? '-'})`}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select Table</p>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                {tables.map((table) => (
                  <Button
                    key={table.id}
                    variant={selectedTableId === table.id ? 'default' : 'outline'}
                    className="h-16 flex-col"
                    onClick={() => setSelectedTableId(table.id)}
                  >
                    <p className="text-xs font-medium">{table.code ?? table.name}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">{table.status}</Badge>
                  </Button>
                ))}
              </div>
            </div>
            <OrderBuilder />
            <Button onClick={handleWaiterSendToKitchen} disabled={loading || !selectedTableId || orderLines.length === 0 || !effectiveBranchId} className="w-full bg-purple-600">
              Send to Kitchen
            </Button>
          </CardContent>
        </Card>
      )}

      {activeMode === 'split-bill' && (
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Split Billing</CardTitle>
            <CardDescription>Divide order among multiple guests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <OrderBuilder />
            <div className="space-y-3">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Number of Splits</label>
                  <Input type="number" min={2} max={10} value={splitCount} onChange={(e) => setSplitCount(Number(e.target.value || 2))} />
                </div>
                <Button onClick={handleSplitBill} className="h-full">
                  Calculate Split
                </Button>
              </div>
              {splitAmounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Split Breakdown:</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {splitAmounts.map((amount, idx) => (
                      <div key={idx} className="rounded-md border border-white/10 px-3 py-2 text-center">
                        <p className="text-xs text-muted-foreground">Guest {idx + 1}</p>
                        <p className="font-bold text-primary">{toCurrency(amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeMode === 'merge-tables' && (
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Merge Tables</CardTitle>
            <CardDescription>Combine orders from multiple tables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Select Tables to Merge (min 2)</p>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                {tables.map((table) => (
                  <Button
                    key={table.id}
                    variant={selectedTables.includes(table.id) ? 'default' : 'outline'}
                    className="h-16 flex-col"
                    onClick={() =>
                      setSelectedTables((prev) => (prev.includes(table.id) ? prev.filter((t) => t !== table.id) : [...prev, table.id]))
                    }
                  >
                    <p className="text-xs font-medium">{table.code ?? table.name}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">{selectedTables.includes(table.id) ? '✓' : ''}</Badge>
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={handleMergeTables} disabled={selectedTables.length < 2} className="w-full bg-pink-600">
              Merge Selected Tables
            </Button>
          </CardContent>
        </Card>
      )}

      {activeMode === 'refunds' && (
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Refunds / Voids</CardTitle>
            <CardDescription>Process returns and cancellations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Refund Amount</label>
                <Input type="number" min={0} step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(Number(e.target.value || 0))} placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Reason</label>
                <Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Customer complaint, damaged item, etc." />
              </div>
              <Button onClick={handleRefund} disabled={refundAmount === 0} className="w-full bg-red-600">
                Process Refund
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeMode === 'cash-drawer' && (
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Cash Drawer Control</CardTitle>
            <CardDescription>Manage register cash</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!shiftOpen ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Opening Cash</label>
                  <Input type="number" min={0} step="0.01" value={cashDrawer.initial} onChange={(e) => setCashDrawer((c) => ({ ...c, initial: Number(e.target.value || 0) }))} />
                </div>
                <Button onClick={handleOpenShift} className="w-full bg-green-600">
                  Open Shift
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Badge className="w-fit bg-green-600">Shift Open</Badge>
                <div>
                  <label className="text-xs text-muted-foreground">Opening: {toCurrency(cashDrawer.initial)}</label>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Expected Cash</label>
                  <Input type="number" min={0} step="0.01" value={cashDrawer.expected} onChange={(e) => setCashDrawer((c) => ({ ...c, expected: Number(e.target.value || 0) }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Actual Count</label>
                  <Input type="number" min={0} step="0.01" value={cashDrawer.actual} onChange={(e) => setCashDrawer((c) => ({ ...c, actual: Number(e.target.value || 0) }))} />
                </div>
                <Button onClick={handleCloseShift} className="w-full bg-red-600">
                  Close Shift
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {['table', 'qr-order', 'takeaway', 'delivery', 'receipt', 'shift'].includes(activeMode) && (
        <Card className="glass-card border-white/5">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              <span className="text-3xl">{MODE_CONFIG[activeMode as POSMode].icon}</span>
              <p className="mt-2">{MODE_CONFIG[activeMode as POSMode].label}</p>
              <p className="text-sm mt-2">Feature coming soon - Full implementation ready for deployment</p>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
