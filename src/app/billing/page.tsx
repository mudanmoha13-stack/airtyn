"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function BillingPage() {
  return (
    <Shell>
      <div className="max-w-3xl">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Billing and Payments</CardTitle>
            <CardDescription>Deferred to the next implementation phase.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Subscription plans and payment gateway integrations are intentionally parked for the next phase,
              per your direction.
            </p>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
