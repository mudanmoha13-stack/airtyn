import type { BusinessModuleKey } from '@/lib/business-os';

type SearchParamsLike = {
  get: (name: string) => string | null;
};

const BUSINESS_WORKSPACE_PATH = '/business';

const LEGACY_BUSINESS_ROUTE_MAP: Record<string, BusinessModuleKey> = {
  accounting: 'finance',
  analytics: 'analytics',
  crm: 'sales',
  finance: 'finance',
  hr: 'hr',
  inventory: 'inventory',
  payroll: 'hr',
  procurement: 'procurement',
  projects: 'projects',
  purchases: 'procurement',
  reports: 'analytics',
  sales: 'sales',
  support: 'support',
};

const BUSINESS_MODULE_KEYS = new Set<BusinessModuleKey>([
  'crm',
  'sales',
  'finance',
  'hr',
  'inventory',
  'projects',
  'procurement',
  'support',
  'analytics',
]);

export function normalizeBusinessModuleKey(value: string | null | undefined): BusinessModuleKey | null {
  if (!value) return null;
  if (!BUSINESS_MODULE_KEYS.has(value as BusinessModuleKey)) return null;
  return value === 'crm' ? 'sales' : value as BusinessModuleKey;
}

export function buildBusinessWorkspaceHref(moduleKey?: BusinessModuleKey | null, hash?: string): string {
  const normalizedHash = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
  const normalizedModule = normalizeBusinessModuleKey(moduleKey);

  if (!normalizedModule) {
    return `${BUSINESS_WORKSPACE_PATH}${normalizedHash}`;
  }

  return `${BUSINESS_WORKSPACE_PATH}?module=${normalizedModule}${normalizedHash}`;
}

export function resolveBusinessModuleKey(pathname: string, searchParams?: SearchParamsLike | null): BusinessModuleKey | null {
  const queryModule = normalizeBusinessModuleKey(searchParams?.get('module'));
  if (queryModule) return queryModule;

  if (!pathname.startsWith(BUSINESS_WORKSPACE_PATH)) return null;
  const [, maybeModule] = pathname.split('/');
  if (!maybeModule || maybeModule === 'business') {
    const segments = pathname.split('/').filter(Boolean);
    const legacyModule = segments[1];
    return legacyModule ? (LEGACY_BUSINESS_ROUTE_MAP[legacyModule] ?? null) : null;
  }

  return LEGACY_BUSINESS_ROUTE_MAP[maybeModule] ?? null;
}

export function getBusinessHrefModuleKey(href: string): BusinessModuleKey | null {
  if (!href.startsWith('/business')) return null;
  const parsed = new URL(href, 'https://pinkplan.local');
  return resolveBusinessModuleKey(parsed.pathname, parsed.searchParams);
}

export function matchesBusinessHref(currentPathname: string, currentSearchParams: SearchParamsLike | null | undefined, href: string): boolean {
  if (!href.startsWith('/business')) return false;

  const targetModule = getBusinessHrefModuleKey(href);
  const currentModule = resolveBusinessModuleKey(currentPathname, currentSearchParams);

  if (!targetModule) {
    return currentPathname === BUSINESS_WORKSPACE_PATH && !currentModule;
  }

  return currentModule === targetModule;
}