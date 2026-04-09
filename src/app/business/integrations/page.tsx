import { Webhook } from 'lucide-react';
import { BusinessPageFrame } from '@/components/business/BusinessPageFrame';

export default function BusinessIntegrationsPage() {
  return (
    <BusinessPageFrame
      eyebrow="Connected systems"
      title="Business integrations"
      description="Connect ERP-adjacent systems, banking rails, POS, payroll vendors, and warehouse tools through the same integration infrastructure with product separation at the route layer."
      icon={Webhook}
      stats={[
        { label: 'Connected systems', value: '19', delta: '6 production-grade' },
        { label: 'Daily sync jobs', value: '3,420', delta: '99.4% success rate' },
        { label: 'Webhook latency', value: '112ms', delta: 'Median end-to-end' },
        { label: 'Pending mappings', value: '7', delta: '2 blocking go-live' },
      ]}
      modules={[
        { title: 'Data connectors', description: 'Accounting, payroll, ecommerce, and vendor systems.', status: 'Ready' },
        { title: 'Mapping studio', description: 'Field transformations and sync definitions.', status: 'Planned' },
        { title: 'Run diagnostics', description: 'Operational visibility into sync health and failures.', status: 'Live' },
      ]}
    />
  );
}
