import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { hashPassword } from '@/lib/server/password';

const bootstrapSchema = z.object({
  tenant: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
    subdomain: z.string().optional(),
    plan: z.string().default('free'),
  }),
  workspace: z.object({
    id: z.string().min(1),
    tenantId: z.string().min(1),
    name: z.string().min(1),
    createdAt: z.string().min(1),
  }),
  owner: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    avatarUrl: z.string().optional(),
    password: z.string().min(10).optional(),
  }),
  businessType: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = bootstrapSchema.parse(await request.json());
    const ownerEmail = payload.owner.email.toLowerCase();
    const tenantId = payload.tenant.id;
    const subdomain = payload.tenant.subdomain?.trim().toLowerCase() ?? null;

    if (subdomain) {
      const duplicate = await adminFirestore
        .collection(col.coreTenants)
        .where('subdomainLower', '==', subdomain)
        .limit(1)
        .get();
      if (!duplicate.empty && duplicate.docs[0].id !== tenantId) {
        return NextResponse.json({ ok: false, error: 'Subdomain is already taken' }, { status: 409 });
      }
    }

    await ensureBusinessTenantDoc(tenantId, ownerEmail);

    await Promise.all([
      adminFirestore.collection(col.coreTenants).doc(tenantId).set(
        {
          ...payload.tenant,
          subdomain,
          subdomainLower: subdomain,
          ownerEmail,
          businessType: payload.businessType ?? null,
          status: 'active',
          updatedAt: nowIso(),
          createdAt: nowIso(),
        },
        { merge: true }
      ),
      adminFirestore.collection(col.coreWorkspaces).doc(payload.workspace.id).set(
        {
          ...payload.workspace,
          updatedAt: nowIso(),
        },
        { merge: true }
      ),
      adminFirestore.collection(col.bizUsers).doc(payload.owner.id).set(
        {
          id: payload.owner.id,
          tenantId,
          email: ownerEmail,
          firstName: payload.owner.name.split(' ')[0] ?? payload.owner.name,
          lastName: payload.owner.name.split(' ').slice(1).join(' ') || null,
          status: 'active',
          avatarUrl: payload.owner.avatarUrl ?? null,
          ...(payload.owner.password ? { passwordHash: hashPassword(payload.owner.password) } : {}),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        { merge: true }
      ),
    ]);

    const auditId = makeId(col.bizAuditLogs);
    await adminFirestore.collection(col.bizAuditLogs).doc(auditId).set({
      id: auditId,
      tenantId,
      module: 'onboarding',
      entityType: 'tenant',
      entityId: tenantId,
      action: 'business_owner_registered',
      meta: {
        ownerEmail,
        ownerName: payload.owner.name,
        businessType: payload.businessType ?? 'unspecified',
        subdomain,
      },
      createdAt: nowIso(),
    });

    return NextResponse.json({ ok: true, tenantId, ownerEmail }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid bootstrap payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to bootstrap business tenant' },
      { status: 500 }
    );
  }
}
