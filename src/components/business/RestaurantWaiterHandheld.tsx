"use client";

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/lib/store';

type Branch = { id: string; name?: string; code?: string };
type TableRecord = { id: string; code?: string; name?: string; status?: string; capacity?: number };
type Reservation = { id: string; guestName?: string; status?: string; tableId?: string | null; slotAt?: string };
type KitchenTicket = { id: string; orderId?: string; tableId?: string; status?: string; lines?: Array<{ id?: string; productName?: string; status?: string }> };

export function RestaurantWaiterHandheld() {
  const { currentTenant, currentUser } = useAppState();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(currentTenant?.id ? { 'x-tenant-id': currentTenant.id } : {}),
      ...(currentUser?.email ? { 'x-owner-email': currentUser.email } : {}),
    }),
    [currentTenant?.id, currentUser?.email]
  );

  const apiFetch = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(path, { ...init, headers: { ...apiHeaders, ...(init?.headers ?? {}) } });
    const data = (await response.json()) as { ok?: boolean; error?: string } & T;
    if (!response.ok || data.ok === false) {
      throw new Error(data.error ?? `Request failed: ${response.status}`);
    }
    return data as T;
  }, [apiHeaders]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const branchRes = await apiFetch<{ branches: Branch[] }>('/api/business/restaurant/branches');
      setBranches(branchRes.branches ?? []);
      const branchId = selectedBranchId || branchRes.branches?.[0]?.id || '';
      if (branchId) {
        setSelectedBranchId(branchId);
        const [tableRes, reservationRes, ticketRes] = await Promise.all([
          apiFetch<{ tables: TableRecord[] }>(`/api/business/restaurant/tables?branchId=${encodeURIComponent(branchId)}`),
          apiFetch<{ reservations: Reservation[] }>(`/api/business/restaurant/reservations?branchId=${encodeURIComponent(branchId)}`),
          apiFetch<{ tickets: KitchenTicket[] }>(`/api/business/restaurant/kitchen-tickets?branchId=${encodeURIComponent(branchId)}&status=ready`),
        ]);
        setTables(tableRes.tables ?? []);
        setReservations(reservationRes.reservations ?? []);
        setTickets(ticketRes.tickets ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load waiter handheld data');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, selectedBranchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateReservation = async (id: string, action: 'confirm' | 'seat' | 'complete') => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/reservations', {
        method: 'PATCH',
        body: JSON.stringify({ id, action }),
      });
      setMessage(`Reservation ${action}ed.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update reservation');
    } finally {
      setLoading(false);
    }
  };

  const serveTicket = async (ticketId: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch('/api/business/restaurant/kitchen-tickets', {
        method: 'PATCH',
        body: JSON.stringify({ id: ticketId, action: 'serve' }),
      });
      setMessage('Ready order handed to table.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to serve order');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-2 w-fit rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">Restaurant Waiter</Badge>
            <h1 className="text-3xl font-bold">Waiter Handheld</h1>
            <p className="text-sm text-muted-foreground">Mobile-first table service workflow for seating guests and serving ready tickets.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/business/restaurant">Control Tower</Link></Button>
            <Button asChild variant="outline"><Link href="/business/restaurant/expo">Expo</Link></Button>
          </div>
        </div>

        {error ? <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
        {message ? <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</div> : null}

        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}>
              <option value="">Select branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{`${branch.name ?? 'Unnamed'} (${branch.code ?? '-'})`}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <Card key={table.id} className="glass-card border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">{table.name ?? table.code ?? table.id}</CardTitle>
                <CardDescription>{`${table.status ?? 'unknown'} • cap ${table.capacity ?? '-'}`}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle>Reservations</CardTitle>
              <CardDescription>Confirm and seat guests quickly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="rounded-lg border border-white/10 bg-background/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{reservation.guestName ?? 'Guest'}</p>
                      <p className="text-xs text-muted-foreground">{reservation.status ?? 'booked'}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => void updateReservation(reservation.id, 'confirm')} disabled={loading}>Confirm</Button>
                      <Button size="sm" variant="outline" onClick={() => void updateReservation(reservation.id, 'seat')} disabled={loading}>Seat</Button>
                      <Button size="sm" variant="outline" onClick={() => void updateReservation(reservation.id, 'complete')} disabled={loading}>Complete</Button>
                    </div>
                  </div>
                </div>
              ))}
              {reservations.length === 0 ? <p className="text-sm text-muted-foreground">No reservations for this branch.</p> : null}
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle>Ready Orders</CardTitle>
              <CardDescription>Serve orders from expo to table.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-white/10 bg-background/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{ticket.orderId ?? ticket.id}</p>
                      <p className="text-xs text-muted-foreground">Table {ticket.tableId ?? 'n/a'}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => void serveTicket(ticket.id)} disabled={loading}>Serve</Button>
                  </div>
                </div>
              ))}
              {tickets.length === 0 ? <p className="text-sm text-muted-foreground">No ready tickets.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
