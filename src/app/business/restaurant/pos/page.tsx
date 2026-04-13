"use client";

import { Shell } from '@/components/layout/Shell';
import { RestaurantBuiltInPOS } from '@/components/business/RestaurantBuiltInPOS';

export default function BusinessRestaurantPOSPage() {
  return (
    <Shell>
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div>
          <h1 className="text-3xl font-bold">Restaurant POS</h1>
          <p className="text-sm text-muted-foreground">Built-in point of sale system for dine-in orders and table management.</p>
        </div>

        <RestaurantBuiltInPOS branchId="default-branch" />
      </div>
    </Shell>
  );
}
