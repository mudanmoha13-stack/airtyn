"use client";

import { Shell } from '@/components/layout/Shell';
import { EnhancedRestaurantPOS } from '@/components/business/EnhancedRestaurantPOS';

export default function BusinessRestaurantPOSPage() {
  return (
    <Shell>
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div>
          <h1 className="text-3xl font-bold">Restaurant POS System</h1>
          <p className="text-sm text-muted-foreground">Complete POS with 12 modes: Counter, Waiter, Table, QR Ordering, Takeaway, Delivery, Split Billing, Merge Tables, Refunds, Receipt Printing, Cash Drawer, and Shift Control.</p>
        </div>

        <EnhancedRestaurantPOS branchId="default-branch" />
      </div>
    </Shell>
  );
}
