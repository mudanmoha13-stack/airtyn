"use client";

import { EnhancedRestaurantPOS } from '@/components/business/EnhancedRestaurantPOS';

export default function BusinessRestaurantPOSPage() {
  return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Restaurant POS System</h1>
          <p className="text-sm text-muted-foreground">Complete POS with 12 modes: Counter, Waiter, Table, QR Ordering, Takeaway, Delivery, Split Billing, Merge Tables, Refunds, Receipt Printing, Cash Drawer, and Shift Control.</p>
        </div>

        <EnhancedRestaurantPOS branchId="default-branch" />
      </div>
  );
}
