import { NextRequest } from 'next/server';
import { BUSINESS_DEFAULT_TENANT_ID } from '@/lib/server/firestore-data';

function normalizeTenantId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9_-]{2,128}$/.test(trimmed)) return null;
  return trimmed;
}

export function resolveBusinessTenantId(request: NextRequest): string {
  const queryTenant = normalizeTenantId(request.nextUrl.searchParams.get('tenantId'));
  if (queryTenant) return queryTenant;

  const headerTenant = normalizeTenantId(request.headers.get('x-tenant-id'));
  if (headerTenant) return headerTenant;

  return BUSINESS_DEFAULT_TENANT_ID;
}

export function resolveBusinessOwnerEmail(request: NextRequest): string | undefined {
  const headerValue = request.headers.get('x-owner-email')?.trim().toLowerCase();
  if (!headerValue) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(headerValue)) return undefined;
  return headerValue;
}
