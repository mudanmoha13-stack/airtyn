"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BUSINESS_MODULE_SUMMARIES } from '@/lib/business-os';
import type { BusinessModuleKey } from '@/lib/business-os';
import { buildBusinessWorkspaceHref, normalizeBusinessModuleKey } from '@/lib/business-navigation';
import { BusinessModulePage } from '@/components/business/BusinessModulePage';
import { useAppState } from '@/lib/store';
import { RestaurantOperatingSystemOverview } from '@/components/business/RestaurantOperatingSystemOverview';

const HOME_MODULES = BUSINESS_MODULE_SUMMARIES
  .filter((module) => module.key !== 'crm')
  .map((module) => (
    module.key === 'sales'
      ? {
          ...module,
          title: 'Sales & CRM',
          summary: 'Manage leads, contacts, accounts, deals, activities, forecasting, and POS operations from one commercial workspace.',
        }
      : module
  ));

export function BusinessWorkspace() {
  const searchParams = useSearchParams();
  const { currentTenant } = useAppState();
  const activeModule = normalizeBusinessModuleKey(searchParams.get('module'));
  const [visitedModules, setVisitedModules] = useState<BusinessModuleKey[]>([]);
  const normalizedBusinessType = (currentTenant?.businessType ?? '').trim().toLowerCase();
  const isRestaurantWorkspace = normalizedBusinessType === 'restaurant' || normalizedBusinessType === 'coffee';

  useEffect(() => {
    if (!activeModule) return;
    setVisitedModules((current) => (current.includes(activeModule) ? current : [...current, activeModule]));
  }, [activeModule]);

  const modulesToRender = useMemo(
    () => (activeModule ? visitedModules.filter((moduleKey) => moduleKey === activeModule || visitedModules.includes(moduleKey)) : []),
    [activeModule, visitedModules]
  );

  return (
    <>
      {!activeModule ? (
        <div className="space-y-6">
          <div>
            <h1 className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-3xl font-bold text-transparent">
              {isRestaurantWorkspace ? 'Restaurant Workspace' : 'Business'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isRestaurantWorkspace ? 'Restaurant and coffee operations hub with tailored modules, workflows, and rollout guidance.' : 'Select a module to get started.'}
            </p>
          </div>

          {isRestaurantWorkspace ? <RestaurantOperatingSystemOverview businessType={currentTenant?.businessType} /> : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {HOME_MODULES.map((module) => (
              <Link key={module.key} href={buildBusinessWorkspaceHref(module.key === 'crm' ? 'sales' : module.key)} className="group block focus:outline-none">
                <Card className="glass-card h-full border-white/5 transition-all duration-150 group-hover:border-primary/20 group-hover:bg-white/[0.05]">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                      <module.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="pt-2 text-lg">{module.title}</CardTitle>
                    <CardDescription>{module.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full border-white/10 bg-background/30 group-hover:border-primary/30 group-hover:text-primary">
                      <span>Open module</span>
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {modulesToRender.map((moduleKey) => (
        <div key={moduleKey} className={moduleKey === activeModule ? 'block' : 'hidden'}>
          <BusinessModulePage moduleKey={moduleKey} embedded />
        </div>
      ))}
    </>
  );
}
