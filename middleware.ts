import { NextRequest, NextResponse } from 'next/server';

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'airtyn.com').toLowerCase();

const PROTECTED_PREFIXES = [
  '/business',
  '/projects',
  '/activity',
  '/calendar',
  '/reports',
  '/integrations',
  '/intelligence',
  '/billing',
  '/settings',
  '/teams',
  '/timeline',
  '/workload',
  '/templates',
  '/admin',
  '/scale',
];

function getHostname(hostHeader: string | null): string {
  return (hostHeader ?? '').split(':')[0].trim().toLowerCase();
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname.endsWith('.localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
}

function extractSubdomain(hostname: string): string | null {
  if (!hostname) return null;
  if (!hostname.endsWith(`.${ROOT_DOMAIN}`)) return null;
  const candidate = hostname.slice(0, -(ROOT_DOMAIN.length + 1));
  if (!candidate || candidate.includes('.')) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(candidate)) return null;
  return candidate;
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const hostname = getHostname(request.headers.get('host'));
  const pathname = request.nextUrl.pathname;
  const subdomain = extractSubdomain(hostname);

  if (isProtectedPath(pathname) && !subdomain && !isLocalHost(hostname)) {
    return NextResponse.redirect(new URL(`https://${ROOT_DOMAIN}/?tenant=required`));
  }

  if (subdomain && pathname === '/') {
    return NextResponse.redirect(new URL(`https://${hostname}/business`));
  }

  const requestHeaders = new Headers(request.headers);
  if (subdomain) {
    requestHeaders.set('x-tenant-subdomain', subdomain);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
