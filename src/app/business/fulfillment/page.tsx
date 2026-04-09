"use client";

import { Truck } from 'lucide-react';
import { BusinessPageFrame } from '@/components/business/BusinessPageFrame';

export default function BusinessFulfillmentPage() {
  return (
    <BusinessPageFrame
      eyebrow="Fulfillment"
      title="Shipping and order execution"
      description="Coordinate pick-pack-ship workflows, delivery promises, and exception handling from a dedicated business surface while reusing the core platform stack."
      icon={Truck}
      stats={[
        { label: 'Orders shipping today', value: '126', delta: '18 priority orders' },
        { label: 'On-time ship', value: '98.1%', delta: 'Ahead of SLA' },
        { label: 'Return rate', value: '1.4%', delta: 'Stable over 30 days' },
        { label: 'Carrier issues', value: '4', delta: 'All under review' },
      ]}
      modules={[
        { title: 'Wave planning', description: 'Batch orders by SLA, route, and packing profile.', status: 'Planned' },
        { title: 'Shipment tracking', description: 'Carrier statuses and exception alerts.', status: 'Ready' },
        { title: 'Returns desk', description: 'RMA, inspection, restock, and credit flows.', status: 'Ready' },
      ]}
    />
  );
}
