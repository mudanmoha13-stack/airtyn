"use client";

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/lib/store';

type Branch = { id: string; name?: string; code?: string; city?: string };
type TableRecord = { id: string; code?: string; name?: string; floor?: string; status?: string; capacity?: number };
type Reservation = { id: string; guestName?: string; slotAt?: string; status?: string; tableId?: string | null };
type PosSession = { id: string; terminalName?: string; status?: string; openedAt?: string };
type KitchenTicketLine = {
  id?: string;
  productId?: string;
  productName?: string;
  qty?: number;
  station?: string;
  status?: string;
  slaMinutes?: number;
  createdAt?: string;
  startedAt?: string;
  readyAt?: string;
  servedAt?: string;
  updatedAt?: string;
};
type KitchenTicket = {
  id: string;
  orderId?: string;
  tableId?: string;
  status?: string;
  stationSummary?: string[];
  createdAt?: string;
  startedAt?: string;
  readyAt?: string;
  servedAt?: string;
  bumpedAt?: string;
  slaTargetMinutes?: number;
  lines?: KitchenTicketLine[];
};
type Product = { id: string; name?: string; basePrice?: number };
type DeliveryRecord = { id: string; customerName?: string; customerPhone?: string; address?: string; status?: string; driverName?: string; total?: number };
type BranchAnalytics = { revenue: number; orders: number; dineInOrders: number; avgTicket: number; avgKitchenMins: number; completedReservations: number; deliveredOrders: number; pendingDeliveries: number; kitchenLateTickets: number };
type ReplenishmentRecord = { id: string; componentProductId?: string; branchId?: string; currentStock: number; suggestedQuantity: number; minStockLevel: number; status?: string; notes?: string };
type LaborCostRecord = { id: string; orderId?: string; kitchenMinutes: number; serviceMode?: string; laborCostPerOrder: number };
type JournalEntry = { id: string; orderId?: string; entryType?: string; accountDebit?: string; accountCredit?: string; amount: number; description?: string; status?: string };
type DineInLine = { productId: string; quantity: number; unitPrice: number };

const toCurrency = (value: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 2 }).format(value || 0);

const minutesBetween = (start?: string, end?: string) => {
  if (!start || !end) return null;
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  return Math.max(0, Math.round((endMs - startMs) / 60000));
};

const minutesSince = (value?: string) => {
  if (!value) return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.round((Date.now() - time) / 60000));
};

const formatElapsed = (minutes: number | null) => {
  if (minutes === null) return 'n/a';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

export function RestaurantControlTower({ mode = 'control' }: { mode?: 'control' | 'expo' }) {
  const { currentTenant, currentUser } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [sessions, setSessions] = useState<PosSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [analytics, setAnalytics] = useState<BranchAnalytics | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [stationFilter, setStationFilter] = useState('all');
  const [branchForm, setBranchForm] = useState({ name: '', code: '', city: '' });
  const [tableForm, setTableForm] = useState({ floor: 'Main Floor', code: '', name: '', capacity: 4 });
  const [reservationForm, setReservationForm] = useState({ guestName: '', pax: 2, slotAt: '', tableId: '' });
  const [openSessionForm, setOpenSessionForm] = useState({ terminalName: 'Main POS', openingCash: 0 });
  const [closeSessionForm, setCloseSessionForm] = useState({ closingCash: 0, expectedCash: 0, cashSales: 0, cardSales: 0, walletSales: 0, bankSales: 0 });
  const [lineItems, setLineItems] = useState<DineInLine[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [payments, setPayments] = useState({ cash: 0, card: 0, wallet: 0, bank: 0 });
  const [deliveryForm, setDeliveryForm] = useState({ customerName: '', customerPhone: '', address: '', zone: 'default', driverName: '', total: 0 });
  const [replenishments, setReplenishments] = useState<ReplenishmentRecord[]>([]);
  const [laborCosts, setLaborCosts] = useState<LaborCostRecord[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);

  const apiHeaders = useMemo(() => ({ 'Content-Type': 'application/json', ...(currentTenant?.id ? { 'x-tenant-id': currentTenant.id } : {}), ...(currentUser?.email ? { 'x-owner-email': currentUser.email } : {}) }), [currentTenant?.id, currentUser?.email]);

  const apiFetch = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(path, { ...init, headers: { ...apiHeaders, ...(init?.headers ?? {}) } });
    const data = (await response.json()) as { ok?: boolean; error?: string } & T;
    if (!response.ok || data.ok === false) throw new Error(data.error ?? `Request failed: ${response.status}`);
    return data as T;
  }, [apiHeaders]);

  const loadMeta = useCallback(async () => {
    const requests: Array<Promise<unknown>> = [apiFetch<{ branches: Branch[] }>('/api/business/restaurant/branches')];
    if (mode === 'control') requests.push(apiFetch<{ products: Product[] }>('/api/business/products'));
    const [branchRes, productRes] = (await Promise.all(requests)) as [{ branches: Branch[] }, { products: Product[] } | undefined];
    setBranches(branchRes.branches ?? []);
    if (productRes) setProducts(productRes.products ?? []);
    const nextBranchId = selectedBranchId || branchRes.branches?.[0]?.id || '';
    if (nextBranchId) setSelectedBranchId(nextBranchId);
  }, [apiFetch, mode, selectedBranchId]);

  const loadBranchData = useCallback(async (branchId: string) => {
    if (!branchId) {
      setTables([]);
      setReservations([]);
      setSessions([]);
      setKitchenTickets([]);
      setDeliveries([]);
      setAnalytics(null);
      setReplenishments([]);
      setLaborCosts([]);
      setJournals([]);
      return;
    }
    const requests: Array<Promise<unknown>> = [apiFetch<{ tickets: KitchenTicket[] }>(`/api/business/restaurant/kitchen-tickets?branchId=${encodeURIComponent(branchId)}${stationFilter !== 'all' ? `&station=${encodeURIComponent(stationFilter)}` : ''}`)];
    if (mode === 'control') {
      requests.unshift(
        apiFetch<{ tables: TableRecord[] }>(`/api/business/restaurant/tables?branchId=${encodeURIComponent(branchId)}`),
        apiFetch<{ reservations: Reservation[] }>(`/api/business/restaurant/reservations?branchId=${encodeURIComponent(branchId)}`),
        apiFetch<{ sessions: PosSession[] }>(`/api/business/restaurant/pos-sessions?branchId=${encodeURIComponent(branchId)}`),
        apiFetch<{ deliveries: DeliveryRecord[] }>(`/api/business/restaurant/delivery?branchId=${encodeURIComponent(branchId)}`),
        apiFetch<{ analytics: BranchAnalytics }>(`/api/business/restaurant/analytics?branchId=${encodeURIComponent(branchId)}`),
        apiFetch<{ data: ReplenishmentRecord[] }>(`/api/business/restaurant/replenishment?branchId=${encodeURIComponent(branchId)}&includeUnsuggestedOnly=true`),
        apiFetch<{ data: LaborCostRecord[] }>(`/api/business/restaurant/labor-cost?branchId=${encodeURIComponent(branchId)}`),
        apiFetch<{ data: JournalEntry[] }>(`/api/business/restaurant/accounting?branchId=${encodeURIComponent(branchId)}`)
      );
    }
    const result = await Promise.all(requests);
    if (mode === 'control') {
      const [tableRes, reservationRes, sessionRes, deliveryRes, analyticsRes, replenishmentRes, laborRes, journalRes, ticketRes] = result as [{ tables: TableRecord[] }, { reservations: Reservation[] }, { sessions: PosSession[] }, { deliveries: DeliveryRecord[] }, { analytics: BranchAnalytics }, { data: ReplenishmentRecord[] }, { data: LaborCostRecord[] }, { data: JournalEntry[] }, { tickets: KitchenTicket[] }];
      setTables(tableRes.tables ?? []);
      setReservations(reservationRes.reservations ?? []);
      setSessions(sessionRes.sessions ?? []);
      setDeliveries(deliveryRes.deliveries ?? []);
      setAnalytics(analyticsRes.analytics ?? null);
      setReplenishments(replenishmentRes.data ?? []);
      setLaborCosts(laborRes.data ?? []);
      setJournals(journalRes.data ?? []);
      setKitchenTickets(ticketRes.tickets ?? []);
      if (!selectedSessionId && (sessionRes.sessions ?? []).length > 0) setSelectedSessionId(sessionRes.sessions[0].id);
      if (!selectedTableId && (tableRes.tables ?? []).length > 0) setSelectedTableId(tableRes.tables[0].id);
    } else {
      const [ticketRes] = result as [{ tickets: KitchenTicket[] }];
      setKitchenTickets(ticketRes.tickets ?? []);
    }
  }, [apiFetch, mode, selectedSessionId, selectedTableId, stationFilter]);

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

  useEffect(() => { void refreshAll(); }, [refreshAll]);
  useEffect(() => { void loadBranchData(selectedBranchId); }, [selectedBranchId, loadBranchData]);
  useEffect(() => {
    if (!selectedBranchId) return undefined;
    const interval = window.setInterval(() => { void loadBranchData(selectedBranchId); }, mode === 'expo' ? 10000 : 20000);
    return () => window.clearInterval(interval);
  }, [loadBranchData, mode, selectedBranchId]);

  const lineTotal = useMemo(() => lineItems.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), [lineItems]);
  const paidTotal = useMemo(() => payments.cash + payments.card + payments.wallet + payments.bank, [payments]);
  const kitchenByStatus = useMemo(() => {
    const groups: Record<string, KitchenTicket[]> = { queued: [], in_prep: [], ready: [], served: [] };
    for (const ticket of kitchenTickets) {
      const key = String(ticket.status ?? 'queued');
      if (groups[key]) groups[key].push(ticket);
    }
    return groups;
  }, [kitchenTickets]);
  const throughput = useMemo(() => {
    const late = kitchenTickets.filter((ticket) => {
      const age = minutesSince(ticket.startedAt ?? ticket.createdAt);
      const target = Number(ticket.slaTargetMinutes ?? 0);
      return ticket.status !== 'served' && ticket.status !== 'bumped' && target > 0 && age !== null && age > target;
    }).length;
    const prepDurations = kitchenTickets.map((ticket) => minutesBetween(ticket.startedAt ?? ticket.createdAt, ticket.readyAt ?? ticket.servedAt)).filter((value): value is number => value !== null);
    const avgPrep = prepDurations.length > 0 ? Math.round(prepDurations.reduce((sum, value) => sum + value, 0) / prepDurations.length) : 0;
    return { queued: kitchenByStatus.queued.length, inPrep: kitchenByStatus.in_prep.length, ready: kitchenByStatus.ready.length, served: kitchenByStatus.served.length, late, avgPrep };
  }, [kitchenByStatus, kitchenTickets]);

  const onCreateBranch = async () => {
    if (!branchForm.name.trim() || !branchForm.code.trim() || !branchForm.city.trim()) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/branches', { method: 'POST', body: JSON.stringify({ name: branchForm.name.trim(), code: branchForm.code.trim(), city: branchForm.city.trim() }) });
      setBranchForm({ name: '', code: '', city: '' });
      setMessage('Branch created.');
      await refreshAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create branch');
    } finally { setLoading(false); }
  };

  const onCreateTable = async () => {
    if (!selectedBranchId || !tableForm.code.trim() || !tableForm.name.trim()) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/tables', { method: 'POST', body: JSON.stringify({ branchId: selectedBranchId, floor: tableForm.floor.trim(), code: tableForm.code.trim(), name: tableForm.name.trim(), capacity: tableForm.capacity }) });
      setTableForm((current) => ({ ...current, code: '', name: '' }));
      setMessage('Table created.');
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create table');
    } finally { setLoading(false); }
  };

  const onCreateReservation = async () => {
    if (!selectedBranchId || !reservationForm.guestName.trim() || !reservationForm.slotAt) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/reservations', { method: 'POST', body: JSON.stringify({ branchId: selectedBranchId, tableId: reservationForm.tableId || undefined, guestName: reservationForm.guestName.trim(), pax: reservationForm.pax, slotAt: new Date(reservationForm.slotAt).toISOString() }) });
      setReservationForm({ guestName: '', pax: 2, slotAt: '', tableId: '' });
      setMessage('Reservation created.');
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create reservation');
    } finally { setLoading(false); }
  };

  const onReservationAction = async (id: string, action: 'confirm' | 'seat' | 'complete' | 'cancel' | 'no_show') => {
    setLoading(true); setError(null); setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/reservations', { method: 'PATCH', body: JSON.stringify({ id, action }) });
      setMessage(`Reservation ${action}ed.`);
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed reservation action');
    } finally { setLoading(false); }
  };

  const onOpenSession = async () => {
    if (!selectedBranchId || !openSessionForm.terminalName.trim() || !currentUser?.id) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/pos-sessions', { method: 'POST', body: JSON.stringify({ branchId: selectedBranchId, terminalName: openSessionForm.terminalName.trim(), openedByUserId: currentUser.id, openingCash: openSessionForm.openingCash }) });
      setMessage('POS session opened.');
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open session');
    } finally { setLoading(false); }
  };

  const onCloseSession = async () => {
    if (!selectedSessionId || !currentUser?.id) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/pos-sessions', { method: 'PATCH', body: JSON.stringify({ id: selectedSessionId, closedByUserId: currentUser.id, ...closeSessionForm }) });
      setMessage('POS session closed.');
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to close session');
    } finally { setLoading(false); }
  };

  const updateLine = (index: number, next: Partial<DineInLine>) => setLineItems((current) => current.map((line, i) => (i === index ? { ...line, ...next } : line)));
  const onAddLine = () => setLineItems((current) => [...current, { productId: '', quantity: 1, unitPrice: 0 }]);
  const onRemoveLine = (index: number) => setLineItems((current) => current.filter((_, i) => i !== index));

  const onCloseDineIn = async () => {
    if (!selectedBranchId || !selectedSessionId || !selectedTableId || !currentUser?.id) return;
    const validLines = lineItems.filter((line) => line.productId && line.quantity > 0);
    if (validLines.length === 0) { setError('Add at least one product line before closing dine-in order.'); return; }
    setLoading(true); setError(null); setMessage(null);
    try {
      const payload = { sessionId: selectedSessionId, branchId: selectedBranchId, tableId: selectedTableId, servedByEmployeeId: currentUser.id, reservationId: selectedReservationId || undefined, customer: { name: customerName.trim() || 'Walk-in Guest', ...(customerPhone.trim() ? { phone: customerPhone.trim() } : {}) }, lines: validLines, payments: [{ method: 'cash', amount: payments.cash }, { method: 'card', amount: payments.card }, { method: 'wallet', amount: payments.wallet }, { method: 'bank', amount: payments.bank }].filter((payment) => payment.amount > 0) };
      if (payload.payments.length === 0) { setError('Enter at least one payment amount.'); return; }
      const response = await apiFetch<{ orderNo: string; change: number }>('/api/business/restaurant/dine-in/close', { method: 'POST', body: JSON.stringify(payload) });
      setMessage(`Dine-in closed: ${response.orderNo}. Change ${toCurrency(response.change)}.`);
      setSelectedReservationId('');
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to close dine-in order');
    } finally { setLoading(false); }
  };

  const onKitchenAction = async (ticketId: string, action: 'start_prep' | 'mark_ready' | 'serve' | 'bump' | 'cancel' | 'requeue', options?: { station?: string; lineId?: string }) => {
    setLoading(true); setError(null); setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/kitchen-tickets', { method: 'PATCH', body: JSON.stringify({ id: ticketId, action, ...(options?.station ? { station: options.station } : {}), ...(options?.lineId ? { lineId: options.lineId } : {}) }) });
      setMessage(`Kitchen ${options?.lineId ? 'line' : 'ticket'} ${action.replace('_', ' ')} completed.`);
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update kitchen ticket');
    } finally { setLoading(false); }
  };

  const onCreateDelivery = async () => {
    if (!selectedBranchId || !deliveryForm.customerName.trim() || !deliveryForm.customerPhone.trim() || !deliveryForm.address.trim()) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/delivery', {
        method: 'POST',
        body: JSON.stringify({
          branchId: selectedBranchId,
          customerName: deliveryForm.customerName.trim(),
          customerPhone: deliveryForm.customerPhone.trim(),
          address: deliveryForm.address.trim(),
          zone: deliveryForm.zone.trim(),
          driverName: deliveryForm.driverName.trim() || undefined,
          total: deliveryForm.total,
        }),
      });
      setDeliveryForm({ customerName: '', customerPhone: '', address: '', zone: 'default', driverName: '', total: 0 });
      setMessage('Delivery order created.');
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create delivery');
    } finally { setLoading(false); }
  };

  const onDeliveryAction = async (id: string, action: 'dispatch' | 'picked_up' | 'delivered' | 'failed' | 'returned', driverName?: string) => {
    setLoading(true); setError(null); setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/delivery', { method: 'PATCH', body: JSON.stringify({ id, action, ...(driverName ? { driverName } : {}) }) });
      setMessage(`Delivery ${action.replace('_', ' ')}.`);
      await loadBranchData(selectedBranchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update delivery');
    } finally { setLoading(false); }
  };

  const renderKitchenBoard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card className="glass-card border-white/5"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Queued</div><div className="mt-2 text-3xl font-bold">{throughput.queued}</div></CardContent></Card>
        <Card className="glass-card border-white/5"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">In Prep</div><div className="mt-2 text-3xl font-bold">{throughput.inPrep}</div></CardContent></Card>
        <Card className="glass-card border-white/5"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Ready</div><div className="mt-2 text-3xl font-bold">{throughput.ready}</div></CardContent></Card>
        <Card className="glass-card border-white/5"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Served</div><div className="mt-2 text-3xl font-bold">{throughput.served}</div></CardContent></Card>
        <Card className="glass-card border-white/5"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">SLA Breaches</div><div className="mt-2 text-3xl font-bold">{throughput.late}</div></CardContent></Card>
        <Card className="glass-card border-white/5"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Avg Prep</div><div className="mt-2 text-3xl font-bold">{throughput.avgPrep}m</div></CardContent></Card>
      </div>

      <Card className="glass-card border-white/5">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{mode === 'expo' ? 'Expo Screen' : 'Kitchen Production Board'}</CardTitle>
              <CardDescription>Per-line station actions, timer tracking, and bump flow.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={stationFilter} onChange={(e) => setStationFilter(e.target.value)}>
                <option value="all">All stations</option><option value="hot">Hot line</option><option value="grill">Grill</option><option value="drinks">Drinks</option><option value="cold">Cold</option><option value="pass">Pass</option>
              </select>
              {mode === 'control' ? <><Button asChild variant="outline"><Link href="/business/restaurant/pos">Open POS</Link></Button><Button asChild variant="outline"><Link href="/business/restaurant/waiter">Open Waiter Mode</Link></Button><Button asChild variant="outline"><Link href="/business/restaurant/expo">Open Expo Mode</Link></Button></> : <Button asChild variant="outline"><Link href="/business/restaurant">Back to Control Tower</Link></Button>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 xl:grid-cols-4">
          {(['queued', 'in_prep', 'ready', 'served'] as const).map((statusKey) => (
            <div key={statusKey} className="space-y-2 rounded-lg border border-white/10 bg-background/30 p-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{statusKey.replace('_', ' ')}</p>
              {(kitchenByStatus[statusKey] ?? []).map((ticket) => {
                const age = minutesSince(ticket.startedAt ?? ticket.createdAt);
                const late = Number(ticket.slaTargetMinutes ?? 0) > 0 && age !== null && age > Number(ticket.slaTargetMinutes ?? 0) && statusKey !== 'served';
                return (
                  <div key={ticket.id} className="space-y-2 rounded-md border border-white/10 bg-background/60 p-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{ticket.orderId ?? ticket.id}</p>
                        <p className="text-muted-foreground">Table {ticket.tableId ?? 'n/a'} • {(ticket.stationSummary ?? []).join(', ') || 'unassigned'}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={late ? 'border-destructive/40 text-destructive' : 'border-white/10 text-muted-foreground'}>{late ? 'Late' : 'On SLA'}</Badge>
                        <p className="mt-1 text-[11px] text-muted-foreground">{formatElapsed(age)}</p>
                      </div>
                    </div>
                    <div className="space-y-2 rounded-md border border-white/10 bg-background/50 p-2">
                      {(ticket.lines ?? []).map((line) => {
                        const lineAge = minutesSince(line.startedAt ?? line.createdAt ?? ticket.createdAt);
                        const lineLate = Number(line.slaMinutes ?? 0) > 0 && lineAge !== null && lineAge > Number(line.slaMinutes ?? 0) && line.status !== 'served' && line.status !== 'canceled';
                        return (
                          <div key={line.id ?? `${ticket.id}-${line.productId}-${line.station}`} className="rounded-md border border-white/10 px-2 py-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{line.productName ?? line.productId ?? 'Line item'}</p>
                                <p className="text-muted-foreground">{`${line.qty ?? 0}x • ${line.station ?? 'station'} • ${line.status ?? 'queued'}`}</p>
                              </div>
                              <div className="text-right">
                                <p className={lineLate ? 'text-destructive' : 'text-muted-foreground'}>{formatElapsed(lineAge)}</p>
                                <p className="text-[11px] text-muted-foreground">SLA {line.slaMinutes ?? 0}m</p>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {line.status === 'queued' ? <Button size="sm" variant="outline" onClick={() => void onKitchenAction(ticket.id, 'start_prep', { lineId: line.id })}>Start line</Button> : null}
                              {line.status === 'in_prep' ? <Button size="sm" variant="outline" onClick={() => void onKitchenAction(ticket.id, 'mark_ready', { lineId: line.id })}>Ready line</Button> : null}
                              {line.status === 'ready' ? <Button size="sm" variant="outline" onClick={() => void onKitchenAction(ticket.id, 'serve', { lineId: line.id })}>Serve line</Button> : null}
                              {line.status !== 'served' && line.status !== 'canceled' ? <Button size="sm" variant="outline" onClick={() => void onKitchenAction(ticket.id, 'cancel', { lineId: line.id })}>Cancel line</Button> : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {statusKey === 'queued' ? <Button size="sm" variant="outline" onClick={() => void onKitchenAction(ticket.id, 'start_prep')}>Start ticket</Button> : null}
                      {statusKey === 'in_prep' ? <Button size="sm" variant="outline" onClick={() => void onKitchenAction(ticket.id, 'mark_ready')}>Ready ticket</Button> : null}
                      {statusKey === 'ready' ? <Button size="sm" variant="outline" onClick={() => void onKitchenAction(ticket.id, 'serve')}>Serve ticket</Button> : null}
                      {statusKey === 'served' ? <Button size="sm" variant="outline" onClick={() => void onKitchenAction(ticket.id, 'bump')}>Bump ticket</Button> : null}
                    </div>
                  </div>
                );
              })}
              {(kitchenByStatus[statusKey] ?? []).length === 0 ? <p className="text-xs text-muted-foreground">No tickets.</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-2 w-fit rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">Restaurant Phase 4</Badge>
            <h1 className="text-3xl font-bold">{mode === 'expo' ? 'Restaurant Expo Board' : 'Restaurant Control Tower'}</h1>
            <p className="text-sm text-muted-foreground">{mode === 'expo' ? 'Dedicated expo screen for kitchen coordination, SLA monitoring, and ready-to-serve control.' : 'Central dashboard for branch operations. Access built-in POS, waiter handheld, kitchen expo, delivery dispatch, procurement replenishment, labor costing, GL accounting, and branch analytics.'}</p>
          </div>
          <Button variant="outline" onClick={() => void refreshAll()} disabled={loading}>Refresh</Button>
        </div>
        {error ? <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
        {message ? <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</div> : null}

        <Card className="glass-card border-white/5">
          <CardHeader><CardTitle>Active Context</CardTitle><CardDescription>{mode === 'expo' ? 'Select branch for expo display.' : 'Select branch, POS session, and table context for operations.'}</CardDescription></CardHeader>
          <CardContent className={`grid gap-3 ${mode === 'expo' ? 'md:grid-cols-1' : 'md:grid-cols-4'}`}>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Branch</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}><option value="">Select branch</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{`${branch.name ?? 'Unnamed'} (${branch.code ?? '-'})`}</option>)}</select></label>
            {mode === 'control' ? <><label className="space-y-1 text-sm"><span className="text-muted-foreground">POS Session</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}><option value="">Select session</option>{sessions.map((session) => <option key={session.id} value={session.id}>{`${session.terminalName ?? 'Terminal'} - ${session.status ?? 'unknown'}`}</option>)}</select></label><label className="space-y-1 text-sm"><span className="text-muted-foreground">Table</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)}><option value="">Select table</option>{tables.map((table) => <option key={table.id} value={table.id}>{`${table.code ?? 'TBL'} (${table.status ?? 'available'})`}</option>)}</select></label><label className="space-y-1 text-sm"><span className="text-muted-foreground">Reservation (optional)</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedReservationId} onChange={(e) => setSelectedReservationId(e.target.value)}><option value="">No reservation</option>{reservations.map((reservation) => <option key={reservation.id} value={reservation.id}>{`${reservation.guestName ?? 'Guest'} - ${reservation.status ?? 'booked'}`}</option>)}</select></label></> : null}
          </CardContent>
        </Card>

        {mode === 'control' ? <><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Card className="glass-card border-white/5"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Branch Revenue</div><div className="mt-2 text-3xl font-bold">{toCurrency(analytics?.revenue ?? 0)}</div></CardContent></Card><Card className="glass-card border-white/5"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Average Ticket</div><div className="mt-2 text-3xl font-bold">{toCurrency(analytics?.avgTicket ?? 0)}</div></CardContent></Card><Card className="glass-card border-white/5"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Delivered Orders</div><div className="mt-2 text-3xl font-bold">{analytics?.deliveredOrders ?? 0}</div></CardContent></Card><Card className="glass-card border-white/5"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Late Kitchen Tickets</div><div className="mt-2 text-3xl font-bold">{analytics?.kitchenLateTickets ?? 0}</div></CardContent></Card></div><div className="grid gap-4 xl:grid-cols-2"><Card className="glass-card border-white/5"><CardHeader><CardTitle>Branch and Table Setup</CardTitle><CardDescription>Create branch and table master data.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="space-y-3"><p className="text-sm font-medium">Create Branch</p><div className="grid gap-3 md:grid-cols-3"><Input placeholder="Branch name" value={branchForm.name} onChange={(e) => setBranchForm((c) => ({ ...c, name: e.target.value }))} /><Input placeholder="Code" value={branchForm.code} onChange={(e) => setBranchForm((c) => ({ ...c, code: e.target.value }))} /><Input placeholder="City" value={branchForm.city} onChange={(e) => setBranchForm((c) => ({ ...c, city: e.target.value }))} /></div><Button onClick={() => void onCreateBranch()} disabled={loading}>Create branch</Button></div><div className="space-y-3 border-t border-white/10 pt-4"><p className="text-sm font-medium">Create Table</p><div className="grid gap-3 md:grid-cols-4"><Input placeholder="Floor" value={tableForm.floor} onChange={(e) => setTableForm((c) => ({ ...c, floor: e.target.value }))} /><Input placeholder="Code" value={tableForm.code} onChange={(e) => setTableForm((c) => ({ ...c, code: e.target.value }))} /><Input placeholder="Name" value={tableForm.name} onChange={(e) => setTableForm((c) => ({ ...c, name: e.target.value }))} /><Input type="number" min={1} max={30} value={tableForm.capacity} onChange={(e) => setTableForm((c) => ({ ...c, capacity: Number(e.target.value || 1) }))} /></div><Button onClick={() => void onCreateTable()} disabled={loading || !selectedBranchId}>Create table</Button></div></CardContent></Card><Card className="glass-card border-white/5"><CardHeader><CardTitle>Reservations</CardTitle><CardDescription>Capture and progress reservation lifecycle.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-4"><Input placeholder="Guest name" value={reservationForm.guestName} onChange={(e) => setReservationForm((c) => ({ ...c, guestName: e.target.value }))} /><Input type="number" min={1} max={30} value={reservationForm.pax} onChange={(e) => setReservationForm((c) => ({ ...c, pax: Number(e.target.value || 1) }))} /><Input type="datetime-local" value={reservationForm.slotAt} onChange={(e) => setReservationForm((c) => ({ ...c, slotAt: e.target.value }))} /><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={reservationForm.tableId} onChange={(e) => setReservationForm((c) => ({ ...c, tableId: e.target.value }))}><option value="">No table pre-assigned</option>{tables.map((table) => <option key={table.id} value={table.id}>{table.code ?? table.id}</option>)}</select></div><Button onClick={() => void onCreateReservation()} disabled={loading || !selectedBranchId}>Create reservation</Button><div className="space-y-2 border-t border-white/10 pt-3">{reservations.slice(0, 8).map((reservation) => <div key={reservation.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 px-3 py-2 text-sm"><span>{`${reservation.guestName ?? 'Guest'} • ${reservation.status ?? 'booked'}`}</span><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => void onReservationAction(reservation.id, 'confirm')}>Confirm</Button><Button size="sm" variant="outline" onClick={() => void onReservationAction(reservation.id, 'seat')}>Seat</Button><Button size="sm" variant="outline" onClick={() => void onReservationAction(reservation.id, 'complete')}>Complete</Button></div></div>)}{reservations.length === 0 ? <p className="text-sm text-muted-foreground">No reservations yet.</p> : null}</div></CardContent></Card></div><div className="grid gap-4 xl:grid-cols-2"><Card className="glass-card border-white/5"><CardHeader><CardTitle>POS Session Controls</CardTitle><CardDescription>Open and close shift sessions with reconciliation fields.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-3"><p className="text-sm font-medium">Open session</p><div className="grid gap-3 md:grid-cols-2"><Input placeholder="Terminal name" value={openSessionForm.terminalName} onChange={(e) => setOpenSessionForm((c) => ({ ...c, terminalName: e.target.value }))} /><Input type="number" min={0} step="0.01" value={openSessionForm.openingCash} onChange={(e) => setOpenSessionForm((c) => ({ ...c, openingCash: Number(e.target.value || 0) }))} /></div><Button onClick={() => void onOpenSession()} disabled={loading || !selectedBranchId || !currentUser?.id}>Open POS session</Button></div><div className="space-y-3 border-t border-white/10 pt-4"><p className="text-sm font-medium">Close session</p><div className="grid gap-3 md:grid-cols-3"><Input type="number" min={0} step="0.01" placeholder="Closing cash" value={closeSessionForm.closingCash} onChange={(e) => setCloseSessionForm((c) => ({ ...c, closingCash: Number(e.target.value || 0) }))} /><Input type="number" min={0} step="0.01" placeholder="Expected cash" value={closeSessionForm.expectedCash} onChange={(e) => setCloseSessionForm((c) => ({ ...c, expectedCash: Number(e.target.value || 0) }))} /><Input type="number" min={0} step="0.01" placeholder="Cash sales" value={closeSessionForm.cashSales} onChange={(e) => setCloseSessionForm((c) => ({ ...c, cashSales: Number(e.target.value || 0) }))} /><Input type="number" min={0} step="0.01" placeholder="Card sales" value={closeSessionForm.cardSales} onChange={(e) => setCloseSessionForm((c) => ({ ...c, cardSales: Number(e.target.value || 0) }))} /><Input type="number" min={0} step="0.01" placeholder="Wallet sales" value={closeSessionForm.walletSales} onChange={(e) => setCloseSessionForm((c) => ({ ...c, walletSales: Number(e.target.value || 0) }))} /><Input type="number" min={0} step="0.01" placeholder="Bank sales" value={closeSessionForm.bankSales} onChange={(e) => setCloseSessionForm((c) => ({ ...c, bankSales: Number(e.target.value || 0) }))} /></div><Button onClick={() => void onCloseSession()} disabled={loading || !selectedSessionId || !currentUser?.id}>Close POS session</Button></div></CardContent></Card><Card className="glass-card border-white/5"><CardHeader><CardTitle>Dine-In Close</CardTitle><CardDescription>Create settled dine-in order, consume recipe stock, post payment, release table, and queue sequenced KOT.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /><Input placeholder="Phone (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div><div className="space-y-2">{lineItems.map((line, index) => <div key={`${index}-${line.productId}`} className="grid gap-2 md:grid-cols-4"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={line.productId} onChange={(e) => { const product = products.find((item) => item.id === e.target.value); updateLine(index, { productId: e.target.value, unitPrice: Number(product?.basePrice ?? 0) }); }}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{`${product.name ?? product.id}`}</option>)}</select><Input type="number" min={1} step="1" value={line.quantity} onChange={(e) => updateLine(index, { quantity: Number(e.target.value || 1) })} /><Input type="number" min={0} step="0.01" value={line.unitPrice} onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value || 0) })} /><Button variant="outline" onClick={() => onRemoveLine(index)} disabled={lineItems.length <= 1}>Remove</Button></div>)}<Button variant="outline" onClick={onAddLine}>Add line</Button></div><div className="grid gap-3 md:grid-cols-4"><Input type="number" min={0} step="0.01" placeholder="Cash" value={payments.cash} onChange={(e) => setPayments((c) => ({ ...c, cash: Number(e.target.value || 0) }))} /><Input type="number" min={0} step="0.01" placeholder="Card" value={payments.card} onChange={(e) => setPayments((c) => ({ ...c, card: Number(e.target.value || 0) }))} /><Input type="number" min={0} step="0.01" placeholder="Wallet" value={payments.wallet} onChange={(e) => setPayments((c) => ({ ...c, wallet: Number(e.target.value || 0) }))} /><Input type="number" min={0} step="0.01" placeholder="Bank" value={payments.bank} onChange={(e) => setPayments((c) => ({ ...c, bank: Number(e.target.value || 0) }))} /></div><div className="rounded-md border border-white/10 bg-background/40 px-3 py-2 text-sm text-muted-foreground"><div>{`Line total: ${toCurrency(lineTotal)}`}</div><div>{`Paid total: ${toCurrency(paidTotal)}`}</div><div>{`Projected change: ${toCurrency(Math.max(0, paidTotal - lineTotal))}`}</div></div><Button onClick={() => void onCloseDineIn()} disabled={loading || !selectedBranchId || !selectedSessionId || !selectedTableId || !currentUser?.id}>Close dine-in order</Button></CardContent></Card></div><div className="grid gap-4 xl:grid-cols-2"><Card className="glass-card border-white/5"><CardHeader><CardTitle>Delivery Dispatch</CardTitle><CardDescription>Create and progress delivery jobs for the branch.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Input placeholder="Customer name" value={deliveryForm.customerName} onChange={(e) => setDeliveryForm((c) => ({ ...c, customerName: e.target.value }))} /><Input placeholder="Customer phone" value={deliveryForm.customerPhone} onChange={(e) => setDeliveryForm((c) => ({ ...c, customerPhone: e.target.value }))} /><Input placeholder="Address" value={deliveryForm.address} onChange={(e) => setDeliveryForm((c) => ({ ...c, address: e.target.value }))} /><Input placeholder="Zone" value={deliveryForm.zone} onChange={(e) => setDeliveryForm((c) => ({ ...c, zone: e.target.value }))} /><Input placeholder="Driver name" value={deliveryForm.driverName} onChange={(e) => setDeliveryForm((c) => ({ ...c, driverName: e.target.value }))} /><Input type="number" min={0} step="0.01" placeholder="Total" value={deliveryForm.total} onChange={(e) => setDeliveryForm((c) => ({ ...c, total: Number(e.target.value || 0) }))} /></div><Button onClick={() => void onCreateDelivery()} disabled={loading || !selectedBranchId}>Create delivery</Button><div className="space-y-2 border-t border-white/10 pt-3">{deliveries.slice(0, 8).map((delivery) => <div key={delivery.id} className="rounded-md border border-white/10 px-3 py-2 text-sm"><div className="flex items-center justify-between gap-2"><div><p className="font-medium">{delivery.customerName ?? 'Guest'}</p><p className="text-xs text-muted-foreground">{delivery.status ?? 'queued'} • {delivery.address ?? 'no address'}</p></div><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => void onDeliveryAction(delivery.id, 'dispatch', delivery.driverName)}>Dispatch</Button><Button size="sm" variant="outline" onClick={() => void onDeliveryAction(delivery.id, 'picked_up', delivery.driverName)}>Picked</Button><Button size="sm" variant="outline" onClick={() => void onDeliveryAction(delivery.id, 'delivered', delivery.driverName)}>Delivered</Button></div></div></div>)}{deliveries.length === 0 ? <p className="text-sm text-muted-foreground">No deliveries yet.</p> : null}</div></CardContent></Card><Card className="glass-card border-white/5"><CardHeader><CardTitle>Live Floor Snapshot</CardTitle><CardDescription>Current table states for selected branch.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{tables.map((table) => <div key={table.id} className="rounded-lg border border-white/10 bg-background/30 px-3 py-2"><p className="text-sm font-medium">{table.name ?? table.code ?? table.id}</p><p className="text-xs text-muted-foreground">{`${table.floor ?? 'Floor'} • cap ${table.capacity ?? '-'}`}</p><Badge variant="outline" className="mt-2 border-white/10 text-muted-foreground">{table.status ?? 'unknown'}</Badge></div>)}{tables.length === 0 ? <p className="text-sm text-muted-foreground">No tables available for this branch yet.</p> : null}</CardContent></Card></div></> : null}

        {mode === 'control' && selectedBranchId ? <div className="grid gap-4 xl:grid-cols-3"><Card className="glass-card border-white/5"><CardHeader><CardTitle>Inventory Replenishment</CardTitle><CardDescription>Auto-triggered component stock replenishment suggestions from recipe consumption.</CardDescription></CardHeader><CardContent className="space-y-2">{replenishments.filter((r) => r.status === 'suggested' || r.status === 'pending').slice(0, 6).map((rep) => <div key={rep.id} className="rounded-md border border-white/10 px-3 py-2 text-sm"><div className="flex items-center justify-between gap-2"><div><p className="font-medium text-xs text-muted-foreground">Stock: {rep.currentStock} / Suggest: {rep.suggestedQuantity}</p><p className="text-xs text-muted-foreground">{rep.status} • Min level {rep.minStockLevel}</p></div></div></div>)}{replenishments.filter((r) => r.status === 'suggested' || r.status === 'pending').length === 0 ? <p className="text-sm text-muted-foreground">All components well-stocked.</p> : null}</CardContent></Card><Card className="glass-card border-white/5"><CardHeader><CardTitle>Labor Costs</CardTitle><CardDescription>Kitchen labor expense allocation by order and service mode.</CardDescription></CardHeader><CardContent className="space-y-2"><div className="grid gap-2 md:grid-cols-2"><div><p className="text-xs text-muted-foreground">Avg Labor Cost/Order</p><p className="text-lg font-bold">{toCurrency(laborCosts.length > 0 ? laborCosts.reduce((sum, lc) => sum + lc.laborCostPerOrder, 0) / laborCosts.length : 0)}</p></div><div><p className="text-xs text-muted-foreground">Total Labor Expense</p><p className="text-lg font-bold">{toCurrency(laborCosts.reduce((sum, lc) => sum + lc.laborCostPerOrder, 0))}</p></div></div><div className="border-t border-white/10 pt-2"><p className="text-xs text-muted-foreground mb-2">Recent Labor Allocations</p>{laborCosts.slice(0, 4).map((labor) => <div key={labor.id} className="text-xs py-1 px-2 rounded-md bg-background/30 border border-white/5 mb-1"><span className="text-muted-foreground">{labor.serviceMode} • {labor.kitchenMinutes}min</span><span className="float-right font-medium">{toCurrency(labor.laborCostPerOrder)}</span></div>)}</div></CardContent></Card><Card className="glass-card border-white/5"><CardHeader><CardTitle>GL Postings</CardTitle><CardDescription>Double-entry accounting journal entries for orders and operations.</CardDescription></CardHeader><CardContent className="space-y-2"><div className="grid gap-2 md:grid-cols-3"><div><p className="text-xs text-muted-foreground">Revenue</p><p className="text-lg font-bold">{toCurrency(journals.filter((j) => j.entryType === 'revenue').reduce((sum, j) => sum + j.amount, 0))}</p></div><div><p className="text-xs text-muted-foreground">COGS</p><p className="text-lg font-bold">{toCurrency(journals.filter((j) => j.entryType === 'cogs').reduce((sum, j) => sum + j.amount, 0))}</p></div><div><p className="text-xs text-muted-foreground">Labor Exp</p><p className="text-lg font-bold">{toCurrency(journals.filter((j) => j.entryType === 'labor_expense').reduce((sum, j) => sum + j.amount, 0))}</p></div></div><div className="border-t border-white/10 pt-2"><p className="text-xs text-muted-foreground mb-2">Recent Postings</p>{journals.slice(0, 4).map((journal) => <div key={journal.id} className="text-xs py-1 px-2 rounded-md bg-background/30 border border-white/5 mb-1"><span className="text-muted-foreground">{journal.entryType}</span><span className="float-right font-medium">{toCurrency(journal.amount)}</span></div>)}</div></CardContent></Card></div> : null}

        {renderKitchenBoard()}
      </div>
    </Shell>
  );
}
