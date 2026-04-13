import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const journalQuerySchema = z.object({
  orderId: z.string().optional(),
  branchId: z.string().optional(),
  entryType: z.enum(['revenue', 'cogs', 'labor_expense', 'delivery']).optional(),
});

const createJournalSchema = z.object({
  orderId: z.string().min(1),
  entryType: z.enum(['revenue', 'cogs', 'labor_expense', 'delivery']),
  accountDebit: z.string().min(1),
  accountCredit: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional(),
  branchId: z.string().optional(),
});

// Standard GL account mappings (these would come from Chart of Accounts in production)
const GL_ACCOUNTS = {
  // Assets
  'ASSET_CASH': { code: '1000', name: 'Cash', type: 'asset' },
  'ASSET_RECEIVABLES': { code: '1200', name: 'Accounts Receivable', type: 'asset' },
  'ASSET_INVENTORY': { code: '1300', name: 'Inventory', type: 'asset' },

  // Expenses
  'EXP_COGS': { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
  'EXP_LABOR': { code: '5100', name: 'Labor Expense', type: 'expense' },
  'EXP_DELIVERY': { code: '5200', name: 'Delivery Expense', type: 'expense' },

  // Revenue
  'REV_FOOD': { code: '4000', name: 'Food & Beverage Revenue', type: 'revenue' },
  'REV_DELIVERY': { code: '4100', name: 'Delivery Revenue', type: 'revenue' },

  // Liabilities
  'LIB_PAYABLE': { code: '2000', name: 'Accounts Payable', type: 'liability' },
};

function validateGLAccount(accountCode: string): boolean {
  return Object.values(GL_ACCOUNTS).some((acc) => acc.code === accountCode);
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const url = new URL(request.url);
    const params = journalQuerySchema.parse({
      orderId: url.searchParams.get('orderId') ?? undefined,
      branchId: url.searchParams.get('branchId') ?? undefined,
      entryType: url.searchParams.get('entryType') as any ?? undefined,
    });

    let query: FirebaseFirestore.Query = adminFirestore
      .collection(col.bizAccountingJournals)
      .where('tenantId', '==', tenantId);

    if (params.orderId) {
      query = query.where('orderId', '==', params.orderId);
    }

    if (params.branchId) {
      query = query.where('branchId', '==', params.branchId);
    }

    if (params.entryType) {
      query = query.where('entryType', '==', params.entryType);
    }

    const snap = await query.orderBy('createdAt', 'desc').limit(200).get();

    const journals = snap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        orderId: data.orderId,
        entryType: String(data.entryType ?? ''),
        accountDebit: String(data.accountDebit ?? ''),
        accountCredit: String(data.accountCredit ?? ''),
        amount: Number(data.amount ?? 0),
        description: data.description ?? '',
        branchId: data.branchId ?? null,
        status: String(data.status ?? 'posted'),
        createdAt: data.createdAt,
      };
    });

    return NextResponse.json({ ok: true, data: journals });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid query parameters', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to fetch journal entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = createJournalSchema.parse(await request.json());

    // Validate GL accounts exist
    if (!validateGLAccount(payload.accountDebit) || !validateGLAccount(payload.accountCredit)) {
      return NextResponse.json({ ok: false, error: 'Invalid GL account code' }, { status: 400 });
    }

    // Validate debit != credit
    if (payload.accountDebit === payload.accountCredit) {
      return NextResponse.json({ ok: false, error: 'Debit and credit accounts cannot be the same' }, { status: 400 });
    }

    const journalId = makeId(col.bizAccountingJournals);
    const now = nowIso();

    await adminFirestore.collection(col.bizAccountingJournals).doc(journalId).set({
      id: journalId,
      tenantId,
      orderId: payload.orderId,
      entryType: payload.entryType,
      accountDebit: payload.accountDebit,
      accountCredit: payload.accountCredit,
      amount: payload.amount,
      description: payload.description?.trim() ?? `${payload.entryType} for order ${payload.orderId}`,
      branchId: payload.branchId ?? null,
      status: 'posted',
      createdAt: now,
    });

    return NextResponse.json({ ok: true, data: { id: journalId } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid journal payload', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create journal entry' }, { status: 500 });
  }
}
