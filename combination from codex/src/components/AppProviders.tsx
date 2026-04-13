"use client";

import React, { useEffect } from 'react';
import { AppProvider } from '@/lib/store';

const APP_STATE_STORAGE_KEY = 'pinkplan-app-state-v5';

function readCurrentTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { currentTenant?: { id?: string } | null };
    const tenantId = parsed.currentTenant?.id?.trim();
    return tenantId ? tenantId : null;
  } catch {
    return null;
  }
}

function readCurrentUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { currentUser?: { email?: string } | null };
    const email = parsed.currentUser?.email?.trim().toLowerCase();
    return email ? email : null;
  } catch {
    return null;
  }
}

function withBusinessTenant(input: RequestInfo | URL): RequestInfo | URL {
  const tenantId = readCurrentTenantId();
  if (!tenantId) return input;

  const asString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (!asString.includes('/api/business')) return input;

  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = asString.startsWith('http') ? new URL(asString) : new URL(asString, base);
  if (url.searchParams.has('tenantId')) return input;
  url.searchParams.set('tenantId', tenantId);

  if (typeof input === 'string') {
    return asString.startsWith('http') ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  }

  return url;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const nextInput = withBusinessTenant(input);
      const asString = typeof nextInput === 'string' ? nextInput : nextInput instanceof URL ? nextInput.toString() : nextInput.url;
      const isBusinessApi = asString.includes('/api/business');

      if (!isBusinessApi) {
        return originalFetch(nextInput, init);
      }

      const email = readCurrentUserEmail();
      if (!email) {
        return originalFetch(nextInput, init);
      }

      const headers = new Headers(init?.headers ?? {});
      if (!headers.has('x-owner-email')) {
        headers.set('x-owner-email', email);
      }

      return originalFetch(nextInput, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <AppProvider>{children}</AppProvider>;
}
