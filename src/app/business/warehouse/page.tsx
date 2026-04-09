import { Archive } from 'lucide-react';
import { BusinessPageFrame } from '@/components/business/BusinessPageFrame';

export default function BusinessWarehousePage() {
  return (
    <BusinessPageFrame
      eyebrow="Warehouse"
      title="Warehouse orchestration"
      description="Manage zones, bin health, labor readiness, and warehouse throughput from the business app while preserving a separate navigation and operating model."
      icon={Archive}
      stats={[
        { label: 'Active bins', value: '1,842', delta: '96.7% mapped accuracy' },
        { label: 'Throughput', value: '2.1k/day', delta: '+14% over baseline' },
        { label: 'Pick accuracy', value: '99.2%', delta: 'Best in 90 days' },
        { label: 'Labor utilization', value: '84%', delta: 'Balanced across shifts' },
      ]}
      modules={[
        { title: 'Zone control', description: 'Area status, congestion, and task release readiness.', status: 'Ready' },
        { title: 'Cycle counts', description: 'Variance review and recount handling.', status: 'Live' },
        { title: 'Labor board', description: 'Shift utilization and exception balancing.', status: 'Planned' },
      ]}
    />
  );
}
