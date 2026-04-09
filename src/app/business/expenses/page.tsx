"use client";

import { HandCoins } from 'lucide-react';
import { BusinessPageFrame } from '@/components/business/BusinessPageFrame';

export default function BusinessExpensesPage() {
  return (
    <BusinessPageFrame
      eyebrow="Spend"
      title="Expenses and approvals"
      description="Capture operating spend, policy violations, receipts, and reimbursement queues under the business app while keeping project views clean."
      icon={HandCoins}
      stats={[
        { label: 'Claims submitted', value: '92', delta: '16 this week' },
        { label: 'Awaiting approval', value: '23', delta: '7 urgent' },
        { label: 'Average reimbursement', value: '$214', delta: 'Within expected range' },
        { label: 'Policy flags', value: '5', delta: '2 need finance review' },
      ]}
      modules={[
        { title: 'Receipt capture', description: 'Manual upload and OCR-ready pipeline placeholder.', status: 'Planned' },
        { title: 'Approval matrix', description: 'Department and threshold-based routing.', status: 'Ready' },
        { title: 'Reimbursement queue', description: 'Track payable status and release batches.', status: 'Live' },
      ]}
    />
  );
}
