import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { BUSINESS_DEFAULT_TENANT_ID, col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';

const uomSchema = z.object({
  name: z.string().min(1),
  symbol: z.string().min(1),
  category: z.string().optional(),
});

const conversionSchema = z.object({
  fromUomId: z.string().min(1),
  toUomId: z.string().min(1),
  factor: z.number().positive(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeConversions = searchParams.get('conversions') === 'true';

    const [uomSnap, conversionSnap] = await Promise.all([
      adminFirestore.collection(col.bizUoms).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).orderBy('name', 'asc').get(),
      includeConversions
        ? adminFirestore.collection(col.bizUomConversions).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).get()
        : Promise.resolve(null),
    ]);

    const uomMap = new Map(uomSnap.docs.map((doc) => [doc.id, doc.data()]));

    const uoms = uomSnap.docs.map((doc) => {
      const data = doc.data();
      if (!conversionSnap) {
        return { id: doc.id, ...data };
      }

      const fromConversions = conversionSnap.docs
        .filter((conv) => conv.data().fromUomId === doc.id)
        .map((conv) => ({
          id: conv.id,
          ...conv.data(),
          toUom: (() => {
            const to = uomMap.get(String(conv.data().toUomId ?? ''));
            return to ? { id: String(conv.data().toUomId), name: to.name, symbol: to.symbol } : null;
          })(),
        }));

      const toConversions = conversionSnap.docs
        .filter((conv) => conv.data().toUomId === doc.id)
        .map((conv) => ({
          id: conv.id,
          ...conv.data(),
          fromUom: (() => {
            const from = uomMap.get(String(conv.data().fromUomId ?? ''));
            return from ? { id: String(conv.data().fromUomId), name: from.name, symbol: from.symbol } : null;
          })(),
        }));

      return { id: doc.id, ...data, fromConversions, toConversions };
    });

    return NextResponse.json({ ok: true, uoms });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureBusinessTenantDoc();
    const { searchParams } = new URL(req.url);

    if (searchParams.get('conversion') === 'true') {
      const body = conversionSchema.parse(await req.json());

      if (body.fromUomId === body.toUomId) {
        return NextResponse.json({ ok: false, error: 'From and To UoM cannot be the same' }, { status: 400 });
      }

      const existing = await adminFirestore
        .collection(col.bizUomConversions)
        .where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID)
        .where('fromUomId', '==', body.fromUomId)
        .where('toUomId', '==', body.toUomId)
        .limit(1)
        .get();

      if (!existing.empty) {
        return NextResponse.json({ ok: false, error: 'Conversion rule already exists', duplicateField: 'fromUomId_toUomId' }, { status: 409 });
      }

      const id = makeId(col.bizUomConversions);
      await adminFirestore.collection(col.bizUomConversions).doc(id).set({
        id,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        fromUomId: body.fromUomId,
        toUomId: body.toUomId,
        factor: body.factor,
        createdAt: nowIso(),
      });

      const [fromUom, toUom] = await Promise.all([
        adminFirestore.collection(col.bizUoms).doc(body.fromUomId).get(),
        adminFirestore.collection(col.bizUoms).doc(body.toUomId).get(),
      ]);

      return NextResponse.json(
        {
          ok: true,
          conversion: {
            id,
            fromUomId: body.fromUomId,
            toUomId: body.toUomId,
            factor: body.factor,
            fromUom: fromUom.exists ? { id: fromUom.id, ...fromUom.data() } : null,
            toUom: toUom.exists ? { id: toUom.id, ...toUom.data() } : null,
          },
        },
        { status: 201 }
      );
    }

    const body = uomSchema.parse(await req.json());
    const normalizedSymbol = body.symbol.trim().toLowerCase();

    const existingUom = await adminFirestore
      .collection(col.bizUoms)
      .where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID)
      .where('symbol', '==', normalizedSymbol)
      .limit(1)
      .get();

    if (!existingUom.empty) {
      return NextResponse.json({ ok: false, error: `UoM symbol '${normalizedSymbol}' already exists`, duplicateField: 'symbol' }, { status: 409 });
    }

    const id = makeId(col.bizUoms);
    const uom = {
      id,
      tenantId: BUSINESS_DEFAULT_TENANT_ID,
      name: body.name,
      symbol: normalizedSymbol,
      category: body.category ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    await adminFirestore.collection(col.bizUoms).doc(id).set(uom);
    return NextResponse.json({ ok: true, uom }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: e.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
