"use client";

import React, { useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Clock, CheckCircle, Flag } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#a855f7',
  review: '#f59e0b',
  done: '#22c55e',
};
const PRIORITY_COLORS: Record<string, string> = {
  low: '#94a3b8',
  medium: '#a855f7',
  high: '#f97316',
  urgent: '#ef4444',
};

export default function ReportsPage() {
  const { tasks, projects, users, milestones } = useAppState();
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const filteredTasks = useMemo(() =>
    projectFilter === 'all' ? tasks : tasks.filter((t) => t.projectId === projectFilter),
    [tasks, projectFilter]
  );

  // Tasks by status
  const tasksByStatus = useMemo(() => {
    const counts: Record<string, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
    filteredTasks.forEach((t) => { counts[t.status] = (counts[t.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] }));
  }, [filteredTasks]);

  // Tasks by priority
  const tasksByPriority = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
    filteredTasks.forEach((t) => { counts[t.priority] = (counts[t.priority] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: PRIORITY_COLORS[name] }));
  }, [filteredTasks]);

  // Tasks per project
  const tasksByProject = useMemo(() => {
    return projects.map((p) => ({
      name: p.name.length > 16 ? p.name.slice(0, 14) + '…' : p.name,
      total: tasks.filter((t) => t.projectId === p.id).length,
      done: tasks.filter((t) => t.projectId === p.id && t.status === 'done').length,
      active: tasks.filter((t) => t.projectId === p.id && t.status !== 'done').length,
    }));
  }, [tasks, projects]);

  // Time logged per user
  const timeByUser = useMemo(() => {
    return users.map((u) => {
      const minutes = filteredTasks.reduce((sum, t) => {
        return sum + (t.timeEntries ?? []).filter((e) => e.userId === u.id).reduce((s, e) => s + e.minutes, 0);
      }, 0);
      return { name: u.name.split(' ')[0], hours: +(minutes / 60).toFixed(1) };
    }).filter((u) => u.hours > 0);
  }, [filteredTasks, users]);

  // Milestone progress
  const milestoneStats = useMemo(() => {
    const relevant = projectFilter === 'all' ? milestones : milestones.filter((m) => m.projectId === projectFilter);
    return {
      total: relevant.length,
      completed: relevant.filter((m) => m.status === 'completed').length,
      pending: relevant.filter((m) => m.status === 'pending').length,
      overdue: relevant.filter(
        (m) => m.status === 'pending' && m.dueDate < new Date().toISOString().slice(0, 10)
      ).length,
    };
  }, [milestones, projectFilter]);

  const completionRate = filteredTasks.length > 0
    ? Math.round((filteredTasks.filter((t) => t.status === 'done').length / filteredTasks.length) * 100)
    : 0;
  const totalHoursLogged = Math.round(
    filteredTasks.reduce((s, t) => s + (t.timeEntries ?? []).reduce((ss, e) => ss + e.minutes, 0), 0) / 60
  );
  const overdueCount = filteredTasks.filter(
    (t) => t.dueDate && t.status !== 'done' && t.dueDate < new Date().toISOString().slice(0, 10)
  ).length;

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Data-driven insights across your workspace.</p>
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Completion Rate</span>
              </div>
              <p className="text-2xl font-bold">{completionRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredTasks.filter((t) => t.status === 'done').length} / {filteredTasks.length} tasks</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Hours Logged</span>
              </div>
              <p className="text-2xl font-bold">{totalHoursLogged}h</p>
              <p className="text-xs text-muted-foreground mt-0.5">across all tasks</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Overdue Tasks</span>
              </div>
              <p className="text-2xl font-bold">{overdueCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">past their due date</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Flag className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Milestones</span>
              </div>
              <p className="text-2xl font-bold">{milestoneStats.completed}/{milestoneStats.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{milestoneStats.overdue} overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Tasks by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No tasks yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={tasksByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {tasksByStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, 'Tasks']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Tasks by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No tasks yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={tasksByPriority} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, 'Tasks']} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {tasksByPriority.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Tasks per Project</CardTitle>
              <CardDescription>Active vs completed breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No projects yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={tasksByProject} barSize={20} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="done" name="Done" fill="#22c55e" radius={[0, 4, 4, 0]} stackId="a" />
                    <Bar dataKey="active" name="Active" fill="#a855f7" radius={[0, 4, 4, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Time Logged per Member</CardTitle>
              <CardDescription>Hours contributed by each team member</CardDescription>
            </CardHeader>
            <CardContent>
              {timeByUser.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No time entries logged yet. Use time tracking on tasks.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={timeByUser} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="h" />
                    <Tooltip formatter={(v: number) => [`${v}h`, 'Hours']} />
                    <Bar dataKey="hours" name="Hours" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Milestones table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Milestone Tracker</CardTitle>
            <CardDescription>Status of all milestones across projects</CardDescription>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones yet. Create them in the project Kanban board.</p>
            ) : (
              <div className="space-y-2">
                {milestones
                  .filter((m) => projectFilter === 'all' || m.projectId === projectFilter)
                  .map((m) => {
                    const project = projects.find((p) => p.id === m.projectId);
                    const overdue = m.status === 'pending' && m.dueDate < new Date().toISOString().slice(0, 10);
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 text-sm py-2 border-b last:border-b-0">
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-medium">🏁 {m.title}</span>
                          <span className="text-xs text-muted-foreground">{project?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{m.dueDate}</span>
                          <Badge
                            variant={m.status === 'completed' ? 'default' : overdue ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {overdue ? 'Overdue' : m.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
