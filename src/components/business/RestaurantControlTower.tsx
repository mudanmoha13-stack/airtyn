"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/lib/store';

type Branch = {
  id: string;
  name?: string;
  code?: string;
  city?: string;
};

type TableRecord = {
  id: string;
  code?: string;
  name?: string;
  floor?: string;
  status?: string;
  capacity?: number;
};

type Reservation = {
  id: string;
  guestName?: string;
  slotAt?: string;
  status?: string;
  tableId?: string | null;
};

type PosSession = {
  id: string;
  terminalName?: string;
  status?: string;
  openedAt?: string;
};

type Product = {
  id: string;
  name?: string;
  basePrice?: number;
};

type DineInLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

const toCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 2 }).format(value || 0);

export function RestaurantControlTower() {
  const { currentTenant, currentUser } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [sessions, setSessions] = useState<PosSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState('');

  const [branchForm, setBranchForm] = useState({ name: '', code: '', city: '' });
  const [tableForm, setTableForm] = useState({ floor: 'Main Floor', code: '', name: '', capacity: 4 });
  const [reservationForm, setReservationForm] = useState({ guestName: '', pax: 2, slotAt: '', tableId: '' });
  const [openSessionForm, setOpenSessionForm] = useState({ terminalName: 'Main POS', openingCash: 0 });
  const [closeSessionForm, setCloseSessionForm] = useState({ closingCash: 0, expectedCash: 0, cashSales: 0, cardSales: 0, walletSales: 0, bankSales: 0 });

  const [lineItems, setLineItems] = useState<DineInLine[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [payments, setPayments] = useState({ cash: 0, card: 0, wallet: 0, bank: 0 });

  const apiHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(currentTenant?.id ? { 'x-tenant-id': currentTenant.id } : {}),
      ...(currentUser?.email ? { 'x-owner-email': currentUser.email } : {}),
    }),
    [currentTenant?.id, currentUser?.email]
  );

  const apiFetch = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const response = await fetch(path, {
        ...init,
        headers: {
          ...apiHeaders,
          ...(init?.headers ?? {}),
        },
      });
      const data = (await response.json()) as { ok?: boolean; error?: string } & T;
      if (!response.ok || data.ok === false) {
        throw new Error(data.error ?? `Request failed: ${response.status}`);
      }
      return data as T;
    },
    [apiHeaders]
  );

  const loadMeta = useCallback(async () => {
    const [branchRes, productRes] = await Promise.all([
      apiFetch<{ branches: Branch[] }>('/api/business/restaurant/branches'),
      apiFetch<{ products: Product[] }>('/api/business/products'),
    ]);

    setBranches(branchRes.branches ?? []);
    setProducts(productRes.products ?? []);

    const nextBranchId = selectedBranchId || branchRes.branches?.[0]?.id || '';
    if (nextBranchId) setSelectedBranchId(nextBranchId);
  }, [apiFetch, selectedBranchId]);

  const loadBranchData = useCallback(
    async (branchId: string) => {
      if (!branchId) {
        setTables([]);
        setReservations([]);
        setSessions([]);
        return;
      }

      const [tableRes, reservationRes, sessionRes] = await Promise.all([
        apiFetch<{ tables: TableRecord[] }>(`/api/business/restaurant/tables?branchId=${encodeURIComponent(branchId)}`),
        apiFetch<{ reservations: Reservation[] }>(`/api/business/restaurant/reservations?branchId=${encodeURIComponent(branchId)}`),
        apiFetch<{ sessions: PosSession[] }>(`/api/business/restaurant/pos-sessions?branchId=${encodeURIComponent(branchId)}`),
      ]);

      setTables(tableRes.tables ?? []);
      setReservations(reservationRes.reservations ?? []);
      setSessions(sessionRes.sessions ?? []);

      if (!selectedSessionId && (sessionRes.sessions ?? []).length > 0) {
        setSelectedSessionId(sessionRes.sessions[0].id);
      }
      if (!selectedTableId && (tableRes.tables ?? []).length > 0) {
        setSelectedTableId(tableRes.tables[0].id);
      }
    },
    [apiFetch, selectedSessionId, selectedTableId]
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadMeta();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  }, [loadMeta]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    void loadBranchData(selectedBranchId);
  }, [selectedBranchId, loadBranchData]);

  const lineTotal = useMemo(() => lineItems.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), [lineItems]);
  const paidTotal = useMemo(() => payments.cash + payments.card + payments.wallet + payments.bank, [payments]);

  const onCreateBranch = async () => {
    if (!branchForm.name.trim() || !branchForm.code.trim() || !branchForm.city.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/branches', {
        method: 'POST',
        body: JSON.stringify({
          name: branchForm.name.trim(),
          code: branchForm.code.trim(),
          city: branchForm.city.trim(),
        }),
      });
      setBranchForm({ name: '', code: '', city: '' });
      setMessage('Branch created.');
      await refreshAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  const onCreateTable = async () => {
    if (!selectedBranchId || !tableForm.code.trim() || !tableForm.name.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/tables', {
        method: 'POST',
        body: JSON.stringify({
          branchId: selectedBranchId,
          floor: tableForm.floor.trim(),
          code: tableForm.code.trim(),
          name: tableForm.name.trim(),
          capacity: tableForm.capacity,
        }),
      });
      setTableForm((current) => ({ ...current, code: '', name: '' }));
      setMessage('Table created.');
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create table');
    } finally {
      setLoading(false);
    }
  };

  const onCreateReservation = async () => {
    if (!selectedBranchId || !reservationForm.guestName.trim() || !reservationForm.slotAt) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/reservations', {
        method: 'POST',
        body: JSON.stringify({
          branchId: selectedBranchId,
          tableId: reservationForm.tableId || undefined,
          guestName: reservationForm.guestName.trim(),
          pax: reservationForm.pax,
          slotAt: new Date(reservationForm.slotAt).toISOString(),
        }),
      });
      setReservationForm({ guestName: '', pax: 2, slotAt: '', tableId: '' });
      setMessage('Reservation created.');
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const onReservationAction = async (id: string, action: 'confirm' | 'seat' | 'complete' | 'cancel' | 'no_show') => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/reservations', {
        method: 'PATCH',
        body: JSON.stringify({ id, action }),
      });
      setMessage(`Reservation ${action}ed.`);
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed reservation action');
    } finally {
      setLoading(false);
    }
  };

  const onOpenSession = async () => {
    if (!selectedBranchId || !openSessionForm.terminalName.trim() || !currentUser?.id) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/pos-sessions', {
        method: 'POST',
        body: JSON.stringify({
          branchId: selectedBranchId,
          terminalName: openSessionForm.terminalName.trim(),
          openedByUserId: currentUser.id,
          openingCash: openSessionForm.openingCash,
        }),
      });
      setMessage('POS session opened.');
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open session');
    } finally {
      setLoading(false);
    }
  };

  const onCloseSession = async () => {
    if (!selectedSessionId || !currentUser?.id) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/pos-sessions', {
        method: 'PATCH',
        body: JSON.stringify({
          id: selectedSessionId,
          closedByUserId: currentUser.id,
          ...closeSessionForm,
        }),
      });
      setMessage('POS session closed.');
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to close session');
    } finally {
      setLoading(false);
    }
  };

  const updateLine = (index: number, next: Partial<DineInLine>) => {
    setLineItems((current) => current.map((line, i) => (i === index ? { ...line, ...next } : line)));
  };

  const onAddLine = () => {
    setLineItems((current) => [...current, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const onRemoveLine = (index: number) => {
    setLineItems((current) => current.filter((_, i) => i !== index));
  };

  const onCloseDineIn = async () => {
    if (!selectedBranchId || !selectedSessionId || !selectedTableId || !currentUser?.id) return;
    const validLines = lineItems.filter((line) => line.productId && line.quantity > 0);
    if (validLines.length === 0) {
      setError('Add at least one product line before closing dine-in order.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        sessionId: selectedSessionId,
        branchId: selectedBranchId,
        tableId: selectedTableId,
        servedByEmployeeId: currentUser.id,
        reservationId: selectedReservationId || undefined,
        customer: {
          name: customerName.trim() || 'Walk-in Guest',
          ...(customerPhone.trim() ? { phone: customerPhone.trim() } : {}),
        },
        lines: validLines,
        payments: [
          { method: 'cash', amount: payments.cash },
          { method: 'card', amount: payments.card },
          { method: 'wallet', amount: payments.wallet },
          { method: 'bank', amount: payments.bank },
        ].filter((p) => p.amount > 0),
      };

      if (payload.payments.length === 0) {
        setError('Enter at least one payment amount.');
        return;
      }

      const response = await apiFetch<{ orderNo: string; change: number }>('/api/business/restaurant/dine-in/close', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessage(`Dine-in closed: ${response.orderNo}. Change ${toCurrency(response.change)}.`);
      setSelectedReservationId('');
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to close dine-in order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-2 w-fit rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
              Restaurant Phase 1
            </Badge>
            <h1 className="text-3xl font-bold">Restaurant Control Tower</h1>
            <p className="text-sm text-muted-foreground">Run branch setup, table service, reservations, POS sessions, and dine-in close from one workflow.</p>
          </div>
          <Button variant="outline" onClick={() => void refreshAll()} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error ? <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
        {message ? <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</div> : null}

        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Active Context</CardTitle>
            <CardDescription>Select branch, POS session, and table context for operations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Branch</span>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}>
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{`${branch.name ?? 'Unnamed'} (${branch.code ?? '-'})`}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">POS Session</span>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
                <option value="">Select session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>{`${session.terminalName ?? 'Terminal'} - ${session.status ?? 'unknown'}`}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Table</span>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)}>
                <option value="">Select table</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>{`${table.code ?? 'TBL'} (${table.status ?? 'available'})`}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Reservation (optional)</span>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedReservationId} onChange={(e) => setSelectedReservationId(e.target.value)}>
                <option value="">No reservation</option>
                {reservations.map((reservation) => (
                  <option key={reservation.id} value={reservation.id}>{`${reservation.guestName ?? 'Guest'} - ${reservation.status ?? 'booked'}`}</option>
                ))}
              </select>
            </label>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle>Branch and Table Setup</CardTitle>
              <CardDescription>Create branch and table master data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium">Create Branch</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input placeholder="Branch name" value={branchForm.name} onChange={(e) => setBranchForm((c) => ({ ...c, name: e.target.value }))} />
                  <Input placeholder="Code" value={branchForm.code} onChange={(e) => setBranchForm((c) => ({ ...c, code: e.target.value }))} />
                  <Input placeholder="City" value={branchForm.city} onChange={(e) => setBranchForm((c) => ({ ...c, city: e.target.value }))} />
                </div>
                <Button onClick={() => void onCreateBranch()} disabled={loading}>Create branch</Button>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <p className="text-sm font-medium">Create Table</p>
                <div className="grid gap-3 md:grid-cols-4">
                  <Input placeholder="Floor" value={tableForm.floor} onChange={(e) => setTableForm((c) => ({ ...c, floor: e.target.value }))} />
                  <Input placeholder="Code" value={tableForm.code} onChange={(e) => setTableForm((c) => ({ ...c, code: e.target.value }))} />
                  <Input placeholder="Name" value={tableForm.name} onChange={(e) => setTableForm((c) => ({ ...c, name: e.target.value }))} />
                  <Input type="number" min={1} max={30} value={tableForm.capacity} onChange={(e) => setTableForm((c) => ({ ...c, capacity: Number(e.target.value || 1) }))} />
                </div>
                <Button onClick={() => void onCreateTable()} disabled={loading || !selectedBranchId}>Create table</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle>Reservations</CardTitle>
              <CardDescription>Capture and progress reservation lifecycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Input placeholder="Guest name" value={reservationForm.guestName} onChange={(e) => setReservationForm((c) => ({ ...c, guestName: e.target.value }))} />
                <Input type="number" min={1} max={30} value={reservationForm.pax} onChange={(e) => setReservationForm((c) => ({ ...c, pax: Number(e.target.value || 1) }))} />
                <Input type="datetime-local" value={reservationForm.slotAt} onChange={(e) => setReservationForm((c) => ({ ...c, slotAt: e.target.value }))} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={reservationForm.tableId} onChange={(e) => setReservationForm((c) => ({ ...c, tableId: e.target.value }))}>
                  <option value="">No table pre-assigned</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>{table.code ?? table.id}</option>
                  ))}
                </select>
              </div>
              <Button onClick={() => void onCreateReservation()} disabled={loading || !selectedBranchId}>Create reservation</Button>

              <div className="space-y-2 border-t border-white/10 pt-3">
                {reservations.slice(0, 8).map((reservation) => (
                  <div key={reservation.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 px-3 py-2 text-sm">
                    <span>{`${reservation.guestName ?? 'Guest'} • ${reservation.status ?? 'booked'}`}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => void onReservationAction(reservation.id, 'confirm')}>Confirm</Button>
                      <Button size="sm" variant="outline" onClick={() => void onReservationAction(reservation.id, 'seat')}>Seat</Button>
                      <Button size="sm" variant="outline" onClick={() => void onReservationAction(reservation.id, 'complete')}>Complete</Button>
                    </div>
                  </div>
                ))}
                {reservations.length === 0 ? <p className="text-sm text-muted-foreground">No reservations yet.</p> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle>POS Session Controls</CardTitle>
              <CardDescription>Open and close shift sessions with reconciliation fields.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <p className="text-sm font-medium">Open session</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Terminal name" value={openSessionForm.terminalName} onChange={(e) => setOpenSessionForm((c) => ({ ...c, terminalName: e.target.value }))} />
                  <Input type="number" min={0} step="0.01" value={openSessionForm.openingCash} onChange={(e) => setOpenSessionForm((c) => ({ ...c, openingCash: Number(e.target.value || 0) }))} />
                </div>
                <Button onClick={() => void onOpenSession()} disabled={loading || !selectedBranchId || !currentUser?.id}>Open POS session</Button>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <p className="text-sm font-medium">Close session</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input type="number" min={0} step="0.01" placeholder="Closing cash" value={closeSessionForm.closingCash} onChange={(e) => setCloseSessionForm((c) => ({ ...c, closingCash: Number(e.target.value || 0) }))} />
                  <Input type="number" min={0} step="0.01" placeholder="Expected cash" value={closeSessionForm.expectedCash} onChange={(e) => setCloseSessionForm((c) => ({ ...c, expectedCash: Number(e.target.value || 0) }))} />
                  <Input type="number" min={0} step="0.01" placeholder="Cash sales" value={closeSessionForm.cashSales} onChange={(e) => setCloseSessionForm((c) => ({ ...c, cashSales: Number(e.target.value || 0) }))} />
                  <Input type="number" min={0} step="0.01" placeholder="Card sales" value={closeSessionForm.cardSales} onChange={(e) => setCloseSessionForm((c) => ({ ...c, cardSales: Number(e.target.value || 0) }))} />
                  <Input type="number" min={0} step="0.01" placeholder="Wallet sales" value={closeSessionForm.walletSales} onChange={(e) => setCloseSessionForm((c) => ({ ...c, walletSales: Number(e.target.value || 0) }))} />
                  <Input type="number" min={0} step="0.01" placeholder="Bank sales" value={closeSessionForm.bankSales} onChange={(e) => setCloseSessionForm((c) => ({ ...c, bankSales: Number(e.target.value || 0) }))} />
                </div>
                <Button onClick={() => void onCloseSession()} disabled={loading || !selectedSessionId || !currentUser?.id}>Close POS session</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle>Dine-In Close</CardTitle>
              <CardDescription>Create settled dine-in order, consume stock, post payment, release table.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                <Input placeholder="Phone (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>

              <div className="space-y-2">
                {lineItems.map((line, index) => (
                  <div key={`${index}-${line.productId}`} className="grid gap-2 md:grid-cols-4">
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={line.productId}
                      onChange={(e) => {
                        const product = products.find((item) => item.id === e.target.value);
                        updateLine(index, { productId: e.target.value, unitPrice: Number(product?.basePrice ?? 0) });
                      }}
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{`${product.name ?? product.id}`}</option>
                      ))}
                    </select>
                    <Input type="number" min={1} step="1" value={line.quantity} onChange={(e) => updateLine(index, { quantity: Number(e.target.value || 1) })} />
                    <Input type="number" min={0} step="0.01" value={line.unitPrice} onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value || 0) })} />
                    <Button variant="outline" onClick={() => onRemoveLine(index)} disabled={lineItems.length <= 1}>Remove</Button>
                  </div>
                ))}
                <Button variant="outline" onClick={onAddLine}>Add line</Button>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <Input type="number" min={0} step="0.01" placeholder="Cash" value={payments.cash} onChange={(e) => setPayments((c) => ({ ...c, cash: Number(e.target.value || 0) }))} />
                <Input type="number" min={0} step="0.01" placeholder="Card" value={payments.card} onChange={(e) => setPayments((c) => ({ ...c, card: Number(e.target.value || 0) }))} />
                <Input type="number" min={0} step="0.01" placeholder="Wallet" value={payments.wallet} onChange={(e) => setPayments((c) => ({ ...c, wallet: Number(e.target.value || 0) }))} />
                <Input type="number" min={0} step="0.01" placeholder="Bank" value={payments.bank} onChange={(e) => setPayments((c) => ({ ...c, bank: Number(e.target.value || 0) }))} />
              </div>

              <div className="rounded-md border border-white/10 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                <div>{`Line total: ${toCurrency(lineTotal)}`}</div>
                <div>{`Paid total: ${toCurrency(paidTotal)}`}</div>
                <div>{`Projected change: ${toCurrency(Math.max(0, paidTotal - lineTotal))}`}</div>
              </div>

              <Button onClick={() => void onCloseDineIn()} disabled={loading || !selectedBranchId || !selectedSessionId || !selectedTableId || !currentUser?.id}>
                Close dine-in order
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Live Floor Snapshot</CardTitle>
            <CardDescription>Current table states for selected branch.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {tables.map((table) => (
              <div key={table.id} className="rounded-lg border border-white/10 bg-background/30 px-3 py-2">
                <p className="text-sm font-medium">{table.name ?? table.code ?? table.id}</p>
                <p className="text-xs text-muted-foreground">{`${table.floor ?? 'Floor'} • cap ${table.capacity ?? '-'}`}</p>
                <Badge variant="outline" className="mt-2 border-white/10 text-muted-foreground">{table.status ?? 'unknown'}</Badge>
              </div>
            ))}
            {tables.length === 0 ? <p className="text-sm text-muted-foreground">No tables available for this branch yet.</p> : null}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
