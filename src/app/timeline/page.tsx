"use client";

import React, { useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, GanttChartSquare } from 'lucide-react';

type Granularity = 'week' | 'month';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-400',
  medium: 'bg-primary',
  high: 'bg-orange-500',
  urgent: 'bg-destructive',
};

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export default function TimelinePage() {
  const { tasks, projects, milestones } = useAppState();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [offsetWeeks, setOffsetWeeks] = useState(0);

  // Determine the visible window
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const windowDays = granularity === 'week' ? 14 : 56; // 2 weeks or 8 weeks
  const rangeStart = addDays(today, offsetWeeks * 7);
  const rangeEnd = addDays(rangeStart, windowDays);

  // Build day columns
  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < windowDays; i++) arr.push(addDays(rangeStart, i));
    return arr;
  }, [rangeStart, windowDays]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const start = t.startDate ? new Date(t.startDate) : new Date(t.createdAt);
      return due >= rangeStart || start <= rangeEnd;
    });
  }, [tasks, selectedProjectId, rangeStart, rangeEnd]);

  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (selectedProjectId !== 'all' && m.projectId !== selectedProjectId) return false;
      const d = new Date(m.dueDate);
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [milestones, selectedProjectId, rangeStart, rangeEnd]);

  // Column width in px
  const colWidth = granularity === 'week' ? 56 : 28;
  const totalWidth = days.length * colWidth;

  // Compute bar position and width for a task
  function getBar(taskStart: string, taskEnd: string) {
    const s = new Date(taskStart);
    const e = new Date(taskEnd);
    const startOffset = Math.max(0, diffDays(rangeStart, s));
    const endOffset = Math.min(windowDays, diffDays(rangeStart, e) + 1);
    const width = Math.max(1, endOffset - startOffset) * colWidth;
    const left = startOffset * colWidth;
    return { left, width, overflow: startOffset < 0 || endOffset > windowDays };
  }

  // Week headers for multi-week grouping
  const weekHeaders = useMemo(() => {
    const headers: { label: string; colSpan: number }[] = [];
    let current = new Date(rangeStart);
    while (current < rangeEnd) {
      const weekStart = isoDate(current);
      const label = `${current.getMonth() + 1}/${current.getDate()}`;
      const span = Math.min(7, diffDays(current, rangeEnd));
      headers.push({ label, colSpan: span });
      current = addDays(current, 7);
    }
    return headers;
  }, [rangeStart, rangeEnd]);

  const todayOffset = diffDays(rangeStart, today);
  const todayLeft = todayOffset * colWidth;

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Timeline</h1>
            <p className="text-muted-foreground">Gantt-style view of tasks and milestones.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">2 Weeks</SelectItem>
                <SelectItem value="month">8 Weeks</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setOffsetWeeks((o) => o - (granularity === 'week' ? 2 : 8))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setOffsetWeeks(0)}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => setOffsetWeeks((o) => o + (granularity === 'week' ? 2 : 8))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GanttChartSquare className="h-4 w-4 text-primary" />
              {isoDate(rangeStart)} — {isoDate(rangeEnd)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div style={{ minWidth: totalWidth + 220 }}>
              {/* Header row */}
              <div className="flex sticky top-0 z-10 bg-card border-b">
                <div className="w-52 min-w-52 shrink-0 border-r px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Task
                </div>
                <div className="flex">
                  {weekHeaders.map((wh, i) => (
                    <div
                      key={i}
                      className="border-r last:border-r-0 px-1 py-2 text-xs text-muted-foreground font-medium text-center overflow-hidden"
                      style={{ width: wh.colSpan * colWidth }}
                    >
                      {wh.label}
                    </div>
                  ))}
                </div>
              </div>
              {/* Day sub-header */}
              <div className="flex border-b bg-muted/30">
                <div className="w-52 min-w-52 shrink-0 border-r" />
                <div className="flex">
                  {days.map((d, i) => {
                    const isToday = isoDate(d) === isoDate(today);
                    const isSun = d.getDay() === 0;
                    return (
                      <div
                        key={i}
                        style={{ width: colWidth }}
                        className={`border-r last:border-r-0 py-1 text-center text-[10px] ${
                          isToday ? 'bg-primary/10 text-primary font-bold' : isSun ? 'bg-muted/50 text-muted-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {granularity === 'week' ? d.getDate() : (d.getDay() === 1 ? d.getDate() : '')}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Milestone rows */}
              {filteredMilestones.length > 0 && (
                <div className="flex items-center border-b bg-yellow-500/5 h-9 relative">
                  <div className="w-52 min-w-52 shrink-0 border-r px-3 text-xs font-semibold text-yellow-600 dark:text-yellow-400 truncate">
                    🏁 Milestones
                  </div>
                  <div className="flex-1 relative" style={{ height: '100%' }}>
                    {filteredMilestones.map((m) => {
                      const proj = projects.find((p) => p.id === m.projectId);
                      const daysFromStart = diffDays(rangeStart, new Date(m.dueDate));
                      if (daysFromStart < 0 || daysFromStart >= windowDays) return null;
                      return (
                        <div
                          key={m.id}
                          className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                          style={{ left: daysFromStart * colWidth }}
                          title={`${m.title} — ${proj?.name}`}
                        >
                          <div className={`w-3 h-3 rotate-45 ${m.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'} shadow-md`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Task rows */}
              {filteredTasks.length === 0 ? (
                <div className="px-4 py-8 text-sm text-muted-foreground text-center">
                  No tasks with due dates in this window. Add due dates to tasks in the Kanban board.
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const start = task.startDate ?? task.createdAt;
                  const end = task.dueDate ?? task.createdAt;
                  const { left, width } = getBar(start, end);
                  const color = PRIORITY_COLORS[task.priority] ?? 'bg-primary';
                  return (
                    <div key={task.id} className="flex items-center border-b h-10 hover:bg-muted/30 transition-colors group">
                      <div className="w-52 min-w-52 shrink-0 border-r px-3 flex flex-col justify-center overflow-hidden">
                        <span className="text-xs font-medium truncate">{task.title}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{project?.name}</span>
                      </div>
                      <div className="flex-1 relative h-full">
                        {/* Today line */}
                        {todayLeft >= 0 && todayLeft <= totalWidth && (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-primary/40 z-10"
                            style={{ left: todayLeft }}
                          />
                        )}
                        <div
                          className={`absolute top-2 h-5 rounded ${color} opacity-80 group-hover:opacity-100 transition-opacity flex items-center px-1.5`}
                          style={{ left, width: Math.max(width, colWidth) }}
                          title={`${task.title}: ${start.slice(0, 10)} → ${end}`}
                        >
                          <span className="text-[10px] text-white font-medium truncate">{task.title}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={`w-3 h-3 rounded ${color}`} />
              {priority}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rotate-45 bg-yellow-500" />
            Milestone
          </div>
        </div>
      </div>
    </Shell>
  );
}
