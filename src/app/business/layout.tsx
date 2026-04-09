import React from 'react';
import { BusinessModuleDock } from '@/components/business/BusinessModuleDock';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Add bottom padding on desktop so content doesn't hide behind the dock */}
      <div className="pb-0 md:pb-12">
        {children}
      </div>
      <BusinessModuleDock />
    </>
  );
}
