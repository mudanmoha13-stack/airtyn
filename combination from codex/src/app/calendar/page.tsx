"use client";

import React, { useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const { tasks, projects, milestones } = useAppState();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Map tasks by due date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const key = t.dueDate.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const milestonesByDate = useMemo(() => {
    const map: Record<string, typeof milestones> = {};
    milestones.forEach((m) => {
      const key = m.dueDate.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [milestones]);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">Tasks and milestones by due date.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="font-semibold text-lg min-w-[180px] text-center">{MONTH_NAMES[month]} {year}</span>
            <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}>
              Today
            </Button>
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              {MONTH_NAMES[month]} {year}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Day header */}
            <div className="grid grid-cols-7 border-b">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="min-h-[110px] border-r border-b last:border-r-0 bg-muted/10" />;
                }
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTasks = tasksByDate[dateKey] ?? [];
                const dayMilestones = milestonesByDate[dateKey] ?? [];
                const isToday = dateKey === todayStr;
                return (
                  <div
                    key={dateKey}
                    className={`min-h-[110px] border-r border-b last:border-r-0 p-1.5 ${
                      isToday ? 'bg-primary/5 ring-1 ring-inset ring-primary/30' : ''
                    }`}
                  >
                    <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayMilestones.slice(0, 1).map((m) => (
                        <div
                          key={m.id}
                          className="text-[10px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-medium truncate"
                          title={m.title}
                        >
                          🏁 {m.title}
                        </div>
                      ))}
                      {dayTasks.slice(0, 3).map((task) => {
                        const project = projects.find((p) => p.id === task.projectId);
                        return (
                          <div
                            key={task.id}
                            className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium truncate"
                            title={`${task.title} — ${project?.name ?? ''}`}
                          >
                            {task.title}
                          </div>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend + upcoming */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Upcoming Due Dates</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-60 overflow-auto">
              {tasks
                .filter((t) => t.dueDate && t.status !== 'done')
                .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
                .slice(0, 10)
                .map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const overdue = task.dueDate! < todayStr;
                  return (
                    <div key={task.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate">{task.title}</span>
                        <span className="text-xs text-muted-foreground">{project?.name}</span>
                      </div>
                      <Badge variant="outline" className={overdue ? 'border-destructive text-destructive' : ''}>
                        {task.dueDate}
                      </Badge>
                    </div>
                  );
                })}
              {tasks.filter((t) => t.dueDate && t.status !== 'done').length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming tasks with due dates.</p>
              )}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Milestones This Month</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-60 overflow-auto">
              {milestones
                .filter((m) => {
                  const d = m.dueDate.slice(0, 7);
                  return d === `${year}-${String(month + 1).padStart(2, '0')}`;
                })
                .map((m) => {
                  const project = projects.find((p) => p.id === m.projectId);
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate">🏁 {m.title}</span>
                        <span className="text-xs text-muted-foreground">{project?.name}</span>
                      </div>
                      <Badge variant={m.status === 'completed' ? 'default' : 'outline'}>
                        {m.status}
                      </Badge>
                    </div>
                  );
                })}
              {milestones.filter((m) => m.dueDate.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`).length === 0 && (
                <p className="text-sm text-muted-foreground">No milestones this month.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
