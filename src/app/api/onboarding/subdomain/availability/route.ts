import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col } from '@/lib/server/firestore-data';

function normalizeSubdomain(input: string): string | null {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(normalized)) return null;
  return normalized;
}

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('subdomain') ?? '';
    const subdomain = normalizeSubdomain(raw);
    if (!subdomain) {
      return NextResponse.json({ ok: false, available: false, error: 'Invalid subdomain format' }, { status: 400 });
    }

    const reserved = new Set(['www', 'app', 'api', 'admin', 'mail', 'docs', 'support', 'help', 'status']);
    if (reserved.has(subdomain)) {
      return NextResponse.json({ ok: true, available: false, reason: 'reserved' });
    }

    const snap = await adminFirestore
      .collection(col.coreTenants)
      .where('subdomainLower', '==', subdomain)
      .limit(1)
      .get();

    return NextResponse.json({ ok: true, available: snap.empty, subdomain });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to check subdomain' }, { status: 500 });
  }
}
