"use client";

import React, { useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DepartmentsScalePage() {
  const { departments, users, tasks, addDepartment, assignUserDepartment } = useAppState();
  const [newDepartment, setNewDepartment] = useState('Operations');

  const departmentMetrics = useMemo(() => {
    return departments.map((department) => {
      const members = users.filter((u) => u.departmentId === department.id);
      const memberIds = members.map((m) => m.id);
      const deptTasks = tasks.filter((t) => t.assigneeId && memberIds.includes(t.assigneeId));
      const done = deptTasks.filter((t) => t.status === 'done').length;
      const overdue = deptTasks.filter((t) => t.dueDate && t.status !== 'done' && t.dueDate < new Date().toISOString().slice(0, 10)).length;
      return {
        department,
        members: members.length,
        taskCount: deptTasks.length,
        completion: deptTasks.length > 0 ? Math.round((done / deptTasks.length) * 100) : 0,
        overdue,
      };
    });
  }, [departments, users, tasks]);

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Department-Level Reporting</h1>
          <p className="text-muted-foreground">Track delivery health and ownership by department.</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Department Setup</CardTitle>
            <CardDescription>Create departments and assign team members.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} placeholder="Department name" />
              <Button onClick={() => { if (newDepartment.trim()) addDepartment({ name: newDepartment.trim() }); }}>Add</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users.map((user) => (
                <div key={user.id} className="border rounded-md p-3 space-y-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <Select value={user.departmentId ?? 'none'} onValueChange={(v) => assignUserDepartment(user.id, v === 'none' ? undefined : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departmentMetrics.map((item) => (
            <Card key={item.department.id} className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">{item.department.name}</CardTitle>
                <CardDescription>{item.members} members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Assigned Tasks</span><span>{item.taskCount}</span></div>
                <div className="flex justify-between"><span>Completion</span><span>{item.completion}%</span></div>
                <div className="flex justify-between"><span>Overdue</span><span>{item.overdue}</span></div>
              </CardContent>
            </Card>
          ))}
          {departments.length === 0 && <p className="text-sm text-muted-foreground">No departments configured.</p>}
        </div>
      </div>
    </Shell>
  );
}
