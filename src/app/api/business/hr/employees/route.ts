import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { BUSINESS_DEFAULT_TENANT_ID, col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';

const createEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  title: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  department: z.string().default('General'),
  email: z.string().email(),
});

export async function GET() {
  try {
    await ensureBusinessTenantDoc();
    const [employeeSnap, usersSnap] = await Promise.all([
      adminFirestore.collection(col.bizEmployees).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).orderBy('createdAt', 'desc').limit(200).get(),
      adminFirestore.collection(col.bizUsers).get(),
    ]);
    const users = new Map(usersSnap.docs.map((doc) => [doc.id, doc.data()]));

    return NextResponse.json({
      ok: true,
      employees: employeeSnap.docs.map((doc) => {
        const employee = doc.data();
        const user = users.get(String(employee.userId ?? ''));
        return {
          id: doc.id,
          name: user ? `${String(user.firstName ?? '')} ${String(user.lastName ?? '')}`.trim() || String(user.email ?? 'Unknown Employee') : 'Unknown Employee',
          title: String(employee.title ?? ''),
          department: String(employee.departmentId ?? 'General'),
          email: String(user?.email ?? 'unknown@local'),
          status: 'Active',
        };
      }),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to list employees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBusinessTenantDoc();
    const payload = createEmployeeSchema.parse(await request.json());

    const normalizedName =
      payload.name?.trim() ||
      [payload.firstName?.trim(), payload.lastName?.trim()].filter(Boolean).join(' ').trim();
    const normalizedTitle = payload.title?.trim() || payload.position?.trim();

    if (!normalizedName || !normalizedTitle) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid employee payload',
          issues: {
            fieldErrors: {
              ...(normalizedName ? {} : { name: ['Required (or provide firstName)'] }),
              ...(normalizedTitle ? {} : { title: ['Required (or provide position)'] }),
            },
          },
        },
        { status: 400 }
      );
    }

    const [firstName, ...rest] = normalizedName.split(' ');
    const lastName = rest.join(' ');

    const normalizedEmail = payload.email.toLowerCase();
    const existingUser = await adminFirestore.collection(col.bizUsers).where('email', '==', normalizedEmail).limit(1).get();
    const userId = existingUser.empty ? makeId(col.bizUsers) : existingUser.docs[0].id;
    await adminFirestore.collection(col.bizUsers).doc(userId).set(
      {
        id: userId,
        email: normalizedEmail,
        passwordHash: 'temp-password-hash',
        status: 'active',
        firstName,
        lastName: lastName || null,
        updatedAt: nowIso(),
        createdAt: existingUser.empty ? nowIso() : undefined,
      },
      { merge: true }
    );

    const existingEmployee = await adminFirestore.collection(col.bizEmployees).where('userId', '==', userId).limit(1).get();
    const employeeId = existingEmployee.empty ? makeId(col.bizEmployees) : existingEmployee.docs[0].id;
    const employee = {
      id: employeeId,
      tenantId: BUSINESS_DEFAULT_TENANT_ID,
      userId,
      title: normalizedTitle,
      departmentId: payload.department,
      updatedAt: nowIso(),
      createdAt: existingEmployee.empty ? nowIso() : undefined,
    };
    await adminFirestore.collection(col.bizEmployees).doc(employeeId).set(employee, { merge: true });

    return NextResponse.json({ ok: true, employee }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid employee payload', issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create employee' }, { status: 500 });
  }
}
