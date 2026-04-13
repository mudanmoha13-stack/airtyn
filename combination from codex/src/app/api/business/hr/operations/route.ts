import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

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
    branch: z.string().optional(),
    managerName: z.string().optional(),
    employmentType: z.string().optional(),
    phone: z.string().optional(),
    emergencyContact: z.string().optional(),
    joiningDate: z.string().datetime().optional(),
    probationEndDate: z.string().datetime().optional(),
  }),
  z.object({
    entityType: z.literal('organization'),
    name: z.string().min(1),
    unitType: z.string().min(1),
    parentName: z.string().optional(),
    branch: z.string().optional(),
    costCenter: z.string().optional(),
    headcountPlan: z.number().int().nonnegative().optional(),
  }),
  z.object({
    entityType: z.literal('candidate'),
    name: z.string().min(1),
    roleTitle: z.string().min(1),
    stage: z.string().default('applied'),
    source: z.string().optional(),
    recruiter: z.string().optional(),
  }),
  z.object({
    entityType: z.literal('requisition'),
    title: z.string().min(1),
    department: z.string().min(1),
    branch: z.string().optional(),
    openings: z.number().int().positive().default(1),
    status: z.string().default('draft'),
  }),
  z.object({
    entityType: z.literal('interview'),
    candidateId: z.string().min(1),
    candidateName: z.string().min(1),
    stage: z.string().min(1),
    scheduledAt: z.string().datetime(),
    interviewer: z.string().optional(),
    status: z.string().default('scheduled'),
  }),
  z.object({
    entityType: z.literal('offer'),
    candidateId: z.string().min(1),
    candidateName: z.string().min(1),
    roleTitle: z.string().min(1),
    proposedSalary: z.number().nonnegative().optional(),
    status: z.string().default('pending_approval'),
  }),
  z.object({
    entityType: z.literal('onboarding'),
    employeeId: z.string().min(1),
    templateName: z.string().min(1),
    buddyName: z.string().optional(),
    firstWeekPlan: z.string().optional(),
    status: z.string().default('planned'),
  }),
  z.object({
    entityType: z.literal('contract'),
    employeeId: z.string().min(1),
    contractType: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    salaryStructure: z.string().optional(),
    probationEndDate: z.string().datetime().optional(),
  }),
  z.object({
    entityType: z.literal('attendance'),
    employeeId: z.string().min(1),
    checkIn: z.string().datetime().optional(),
    checkOut: z.string().datetime().optional(),
    shiftLabel: z.string().optional(),
  }),
  z.object({
    entityType: z.literal('shift'),
    employeeId: z.string().min(1),
    shiftLabel: z.string().min(1),
    shiftDate: z.string().datetime(),
    branch: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  z.object({
    entityType: z.literal('attendance_correction'),
    employeeId: z.string().min(1),
    attendanceId: z.string().optional(),
    requestedCheckIn: z.string().datetime().optional(),
    requestedCheckOut: z.string().datetime().optional(),
    reason: z.string().min(1),
  }),
  z.object({
    entityType: z.literal('overtime'),
    employeeId: z.string().min(1),
    workDate: z.string().datetime(),
    hours: z.number().nonnegative(),
    policyName: z.string().optional(),
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
    inputsSummary: z.string().optional(),
  }),
  z.object({
    entityType: z.literal('expense'),
    employeeId: z.string().min(1),
    category: z.string().min(1),
    amount: z.number().nonnegative(),
    description: z.string().optional(),
  }),
  z.object({
    entityType: z.literal('travel'),
    employeeId: z.string().min(1),
    destination: z.string().min(1),
    purpose: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
  z.object({
    entityType: z.literal('performance'),
    employeeId: z.string().min(1),
    cycleName: z.string().min(1),
    rating: z.string().min(1),
    managerName: z.string().optional(),
    goalsSummary: z.string().optional(),
  }),
  z.object({
    entityType: z.literal('goal'),
    employeeId: z.string().min(1),
    title: z.string().min(1),
    dueDate: z.string().datetime().optional(),
    alignment: z.string().optional(),
    status: z.string().default('open'),
  }),
  z.object({
    entityType: z.literal('learning'),
    employeeId: z.string().min(1),
    courseName: z.string().min(1),
    provider: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    status: z.string().default('assigned'),
  }),
  z.object({
    entityType: z.literal('certification'),
    employeeId: z.string().min(1),
    certificationName: z.string().min(1),
    issuer: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
    status: z.string().default('valid'),
  }),
  z.object({
    entityType: z.literal('asset'),
    employeeId: z.string().min(1),
    assetName: z.string().min(1),
    assetTag: z.string().optional(),
    assignedAt: z.string().datetime().optional(),
    status: z.string().default('assigned'),
  }),
  z.object({
    entityType: z.literal('document'),
    employeeId: z.string().min(1),
    documentName: z.string().min(1),
    expiryDate: z.string().datetime().optional(),
    status: z.string().default('valid'),
  }),
  z.object({
    entityType: z.literal('incident'),
    employeeId: z.string().min(1),
    incidentType: z.string().min(1),
    occurredAt: z.string().datetime(),
    severity: z.string().default('medium'),
    notes: z.string().optional(),
  }),
  z.object({
    entityType: z.literal('discipline'),
    employeeId: z.string().min(1),
    caseType: z.string().min(1),
    status: z.string().default('open'),
    notes: z.string().optional(),
  }),
  z.object({
    entityType: z.literal('offboarding'),
    employeeId: z.string().min(1),
    lastWorkingDate: z.string().datetime(),
    reason: z.string().min(1),
    status: z.string().default('planned'),
  }),
]);

const patchSchema = z.discriminatedUnion('entityType', [
  z.object({ entityType: z.literal('leave'), id: z.string().min(1), status: z.enum(['requested', 'approved', 'rejected', 'canceled']) }),
  z.object({ entityType: z.literal('candidate'), id: z.string().min(1), stage: z.string().min(1) }),
  z.object({ entityType: z.literal('payroll'), id: z.string().min(1), approval: z.enum(['approved', 'rejected']) }),
  z.object({ entityType: z.literal('employee'), id: z.string().min(1), status: z.enum(['active', 'suspended', 'deactive']) }),
  z.object({ entityType: z.literal('attendance_correction'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('overtime'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('onboarding'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('requisition'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('interview'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('offer'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('expense'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('travel'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('goal'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('learning'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('certification'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('document'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('incident'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('discipline'), id: z.string().min(1), status: z.string().min(1) }),
  z.object({ entityType: z.literal('offboarding'), id: z.string().min(1), status: z.string().min(1) }),
]);

type EmployeeDoc = Record<string, unknown> & {
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
  const normalized = message.toLowerCase();
  if (normalized.includes('not_found') || normalized.includes('not found')) return 'Firestore database does not exist yet. Create the Firestore database in Firebase Console, then retry.';
  if (normalized.includes('permission_denied') && normalized.includes('firestore.googleapis.com')) return 'Cloud Firestore API is disabled for this Google Cloud project. Enable it, wait a few minutes, then retry.';
  if (normalized.includes('unauthenticated') || normalized.includes('permission_denied')) return 'Firebase Admin credentials are missing or do not have Firestore access.';
  if (normalized.includes('failed_precondition') || normalized.includes('index')) return 'A required Firestore composite index is missing. Create the index from the Firebase Console link, then retry.';
  return 'Unexpected Firestore error. Check server logs for details.';
}

function employeeDisplayName(employee: EmployeeDoc | undefined, user?: Record<string, unknown>) {
  const fromUser = user ? `${String(user.firstName ?? '')} ${String(user.lastName ?? '')}`.trim() || String(user.email ?? '') : '';
  return fromUser || String(employee?.name ?? '') || String(employee?.email ?? '') || 'Unknown Employee';
}

async function logHrAudit(tenantId: string, entityType: string, entityId: string, action: string, meta?: Record<string, unknown>) {
  const id = makeId(col.bizAuditLogs);
  await adminFirestore.collection(col.bizAuditLogs).doc(id).set({ id, tenantId, module: 'hr', entityType, entityId, action, meta: meta ?? {}, createdAt: nowIso() });
}

async function assertTenantOwnership(collectionName: string, id: string, tenantId: string) {
  const ref = adminFirestore.collection(collectionName).doc(id);
  const snap = await ref.get();
  if (!snap.exists || String(snap.data()?.tenantId ?? '') !== tenantId) return null;
  return ref;
}

function mapNamedDocs(snapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>, employeeNameResolver?: (employeeId: string) => string): Array<Record<string, unknown> & { id: string; employeeName?: string }> {
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      id: doc.id,
      ...data,
      ...(employeeNameResolver ? { employeeName: employeeNameResolver(String(data.employeeId ?? '')) } : {}),
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const [employeeSnap, userSnap, contractSnap, attendanceSnap, leaveSnap, payrollSnap, payslipSnap, candidateSnap, requisitionSnap, interviewSnap, offerSnap, orgSnap, onboardingSnap, shiftSnap, attendanceCorrectionSnap, overtimeSnap, expenseSnap, travelSnap, performanceSnap, goalSnap, learningSnap, certificationSnap, assetSnap, documentSnap, incidentSnap, disciplineSnap, offboardingSnap] = await Promise.all([
      adminFirestore.collection(col.bizEmployees).where('tenantId', '==', tenantId).limit(500).get(),
      adminFirestore.collection(col.bizUsers).where('tenantId', '==', tenantId).limit(500).get(),
      adminFirestore.collection(col.bizContracts).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizAttendance).where('tenantId', '==', tenantId).limit(300).get(),
      adminFirestore.collection(col.bizLeaves).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizPayrollRuns).where('tenantId', '==', tenantId).limit(100).get(),
      adminFirestore.collection(col.bizPayslips).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizCandidates).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrRequisitions).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrInterviews).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrOffers).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrOrgUnits).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrOnboarding).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrShifts).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrAttendanceCorrections).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrOvertime).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrExpenses).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrTravel).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrPerformance).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrGoals).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrLearning).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrCertifications).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrAssets).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrDocuments).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrIncidents).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrDiscipline).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizHrOffboarding).where('tenantId', '==', tenantId).limit(200).get(),
    ]);

    let payrollLogDocs: Array<Record<string, unknown>> = [];
    try {
      const payrollLogSnap = await adminFirestore.collection(col.bizAuditLogs).where('tenantId', '==', tenantId).where('module', '==', 'hr').where('entityType', '==', 'payroll_run').limit(500).get();
      payrollLogDocs = payrollLogSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Record<string, unknown>));
    } catch {
      payrollLogDocs = [];
    }

    const users = new Map(userSnap.docs.map((doc) => [doc.id, doc.data()]));
    const employees = employeeSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as EmployeeDoc).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
    const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
    const resolveEmployeeName = (employeeId: string) => {
      const employee = employeeMap.get(employeeId);
      const user = users.get(String(employee?.userId ?? ''));
      return employeeDisplayName(employee, user);
    };

    const payrollStatusMap = new Map<string, string>();
    payrollLogDocs.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).forEach((log) => {
      const entityId = String(log.entityId ?? '');
      if (!entityId || payrollStatusMap.has(entityId)) return;
      if (log.action === 'payroll_approved') payrollStatusMap.set(entityId, 'approved');
      else if (log.action === 'payroll_rejected') payrollStatusMap.set(entityId, 'rejected');
      else payrollStatusMap.set(entityId, 'pending_approval');
    });

    const payslipsByRun = new Map<string, Array<Record<string, unknown>>>();
    payslipSnap.docs.forEach((doc) => {
      const slip = doc.data() as Record<string, unknown>;
      const runId = String(slip.payrollRunId ?? '');
      const current = payslipsByRun.get(runId) ?? [];
      current.push({ id: doc.id, ...slip });
      payslipsByRun.set(runId, current);
    });

    return NextResponse.json({
      ok: true,
      employees: employees.map((employee) => {
        const user = users.get(String(employee.userId ?? ''));
        return {
          id: employee.id,
          employeeCode: String(employee.employeeCode ?? employee.id.slice(-6)).toUpperCase(),
          name: employeeDisplayName(employee, user),
          title: String(employee.title ?? ''),
          department: String(employee.departmentId ?? 'General'),
          email: String(user?.email ?? employee.email ?? 'unknown@local'),
          status: String(employee.status ?? user?.status ?? 'active'),
          role: String(employee.role ?? ''),
          orgUnit: String(employee.orgUnit ?? ''),
          skills: String(employee.skills ?? ''),
          branch: String(employee.branch ?? ''),
          managerName: String(employee.managerName ?? ''),
          employmentType: String(employee.employmentType ?? ''),
          phone: String(employee.phone ?? ''),
          emergencyContact: String(employee.emergencyContact ?? ''),
          joiningDate: String(employee.joiningDate ?? ''),
          probationEndDate: String(employee.probationEndDate ?? ''),
        };
      }),
      organizationUnits: mapNamedDocs(orgSnap).sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''))),
      contracts: contractSnap.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return { id: doc.id, employeeId: String(data.employeeId ?? ''), employeeName: resolveEmployeeName(String(data.employeeId ?? '')), type: String(data.type ?? ''), startDate: String(data.startDate ?? ''), endDate: data.endDate ? String(data.endDate) : null, salaryStructure: String(data.salaryStructure ?? ''), probationEndDate: String(data.probationEndDate ?? '') };
      }).sort((a, b) => b.startDate.localeCompare(a.startDate)),
      attendance: attendanceSnap.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return { id: doc.id, employeeId: String(data.employeeId ?? ''), employeeName: resolveEmployeeName(String(data.employeeId ?? '')), checkIn: String(data.checkIn ?? ''), checkOut: data.checkOut ? String(data.checkOut) : null, shiftLabel: String(data.shiftLabel ?? '') };
      }).sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
      shifts: mapNamedDocs(shiftSnap, resolveEmployeeName).sort((a, b) => String(b.shiftDate ?? '').localeCompare(String(a.shiftDate ?? ''))),
      leaves: leaveSnap.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return { id: doc.id, employeeId: String(data.employeeId ?? ''), employeeName: resolveEmployeeName(String(data.employeeId ?? '')), type: String(data.type ?? ''), status: String(data.status ?? ''), startDate: String(data.startDate ?? ''), endDate: String(data.endDate ?? '') };
      }).sort((a, b) => b.startDate.localeCompare(a.startDate)),
      payrollRuns: payrollSnap.docs.map((doc) => ({ id: doc.id, periodStart: String(doc.data().periodStart ?? ''), periodEnd: String(doc.data().periodEnd ?? ''), createdAt: String(doc.data().createdAt ?? ''), inputsSummary: String(doc.data().inputsSummary ?? ''), approvalStatus: payrollStatusMap.get(doc.id) ?? 'pending_approval', payslips: (payslipsByRun.get(doc.id) ?? []).map((slip) => ({ id: String(slip.id ?? ''), employeeId: String(slip.employeeId ?? ''), employeeName: resolveEmployeeName(String(slip.employeeId ?? '')), netPay: Number(slip.netPay ?? 0) })) })),
      candidates: mapNamedDocs(candidateSnap).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
      requisitions: mapNamedDocs(requisitionSnap).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
      interviews: mapNamedDocs(interviewSnap).sort((a, b) => String(a.scheduledAt ?? '').localeCompare(String(b.scheduledAt ?? ''))),
      offers: mapNamedDocs(offerSnap).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
      onboarding: mapNamedDocs(onboardingSnap, resolveEmployeeName).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
      attendanceCorrections: mapNamedDocs(attendanceCorrectionSnap, resolveEmployeeName).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
      overtime: mapNamedDocs(overtimeSnap, resolveEmployeeName).sort((a, b) => String(b.workDate ?? '').localeCompare(String(a.workDate ?? ''))),
      expenses: mapNamedDocs(expenseSnap, resolveEmployeeName).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
      travel: mapNamedDocs(travelSnap, resolveEmployeeName).sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? ''))),
      performance: mapNamedDocs(performanceSnap, resolveEmployeeName).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
      goals: mapNamedDocs(goalSnap, resolveEmployeeName).sort((a, b) => String(a.dueDate ?? '').localeCompare(String(b.dueDate ?? ''))),
      learning: mapNamedDocs(learningSnap, resolveEmployeeName).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
      certifications: mapNamedDocs(certificationSnap, resolveEmployeeName).sort((a, b) => String(a.expiryDate ?? '').localeCompare(String(b.expiryDate ?? ''))),
      assets: mapNamedDocs(assetSnap, resolveEmployeeName).sort((a, b) => String(b.assignedAt ?? '').localeCompare(String(a.assignedAt ?? ''))),
      documents: mapNamedDocs(documentSnap, resolveEmployeeName).sort((a, b) => String(a.expiryDate ?? '').localeCompare(String(b.expiryDate ?? ''))),
      incidents: mapNamedDocs(incidentSnap, resolveEmployeeName).sort((a, b) => String(b.occurredAt ?? '').localeCompare(String(a.occurredAt ?? ''))),
      discipline: mapNamedDocs(disciplineSnap, resolveEmployeeName).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
      offboarding: mapNamedDocs(offboardingSnap, resolveEmployeeName).sort((a, b) => String(b.lastWorkingDate ?? '').localeCompare(String(a.lastWorkingDate ?? ''))),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load HR operations';
    const description = getFirestoreErrorDescription(message);
    const indexUrl = extractIndexUrl(message);
    return NextResponse.json({ ok: false, code: 'HR_OPERATIONS_GET_FAILED', error: message, description, ...(indexUrl ? { indexUrl } : {}) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = createSchema.parse(await request.json());
    const createdAt = nowIso();

    if (payload.entityType === 'employee') {
      const [firstName, ...rest] = payload.name.trim().split(' ');
      const lastName = rest.join(' ');
      const email = payload.email.toLowerCase();
      const existingUser = await adminFirestore.collection(col.bizUsers).where('tenantId', '==', tenantId).where('email', '==', email).limit(1).get();
      const userId = existingUser.empty ? makeId(col.bizUsers) : existingUser.docs[0].id;
      await adminFirestore.collection(col.bizUsers).doc(userId).set({ id: userId, tenantId, email, firstName, lastName: lastName || null, passwordHash: 'temp-password-hash', status: 'active', createdAt, updatedAt: createdAt }, { merge: true });

      const existingEmployee = await adminFirestore.collection(col.bizEmployees).where('tenantId', '==', tenantId).where('userId', '==', userId).limit(1).get();
      const employeeId = existingEmployee.empty ? makeId(col.bizEmployees) : existingEmployee.docs[0].id;
      await adminFirestore.collection(col.bizEmployees).doc(employeeId).set({ id: employeeId, tenantId, userId, name: payload.name.trim(), email, title: payload.title, departmentId: payload.department, role: payload.role ?? null, orgUnit: payload.orgUnit ?? null, skills: payload.skills ?? null, branch: payload.branch ?? null, managerName: payload.managerName ?? null, employmentType: payload.employmentType ?? null, phone: payload.phone ?? null, emergencyContact: payload.emergencyContact ?? null, joiningDate: payload.joiningDate ?? null, probationEndDate: payload.probationEndDate ?? null, employeeCode: `EMP-${employeeId.slice(-6).toUpperCase()}`, status: 'active', createdAt, updatedAt: createdAt }, { merge: true });
      await logHrAudit(tenantId, 'employee', employeeId, 'employee_created', { email, title: payload.title });
      return NextResponse.json({ ok: true, id: employeeId }, { status: 201 });
    }

    if (payload.entityType === 'payroll') {
      const runId = makeId(col.bizPayrollRuns);
      await adminFirestore.collection(col.bizPayrollRuns).doc(runId).set({ id: runId, tenantId, periodStart: payload.periodStart, periodEnd: payload.periodEnd, inputsSummary: payload.inputsSummary ?? null, createdAt, updatedAt: createdAt });
      const payslipId = makeId(col.bizPayslips);
      await adminFirestore.collection(col.bizPayslips).doc(payslipId).set({ id: payslipId, tenantId, payrollRunId: runId, employeeId: payload.employeeId, netPay: payload.netPay, createdAt });
      await logHrAudit(tenantId, 'payroll_run', runId, 'payroll_submitted', { source: 'hr-module' });
      return NextResponse.json({ ok: true, id: runId }, { status: 201 });
    }

    const collectionMap: Record<string, string> = {
      organization: col.bizHrOrgUnits,
      candidate: col.bizCandidates,
      onboarding: col.bizHrOnboarding,
      contract: col.bizContracts,
      attendance: col.bizAttendance,
      shift: col.bizHrShifts,
      attendance_correction: col.bizHrAttendanceCorrections,
      overtime: col.bizHrOvertime,
      leave: col.bizLeaves,
      requisition: col.bizHrRequisitions,
      interview: col.bizHrInterviews,
      offer: col.bizHrOffers,
      expense: col.bizHrExpenses,
      travel: col.bizHrTravel,
      performance: col.bizHrPerformance,
      goal: col.bizHrGoals,
      learning: col.bizHrLearning,
      certification: col.bizHrCertifications,
      asset: col.bizHrAssets,
      document: col.bizHrDocuments,
      incident: col.bizHrIncidents,
      discipline: col.bizHrDiscipline,
      offboarding: col.bizHrOffboarding,
    };

    const collectionName = collectionMap[payload.entityType];
    if (!collectionName) return NextResponse.json({ ok: false, error: 'Unsupported entity payload' }, { status: 400 });
    const id = makeId(collectionName);

    const data = payload.entityType === 'contract'
      ? { id, tenantId, employeeId: payload.employeeId, type: payload.contractType, startDate: payload.startDate, endDate: payload.endDate ?? null, salaryStructure: payload.salaryStructure ?? null, probationEndDate: payload.probationEndDate ?? null, createdAt, updatedAt: createdAt }
      : payload.entityType === 'attendance'
        ? { id, tenantId, employeeId: payload.employeeId, checkIn: payload.checkIn ?? createdAt, checkOut: payload.checkOut ?? null, shiftLabel: payload.shiftLabel ?? null, createdAt, updatedAt: createdAt }
        : payload.entityType === 'attendance_correction'
          ? { id, tenantId, ...payload, status: 'requested', createdAt, updatedAt: createdAt }
          : payload.entityType === 'overtime'
            ? { id, tenantId, ...payload, status: 'pending_approval', createdAt, updatedAt: createdAt }
        : payload.entityType === 'leave'
          ? { id, tenantId, employeeId: payload.employeeId, type: payload.leaveType, status: 'requested', startDate: payload.startDate, endDate: payload.endDate, createdAt, updatedAt: createdAt }
          : payload.entityType === 'requisition' || payload.entityType === 'interview' || payload.entityType === 'offer'
            ? { id, tenantId, ...payload, createdAt, updatedAt: createdAt }
          : payload.entityType === 'onboarding'
            ? { id, tenantId, ...payload, completionScore: payload.status === 'completed' ? 100 : 20, createdAt, updatedAt: createdAt }
            : payload.entityType === 'expense' || payload.entityType === 'travel'
              ? { id, tenantId, ...payload, status: 'submitted', createdAt, updatedAt: createdAt }
              : payload.entityType === 'goal' || payload.entityType === 'certification'
                ? { id, tenantId, ...payload, createdAt, updatedAt: createdAt }
              : payload.entityType === 'incident'
                ? { id, tenantId, ...payload, status: 'open', createdAt, updatedAt: createdAt }
                : { id, tenantId, ...payload, createdAt, updatedAt: createdAt };

    await adminFirestore.collection(collectionName).doc(id).set(data);
    await logHrAudit(tenantId, payload.entityType, id, `${payload.entityType}_created`);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, error: 'Invalid HR payload', issues: error.flatten() }, { status: 400 });
    const message = error instanceof Error ? error.message : 'Failed to save HR operation';
    const description = getFirestoreErrorDescription(message);
    const indexUrl = extractIndexUrl(message);
    return NextResponse.json({ ok: false, code: 'HR_OPERATIONS_POST_FAILED', error: message, description, ...(indexUrl ? { indexUrl } : {}) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = patchSchema.parse(await request.json());

    if (payload.entityType === 'leave') {
      const ref = await assertTenantOwnership(col.bizLeaves, payload.id, tenantId);
      if (!ref) return NextResponse.json({ ok: false, error: 'Leave record not found for tenant' }, { status: 404 });
      await ref.set({ status: payload.status, updatedAt: nowIso() }, { merge: true });
      return NextResponse.json({ ok: true, id: payload.id });
    }

    if (payload.entityType === 'candidate') {
      const ref = await assertTenantOwnership(col.bizCandidates, payload.id, tenantId);
      if (!ref) return NextResponse.json({ ok: false, error: 'Candidate not found for tenant' }, { status: 404 });
      await ref.set({ stage: payload.stage, updatedAt: nowIso() }, { merge: true });
      return NextResponse.json({ ok: true, id: payload.id });
    }

    if (payload.entityType === 'payroll') {
      const ref = await assertTenantOwnership(col.bizPayrollRuns, payload.id, tenantId);
      if (!ref) return NextResponse.json({ ok: false, error: 'Payroll run not found for tenant' }, { status: 404 });
      await logHrAudit(tenantId, 'payroll_run', payload.id, payload.approval === 'approved' ? 'payroll_approved' : 'payroll_rejected', { source: 'hr-module' });
      return NextResponse.json({ ok: true, id: payload.id });
    }

    if (payload.entityType === 'employee') {
      const ref = await assertTenantOwnership(col.bizEmployees, payload.id, tenantId);
      if (!ref) return NextResponse.json({ ok: false, error: 'Employee not found for tenant' }, { status: 404 });
      const snap = await ref.get();
      await ref.set({ status: payload.status, updatedAt: nowIso() }, { merge: true });
      const userId = String(snap.data()?.userId ?? '');
      if (userId) {
        await adminFirestore.collection(col.bizUsers).doc(userId).set({ status: payload.status === 'deactive' ? 'inactive' : payload.status, updatedAt: nowIso() }, { merge: true });
      }
      return NextResponse.json({ ok: true, id: payload.id });
    }

    const collectionMap: Record<string, string> = {
      attendance_correction: col.bizHrAttendanceCorrections,
      overtime: col.bizHrOvertime,
      onboarding: col.bizHrOnboarding,
      requisition: col.bizHrRequisitions,
      interview: col.bizHrInterviews,
      offer: col.bizHrOffers,
      expense: col.bizHrExpenses,
      travel: col.bizHrTravel,
      goal: col.bizHrGoals,
      learning: col.bizHrLearning,
      certification: col.bizHrCertifications,
      document: col.bizHrDocuments,
      incident: col.bizHrIncidents,
      discipline: col.bizHrDiscipline,
      offboarding: col.bizHrOffboarding,
    };

    const collectionName = collectionMap[payload.entityType];
    if (!collectionName) return NextResponse.json({ ok: false, error: 'Unsupported patch payload' }, { status: 400 });
    const ref = await assertTenantOwnership(collectionName, payload.id, tenantId);
    if (!ref) return NextResponse.json({ ok: false, error: `${payload.entityType} record not found for tenant` }, { status: 404 });
    await ref.set({ status: payload.status, updatedAt: nowIso() }, { merge: true });
    return NextResponse.json({ ok: true, id: payload.id });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, error: 'Invalid HR patch payload', issues: error.flatten() }, { status: 400 });
    const message = error instanceof Error ? error.message : 'Failed to update HR operation';
    const description = getFirestoreErrorDescription(message);
    const indexUrl = extractIndexUrl(message);
    return NextResponse.json({ ok: false, code: 'HR_OPERATIONS_PATCH_FAILED', error: message, description, ...(indexUrl ? { indexUrl } : {}) }, { status: 500 });
  }
}
