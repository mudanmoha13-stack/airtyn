import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { BUSINESS_DEFAULT_TENANT_ID, col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';

const createSchema = z.discriminatedUnion('entityType', [
  z.object({
    entityType: z.literal('employee'),
    name: z.string().min(1),
    email: z.string().email(),
    title: z.string().min(1),
    department: z.string().default('General'),
    role: z.string().optional(),
    orgUnit: z.string().optional(),
    skills: z.string().optional(),
  }),
  z.object({
    entityType: z.literal('contract'),
    employeeId: z.string().min(1),
    contractType: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
  }),
  z.object({
    entityType: z.literal('attendance'),
    employeeId: z.string().min(1),
    checkIn: z.string().datetime().optional(),
    checkOut: z.string().datetime().optional(),
  }),
  z.object({
    entityType: z.literal('leave'),
    employeeId: z.string().min(1),
    leaveType: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
  z.object({
    entityType: z.literal('payroll'),
    employeeId: z.string().min(1),
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime(),
    netPay: z.number().nonnegative(),
  }),
  z.object({
    entityType: z.literal('candidate'),
    name: z.string().min(1),
    roleTitle: z.string().min(1),
    stage: z.string().default('screening'),
  }),
]);

const patchSchema = z.discriminatedUnion('entityType', [
  z.object({ entityType: z.literal('leave'), id: z.string().min(1), status: z.enum(['requested', 'approved', 'rejected', 'canceled']) }),
  z.object({ entityType: z.literal('candidate'), id: z.string().min(1), stage: z.string().min(1) }),
  z.object({ entityType: z.literal('payroll'), id: z.string().min(1), approval: z.enum(['approved', 'rejected']) }),
  z.object({ entityType: z.literal('employee'), id: z.string().min(1), status: z.enum(['active', 'suspended', 'deactive']) }),
]);

type EmployeeDoc = {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  title?: string;
  departmentId?: string;
  role?: string;
  orgUnit?: string;
  skills?: string;
  status?: string;
  createdAt?: string;
};

function extractIndexUrl(message: string): string | null {
  const match = /https:\/\/console\.firebase\.google\.com\/[^\s|]+/.exec(message);
  return match ? match[0].replace(/\s+$/, '') : null;
}

function getFirestoreErrorDescription(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('not_found') || m.includes('not found')) {
    return 'Firestore database does not exist yet. Open Firebase Console → your project → Build → Firestore Database → click "Create database", choose Native mode and a region, then retry.';
  }
  if (m.includes('permission_denied') && m.includes('firestore.googleapis.com')) {
    return 'Cloud Firestore API is disabled for this Google Cloud project. Enable firestore.googleapis.com at https://console.developers.google.com/apis/api/firestore.googleapis.com, wait a few minutes, then retry.';
  }
  if (m.includes('unauthenticated') || m.includes('permission_denied')) {
    return 'Firebase Admin credentials are missing or do not have Firestore access. Verify FIREBASE_SERVICE_ACCOUNT_PATH and IAM roles (Firestore Editor or Firebase Admin).';
  }
  if (m.includes('failed_precondition') || m.includes('failed-precondition') || m.includes('index')) {
    return 'A required Firestore composite index is missing. Click the "Create Index" link below to create it instantly, then retry.';
  }
  return 'Unexpected Firestore error. Check server logs for details.';
}

export async function GET() {
  try {
    await ensureBusinessTenantDoc();

    // orderBy is intentionally omitted from all queries to avoid requiring composite indexes.
    // Results are sorted in JS below.
    const [employeeSnap, userSnap, contractSnap, attendanceSnap, leaveSnap, payrollSnap, payslipSnap, candidateSnap] = await Promise.all([
      adminFirestore.collection(col.bizEmployees).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).limit(500).get(),
      adminFirestore.collection(col.bizUsers).limit(500).get(),
      adminFirestore.collection(col.bizContracts).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).limit(200).get(),
      adminFirestore.collection(col.bizAttendance).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).limit(300).get(),
      adminFirestore.collection(col.bizLeaves).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).limit(200).get(),
      adminFirestore.collection(col.bizPayrollRuns).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).limit(100).get(),
      adminFirestore.collection(col.bizPayslips).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).get(),
      adminFirestore.collection(col.bizCandidates).where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID).limit(200).get(),
    ]);

    // Payroll audit log is optional — skip silently if collection/index not ready.
    let payrollLogDocs: Array<Record<string, unknown>> = [];
    try {
      const payrollLogSnap = await adminFirestore
        .collection(col.bizAuditLogs)
        .where('tenantId', '==', BUSINESS_DEFAULT_TENANT_ID)
        .where('module', '==', 'hr')
        .where('entityType', '==', 'payroll_run')
        .limit(500)
        .get();
      payrollLogDocs = payrollLogSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Record<string, unknown>))
        .sort((a, b) => String(b['createdAt'] ?? '').localeCompare(String(a['createdAt'] ?? '')));
    } catch {
      payrollLogDocs = [];
    }

    const users = new Map(userSnap.docs.map((doc) => [doc.id, doc.data()]));
    const employees: EmployeeDoc[] = employeeSnap.docs
      .map((doc) => {
        const employee = doc.data() as Omit<EmployeeDoc, 'id'>;
        return { id: doc.id, ...employee };
      })
      .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
    const employeeMap = new Map(employees.map((employee) => [String(employee.id), employee]));

    const payrollStatusMap = new Map<string, string>();
    payrollLogDocs.forEach((log) => {
      const entityId = String(log.entityId ?? '');
      if (!entityId || payrollStatusMap.has(entityId)) return;
      if (log.action === 'payroll_approved') payrollStatusMap.set(entityId, 'approved');
      else if (log.action === 'payroll_rejected') payrollStatusMap.set(entityId, 'rejected');
      else payrollStatusMap.set(entityId, 'pending_approval');
    });

    const payslipsByRun = new Map<string, Array<Record<string, unknown>>>();
    payslipSnap.docs.forEach((doc) => {
      const slip = doc.data();
      const runId = String(slip.payrollRunId ?? '');
      const arr = payslipsByRun.get(runId) ?? [];
      arr.push({ id: doc.id, ...slip });
      payslipsByRun.set(runId, arr);
    });

    return NextResponse.json({
      ok: true,
      employees: employees.map((employee) => {
        const user = users.get(String(employee.userId ?? ''));
        return {
          id: employee.id,
          name: (() => { const fromUser = user ? `${String(user.firstName ?? '')} ${String(user.lastName ?? '')}`.trim() || String(user.email ?? '') : ''; return fromUser || String(employee.name ?? '') || 'Unknown Employee'; })(),
          title: String(employee.title ?? ''),
          department: String(employee.departmentId ?? 'General'),
          email: String(user?.email ?? employee.email ?? 'unknown@local'),
          status: String(employee.status ?? user?.status ?? 'active'),
          role: String(employee.role ?? ''),
          orgUnit: String(employee.orgUnit ?? ''),
          skills: String(employee.skills ?? ''),
        };
      }),
      contracts: contractSnap.docs
        .map((doc) => {
          const contract = doc.data();
          const employee = employeeMap.get(String(contract.employeeId ?? ''));
          const user = users.get(String(employee?.userId ?? ''));
          return {
            id: doc.id,
            employeeId: String(contract.employeeId ?? ''),
            employeeName: user ? `${String(user.firstName ?? '')} ${String(user.lastName ?? '')}`.trim() || String(user.email ?? 'Unknown Employee') : 'Unknown Employee',
            type: String(contract.type ?? ''),
            startDate: String(contract.startDate ?? ''),
            endDate: contract.endDate ? String(contract.endDate) : null,
          };
        })
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
      attendance: attendanceSnap.docs
        .map((doc) => {
          const entry = doc.data();
          const employee = employeeMap.get(String(entry.employeeId ?? ''));
          const user = users.get(String(employee?.userId ?? ''));
          return {
            id: doc.id,
            employeeId: String(entry.employeeId ?? ''),
            employeeName: user ? `${String(user.firstName ?? '')} ${String(user.lastName ?? '')}`.trim() || String(user.email ?? 'Unknown Employee') : 'Unknown Employee',
            checkIn: String(entry.checkIn ?? ''),
            checkOut: entry.checkOut ? String(entry.checkOut) : null,
          };
        })
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
      leaves: leaveSnap.docs
        .map((doc) => {
          const leave = doc.data();
          const employee = employeeMap.get(String(leave.employeeId ?? ''));
          const user = users.get(String(employee?.userId ?? ''));
          return {
            id: doc.id,
            employeeId: String(leave.employeeId ?? ''),
            employeeName: user ? `${String(user.firstName ?? '')} ${String(user.lastName ?? '')}`.trim() || String(user.email ?? 'Unknown Employee') : 'Unknown Employee',
            type: String(leave.type ?? ''),
            status: String(leave.status ?? ''),
            startDate: String(leave.startDate ?? ''),
            endDate: String(leave.endDate ?? ''),
          };
        })
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
      payrollRuns: payrollSnap.docs.map((doc) => ({
        id: doc.id,
        periodStart: String(doc.data().periodStart ?? ''),
        periodEnd: String(doc.data().periodEnd ?? ''),
        createdAt: String(doc.data().createdAt ?? ''),
        approvalStatus: payrollStatusMap.get(doc.id) ?? 'pending_approval',
        payslips: (payslipsByRun.get(doc.id) ?? []).map((slip) => {
          const employee = employeeMap.get(String(slip.employeeId ?? ''));
          const user = users.get(String(employee?.userId ?? ''));
          return {
            id: String(slip.id ?? ''),
            employeeId: String(slip.employeeId ?? ''),
            employeeName: user ? `${String(user.firstName ?? '')} ${String(user.lastName ?? '')}`.trim() || String(user.email ?? 'Unknown Employee') : 'Unknown Employee',
            netPay: Number(slip.netPay ?? 0),
          };
        }),
      })),
      candidates: candidateSnap.docs
        .map((doc) => ({
          id: doc.id,
          name: String(doc.data().name ?? ''),
          roleTitle: String(doc.data().roleTitle ?? ''),
          stage: String(doc.data().stage ?? ''),
          createdAt: String(doc.data().createdAt ?? ''),
        }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load HR operations';
    const description = getFirestoreErrorDescription(message);
    const indexUrl = extractIndexUrl(message);
    return NextResponse.json(
      { ok: false, code: 'HR_OPERATIONS_GET_FAILED', error: message, description, ...(indexUrl ? { indexUrl } : {}) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBusinessTenantDoc();
    const payload = createSchema.parse(await request.json());

    if (payload.entityType === 'employee') {
      const [firstName, ...rest] = payload.name.trim().split(' ');
      const lastName = rest.join(' ');
      const email = payload.email.toLowerCase();

      const existingUser = await adminFirestore.collection(col.bizUsers).where('email', '==', email).limit(1).get();
      const userId = existingUser.empty ? makeId(col.bizUsers) : existingUser.docs[0].id;
      await adminFirestore.collection(col.bizUsers).doc(userId).set(
        { id: userId, email, firstName, lastName: lastName || null, passwordHash: 'temp-password-hash', status: 'active', createdAt: nowIso(), updatedAt: nowIso() },
        { merge: true }
      );

      const existingEmployee = await adminFirestore.collection(col.bizEmployees).where('userId', '==', userId).limit(1).get();
      const employeeId = existingEmployee.empty ? makeId(col.bizEmployees) : existingEmployee.docs[0].id;
      await adminFirestore.collection(col.bizEmployees).doc(employeeId).set(
        { id: employeeId, tenantId: BUSINESS_DEFAULT_TENANT_ID, userId, name: payload.name.trim(), email: payload.email.toLowerCase(), title: payload.title, departmentId: payload.department, role: payload.role ?? null, orgUnit: payload.orgUnit ?? null, skills: payload.skills ?? null, status: 'active', createdAt: nowIso(), updatedAt: nowIso() },
        { merge: true }
      );

      return NextResponse.json({ ok: true, id: employeeId }, { status: 201 });
    }

    if (payload.entityType === 'contract') {
      const id = makeId(col.bizContracts);
      await adminFirestore.collection(col.bizContracts).doc(id).set({
        id,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        employeeId: payload.employeeId,
        type: payload.contractType,
        startDate: payload.startDate,
        endDate: payload.endDate ?? null,
        createdAt: nowIso(),
      });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.entityType === 'attendance') {
      const id = makeId(col.bizAttendance);
      await adminFirestore.collection(col.bizAttendance).doc(id).set({
        id,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        employeeId: payload.employeeId,
        checkIn: payload.checkIn ?? nowIso(),
        checkOut: payload.checkOut ?? null,
      });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.entityType === 'leave') {
      const id = makeId(col.bizLeaves);
      await adminFirestore.collection(col.bizLeaves).doc(id).set({
        id,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        employeeId: payload.employeeId,
        type: payload.leaveType,
        status: 'requested',
        startDate: payload.startDate,
        endDate: payload.endDate,
        createdAt: nowIso(),
      });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.entityType === 'payroll') {
      const runId = makeId(col.bizPayrollRuns);
      await adminFirestore.collection(col.bizPayrollRuns).doc(runId).set({
        id: runId,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        periodStart: payload.periodStart,
        periodEnd: payload.periodEnd,
        createdAt: nowIso(),
      });

      const payslipId = makeId(col.bizPayslips);
      await adminFirestore.collection(col.bizPayslips).doc(payslipId).set({
        id: payslipId,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        payrollRunId: runId,
        employeeId: payload.employeeId,
        netPay: payload.netPay,
      });

      const logId = makeId(col.bizAuditLogs);
      await adminFirestore.collection(col.bizAuditLogs).doc(logId).set({
        id: logId,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        module: 'hr',
        entityType: 'payroll_run',
        entityId: runId,
        action: 'payroll_submitted',
        meta: { source: 'hr-module' },
        createdAt: nowIso(),
      });

      return NextResponse.json({ ok: true, id: runId }, { status: 201 });
    }

    if (payload.entityType === 'candidate') {
      const id = makeId(col.bizCandidates);
      await adminFirestore.collection(col.bizCandidates).doc(id).set({
        id,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        name: payload.name,
        stage: payload.stage,
        roleTitle: payload.roleTitle,
        createdAt: nowIso(),
      });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported entity payload' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid HR payload', issues: error.flatten() }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Failed to save HR operation';
    const description = getFirestoreErrorDescription(message);
    const indexUrl = extractIndexUrl(message);
    return NextResponse.json(
      { ok: false, code: 'HR_OPERATIONS_POST_FAILED', error: message, description, ...(indexUrl ? { indexUrl } : {}) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureBusinessTenantDoc();
    const payload = patchSchema.parse(await request.json());

    if (payload.entityType === 'leave') {
      await adminFirestore.collection(col.bizLeaves).doc(payload.id).set({ status: payload.status, updatedAt: nowIso() }, { merge: true });
      return NextResponse.json({ ok: true, id: payload.id });
    }

    if (payload.entityType === 'candidate') {
      await adminFirestore.collection(col.bizCandidates).doc(payload.id).set({ stage: payload.stage, updatedAt: nowIso() }, { merge: true });
      return NextResponse.json({ ok: true, id: payload.id });
    }

    if (payload.entityType === 'payroll') {
      const logId = makeId(col.bizAuditLogs);
      await adminFirestore.collection(col.bizAuditLogs).doc(logId).set({
        id: logId,
        tenantId: BUSINESS_DEFAULT_TENANT_ID,
        module: 'hr',
        entityType: 'payroll_run',
        entityId: payload.id,
        action: payload.approval === 'approved' ? 'payroll_approved' : 'payroll_rejected',
        meta: { source: 'hr-module' },
        createdAt: nowIso(),
      });

      return NextResponse.json({ ok: true, id: payload.id });
    }

    if (payload.entityType === 'employee') {
      await adminFirestore.collection(col.bizEmployees).doc(payload.id).set({ status: payload.status, updatedAt: nowIso() }, { merge: true });

      const employeeDoc = await adminFirestore.collection(col.bizEmployees).doc(payload.id).get();
      const userId = String(employeeDoc.data()?.userId ?? '');
      if (userId) {
        const mappedUserStatus = payload.status === 'deactive' ? 'inactive' : payload.status;
        await adminFirestore.collection(col.bizUsers).doc(userId).set({ status: mappedUserStatus, updatedAt: nowIso() }, { merge: true });
      }

      return NextResponse.json({ ok: true, id: payload.id });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported patch payload' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid HR patch payload', issues: error.flatten() }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Failed to update HR operation';
    const description = getFirestoreErrorDescription(message);
    const indexUrl = extractIndexUrl(message);
    return NextResponse.json(
      { ok: false, code: 'HR_OPERATIONS_PATCH_FAILED', error: message, description, ...(indexUrl ? { indexUrl } : {}) },
      { status: 500 }
    );
  }
}
