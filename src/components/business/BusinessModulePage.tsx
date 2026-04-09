"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BUSINESS_MODULES_BY_KEY } from '@/lib/business-os';
import type { BusinessModuleKey } from '@/lib/business-os';
import type { BusinessModuleSpec, BusinessRecord } from '@/lib/business-os';

const MODULE_UI_LABELS: Record<BusinessModuleKey, {
  objectLabel: string;
  featureLabel: string;
  workflowLabel: string;
  governanceLabel: string;
  snapshotTitle: string;
  snapshotDescription: string;
}> = {
  crm: {
    objectLabel: 'Revenue Objects',
    featureLabel: 'Sales Capabilities',
    workflowLabel: 'Commercial Workflows',
    governanceLabel: 'Revenue Controls',
    snapshotTitle: 'Pipeline Snapshot',
    snapshotDescription: 'Representative deals, leads, and territory activities.',
  },
  finance: {
    objectLabel: 'Core Objects',
    featureLabel: 'Features',
    workflowLabel: 'Workflows',
    governanceLabel: 'Compliance',
    snapshotTitle: 'Finance Operations Snapshot',
    snapshotDescription: 'Representative invoices, reconciliations, and approval queues.',
  },
  hr: {
    objectLabel: 'People Objects',
    featureLabel: 'HR Capabilities',
    workflowLabel: 'People Workflows',
    governanceLabel: 'Workforce Controls',
    snapshotTitle: 'People Ops Snapshot',
    snapshotDescription: 'Representative payroll, leave, and hiring activities.',
  },
  inventory: {
    objectLabel: 'Inventory Objects',
    featureLabel: 'Inventory Capabilities',
    workflowLabel: 'Stock Workflows',
    governanceLabel: 'Stock Controls',
    snapshotTitle: 'Inventory Control Snapshot',
    snapshotDescription: 'Representative stock states, transfers, and traceability queues.',
  },
  projects: {
    objectLabel: 'Delivery Objects',
    featureLabel: 'Execution Capabilities',
    workflowLabel: 'Delivery Workflows',
    governanceLabel: 'Delivery Controls',
    snapshotTitle: 'Delivery Snapshot',
    snapshotDescription: 'Representative milestones, staffing, and execution status.',
  },
  procurement: {
    objectLabel: 'Procurement Objects',
    featureLabel: 'Sourcing Capabilities',
    workflowLabel: 'Procurement Workflows',
    governanceLabel: 'Purchasing Controls',
    snapshotTitle: 'Sourcing Snapshot',
    snapshotDescription: 'Representative RFQs, POs, receipts, and supplier health.',
  },
  support: {
    objectLabel: 'Service Objects',
    featureLabel: 'Support Capabilities',
    workflowLabel: 'Support Workflows',
    governanceLabel: 'Service Controls',
    snapshotTitle: 'Support Operations Snapshot',
    snapshotDescription: 'Representative ticket queues, SLA risks, and response coverage.',
  },
  analytics: {
    objectLabel: 'Analytics Objects',
    featureLabel: 'BI Capabilities',
    workflowLabel: 'Analytics Workflows',
    governanceLabel: 'Data Controls',
    snapshotTitle: 'BI Snapshot',
    snapshotDescription: 'Representative dashboards, reports, and scheduled insights.',
  },
};

const BulletList = ({ title, items, id }: { title: string; items: string[]; id?: string }) => (
  <Card id={id} className="glass-card border-white/5 scroll-mt-24">
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <span>{item}</span>
        </div>
      ))}
    </CardContent>
  </Card>
);

const FinanceModuleContent = ({ module }: { module: BusinessModuleSpec }) => {
  const [rows, setRows] = useState<ModuleFormRow[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newMeta, setNewMeta] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch('/api/business/operations?module=finance', { cache: 'no-store' });
        const data = (await response.json()) as { ok: boolean; records?: ModuleFormRow[] };
        if (mounted && data.ok && data.records) {
          setRows(data.records);
          return;
        }
      } catch {
        // fall through to seeded fallback
      }

      if (mounted) {
        setRows(
          module.records.map((record) => ({
            id: `${record.title}-${record.meta}`,
            title: record.title,
            subtitle: record.subtitle,
            meta: record.meta,
            status: record.status ?? 'Open',
          }))
        );
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [module.records]);

  const filterOptions = useMemo(() => {
    const statuses = rows
      .map((record) => record.status?.toLowerCase())
      .filter((status): status is string => Boolean(status));
    return ['all', ...Array.from(new Set(statuses))];
  }, [rows]);

  const filteredRecords = useMemo(() => {
    if (statusFilter === 'all') return rows;
    return rows.filter((record) => record.status?.toLowerCase() === statusFilter);
  }, [rows, statusFilter]);

  const addFinanceRecord = async () => {
    if (!newTitle.trim() || !newSubtitle.trim()) return;
    let savedToApi = false;

    try {
      const response = await fetch('/api/business/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'finance',
          title: newTitle.trim(),
          subtitle: newSubtitle.trim(),
          meta: newMeta.trim() || 'N/A',
          status: 'submitted',
        }),
      });

      if (response.ok) {
        savedToApi = true;
        const refresh = await fetch('/api/business/operations?module=finance', { cache: 'no-store' });
        const data = (await refresh.json()) as { ok: boolean; records?: ModuleFormRow[] };
        if (data.ok && data.records) {
          setRows(data.records);
        }
      }
    } catch {
      // continue with local fallback
    }

    const next: ModuleFormRow = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim(),
      meta: newMeta.trim() || 'N/A',
      status: 'Open',
    };
    if (!savedToApi) {
      setRows((prev) => [next, ...prev]);
    }
    setNewTitle('');
    setNewSubtitle('');
    setNewMeta('');
  };

  const advanceFinanceRecord = (id: string) => {
    const flow = ['Open', 'Review', 'Ready to pay', 'Closed'];
    setRows((prev) => prev.map((record) => {
      if (record.id !== id) return record;
      const idx = flow.findIndex((item) => item.toLowerCase() === record.status.toLowerCase());
      const next = flow[(idx + 1 + flow.length) % flow.length];
      return { ...record, status: next };
    }));
  };

  const primaryFeatures = module.features.slice(0, 5);
  const advancedFeatures = module.features.slice(5);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-12">
        <Card id="core-objects" className="glass-card border-white/5 xl:col-span-5 scroll-mt-24">
          <CardHeader>
            <CardTitle>Core Objects</CardTitle>
            <CardDescription>Foundational financial entities for daily operations.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {module.coreObjects.map((object) => (
              <Badge key={object} variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                {object}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card id="features" className="glass-card border-white/5 xl:col-span-7 scroll-mt-24">
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Operational finance capabilities split by core and advanced scope.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-white/5 bg-card/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-primary">Core stack</p>
              {primaryFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3 rounded-xl border border-white/5 bg-card/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-primary">Advanced finance</p>
              {advancedFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card id="workflows" className="glass-card border-white/5 xl:col-span-7 scroll-mt-24">
          <CardHeader>
            <CardTitle>Workflows</CardTitle>
            <CardDescription>Finance approval lanes and execution flow.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {module.workflows.map((workflow, index) => (
              <div key={workflow} className="rounded-xl border border-white/5 bg-card/50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-primary">Step {index + 1}</p>
                <p className="mt-2 text-sm text-foreground">{workflow}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card id="compliance" className="glass-card border-white/5 xl:col-span-5 scroll-mt-24">
          <CardHeader>
            <CardTitle>Compliance</CardTitle>
            <CardDescription>Regulatory and audit controls applied to the finance domain.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {module.governance.map((control) => (
              <div key={control} className="flex items-center justify-between rounded-xl border border-white/5 bg-card/40 px-3 py-2">
                <span className="text-sm text-muted-foreground">{control}</span>
                <Badge className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">Active</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card id="operations" className="glass-card border-white/5 scroll-mt-24">
        <CardHeader>
          <CardTitle>Finance Operations Snapshot</CardTitle>
          <CardDescription>Interactive view of key finance records by current status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Record title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} />
            <Input placeholder="Description" value={newSubtitle} onChange={(event) => setNewSubtitle(event.target.value)} />
            <Input placeholder="Amount / Meta" value={newMeta} onChange={(event) => setNewMeta(event.target.value)} />
          </div>
          <Button className="gradient-amber text-black font-semibold" onClick={addFinanceRecord}>Add Finance Record</Button>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option}
                type="button"
                variant={statusFilter === option ? 'default' : 'outline'}
                className={statusFilter === option ? 'gradient-amber text-black font-semibold' : 'border-white/10 bg-card/40'}
                onClick={() => setStatusFilter(option)}
              >
                {option === 'all' ? 'All' : option}
              </Button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="min-w-full text-sm">
              <thead className="bg-card/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Record</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Amount / Meta</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-foreground">{record.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.subtitle}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-white/10 text-muted-foreground">
                        {record.status ?? 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-primary">{record.meta}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => advanceFinanceRecord(record.id)}>
                        Advance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

type InventoryTx = {
  id: string;
  at: string;
  message: string;
};

type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
  productType: string;
  category: string;
};

type InventoryEntry = {
  id: string;
  productSku: string;
  warehouse: string;
  stockType: string;
  ownership: string;
  quantity: number;
};

type HrEmployeeRow = {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  status: string;
};

type ModuleFormRow = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
};

const INVENTORY_PRODUCT_FEATURES = [
  'Product Master (physical, digital, service)',
  'Product Variants (size, color, etc.)',
  'SKU auto-generation rules',
  'Units of Measure (UoM conversions)',
  'Product Categories & Hierarchies',
  'Product Bundles / Kits (BOM-lite)',
  'Product Lifecycle Status (active, discontinued, seasonal)',
];

const INVENTORY_STRUCTURE_FEATURES = [
  'Warehouses (multi-location support)',
  'Storage Locations (zones, bins, shelves)',
  'Stock Types (On-hand, Reserved, Available, In-transit)',
  'Inventory Ownership (company, consignment, vendor-owned)',
];

const InventoryModuleContent = ({ module }: { module: BusinessModuleSpec }) => {
  const [stock, setStock] = useState({ onHand: 1240, reserved: 210, available: 1030, inTransit: 96 });
  const [records, setRecords] = useState<BusinessRecord[]>(module.records);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [tx, setTx] = useState<InventoryTx[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [inventoryEntries, setInventoryEntries] = useState<InventoryEntry[]>([]);

  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductType, setNewProductType] = useState('physical');
  const [newProductCategory, setNewProductCategory] = useState('general');

  const [newEntrySku, setNewEntrySku] = useState('');
  const [newEntryWarehouse, setNewEntryWarehouse] = useState('Main Warehouse');
  const [newEntryStockType, setNewEntryStockType] = useState('On-hand');
  const [newEntryOwnership, setNewEntryOwnership] = useState('company');
  const [newEntryQty, setNewEntryQty] = useState('0');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [productsResponse, entriesResponse] = await Promise.all([
          fetch('/api/business/inventory/products', { cache: 'no-store' }),
          fetch('/api/business/inventory/entries', { cache: 'no-store' }),
        ]);

        const productsData = (await productsResponse.json()) as { ok: boolean; products?: Array<{ id: string; name: string; sku: string | null; productType: string; category: string | null }> };
        const entriesData = (await entriesResponse.json()) as { ok: boolean; entries?: Array<{ id: string; productSku: string; warehouse: string; stockType: string; ownership: string; quantity: number }> };

        if (!mounted) return;

        if (productsData.ok && productsData.products) {
          setProducts(productsData.products.map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku ?? product.name,
            productType: product.productType,
            category: product.category ?? 'general',
          })));
        }

        if (entriesData.ok && entriesData.entries) {
          setInventoryEntries(entriesData.entries);
          setRecords(entriesData.entries.map((entry) => ({
            title: `Stock Entry ${entry.productSku}`,
            subtitle: `${entry.warehouse} • ${entry.stockType} • ${entry.ownership}`,
            meta: `${entry.quantity} units`,
            status: 'Open',
          })));
          const onHand = entriesData.entries
            .filter((entry) => entry.stockType === 'on_hand' || entry.stockType === 'On-hand')
            .reduce((sum, entry) => sum + entry.quantity, 0);
          const reserved = entriesData.entries
            .filter((entry) => entry.stockType === 'reserved' || entry.stockType === 'Reserved')
            .reduce((sum, entry) => sum + entry.quantity, 0);
          const inTransit = entriesData.entries
            .filter((entry) => entry.stockType === 'in_transit' || entry.stockType === 'In-transit')
            .reduce((sum, entry) => sum + entry.quantity, 0);
          setStock({
            onHand,
            reserved,
            inTransit,
            available: Math.max(onHand - reserved, 0),
          });
        }

        setTx([{ id: 'boot', at: new Date().toLocaleTimeString(), message: 'Inventory stream online' }]);
        return;
      } catch {
        // fall through to local fallback
      }

      if (!mounted) return;

      const stockRaw = window.localStorage.getItem('pinkplan:inventory:stock');
      const recordsRaw = window.localStorage.getItem('pinkplan:inventory:records');
      const txRaw = window.localStorage.getItem('pinkplan:inventory:tx');
      const productsRaw = window.localStorage.getItem('pinkplan:inventory:products');
      const entriesRaw = window.localStorage.getItem('pinkplan:inventory:entries');

      if (stockRaw) setStock(JSON.parse(stockRaw) as typeof stock);
      if (recordsRaw) setRecords(JSON.parse(recordsRaw) as BusinessRecord[]);
      if (txRaw) setTx(JSON.parse(txRaw) as InventoryTx[]);
      else setTx([{ id: 'boot', at: new Date().toLocaleTimeString(), message: 'Inventory stream online' }]);
      if (productsRaw) setProducts(JSON.parse(productsRaw) as InventoryProduct[]);
      if (entriesRaw) setInventoryEntries(JSON.parse(entriesRaw) as InventoryEntry[]);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:inventory:stock', JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:inventory:records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:inventory:tx', JSON.stringify(tx));
  }, [tx]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:inventory:products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:inventory:entries', JSON.stringify(inventoryEntries));
  }, [inventoryEntries]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const events = [
        'Live sync: warehouse balances refreshed',
        'Move processed: transfer queue updated',
        'Reservation update: available stock recalculated',
      ];
      const message = events[Math.floor(Math.random() * events.length)];
      setTx((prev) => [
        { id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, at: new Date().toLocaleTimeString(), message },
        ...prev,
      ].slice(0, 20));
    }, 17000);

    return () => window.clearInterval(id);
  }, []);

  const statusOptions = useMemo(() => {
    const statuses = records
      .map((record) => record.status)
      .filter((status): status is string => Boolean(status));
    return ['all', ...Array.from(new Set(statuses))];
  }, [records]);

  const filteredRecords = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return records.filter((record) => {
      const statusMatch = statusFilter === 'all' ? true : (record.status ?? '') === statusFilter;
      const text = `${record.title} ${record.subtitle} ${record.meta} ${record.status ?? ''}`.toLowerCase();
      const queryMatch = lowered.length === 0 ? true : text.includes(lowered);
      return statusMatch && queryMatch;
    });
  }, [query, records, statusFilter]);

  const pushTx = (message: string) => {
    setTx((prev) => [
      { id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, at: new Date().toLocaleTimeString(), message },
      ...prev,
    ].slice(0, 20));
  };

  const adjustStock = (key: keyof typeof stock, delta: number) => {
    setStock((prev) => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));
    pushTx(`Stock ${key} adjusted by ${delta > 0 ? '+' : ''}${delta}`);
  };

  const advanceRecord = (title: string) => {
    const flow = ['Reorder', 'In transit', 'Inspection', 'Closed'];
    setRecords((prev) => prev.map((record) => {
      if (record.title !== title) return record;
      const current = record.status ?? 'Reorder';
      const index = flow.findIndex((item) => item.toLowerCase() === current.toLowerCase());
      const next = flow[(index + 1 + flow.length) % flow.length];
      pushTx(`${record.title} moved to ${next}`);
      return { ...record, status: next };
    }));
  };

  const addProduct = async () => {
    if (!newProductName.trim() || !newProductSku.trim()) return;
    let savedToApi = false;

    try {
      const response = await fetch('/api/business/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName.trim(),
          sku: newProductSku.trim().toUpperCase(),
          productType: newProductType.trim() || 'physical',
          category: newProductCategory.trim() || 'general',
        }),
      });

      if (response.ok) {
        savedToApi = true;
        const refresh = await fetch('/api/business/inventory/products', { cache: 'no-store' });
        const data = (await refresh.json()) as { ok: boolean; products?: Array<{ id: string; name: string; sku: string | null; productType: string; category: string | null }> };
        if (data.ok && data.products) {
          setProducts(data.products.map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku ?? product.name,
            productType: product.productType,
            category: product.category ?? 'general',
          })));
        }
      }
    } catch {
      // continue with local fallback
    }

    const next: InventoryProduct = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name: newProductName.trim(),
      sku: newProductSku.trim().toUpperCase(),
      productType: newProductType.trim() || 'physical',
      category: newProductCategory.trim() || 'general',
    };

    if (!savedToApi) {
      setProducts((prev) => [next, ...prev]);
    }
    pushTx(`New product created: ${next.name} (${next.sku})`);
    setNewProductName('');
    setNewProductSku('');
    setNewProductType('physical');
    setNewProductCategory('general');
  };

  const addInventoryEntry = async () => {
    if (!newEntrySku.trim() || !newEntryWarehouse.trim()) return;
    const qty = Number(newEntryQty);
    if (Number.isNaN(qty) || qty < 0) return;
    let savedToApi = false;

    const next: InventoryEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      productSku: newEntrySku.trim().toUpperCase(),
      warehouse: newEntryWarehouse.trim(),
      stockType: newEntryStockType.trim() || 'On-hand',
      ownership: newEntryOwnership.trim() || 'company',
      quantity: qty,
    };

    try {
      const normalizeStockState = (value: string) => {
        const lowered = value.toLowerCase();
        if (lowered.includes('transit')) return 'in_transit';
        if (lowered.includes('reserve')) return 'reserved';
        if (lowered.includes('available')) return 'available';
        return 'on_hand';
      };

      const normalizeOwnership = (value: string) => {
        const lowered = value.toLowerCase();
        if (lowered.includes('consign')) return 'consignment';
        if (lowered.includes('vendor')) return 'vendor_owned';
        return 'company';
      };

      const response = await fetch('/api/business/inventory/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSku: next.productSku,
          warehouse: next.warehouse,
          stockState: normalizeStockState(next.stockType),
          ownershipType: normalizeOwnership(next.ownership),
          quantity: next.quantity,
        }),
      });

      if (response.ok) {
        savedToApi = true;
        const refresh = await fetch('/api/business/inventory/entries', { cache: 'no-store' });
        const data = (await refresh.json()) as { ok: boolean; entries?: InventoryEntry[] };
        if (data.ok && data.entries) {
          setInventoryEntries(data.entries);
          setRecords(data.entries.map((entry) => ({
            title: `Stock Entry ${entry.productSku}`,
            subtitle: `${entry.warehouse} • ${entry.stockType} • ${entry.ownership}`,
            meta: `${entry.quantity} units`,
            status: 'Open',
          })));
        }
      }
    } catch {
      // continue with local fallback
    }

    if (!savedToApi) {
      setInventoryEntries((prev) => [next, ...prev]);
      setRecords((prev) => [
        {
          title: `Stock Entry ${next.productSku}`,
          subtitle: `${next.warehouse} • ${next.stockType} • ${next.ownership}`,
          meta: `${next.quantity} units`,
          status: 'Open',
        },
        ...prev,
      ]);
    }
    setStock((prev) => ({ ...prev, onHand: prev.onHand + qty, available: prev.available + qty }));
    pushTx(`Inventory entry added: ${next.productSku} +${next.quantity} @ ${next.warehouse}`);

    setNewEntrySku('');
    setNewEntryWarehouse('Main Warehouse');
    setNewEntryStockType('On-hand');
    setNewEntryOwnership('company');
    setNewEntryQty('0');
  };

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-12">
        <Card id="product-management" className="glass-card border-white/5 xl:col-span-6 scroll-mt-24">
          <CardHeader>
            <CardTitle>Product Management (Unified)</CardTitle>
            <CardDescription>Core domain model for product master and catalog structure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {INVENTORY_PRODUCT_FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card id="inventory-structure" className="glass-card border-white/5 xl:col-span-6 scroll-mt-24">
          <CardHeader>
            <CardTitle>Inventory Structure</CardTitle>
            <CardDescription>Warehouse and stock model with ownership and location depth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {INVENTORY_STRUCTURE_FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div id="stock-types" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 scroll-mt-24">
        <Card className="glass-card border-white/5">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">On-hand</p>
            <p className="text-3xl font-bold">{stock.onHand}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => adjustStock('onHand', -10)}>-10</Button>
              <Button size="sm" className="gradient-amber text-black" onClick={() => adjustStock('onHand', 10)}>+10</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">Reserved</p>
            <p className="text-3xl font-bold">{stock.reserved}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => adjustStock('reserved', -5)}>-5</Button>
              <Button size="sm" className="gradient-amber text-black" onClick={() => adjustStock('reserved', 5)}>+5</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-3xl font-bold">{stock.available}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => adjustStock('available', -10)}>-10</Button>
              <Button size="sm" className="gradient-amber text-black" onClick={() => adjustStock('available', 10)}>+10</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">In-transit</p>
            <p className="text-3xl font-bold">{stock.inTransit}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => adjustStock('inTransit', -5)}>-5</Button>
              <Button size="sm" className="gradient-amber text-black" onClick={() => adjustStock('inTransit', 5)}>+5</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="glass-card border-white/5 xl:col-span-6">
          <CardHeader>
            <CardTitle>Create New Product</CardTitle>
            <CardDescription>Add product master records (physical, digital, service) with SKU.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Product name" value={newProductName} onChange={(event) => setNewProductName(event.target.value)} />
            <Input placeholder="SKU" value={newProductSku} onChange={(event) => setNewProductSku(event.target.value)} />
            <Input placeholder="Type (physical/digital/service)" value={newProductType} onChange={(event) => setNewProductType(event.target.value)} />
            <Input placeholder="Category" value={newProductCategory} onChange={(event) => setNewProductCategory(event.target.value)} />
            <div className="md:col-span-2">
              <Button className="w-full gradient-amber text-black font-semibold" onClick={addProduct}>Add Product</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 xl:col-span-6">
          <CardHeader>
            <CardTitle>Create New Inventory Entry</CardTitle>
            <CardDescription>Add warehouse stock entries with stock type and ownership.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Product SKU" value={newEntrySku} onChange={(event) => setNewEntrySku(event.target.value)} />
            <Input placeholder="Warehouse" value={newEntryWarehouse} onChange={(event) => setNewEntryWarehouse(event.target.value)} />
            <Input placeholder="Stock Type (On-hand/Reserved/...)" value={newEntryStockType} onChange={(event) => setNewEntryStockType(event.target.value)} />
            <Input placeholder="Ownership (company/consignment/vendor-owned)" value={newEntryOwnership} onChange={(event) => setNewEntryOwnership(event.target.value)} />
            <Input placeholder="Quantity" value={newEntryQty} onChange={(event) => setNewEntryQty(event.target.value)} />
            <Button className="gradient-amber text-black font-semibold" onClick={addInventoryEntry}>Add Inventory</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="glass-card border-white/5 xl:col-span-6">
          <CardHeader>
            <CardTitle>Product Master Records</CardTitle>
            <CardDescription>Products created through this interface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products added yet.</p>
            ) : (
              products.map((product) => (
                <div key={product.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                  <p className="font-medium text-foreground">{product.name} ({product.sku})</p>
                  <p className="text-xs text-muted-foreground">{product.productType} • {product.category}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 xl:col-span-6">
          <CardHeader>
            <CardTitle>Inventory Entries</CardTitle>
            <CardDescription>Warehouse/stock entries created through this interface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {inventoryEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inventory entries added yet.</p>
            ) : (
              inventoryEntries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                  <p className="font-medium text-foreground">{entry.productSku} • {entry.quantity} units</p>
                  <p className="text-xs text-muted-foreground">{entry.warehouse} • {entry.stockType} • {entry.ownership}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card id="stock-tracking" className="glass-card border-white/5 xl:col-span-8 scroll-mt-24">
          <CardHeader>
            <CardTitle>Live Stock Tracking Objects</CardTitle>
            <CardDescription>Movement, traceability, and adjustments managed in real time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search stock moves, lots, serials, or metadata..."
                className="md:max-w-sm"
              />
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={statusFilter === option ? 'default' : 'outline'}
                    className={statusFilter === option ? 'gradient-amber text-black font-semibold' : 'border-white/10 bg-card/40'}
                    onClick={() => setStatusFilter(option)}
                  >
                    {option === 'all' ? 'All' : option}
                  </Button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="min-w-full text-sm">
                <thead className="bg-card/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Object</th>
                    <th className="px-4 py-3 font-medium">Detail</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Meta</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.title} className="border-t border-white/5">
                      <td className="px-4 py-3 text-foreground">{record.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{record.subtitle}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-white/10 text-muted-foreground">
                          {record.status ?? 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-primary">{record.meta}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => advanceRecord(record.title)}>
                          Process
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card id="live-transactions" className="glass-card border-white/5 xl:col-span-4 scroll-mt-24">
          <CardHeader>
            <CardTitle>Live Transactions</CardTitle>
            <CardDescription>Event feed for inventory operations and stock updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full gradient-amber text-black font-semibold" onClick={() => pushTx('Manual inventory sync triggered')}>
              Trigger Sync
            </Button>
            <div className="max-h-80 space-y-2 overflow-auto pr-1">
              {tx.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                  <p className="text-xs uppercase tracking-[0.15em] text-primary">{entry.at}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

const HrModuleContent = ({ module }: { module: BusinessModuleSpec }) => {
  const [employees, setEmployees] = useState<HrEmployeeRow[]>([]);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeTitle, setEmployeeTitle] = useState('');
  const [employeeDepartment, setEmployeeDepartment] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch('/api/business/hr/employees', { cache: 'no-store' });
        const data = (await response.json()) as { ok: boolean; employees?: HrEmployeeRow[] };
        if (mounted && data.ok && data.employees) {
          setEmployees(data.employees);
          return;
        }
      } catch {
        // fall through to seeded fallback
      }

      if (mounted) {
        setEmployees([
          {
            id: 'seed-1',
            name: 'Nina Joseph',
            title: 'Senior Ops Manager',
            department: 'Operations',
            email: 'nina@pinkplan.local',
            status: 'Active',
          },
        ]);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const addEmployee = async () => {
    if (!employeeName.trim() || !employeeTitle.trim() || !employeeEmail.trim()) return;
    let savedToApi = false;

    try {
      const response = await fetch('/api/business/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: employeeName.trim(),
          title: employeeTitle.trim(),
          department: employeeDepartment.trim() || 'General',
          email: employeeEmail.trim().toLowerCase(),
        }),
      });

      if (response.ok) {
        savedToApi = true;
        const refresh = await fetch('/api/business/hr/employees', { cache: 'no-store' });
        const data = (await refresh.json()) as { ok: boolean; employees?: HrEmployeeRow[] };
        if (data.ok && data.employees) {
          setEmployees(data.employees);
        }
      }
    } catch {
      // continue with local fallback
    }

    const next: HrEmployeeRow = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name: employeeName.trim(),
      title: employeeTitle.trim(),
      department: employeeDepartment.trim() || 'General',
      email: employeeEmail.trim().toLowerCase(),
      status: 'Pending approval',
    };

    if (!savedToApi) {
      setEmployees((prev) => [next, ...prev]);
    }
    setEmployeeName('');
    setEmployeeTitle('');
    setEmployeeDepartment('');
    setEmployeeEmail('');
  };

  const advanceEmployee = (id: string) => {
    setEmployees((prev) => prev.map((employee) => {
      if (employee.id !== id) return employee;
      const nextStatus = employee.status === 'Pending approval' ? 'Active' : employee.status === 'Active' ? 'On leave' : 'Active';
      return { ...employee, status: nextStatus };
    }));
  };

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <BulletList id="core-objects" title="Core Objects" items={module.coreObjects} />
        <BulletList id="features" title="Features" items={module.features} />
        <BulletList id="workflows" title="Workflows" items={module.workflows} />
        <BulletList id="governance" title="Controls" items={module.governance} />
      </div>

      <Card id="operations" className="glass-card border-white/5 scroll-mt-24">
        <CardHeader>
          <CardTitle>Create New Employee</CardTitle>
          <CardDescription>Add employees for HR, contracts, attendance, leave, and payroll workflows.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Employee name" value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} />
          <Input placeholder="Title" value={employeeTitle} onChange={(event) => setEmployeeTitle(event.target.value)} />
          <Input placeholder="Department" value={employeeDepartment} onChange={(event) => setEmployeeDepartment(event.target.value)} />
          <Input placeholder="Work email" type="email" value={employeeEmail} onChange={(event) => setEmployeeEmail(event.target.value)} />
          <div className="md:col-span-2">
            <Button className="w-full gradient-amber text-black font-semibold" onClick={addEmployee}>Add Employee</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>Live employee records created in this Business workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {employees.map((employee) => (
            <div key={employee.id} className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card/40 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-foreground">{employee.name}</p>
                <p className="text-sm text-muted-foreground">{employee.title} • {employee.department}</p>
                <p className="text-xs text-muted-foreground">{employee.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-white/10 text-muted-foreground">{employee.status}</Badge>
                <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => advanceEmployee(employee.id)}>
                  Advance Status
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
};

const GENERIC_FORM_TITLES: Record<BusinessModuleKey, string> = {
  crm: 'Create Lead / Deal',
  finance: 'Create Finance Record',
  hr: 'Create Employee',
  inventory: 'Create Inventory Record',
  projects: 'Create Project Task',
  procurement: 'Create RFQ / Purchase Order',
  support: 'Create Support Ticket',
  analytics: 'Create Report / Dashboard',
};

const GenericModuleContent = ({
  module,
  moduleKey,
  labels,
}: {
  module: BusinessModuleSpec;
  moduleKey: BusinessModuleKey;
  labels: {
    objectLabel: string;
    featureLabel: string;
    workflowLabel: string;
    governanceLabel: string;
    snapshotTitle: string;
    snapshotDescription: string;
  };
}) => {
  const [rows, setRows] = useState<ModuleFormRow[]>([]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [meta, setMeta] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/business/operations?module=${moduleKey}`, { cache: 'no-store' });
        const data = (await response.json()) as { ok: boolean; records?: Array<{ id: string; title: string; subtitle: string; meta: string; status: string }> };

        if (mounted && data.ok && data.records) {
          setRows(data.records.map((record) => ({
            id: record.id,
            title: record.title,
            subtitle: record.subtitle,
            meta: record.meta,
            status: record.status,
          })));
          return;
        }
      } catch {
        // Fall back to seeded rows when API is unavailable.
      }

      if (mounted) {
        setRows(
          module.records.map((record) => ({
            id: `${record.title}-${record.meta}`,
            title: record.title,
            subtitle: record.subtitle,
            meta: record.meta,
            status: record.status ?? 'Open',
          }))
        );
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [module.records, moduleKey]);

  const addRow = async () => {
    if (!title.trim() || !subtitle.trim()) return;
    let savedToApi = false;

    try {
      const response = await fetch('/api/business/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: moduleKey,
          title: title.trim(),
          subtitle: subtitle.trim(),
          meta: meta.trim() || 'N/A',
          status: 'Open',
        }),
      });

      if (response.ok) {
        savedToApi = true;
        const refresh = await fetch(`/api/business/operations?module=${moduleKey}`, { cache: 'no-store' });
        const data = (await refresh.json()) as { ok: boolean; records?: Array<{ id: string; title: string; subtitle: string; meta: string; status: string }> };
        if (data.ok && data.records) {
          setRows(data.records.map((record) => ({
            id: record.id,
            title: record.title,
            subtitle: record.subtitle,
            meta: record.meta,
            status: record.status,
          })));
        }
      }
    } catch {
      // Keep optimistic fallback below.
    }

    const next: ModuleFormRow = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      meta: meta.trim() || 'N/A',
      status: 'Open',
    };
    if (!savedToApi) {
      setRows((prev) => (prev.some((row) => row.id === next.id) ? prev : [next, ...prev]));
    }
    setTitle('');
    setSubtitle('');
    setMeta('');
  };

  const advanceRow = (id: string) => {
    const flow = ['Open', 'In Progress', 'Closed'];
    setRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      const idx = flow.findIndex((item) => item.toLowerCase() === row.status.toLowerCase());
      const next = flow[(idx + 1 + flow.length) % flow.length];
      return { ...row, status: next };
    }));
  };

  const statusOptions = useMemo(() => ['all', ...Array.from(new Set(rows.map((row) => row.status)))], [rows]);
  const filteredRows = useMemo(
    () => (statusFilter === 'all' ? rows : rows.filter((row) => row.status === statusFilter)),
    [rows, statusFilter]
  );

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <BulletList id="core-objects" title={labels.objectLabel} items={module.coreObjects} />
        <BulletList id="features" title={labels.featureLabel} items={module.features} />
        <BulletList id="workflows" title={labels.workflowLabel} items={module.workflows} />
        <BulletList id="governance" title={labels.governanceLabel} items={module.governance} />
      </div>

      <Card id="operations" className="glass-card border-white/5 scroll-mt-24">
        <CardHeader>
          <CardTitle>{GENERIC_FORM_TITLES[moduleKey]}</CardTitle>
          <CardDescription>{labels.snapshotDescription} Add and progress records from this module interface.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Input placeholder="Description" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
            <Input placeholder="Meta / Amount / Tag" value={meta} onChange={(event) => setMeta(event.target.value)} />
          </div>
          <Button className="gradient-amber text-black font-semibold" onClick={addRow}>Add Record</Button>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={statusFilter === option ? 'default' : 'outline'}
                className={statusFilter === option ? 'gradient-amber text-black font-semibold' : 'border-white/10 bg-card/40'}
                onClick={() => setStatusFilter(option)}
              >
                {option === 'all' ? 'All' : option}
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
                  <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => advanceRow(row.id)}>
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
};

export function BusinessModulePage({
  moduleKey,
  actionLabel = 'Open workflow',
  actionHref,
}: {
  moduleKey: BusinessModuleKey;
  actionLabel?: string;
  actionHref?: string;
}) {
  const module = BUSINESS_MODULES_BY_KEY[moduleKey];
  const Icon = module.icon;
  const labels = MODULE_UI_LABELS[moduleKey];

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
              {module.eyebrow}
            </Badge>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10">
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-4xl font-bold text-transparent">
                  {module.title}
                </h1>
                <p className="mt-2 max-w-3xl text-muted-foreground">
                  {module.summary}
                </p>
              </div>
            </div>
          </div>
          {actionHref ? (
            <Button asChild className="gradient-amber h-11 rounded-xl px-4 text-black font-semibold shadow-lg shadow-amber-500/20">
              <Link href={actionHref}>
                {actionLabel}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button className="gradient-amber h-11 rounded-xl px-4 text-black font-semibold shadow-lg shadow-amber-500/20">
              {actionLabel}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {module.stats.map((stat) => (
            <Card key={stat.label} className="glass-card border-white/5">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="mt-3 text-3xl font-bold">{stat.value}</div>
                <div className="mt-2 text-xs text-primary">{stat.delta}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {moduleKey === 'finance' ? (
          <FinanceModuleContent module={module} />
        ) : moduleKey === 'inventory' ? (
          <InventoryModuleContent module={module} />
        ) : moduleKey === 'hr' ? (
          <HrModuleContent module={module} />
        ) : (
          <GenericModuleContent module={module} moduleKey={moduleKey} labels={labels} />
        )}
      </div>
    </Shell>
  );
}
