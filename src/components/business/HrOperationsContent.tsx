"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BusinessModuleSpec } from '@/lib/business-os';

type Employee = {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  status: string;
};

type Contract = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string | null;
};

type Attendance = {
  id: string;
  employeeId: string;
  employeeName: string;
  checkIn: string;
  checkOut: string | null;
};

type LeaveRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
};

type PayrollSlip = {
  id: string;
  employeeId: string;
  employeeName: string;
  netPay: number;
};

type PayrollRun = {
  id: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  approvalStatus: string;
  payslips: PayrollSlip[];
};

type Candidate = {
  id: string;
  name: string;
  roleTitle: string;
  stage: string;
  createdAt: string;
};

const CANDIDATE_FLOW = ['screening', 'interview', 'offer', 'approved'];

export function HrOperationsContent({ module }: { module: BusinessModuleSpec }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [employeeName, setEmployeeName] = useState('');
  const [employeeTitle, setEmployeeTitle] = useState('');
  const [employeeDepartment, setEmployeeDepartment] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [employeeOrgUnit, setEmployeeOrgUnit] = useState('');
  const [employeeSkills, setEmployeeSkills] = useState('');

  const [contractEmployeeId, setContractEmployeeId] = useState('');
  const [contractType, setContractType] = useState('full-time');
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');

  const [attendanceEmployeeId, setAttendanceEmployeeId] = useState('');
  const [shiftLabel, setShiftLabel] = useState('day');

  const [leaveEmployeeId, setLeaveEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('annual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');

  const [payrollEmployeeId, setPayrollEmployeeId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [netPay, setNetPay] = useState('0');

  const [candidateName, setCandidateName] = useState('');
  const [candidateRoleTitle, setCandidateRoleTitle] = useState('');
  const [candidateStage, setCandidateStage] = useState('screening');

  const [localProfiles, setLocalProfiles] = useState<Record<string, { role: string; orgUnit: string; skills: string }>>({});

  const load = async () => {
    try {
      const response = await fetch('/api/business/hr/operations', { cache: 'no-store' });
      const data = (await response.json()) as {
        ok: boolean;
        employees?: Employee[];
        contracts?: Contract[];
        attendance?: Attendance[];
        leaves?: LeaveRow[];
        payrollRuns?: PayrollRun[];
        candidates?: Candidate[];
      };

      if (data.ok) {
        setEmployees(data.employees ?? []);
        setContracts(data.contracts ?? []);
        setAttendance(data.attendance ?? []);
        setLeaves(data.leaves ?? []);
        setPayrollRuns(data.payrollRuns ?? []);
        setCandidates(data.candidates ?? []);
      }
    } catch {
      setEmployees((module.records ?? []).map((record, index) => ({
        id: `seed-emp-${index}`,
        name: record.title,
        title: record.subtitle,
        department: 'General',
        email: `employee${index + 1}@pinkplan.local`,
        status: 'active',
      })));
    }

    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('pinkplan:hr:profiles');
      if (raw) {
        setLocalProfiles(JSON.parse(raw) as Record<string, { role: string; orgUnit: string; skills: string }>);
      }
    }
  };

  useEffect(() => {
    void load();
  }, [module.records]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinkplan:hr:profiles', JSON.stringify(localProfiles));
  }, [localProfiles]);

  const addEmployee = async () => {
    if (!employeeName.trim() || !employeeTitle.trim() || !employeeEmail.trim()) return;

    await fetch('/api/business/hr/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'employee',
        name: employeeName.trim(),
        email: employeeEmail.trim().toLowerCase(),
        title: employeeTitle.trim(),
        department: employeeDepartment.trim() || 'General',
      }),
    });

    await load();

    const match = employees.find((item) => item.email.toLowerCase() === employeeEmail.trim().toLowerCase());
    if (match) {
      setLocalProfiles((prev) => ({
        ...prev,
        [match.id]: {
          role: employeeRole.trim(),
          orgUnit: employeeOrgUnit.trim(),
          skills: employeeSkills.trim(),
        },
      }));
    }

    setEmployeeName('');
    setEmployeeTitle('');
    setEmployeeDepartment('');
    setEmployeeEmail('');
    setEmployeeRole('');
    setEmployeeOrgUnit('');
    setEmployeeSkills('');
  };

  const addContract = async () => {
    if (!contractEmployeeId || !contractStart) return;

    await fetch('/api/business/hr/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'contract',
        employeeId: contractEmployeeId,
        contractType: contractType.trim(),
        startDate: new Date(contractStart).toISOString(),
        endDate: contractEnd ? new Date(contractEnd).toISOString() : undefined,
      }),
    });

    await load();
    setContractType('full-time');
    setContractStart('');
    setContractEnd('');
  };

  const clockIn = async () => {
    if (!attendanceEmployeeId) return;

    await fetch('/api/business/hr/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'attendance',
        employeeId: attendanceEmployeeId,
        checkIn: new Date().toISOString(),
      }),
    });

    await load();
  };

  const requestLeave = async () => {
    if (!leaveEmployeeId || !leaveStart || !leaveEnd) return;

    await fetch('/api/business/hr/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'leave',
        employeeId: leaveEmployeeId,
        leaveType: leaveType.trim(),
        startDate: new Date(leaveStart).toISOString(),
        endDate: new Date(leaveEnd).toISOString(),
      }),
    });

    await load();
    setLeaveType('annual');
    setLeaveStart('');
    setLeaveEnd('');
  };

  const createPayrollRun = async () => {
    const parsedNetPay = Number(netPay);
    if (!payrollEmployeeId || !periodStart || !periodEnd || Number.isNaN(parsedNetPay) || parsedNetPay < 0) return;

    await fetch('/api/business/hr/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'payroll',
        employeeId: payrollEmployeeId,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
        netPay: parsedNetPay,
      }),
    });

    await load();
    setPeriodStart('');
    setPeriodEnd('');
    setNetPay('0');
  };

  const addCandidate = async () => {
    if (!candidateName.trim() || !candidateRoleTitle.trim()) return;

    await fetch('/api/business/hr/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'candidate',
        name: candidateName.trim(),
        roleTitle: candidateRoleTitle.trim(),
        stage: candidateStage,
      }),
    });

    await load();
    setCandidateName('');
    setCandidateRoleTitle('');
    setCandidateStage('screening');
  };

  const updateLeaveStatus = async (id: string, status: 'requested' | 'approved' | 'rejected' | 'canceled') => {
    await fetch('/api/business/hr/operations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'leave',
        id,
        status,
      }),
    });

    await load();
  };

  const advanceCandidate = async (candidate: Candidate) => {
    const index = CANDIDATE_FLOW.findIndex((stage) => stage === candidate.stage.toLowerCase());
    const next = CANDIDATE_FLOW[(index + 1 + CANDIDATE_FLOW.length) % CANDIDATE_FLOW.length];

    await fetch('/api/business/hr/operations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'candidate',
        id: candidate.id,
        stage: next,
      }),
    });

    await load();
  };

  const reviewPayroll = async (id: string, approval: 'approved' | 'rejected') => {
    await fetch('/api/business/hr/operations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'payroll',
        id,
        approval,
      }),
    });

    await load();
  };

  const requestedLeaves = useMemo(() => leaves.filter((item) => item.status === 'requested'), [leaves]);
  const pendingPayroll = useMemo(() => payrollRuns.filter((item) => item.approvalStatus === 'pending_approval'), [payrollRuns]);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card id="core-objects" className="glass-card border-white/5 scroll-mt-24">
          <CardHeader>
            <CardTitle>Core Objects</CardTitle>
            <CardDescription>Employees, contracts, attendance, leave, payroll runs, and recruitment candidates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {module.coreObjects.map((item) => (
              <div key={item}>• {item}</div>
            ))}
          </CardContent>
        </Card>

        <Card id="features" className="glass-card border-white/5 scroll-mt-24">
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>All requested HR & payroll capabilities are enabled below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {module.features.map((item) => (
              <div key={item}>• {item}</div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="glass-card border-white/5 xl:col-span-2" id="operations">
          <CardHeader>
            <CardTitle>Employee Profiles</CardTitle>
            <CardDescription>Add employee profile with skills, role, and org unit.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Employee name" value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} />
            <Input placeholder="Work email" value={employeeEmail} onChange={(event) => setEmployeeEmail(event.target.value)} />
            <Input placeholder="Title" value={employeeTitle} onChange={(event) => setEmployeeTitle(event.target.value)} />
            <Input placeholder="Department" value={employeeDepartment} onChange={(event) => setEmployeeDepartment(event.target.value)} />
            <Input placeholder="Role" value={employeeRole} onChange={(event) => setEmployeeRole(event.target.value)} />
            <Input placeholder="Org unit" value={employeeOrgUnit} onChange={(event) => setEmployeeOrgUnit(event.target.value)} />
            <div className="md:col-span-2">
              <Input placeholder="Skills (comma-separated)" value={employeeSkills} onChange={(event) => setEmployeeSkills(event.target.value)} />
            </div>
            <Button className="gradient-amber text-black font-semibold" onClick={addEmployee}>Add Employee</Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Time & Attendance</CardTitle>
            <CardDescription>Clock-in and shift logging.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={attendanceEmployeeId}
              onChange={(event) => setAttendanceEmployeeId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
            <Input placeholder="Shift label" value={shiftLabel} onChange={(event) => setShiftLabel(event.target.value)} />
            <Button variant="outline" className="w-full border-white/10 bg-card/40" onClick={clockIn}>Clock In</Button>
            <div className="space-y-2 max-h-44 overflow-auto">
              {attendance.slice(0, 6).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/5 bg-card/40 p-2">
                  <p className="text-sm text-foreground">{entry.employeeName}</p>
                  <p className="text-xs text-muted-foreground">In: {new Date(entry.checkIn).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Shift: {shiftLabel}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="glass-card border-white/5 xl:col-span-6">
          <CardHeader>
            <CardTitle>Contracts</CardTitle>
            <CardDescription>Create and track contract terms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={contractEmployeeId}
                onChange={(event) => setContractEmployeeId(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              <Input placeholder="Contract type" value={contractType} onChange={(event) => setContractType(event.target.value)} />
              <Input type="date" value={contractStart} onChange={(event) => setContractStart(event.target.value)} />
              <Input type="date" value={contractEnd} onChange={(event) => setContractEnd(event.target.value)} />
            </div>
            <Button className="gradient-amber text-black font-semibold" onClick={addContract}>Create Contract</Button>

            <div className="space-y-2 max-h-56 overflow-auto">
              {contracts.map((contract) => (
                <div key={contract.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                  <p className="font-medium text-foreground">{contract.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{contract.type} • {new Date(contract.startDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 xl:col-span-6">
          <CardHeader>
            <CardTitle>Leave Management</CardTitle>
            <CardDescription>Submit leave requests and apply policy approval actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={leaveEmployeeId}
                onChange={(event) => setLeaveEmployeeId(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              <Input placeholder="Leave type" value={leaveType} onChange={(event) => setLeaveType(event.target.value)} />
              <Input type="date" value={leaveStart} onChange={(event) => setLeaveStart(event.target.value)} />
              <Input type="date" value={leaveEnd} onChange={(event) => setLeaveEnd(event.target.value)} />
            </div>
            <Button className="gradient-amber text-black font-semibold" onClick={requestLeave}>Request Leave</Button>

            <div className="space-y-2 max-h-56 overflow-auto">
              {leaves.map((leave) => (
                <div key={leave.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{leave.employeeName}</p>
                    <Badge variant="outline" className="border-white/10 text-muted-foreground">{leave.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{leave.type} • {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="glass-card border-white/5 xl:col-span-6">
          <CardHeader>
            <CardTitle>Payroll Runs</CardTitle>
            <CardDescription>Earnings, deductions proxy through net pay, and payslip generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={payrollEmployeeId}
                onChange={(event) => setPayrollEmployeeId(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              <Input placeholder="Net pay" value={netPay} onChange={(event) => setNetPay(event.target.value)} />
              <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
              <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </div>
            <Button className="gradient-amber text-black font-semibold" onClick={createPayrollRun}>Create Payroll Run</Button>

            <div className="space-y-2 max-h-56 overflow-auto">
              {payrollRuns.map((run) => (
                <div key={run.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{new Date(run.periodStart).toLocaleDateString()} → {new Date(run.periodEnd).toLocaleDateString()}</p>
                    <Badge variant="outline" className="border-white/10 text-muted-foreground">{run.approvalStatus}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Payslips: {run.payslips.length}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 xl:col-span-6">
          <CardHeader>
            <CardTitle>Recruitment</CardTitle>
            <CardDescription>Create candidate records and move stages through hiring workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Input placeholder="Candidate name" value={candidateName} onChange={(event) => setCandidateName(event.target.value)} />
              <Input placeholder="Role title" value={candidateRoleTitle} onChange={(event) => setCandidateRoleTitle(event.target.value)} />
              <select
                value={candidateStage}
                onChange={(event) => setCandidateStage(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="screening">screening</option>
                <option value="interview">interview</option>
                <option value="offer">offer</option>
                <option value="approved">approved</option>
              </select>
            </div>
            <Button className="gradient-amber text-black font-semibold" onClick={addCandidate}>Add Candidate</Button>

            <div className="space-y-2 max-h-56 overflow-auto">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{candidate.name}</p>
                    <Badge variant="outline" className="border-white/10 text-muted-foreground">{candidate.stage}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{candidate.roleTitle}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3" id="workflows">
        <Card className="glass-card border-white/5 scroll-mt-24">
          <CardHeader>
            <CardTitle>Hiring Approvals</CardTitle>
            <CardDescription>Advance candidate to next hiring stage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.slice(0, 6).map((candidate) => (
              <div key={candidate.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                <p className="text-sm text-foreground">{candidate.name}</p>
                <p className="text-xs text-muted-foreground">{candidate.stage}</p>
                <Button size="sm" variant="outline" className="mt-2 border-white/10 bg-card/40" onClick={() => advanceCandidate(candidate)}>
                  Advance Stage
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Leave Approvals</CardTitle>
            <CardDescription>Approve or reject requested leaves.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {requestedLeaves.slice(0, 6).map((leave) => (
              <div key={leave.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                <p className="text-sm text-foreground">{leave.employeeName}</p>
                <p className="text-xs text-muted-foreground">{leave.type}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="gradient-amber text-black" onClick={() => updateLeaveStatus(leave.id, 'approved')}>Approve</Button>
                  <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => updateLeaveStatus(leave.id, 'rejected')}>Reject</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5" id="governance">
          <CardHeader>
            <CardTitle>Payroll Approvals</CardTitle>
            <CardDescription>Approve or reject payroll runs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingPayroll.slice(0, 6).map((run) => (
              <div key={run.id} className="rounded-xl border border-white/5 bg-card/40 p-3">
                <p className="text-sm text-foreground">Run {new Date(run.periodStart).toLocaleDateString()} → {new Date(run.periodEnd).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">{run.payslips.length} payslips</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="gradient-amber text-black" onClick={() => reviewPayroll(run.id, 'approved')}>Approve</Button>
                  <Button size="sm" variant="outline" className="border-white/10 bg-card/40" onClick={() => reviewPayroll(run.id, 'rejected')}>Reject</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>Profiles with role, skills, org unit and employment context.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {employees.map((employee) => {
            const profile = localProfiles[employee.id];
            return (
              <div key={employee.id} className="rounded-xl border border-white/5 bg-card/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{employee.name}</p>
                  <Badge variant="outline" className="border-white/10 text-muted-foreground">{employee.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{employee.title} • {employee.department}</p>
                <p className="text-xs text-muted-foreground">{employee.email}</p>
                <p className="text-xs text-primary mt-1">Role: {profile?.role || 'N/A'} • Org Unit: {profile?.orgUnit || 'N/A'}</p>
                <p className="text-xs text-primary">Skills: {profile?.skills || 'N/A'}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}
