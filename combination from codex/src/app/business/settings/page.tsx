"use client";

import { Settings } from 'lucide-react';
import { BusinessPageFrame } from '@/components/business/BusinessPageFrame';

export default function BusinessSettingsPage() {
  return (
    <BusinessPageFrame
      eyebrow="Configuration"
      title="Business settings and policy controls"
      description="Manage business-specific operating rules, fiscal settings, approvals, and permissions while staying on the same tenant and auth foundation as the project app."
      icon={Settings}
      stats={[
        { label: 'Policy sets', value: '12', delta: 'Across finance and ops' },
        { label: 'Approval matrices', value: '7', delta: '2 recently updated' },
        { label: 'Fiscal entities', value: '3', delta: 'Multi-company ready' },
        { label: 'Audit policies', value: '100%', delta: 'All enforced' },
      ]}
      modules={[
        { title: 'Operating policies', description: 'Thresholds, calendars, and approval boundaries.', status: 'Ready' },
        { title: 'Entity setup', description: 'Subsidiary, branch, and fiscal configuration.', status: 'Planned' },
        { title: 'Audit readiness', description: 'Control visibility and business access trails.', status: 'Live' },
      ]}
    />
  );
}
