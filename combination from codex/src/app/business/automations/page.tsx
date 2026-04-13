"use client";

import { Workflow } from 'lucide-react';
import { BusinessPageFrame } from '@/components/business/BusinessPageFrame';

export default function BusinessAutomationsPage() {
  return (
    <BusinessPageFrame
      eyebrow="Automation"
      title="Business workflow automation"
      description="Automate approvals, restock triggers, payroll checks, and accounting handoffs from a product-specific admin surface on the same platform."
      icon={Workflow}
      stats={[
        { label: 'Automation rules', value: '34', delta: '11 cross-team flows' },
        { label: 'Tasks saved', value: '1.8k/mo', delta: 'Estimated manual steps removed' },
        { label: 'Failure rate', value: '0.6%', delta: 'Below internal target' },
        { label: 'Queued runs', value: '14', delta: 'All within SLA' },
      ]}
      modules={[
        { title: 'Approval flows', description: 'Purchasing, payroll, and spend guardrails.', status: 'Live' },
        { title: 'Ops triggers', description: 'Stock alerts, customer actions, and warehouse events.', status: 'Ready' },
        { title: 'Finance routines', description: 'Periodic close reminders and exception routing.', status: 'Planned' },
      ]}
    />
  );
}
