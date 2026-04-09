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

type CrmOpportunity = {
  id: string;
  title: string;
  customer: string;
  ownerId: string;
  ownerName: string;
  email: string;
  value: number;
  stage: 'draft' | 'open' | 'settled';
  nextFollowUp: string;
};

type SubscriptionRecord = {
  id: string;
  customer: string;
  plan: string;
  ownerId: string;
  ownerName: string;
  amount: number;
  cycle: 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'trial' | 'paused' | 'churned';
  renewalDate: string;
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

type CompanyNature = 'b2b_services' | 'retail_shop' | 'restaurant' | 'rental_business' | 'mixed';

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  EUR: 'EUR ',
  GBP: 'GBP ',
  KES: 'KES ',
  AED: 'AED ',
};

const SALES_FLOW: Array<'draft' | 'open' | 'settled' | 'closed' | 'canceled'> = ['draft', 'open', 'settled', 'closed', 'canceled'];

const COMPANY_TOOLKIT: Record<CompanyNature, { label: string; tools: string[] }> = {
  b2b_services: {
    label: 'B2B Services',
    tools: ['CRM pipeline', 'Quotations to invoice', 'Subscriptions', 'Renewal management', 'MRR dashboard'],
  },
  retail_shop: {
    label: 'Retail Shop',
    tools: ['POS Shop', 'Barcode scanning', 'Pricelists', 'Discount rules', 'Offline mode'],
  },
  restaurant: {
    label: 'Restaurant',
    tools: ['POS Restaurant', 'Table management', 'Kitchen display flow', 'Split bills & tips'],
  },
  rental_business: {
    label: 'Rental Business',
    tools: ['Rental contracts', 'Delivery tracking', 'Return tracking', 'Availability calendar'],
  },
  mixed: {
    label: 'Mixed Model',
    tools: ['Normal Sales', 'POS Shop', 'Subscriptions', 'Rental desk', 'Omnichannel stock'],
  },
};

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
  const [companyNature, setCompanyNature] = useState<CompanyNature>('mixed');

  const [restaurantTable, setRestaurantTable] = useState('T-01');
  const [restaurantGuests, setRestaurantGuests] = useState('2');
  const [restaurantTips, setRestaurantTips] = useState('0');

  const [rentalProduct, setRentalProduct] = useState('');
  const [rentalCustomer, setRentalCustomer] = useState('');
  const [rentalStart, setRentalStart] = useState('');
  const [rentalEnd, setRentalEnd] = useState('');
  const [rentalContracts, setRentalContracts] = useState<Array<{ id: string; product: string; customer: string; start: string; end: string; status: string }>>([]);

  const [quoteEmployeeId, setQuoteEmployeeId] = useState('');
  const [quoteProductId, setQuoteProductId] = useState('');
  const [quoteQty, setQuoteQty] = useState('1');
  const [quotePrice, setQuotePrice] = useState('0');

  const [crmOpportunities, setCrmOpportunities] = useState<CrmOpportunity[]>([]);
  const [crmTitle, setCrmTitle] = useState('');
  const [crmCustomer, setCrmCustomer] = useState('');
  const [crmOwnerId, setCrmOwnerId] = useState('');
  const [crmEmail, setCrmEmail] = useState('');
  const [crmValue, setCrmValue] = useState('0');
  const [crmFollowUp, setCrmFollowUp] = useState('');
  const [crmStageFilter, setCrmStageFilter] = useState<'all' | 'draft' | 'open' | 'settled'>('all');

  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [subscriptionCustomer, setSubscriptionCustomer] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('');
  const [subscriptionOwnerId, setSubscriptionOwnerId] = useState('');
  const [subscriptionAmount, setSubscriptionAmount] = useState('0');
  const [subscriptionCycle, setSubscriptionCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [subscriptionRenewalDate, setSubscriptionRenewalDate] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'active' | 'trial' | 'paused' | 'churned'>('all');

  const [pricingBaseAmount, setPricingBaseAmount] = useState('100');
  const [selectedPricingRuleId, setSelectedPricingRuleId] = useState('');

  const [selectedCreditId, setSelectedCreditId] = useState('');

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
        const natureRaw = window.localStorage.getItem('pinkplan:sales:company-nature');
        const rulesRaw = window.localStorage.getItem('pinkplan:sales:pricing-rules');
        const creditsRaw = window.localStorage.getItem('pinkplan:sales:credits');
        const queueRaw = window.localStorage.getItem('pinkplan:sales:offline-queue');

        if (
          natureRaw === 'b2b_services' ||
          natureRaw === 'retail_shop' ||
          natureRaw === 'restaurant' ||
          natureRaw === 'rental_business' ||
          natureRaw === 'mixed'
        ) {
          setCompanyNature(natureRaw);
        }

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

        const crmRaw = window.localStorage.getItem('pinkplan:sales:crm-opportunities');
        if (crmRaw) {
          setCrmOpportunities(JSON.parse(crmRaw) as CrmOpportunity[]);
        }

        const subscriptionsRaw = window.localStorage.getItem('pinkplan:sales:subscriptions');
        if (subscriptionsRaw) {
          setSubscriptions(JSON.parse(subscriptionsRaw) as SubscriptionRecord[]);
        } else {
          setSubscriptions([
            {
              id: 'sub-seed-1',
              customer: 'Northwind B2B',
              plan: 'Growth',
              ownerId: 'seed-owner-1',
              ownerName: 'Account Team',
              amount: 299,
              cycle: 'monthly',
              status: 'active',
              renewalDate: new Date().toISOString().slice(0, 10),
            },
          ]);
        }
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
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:sales:company-nature', companyNature);
  }, [companyNature]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:sales:crm-opportunities', JSON.stringify(crmOpportunities));
  }, [crmOpportunities]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:sales:subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

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

  const draftOrders = useMemo(() => rows.filter((row) => row.status === 'draft'), [rows]);
  const openOrders = useMemo(() => rows.filter((row) => row.status === 'open'), [rows]);
  const settledOrders = useMemo(() => rows.filter((row) => row.status === 'settled'), [rows]);

  const crmDraftCount = useMemo(() => crmOpportunities.filter((item) => item.stage === 'draft').length, [crmOpportunities]);
  const crmOpenCount = useMemo(() => crmOpportunities.filter((item) => item.stage === 'open').length, [crmOpportunities]);
  const crmSettledCount = useMemo(() => crmOpportunities.filter((item) => item.stage === 'settled').length, [crmOpportunities]);

  const crmForecast = useMemo(() => crmOpportunities.reduce((sum, item) => {
    const weight = item.stage === 'settled' ? 1 : item.stage === 'open' ? 0.65 : 0.3;
    return sum + (item.value * weight);
  }, 0), [crmOpportunities]);

  const dueFollowUps = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return crmOpportunities.filter((item) => item.nextFollowUp && item.nextFollowUp <= today);
  }, [crmOpportunities]);

  const visibleCrmOpportunities = useMemo(() => {
    if (crmStageFilter === 'all') return crmOpportunities;
    return crmOpportunities.filter((item) => item.stage === crmStageFilter);
  }, [crmOpportunities, crmStageFilter]);

  const toolkit = COMPANY_TOOLKIT[companyNature];

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((item) => item.status === 'active').length,
    [subscriptions]
  );

  const estimatedMrr = useMemo(
    () => subscriptions
      .filter((item) => item.status === 'active' || item.status === 'trial')
      .reduce((sum, item) => {
        const monthlyValue = item.cycle === 'monthly' ? item.amount : item.cycle === 'quarterly' ? item.amount / 3 : item.amount / 12;
        return sum + monthlyValue;
      }, 0),
    [subscriptions]
  );

  const renewalsDueThisCycle = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    return subscriptions.filter((item) => {
      if (item.status !== 'active' && item.status !== 'trial') return false;
      if (!item.renewalDate) return false;
      const renewal = new Date(item.renewalDate);
      return renewal.getFullYear() === year && renewal.getMonth() === month;
    }).length;
  }, [subscriptions]);

  const churnRate = useMemo(() => {
    if (subscriptions.length === 0) return 0;
    const churned = subscriptions.filter((item) => item.status === 'churned').length;
    return Math.round((churned / subscriptions.length) * 100);
  }, [subscriptions]);

  const visibleSubscriptions = useMemo(() => {
    if (subscriptionFilter === 'all') return subscriptions;
    return subscriptions.filter((item) => item.status === subscriptionFilter);
  }, [subscriptions, subscriptionFilter]);

  const selectedPricingRule = useMemo(
    () => pricingRules.find((rule) => rule.id === selectedPricingRuleId) ?? pricingRules[0] ?? null,
    [pricingRules, selectedPricingRuleId]
  );

  const pricingPreview = useMemo(() => {
    const base = Number(pricingBaseAmount);
    if (Number.isNaN(base) || base < 0) return { base: 0, effect: 0, final: 0 };
    const rule = selectedPricingRule;
    if (!rule) return { base, effect: 0, final: base };
    const effect = (base * rule.value) / 100;
    return { base, effect, final: Math.max(base - effect, 0) };
  }, [pricingBaseAmount, selectedPricingRule]);

  const selectedCreditProfile = useMemo(
    () => credits.find((profile) => profile.id === selectedCreditId) ?? null,
    [credits, selectedCreditId]
  );

  const selectedCreditAvailable = selectedCreditProfile ? Math.max(selectedCreditProfile.limit - selectedCreditProfile.used, 0) : 0;

  const nextConfirmationAmount = useMemo(() => {
    const next = draftOrders[0];
    return next ? next.total : 0;
  }, [draftOrders]);

  const confirmationAllowed = selectedCreditProfile ? selectedCreditAvailable >= nextConfirmationAmount : false;

  const bookedRevenue = useMemo(() => settledOrders.reduce((sum, row) => sum + row.total, 0), [settledOrders]);

  const conversionRate = useMemo(() => {
    const created = draftOrders.length + openOrders.length + settledOrders.length;
    if (created === 0) return 0;
    return Math.round((settledOrders.length / created) * 100);
  }, [draftOrders.length, openOrders.length, settledOrders.length]);

  const averageOrderValue = useMemo(() => {
    if (rows.length === 0) return 0;
    return rows.reduce((sum, row) => sum + row.total, 0) / rows.length;
  }, [rows]);

  const scrollToSection = (sectionId: string) => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openOperationsView = (filter: string) => {
    setStatusFilter(filter);
    scrollToSection('operations');
  };

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

  const refreshOrders = async () => {
    const refresh = await fetch('/api/business/sales/orders', { cache: 'no-store' });
    const data = (await refresh.json()) as { ok: boolean; orders?: SalesOrderRow[] };
    if (data.ok && data.orders) {
      setRows(data.orders);
    }
  };

  const createQuotation = async () => {
    const qty = Number(quoteQty);
    const price = Number(quotePrice);
    if (!quoteEmployeeId || !quoteProductId || Number.isNaN(qty) || qty <= 0 || Number.isNaN(price) || price < 0) return;

    const response = await fetch('/api/business/sales/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: quoteEmployeeId,
        currency,
        channel: 'ecommerce',
        status: 'draft',
        lines: [{ productId: quoteProductId, quantity: qty, unitPrice: price }],
        payments: [],
      }),
    });

    if (response.ok) {
      await refreshOrders();
      setQuoteQty('1');
    }
  };

  const updateOrderStatus = async (id: string, status: 'draft' | 'open' | 'settled' | 'closed' | 'canceled') => {
    const response = await fetch('/api/business/sales/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });

    if (response.ok) {
      await refreshOrders();
    }
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
        await refreshOrders();
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
    await refreshOrders();
  };

  const addRentalContract = () => {
    if (!rentalProduct.trim() || !rentalCustomer.trim() || !rentalStart || !rentalEnd) return;

    const next = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      product: rentalProduct.trim(),
      customer: rentalCustomer.trim(),
      start: rentalStart,
      end: rentalEnd,
      status: 'reserved',
    };

    setRentalContracts((prev) => [next, ...prev]);
    setRentalProduct('');
    setRentalCustomer('');
    setRentalStart('');
    setRentalEnd('');
  };

  const addCrmOpportunity = () => {
    const parsedValue = Number(crmValue);
    if (!crmTitle.trim() || !crmCustomer.trim() || !crmOwnerId || Number.isNaN(parsedValue) || parsedValue <= 0) return;
    const owner = employees.find((employee) => employee.id === crmOwnerId);
    if (!owner) return;

    const next: CrmOpportunity = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: crmTitle.trim(),
      customer: crmCustomer.trim(),
      ownerId: owner.id,
      ownerName: owner.name,
      email: crmEmail.trim(),
      value: parsedValue,
      stage: 'draft',
      nextFollowUp: crmFollowUp,
    };

    setCrmOpportunities((prev) => [next, ...prev]);
    setCrmTitle('');
    setCrmCustomer('');
    setCrmOwnerId('');
    setCrmEmail('');
    setCrmValue('0');
    setCrmFollowUp('');
  };

  const advanceCrmOpportunity = (id: string) => {
    setCrmOpportunities((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const nextStage = item.stage === 'draft' ? 'open' : item.stage === 'open' ? 'settled' : 'draft';
      return { ...item, stage: nextStage };
    }));
  };

  const runFollowUpAutomation = () => {
    const today = new Date().toISOString().slice(0, 10);
    setCrmOpportunities((prev) => prev.map((item) => {
      if (!item.nextFollowUp || item.nextFollowUp > today) return item;
      const nextDate = new Date(item.nextFollowUp);
      nextDate.setDate(nextDate.getDate() + 7);
      const nextFollowUp = nextDate.toISOString().slice(0, 10);
      return { ...item, nextFollowUp };
    }));
  };

  const addSubscription = () => {
    const parsedAmount = Number(subscriptionAmount);
    if (!subscriptionCustomer.trim() || !subscriptionPlan.trim() || !subscriptionOwnerId || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
    const owner = employees.find((employee) => employee.id === subscriptionOwnerId);
    if (!owner) return;

    const next: SubscriptionRecord = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      customer: subscriptionCustomer.trim(),
      plan: subscriptionPlan.trim(),
      ownerId: owner.id,
      ownerName: owner.name,
      amount: parsedAmount,
      cycle: subscriptionCycle,
      status: 'active',
      renewalDate: subscriptionRenewalDate,
    };

    setSubscriptions((prev) => [next, ...prev]);
    setSubscriptionCustomer('');
    setSubscriptionPlan('');
    setSubscriptionOwnerId('');
    setSubscriptionAmount('0');
    setSubscriptionCycle('monthly');
    setSubscriptionRenewalDate('');
  };

  const cycleSubscriptionStatus = (id: string) => {
    setSubscriptions((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const nextStatus = item.status === 'active' ? 'paused' : item.status === 'paused' ? 'churned' : item.status === 'churned' ? 'trial' : 'active';
      return { ...item, status: nextStatus };
    }));
  };

  const renewSubscription = (id: string) => {
    setSubscriptions((prev) => prev.map((item) => {
      if (item.id !== id || !item.renewalDate) return item;
      const nextDate = new Date(item.renewalDate);
      if (item.cycle === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      if (item.cycle === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
      if (item.cycle === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
      return {
        ...item,
        status: item.status === 'churned' ? 'active' : item.status,
        renewalDate: nextDate.toISOString().slice(0, 10),
      };
    }));
  };

  return (
    <>
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle>Sales Setup by Company Type</CardTitle>
          <CardDescription>Configure tenant business nature so teams get the right sales tools and workflow focus.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={companyNature}
              onChange={(event) => setCompanyNature(event.target.value as CompanyNature)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="mixed">Mixed model</option>
              <option value="b2b_services">B2B services</option>
              <option value="retail_shop">Retail shop</option>
              <option value="restaurant">Restaurant</option>
              <option value="rental_business">Rental business</option>
            </select>
            <div className="md:col-span-2 flex items-center rounded-xl border border-white/5 bg-card/40 px-3 py-2 text-sm text-muted-foreground">
              Active toolkit: {toolkit.label}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {toolkit.tools.map((tool) => (
              <Badge key={tool} variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                {tool}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card id="sales-quotations" className="glass-card border-white/5 xl:col-span-7 scroll-mt-24">
          <CardHeader>
            <CardTitle>Sales</CardTitle>
            <CardDescription>Quotations to invoices, pricelists, discount rules, order confirmations, and sales analytics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="text-xs uppercase tracking-[0.14em] text-primary">1. Sales Workflow</p>
            <div className="grid gap-2">
              <select
                value={quoteEmployeeId}
                onChange={(event) => setQuoteEmployeeId(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              <select
                value={quoteProductId}
                onChange={(event) => {
                  setQuoteProductId(event.target.value);
                  const product = products.find((item) => item.id === event.target.value);
                  if (product) setQuotePrice(String(product.basePrice));
                }}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select product</option>
                {products.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <div className="grid gap-2 md:grid-cols-2">
                <Input placeholder="Qty" value={quoteQty} onChange={(event) => setQuoteQty(event.target.value)} />
                <Input placeholder="Unit price" value={quotePrice} onChange={(event) => setQuotePrice(event.target.value)} />
              </div>
              <Button className="gradient-amber text-black font-semibold" onClick={createQuotation}>Create Quotation</Button>
            </div>

            <div className="rounded-xl border border-white/5 bg-card/40 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-primary">1.1 Core Tasks</p>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <Button type="button" variant="outline" className="justify-start border-white/10 bg-card/40" onClick={() => openOperationsView('draft')}>
                  Draft quotations: {draftOrders.length}
                </Button>
                <Button type="button" variant="outline" className="justify-start border-white/10 bg-card/40" onClick={() => openOperationsView('open')}>
                  Open confirmations: {openOrders.length}
                </Button>
                <Button type="button" variant="outline" className="justify-start border-white/10 bg-card/40" onClick={() => openOperationsView('settled')}>
                  Settled invoices: {settledOrders.length}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {draftOrders.slice(0, 2).map((order) => (
                <div key={order.id} className="rounded-lg border border-white/5 bg-card/40 p-2">
                  <p className="text-xs text-foreground">{order.orderNo} • {order.employeeName}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => updateOrderStatus(order.id, 'open')}>
                      Confirm Order
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => updateOrderStatus(order.id, 'settled')}>
                      Convert to Invoice
                    </Button>
                  </div>
                </div>
              ))}
              {draftOrders.length === 0 ? (
                <div className="flex items-center justify-between rounded-lg border border-dashed border-white/10 bg-card/30 p-2">
                  <p className="text-xs">No draft quotations available.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 bg-card/40"
                    onClick={() => {
                      scrollToSection('sales-quotations');
                    }}
                  >
                    Start New Quote
                  </Button>
                </div>
              ) : null}
            </div>

            <p className="pt-2 text-xs uppercase tracking-[0.14em] text-primary">2. Pricing & Discounts</p>
            <div className="space-y-2 rounded-xl border border-white/5 bg-card/40 p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <Input placeholder="Base amount" value={pricingBaseAmount} onChange={(event) => setPricingBaseAmount(event.target.value)} />
                <select
                  value={selectedPricingRuleId}
                  onChange={(event) => setSelectedPricingRuleId(event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Auto best rule</option>
                  {pricingRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>{rule.name} ({rule.value}%)</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPricingRule ? `${selectedPricingRule.name}: -${pricingPreview.effect.toFixed(2)}` : 'No pricing rule selected'} | Final: {pricingPreview.final.toFixed(2)}
              </p>
              <Button type="button" size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => scrollToSection('sales-pricing')}>
                Open Pricing Rules
              </Button>
            </div>

            <p className="pt-2 text-xs uppercase tracking-[0.14em] text-primary">3. Credit Management</p>
            <div className="space-y-2 rounded-xl border border-white/5 bg-card/40 p-3">
              <select
                value={selectedCreditId}
                onChange={(event) => setSelectedCreditId(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select customer profile</option>
                {credits.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.customer}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Required for next confirmation: {nextConfirmationAmount.toFixed(2)} | Available credit: {selectedCreditAvailable.toFixed(2)}
              </p>
              <Badge
                variant="outline"
                className={confirmationAllowed ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-200'}
              >
                {confirmationAllowed ? 'Confirmation allowed' : 'Confirmation gated by credit'}
              </Badge>
              <Button type="button" size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => scrollToSection('sales-credit')}>
                Open Customer Credit
              </Button>
            </div>

            <p className="pt-2 text-xs uppercase tracking-[0.14em] text-primary">4. Sales Operations & Analytics</p>
            <div className="space-y-2 rounded-xl border border-white/5 bg-card/40 p-3">
              <p className="text-xs text-muted-foreground">Booked revenue: {bookedRevenue.toFixed(2)} | Avg order: {averageOrderValue.toFixed(2)} | Conversion: {conversionRate}%</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => openOperationsView('all')}>
                  Open Feed
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => openOperationsView('open')}>
                  View Open Orders
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => openOperationsView('settled')}>
                  View Settled Orders
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-5">
          <Card id="crm-workbench" className="glass-card border-white/5 scroll-mt-24">
            <CardHeader>
              <CardTitle>CRM</CardTitle>
              <CardDescription>Visual pipeline, lead management, automated follow-ups, email integration, and sales forecasting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="grid gap-2">
                <Input placeholder="Opportunity title" value={crmTitle} onChange={(event) => setCrmTitle(event.target.value)} />
                <Input placeholder="Customer" value={crmCustomer} onChange={(event) => setCrmCustomer(event.target.value)} />
                <select
                  value={crmOwnerId}
                  onChange={(event) => setCrmOwnerId(event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select owner</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input placeholder="Customer email" type="email" value={crmEmail} onChange={(event) => setCrmEmail(event.target.value)} />
                  <Input placeholder="Opportunity value" value={crmValue} onChange={(event) => setCrmValue(event.target.value)} />
                </div>
                <Input type="date" value={crmFollowUp} onChange={(event) => setCrmFollowUp(event.target.value)} />
                <Button className="gradient-amber text-black font-semibold" onClick={addCrmOpportunity}>Add Opportunity</Button>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <Button type="button" variant="outline" className="justify-start border-white/10 bg-card/40" onClick={() => setCrmStageFilter('open')}>
                  Open opportunities: {crmOpenCount}
                </Button>
                <Button type="button" variant="outline" className="justify-start border-white/10 bg-card/40" onClick={() => setCrmStageFilter('draft')}>
                  Draft opportunities: {crmDraftCount}
                </Button>
                <Button type="button" variant="outline" className="justify-start border-white/10 bg-card/40" onClick={() => setCrmStageFilter('settled')}>
                  Settled/won opportunities: {crmSettledCount}
                </Button>
              </div>

              <div className="rounded-xl border border-white/5 bg-card/40 p-3">
                <p>Forecasted revenue: {CURRENCY_SYMBOL[currency] ?? ''}{crmForecast.toFixed(2)}</p>
                <p>Due follow-ups: {dueFollowUps.length}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => setCrmStageFilter('all')}>
                    Show All
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={runFollowUpAutomation}>
                    Run Follow-up Automation
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {visibleCrmOpportunities.length === 0 ? (
                  <p className="text-xs">No opportunities for this view.</p>
                ) : (
                  visibleCrmOpportunities.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-lg border border-white/5 bg-card/40 p-2">
                      <p className="text-xs text-foreground">{item.title} • {item.customer}</p>
                      <p className="text-xs">{item.stage} • {CURRENCY_SYMBOL[currency] ?? ''}{item.value.toFixed(2)} • Follow-up: {item.nextFollowUp || 'Not set'}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => advanceCrmOpportunity(item.id)}>
                          Advance Stage
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-card/40"
                          disabled={!item.email}
                          onClick={() => {
                            if (!item.email) return;
                            window.open(`mailto:${item.email}?subject=${encodeURIComponent(`Follow-up: ${item.title}`)}`);
                          }}
                        >
                          Send Follow-up Email
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card id="subscriptions-hub" className="glass-card border-white/5 scroll-mt-24">
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>Recurring billing, renewal management, churn tracking, and MRR dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="grid gap-2">
                <Input placeholder="Customer" value={subscriptionCustomer} onChange={(event) => setSubscriptionCustomer(event.target.value)} />
                <Input placeholder="Plan" value={subscriptionPlan} onChange={(event) => setSubscriptionPlan(event.target.value)} />
                <select
                  value={subscriptionOwnerId}
                  onChange={(event) => setSubscriptionOwnerId(event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select owner</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input placeholder="Recurring amount" value={subscriptionAmount} onChange={(event) => setSubscriptionAmount(event.target.value)} />
                  <select
                    value={subscriptionCycle}
                    onChange={(event) => setSubscriptionCycle(event.target.value as 'monthly' | 'quarterly' | 'yearly')}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="monthly">monthly</option>
                    <option value="quarterly">quarterly</option>
                    <option value="yearly">yearly</option>
                  </select>
                </div>
                <Input type="date" value={subscriptionRenewalDate} onChange={(event) => setSubscriptionRenewalDate(event.target.value)} />
                <Button className="gradient-amber text-black font-semibold" onClick={addSubscription}>Add Subscription</Button>
              </div>

              <div className="rounded-xl border border-white/5 bg-card/40 p-3">
                <div>Active subscriptions: {activeSubscriptions}</div>
                <div>Estimated MRR: {CURRENCY_SYMBOL[currency] ?? ''}{estimatedMrr.toFixed(0)}</div>
                <div>Renewals due this cycle: {renewalsDueThisCycle}</div>
                <div>Churn rate: {churnRate}%</div>
              </div>

              <div className="flex flex-wrap gap-2">
                {['all', 'active', 'trial', 'paused', 'churned'].map((status) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={subscriptionFilter === status ? 'default' : 'outline'}
                    className={subscriptionFilter === status ? 'gradient-amber text-black font-semibold' : 'border-white/10 bg-card/40'}
                    onClick={() => setSubscriptionFilter(status as 'all' | 'active' | 'trial' | 'paused' | 'churned')}
                  >
                    {status}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                {visibleSubscriptions.length === 0 ? (
                  <p className="text-xs">No subscriptions in this view.</p>
                ) : (
                  visibleSubscriptions.slice(0, 4).map((subscription) => (
                    <div key={subscription.id} className="rounded-lg border border-white/5 bg-card/40 p-2">
                      <p className="text-xs text-foreground">{subscription.customer} • {subscription.plan}</p>
                      <p className="text-xs">
                        {subscription.status} • {CURRENCY_SYMBOL[currency] ?? ''}{subscription.amount.toFixed(2)} / {subscription.cycle} • Renewal: {subscription.renewalDate || 'Not set'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => renewSubscription(subscription.id)}>
                          Renew
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => cycleSubscriptionStatus(subscription.id)}>
                          Cycle Status
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
            <CardTitle>POS Shop</CardTitle>
            <CardDescription>
              Touch-screen retail interface, barcode scanning, loyalty-ready checkout, split payments, and offline mode.
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

        <Card id="sales-cash-drawer" className="glass-card border-white/5 xl:col-span-4 scroll-mt-24">
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
        <Card id="pos-restaurant" className="glass-card border-white/5 xl:col-span-6 scroll-mt-24">
          <CardHeader>
            <CardTitle>POS Restaurant</CardTitle>
            <CardDescription>Table management, kitchen display flow, split bills, and tips for hospitality operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Input placeholder="Table" value={restaurantTable} onChange={(event) => setRestaurantTable(event.target.value)} />
              <Input placeholder="Guests" value={restaurantGuests} onChange={(event) => setRestaurantGuests(event.target.value)} />
              <Input placeholder="Tips" value={restaurantTips} onChange={(event) => setRestaurantTips(event.target.value)} />
            </div>
            <div className="rounded-xl border border-white/5 bg-card/40 p-3 text-sm text-muted-foreground">
              Table {restaurantTable || 'T-01'} • Guests {restaurantGuests || '0'} • Tips {restaurantTips || '0'}
            </div>
          </CardContent>
        </Card>

        <Card id="rental-desk" className="glass-card border-white/5 xl:col-span-6 scroll-mt-24">
          <CardHeader>
            <CardTitle>Rental</CardTitle>
            <CardDescription>Contract creation, delivery/return tracking, and product availability calendar workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Product / Asset" value={rentalProduct} onChange={(event) => setRentalProduct(event.target.value)} />
              <Input placeholder="Customer" value={rentalCustomer} onChange={(event) => setRentalCustomer(event.target.value)} />
              <Input type="date" value={rentalStart} onChange={(event) => setRentalStart(event.target.value)} />
              <Input type="date" value={rentalEnd} onChange={(event) => setRentalEnd(event.target.value)} />
            </div>
            <Button className="gradient-amber text-black font-semibold" onClick={addRentalContract}>Create Rental Contract</Button>
            <div className="space-y-2">
              {rentalContracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rental contracts yet.</p>
              ) : (
                rentalContracts.map((contract) => (
                  <div key={contract.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                    <p className="text-sm font-medium text-foreground">{contract.product} • {contract.customer}</p>
                    <p className="text-xs text-muted-foreground">{contract.start} to {contract.end} • {contract.status}</p>
                  </div>
                ))
              )}
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
