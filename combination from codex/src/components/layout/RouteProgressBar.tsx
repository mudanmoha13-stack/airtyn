"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigationFeedback } from './NavigationFeedback';

type Phase = 'idle' | 'loading' | 'completing';

export const RouteProgressBar = () => {
  const { loading } = useNavigationFeedback();
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    if (loading) {
      setPhase('loading');
    } else if (phase === 'loading') {
      setPhase('completing');
      const t = window.setTimeout(() => setPhase('idle'), 400);
      return () => window.clearTimeout(t);
    }
  // phase intentionally excluded to avoid loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px]">
      <div
        className={cn(
          'h-full bg-gradient-to-r from-primary via-accent to-secondary shadow-[0_0_12px_rgba(255,79,216,0.7)]',
          phase === 'idle' && 'w-0 opacity-0',
          phase === 'loading' && 'nav-progress-bar opacity-100',
          phase === 'completing' && 'w-full opacity-0 transition-opacity duration-350',
        )}
      />
    </div>
  );
};
