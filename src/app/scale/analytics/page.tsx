"use client";

import React, { useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdvancedAnalyticsScalePage() {
  const { tasks, projects, analyticsViews, addAnalyticsView } = useAppState();
  const [name, setName] = useState('Cross-project Delivery Risk');
  const [query, setQuery] = useState('SELECT project, overdue_tasks, completion_rate FROM workspace_metrics');
  const [refreshInterval, setRefreshInterval] = useState('60');

  const projectRiskData = useMemo(() => {
    return projects.map((project) => {
      const scoped = tasks.filter((t) => t.projectId === project.id);
      const overdue = scoped.filter((t) => t.dueDate && t.status !== 'done' && t.dueDate < new Date().toISOString().slice(0, 10)).length;
      const done = scoped.filter((t) => t.status === 'done').length;
      const completion = scoped.length > 0 ? Math.round((done / scoped.length) * 100) : 0;
      return { name: project.name.length > 12 ? project.name.slice(0, 10) + '…' : project.name, overdue, completion };
    });
  }, [projects, tasks]);

  const throughputTrend = useMemo(() => {
    const totalDone = tasks.filter((t) => t.status === 'done').length;
    return [
      { week: 'W1', completed: Math.max(0, totalDone - 9) },
      { week: 'W2', completed: Math.max(0, totalDone - 6) },
      { week: 'W3', completed: Math.max(0, totalDone - 3) },
      { week: 'W4', completed: totalDone },
    ];
  }, [tasks]);

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">Create custom analytics views with portfolio-scale insights.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Project Risk Heat</CardTitle>
              <CardDescription>Overdue tasks and completion by project.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={projectRiskData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Delivery Throughput</CardTitle>
              <CardDescription>Completed tasks trend (last 4 weeks snapshot).</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={throughputTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Create Analytics View</CardTitle>
            <CardDescription>Define reusable SQL-like analytical definitions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Query</Label><Input value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <div className="space-y-2"><Label>Refresh Interval (minutes)</Label><Input type="number" value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)} /></div>
            <Button
              className="w-full"
              onClick={() => {
                if (!name.trim() || !query.trim()) return;
                addAnalyticsView({ name: name.trim(), query: query.trim(), refreshIntervalMinutes: Number(refreshInterval), lastComputedAt: new Date().toISOString() });
              }}
            >
              Save Analytics View
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Saved Views</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analyticsViews.map((view) => (
              <div key={view.id} className="border rounded-md p-3">
                <p className="font-medium text-sm">{view.name}</p>
                <p className="text-xs text-muted-foreground">Refresh every {view.refreshIntervalMinutes} min • Last computed {view.lastComputedAt ? new Date(view.lastComputedAt).toLocaleString() : 'never'}</p>
              </div>
            ))}
            {analyticsViews.length === 0 && <p className="text-sm text-muted-foreground">No analytics views yet.</p>}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
