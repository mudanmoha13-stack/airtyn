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
      return NextResponse.json({ ok: false, error: 'Invalid subdomain' }, { status: 400 });
    }

    const tenantSnap = await adminFirestore
      .collection(col.coreTenants)
      .where('subdomainLower', '==', subdomain)
      .limit(1)
      .get();

    if (tenantSnap.empty) {
      return NextResponse.json({ ok: false, error: 'Tenant not found for subdomain' }, { status: 404 });
    }

    const tenantDoc = tenantSnap.docs[0];
    const tenantData = tenantDoc.data();

    const workspaceSnap = await adminFirestore
      .collection(col.coreWorkspaces)
      .where('tenantId', '==', tenantDoc.id)
      .limit(1)
      .get();

    const workspaceData = workspaceSnap.empty ? null : workspaceSnap.docs[0].data();

    return NextResponse.json({
      ok: true,
      tenant: {
        id: tenantDoc.id,
        name: String(tenantData.name ?? ''),
        slug: String(tenantData.slug ?? ''),
        plan: String(tenantData.plan ?? 'free'),
        subdomain: String(tenantData.subdomain ?? subdomain),
      },
      workspace: workspaceData
        ? {
            id: String(workspaceData.id ?? workspaceSnap.docs[0].id),
            tenantId: String(workspaceData.tenantId ?? tenantDoc.id),
            name: String(workspaceData.name ?? 'Workspace'),
            createdAt: String(workspaceData.createdAt ?? new Date().toISOString()),
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to resolve tenant' }, { status: 500 });
  }
}
