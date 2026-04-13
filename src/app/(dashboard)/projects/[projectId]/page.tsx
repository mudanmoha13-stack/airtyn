"use client";

import React, { use, useMemo, useState } from 'react';
import { useAppState } from '@/lib/store';
import type { ProjectView, TaskStatus, TaskPriority, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TaskDetailPanel } from '@/components/pm/TaskDetailPanel';
import { BoardView } from '@/components/pm/BoardView';
import { ListView } from '@/components/pm/ListView';
import { AddTaskDialog } from '@/components/pm/AddTaskDialog';
import { FilterBar, FilterState } from '@/components/pm/FilterBar';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  Target,
  Archive,
  Trash2,
  ChevronLeft,
  TrendingUp,
  Flag,
  MoreHorizontal,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Utility ────────────────────────────────────────────────────────────────

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function diffDays(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  none: 'bg-muted',
  low: 'bg-slate-400',
  medium: 'bg-primary',
  high: 'bg-orange-500',
  urgent: 'bg-destructive',
};

// ─── Timeline View ─────────────────────────────────────────────────────────

const TimelineView: React.FC<{ projectId: string; onTaskClick: (id: string) => void }> = ({
  projectId, onTaskClick,
}) => {
  const { tasks, milestones } = useAppState();
  const [offsetWeeks, setOffsetWeeks] = useState(0);
  const [granularity, setGranularity] = useState<'week' | 'month'>('month');
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const windowDays = granularity === 'week' ? 14 : 56;
  const rangeStart = addDays(today, offsetWeeks * 7);
  const rangeEnd = addDays(rangeStart, windowDays);
  const colWidth = granularity === 'week' ? 52 : 26;
  const days = useMemo(
    () => Array.from({ length: windowDays }, (_, i) => addDays(rangeStart, i)),
    [rangeStart, windowDays]
  );

  const filteredTasks = useMemo(
    () => tasks.filter((t) => {
      if (t.projectId !== projectId) return false;
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const start = t.startDate ? new Date(t.startDate) : new Date(t.createdAt);
      return due >= rangeStart || start <= rangeEnd;
    }),
    [tasks, projectId, rangeStart, rangeEnd]
  );

  const filteredMilestones = useMemo(
    () => milestones.filter((m) => {
      if (m.projectId !== projectId) return false;
      const d = new Date(m.dueDate);
      return d >= rangeStart && d <= rangeEnd;
    }),
    [milestones, projectId, rangeStart, rangeEnd]
  );

  const weekHeaders = useMemo(() => {
    const headers: { label: string; colSpan: number }[] = [];
    let cur = new Date(rangeStart);
    while (cur < rangeEnd) {
      const span = Math.min(7, diffDays(cur, rangeEnd));
      headers.push({ label: `${cur.getMonth() + 1}/${cur.getDate()}`, colSpan: span });
      cur = addDays(cur, 7);
    }
    return headers;
  }, [rangeStart, rangeEnd]);

  const todayLeft = diffDays(rangeStart, today) * colWidth;
  const totalWidth = days.length * colWidth;

  return (
    <div className="h-full overflow-auto p-4 space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={granularity}
          onChange={(e) => setGranularity(e.target.value as 'week' | 'month')}
          className="text-xs border rounded px-2 py-1 bg-background"
        >
          <option value="week">2 Weeks</option>
          <option value="month">8 Weeks</option>
        </select>
        <Button size="sm" variant="outline" onClick={() => setOffsetWeeks((o) => o - (granularity === 'week' ? 2 : 8))}>‹</Button>
        <Button size="sm" variant="outline" onClick={() => setOffsetWeeks(0)}>Today</Button>
        <Button size="sm" variant="outline" onClick={() => setOffsetWeeks((o) => o + (granularity === 'week' ? 2 : 8))}>›</Button>
        <span className="text-xs text-muted-foreground">{isoDate(rangeStart)} — {isoDate(rangeEnd)}</span>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <div style={{ minWidth: totalWidth + 220 }}>
          <div className="flex sticky top-0 z-10 bg-card border-b">
            <div className="w-52 min-w-52 shrink-0 border-r px-3 py-2 text-xs font-semibold text-muted-foreground">Task</div>
            <div className="flex">
              {weekHeaders.map((wh, i) => (
                <div key={i} style={{ width: wh.colSpan * colWidth }} className="border-r px-1 py-2 text-xs text-muted-foreground text-center">
                  {wh.label}
                </div>
              ))}
            </div>
          </div>
          <div className="flex border-b bg-muted/20">
            <div className="w-52 min-w-52 shrink-0 border-r" />
            <div className="flex">
              {days.map((d, i) => {
                const isToday = isoDate(d) === isoDate(today);
                return (
                  <div key={i} style={{ width: colWidth }}
                    className={`border-r py-1 text-center text-[10px] ${isToday ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground'}`}>
                    {granularity === 'week' ? d.getDate() : (d.getDay() === 1 ? d.getDate() : '')}
                  </div>
                );
              })}
            </div>
          </div>
          {filteredMilestones.length > 0 && (
            <div className="flex items-center border-b bg-yellow-500/5 h-9 relative">
              <div className="w-52 min-w-52 shrink-0 border-r px-3 text-xs font-semibold text-yellow-600 dark:text-yellow-400">🏁 Milestones</div>
              <div className="flex-1 relative h-full">
                {filteredMilestones.map((m) => {
                  const dayOff = diffDays(rangeStart, new Date(m.dueDate));
                  if (dayOff < 0 || dayOff >= windowDays) return null;
                  return (
                    <div key={m.id} className="absolute top-1/2 -translate-y-1/2" style={{ left: dayOff * colWidth }} title={m.title}>
                      <div className={`w-3 h-3 rotate-45 ${m.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {filteredTasks.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground text-center">No tasks with due dates in this window.</div>
          ) : (
            filteredTasks.map((task) => {
              const s = task.startDate ?? task.createdAt;
              const e = task.dueDate ?? task.createdAt;
              const startOff = Math.max(0, diffDays(rangeStart, new Date(s)));
              const endOff = Math.min(windowDays, diffDays(rangeStart, new Date(e)) + 1);
              const barWidth = Math.max(1, endOff - startOff) * colWidth;
              const barLeft = startOff * colWidth;
              const color = PRIORITY_COLORS[task.priority] ?? 'bg-primary';
              return (
                <div key={task.id} className="flex items-center border-b h-10 hover:bg-muted/20 group cursor-pointer" onClick={() => onTaskClick(task.id)}>
                  <div className="w-52 min-w-52 shrink-0 border-r px-3">
                    <span className="text-xs font-medium truncate block">{task.title}</span>
                  </div>
                  <div className="flex-1 relative h-full">
                    {todayLeft >= 0 && todayLeft <= totalWidth && (
                      <div className="absolute top-0 bottom-0 w-px bg-primary/40 z-10" style={{ left: todayLeft }} />
                    )}
                    <div className={`absolute top-2 h-5 rounded ${color} opacity-80 flex items-center px-1.5`}
                      style={{ left: barLeft, width: Math.max(barWidth, colWidth) }}>
                      <span className="text-[10px] text-white truncate">{task.title}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Calendar View ─────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const CalendarView: React.FC<{ projectId: string; onTaskClick: (id: string) => void }> = ({
  projectId, onTaskClick,
}) => {
  const { tasks } = useAppState();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayStr = now.toISOString().slice(0, 10);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.filter((t) => t.projectId === projectId).forEach((t) => {
      if (!t.dueDate) return;
      const key = t.dueDate.slice(0, 10);
      map[key] = [...(map[key] ?? []), t];
    });
    return map;
  }, [tasks, projectId]);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="p-4 h-full overflow-auto space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-lg">{MONTH_NAMES[month]} {year}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }}>‹</Button>
          <Button size="sm" variant="outline" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}>Today</Button>
          <Button size="sm" variant="outline" onClick={() => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }}>›</Button>
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e${idx}`} className="min-h-[90px] border-r border-b last:border-r-0 bg-muted/5" />;
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasksByDate[dateKey] ?? [];
            const isToday = dateKey === todayStr;
            return (
              <div key={dateKey} className={`min-h-[90px] border-r border-b last:border-r-0 p-1.5 ${isToday ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}>
                <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>{day}</div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div key={task.id}
                      className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium truncate cursor-pointer hover:bg-primary/20"
                      onClick={() => onTaskClick(task.id)} title={task.title}>
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Table View ─────────────────────────────────────────────────────────────

const TableView: React.FC<{ projectId: string; onTaskClick: (id: string) => void }> = ({
  projectId, onTaskClick,
}) => {
  const { tasks, users } = useAppState();
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="h-full overflow-auto p-4">
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20 text-xs text-muted-foreground font-medium">
              {['#','Task','Status','Priority','Assignee','Due Date','Points','Subtasks','Comments','Created'].map((h) => (
                <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projectTasks.map((task, idx) => {
              const assignee = users.find((u) => u.id === task.assigneeId);
              const isOverdue = task.dueDate && task.status !== 'done' && task.dueDate < today;
              const completedSubs = task.subtasks.filter((s) => s.completed).length;
              return (
                <tr key={task.id} className="border-b hover:bg-muted/10 cursor-pointer" onClick={() => onTaskClick(task.id)}>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{idx + 1}</td>
                  <td className="px-3 py-2 max-w-[200px]">
                    <span className={`font-medium truncate block ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                  </td>
                  <td className="px-3 py-2"><Badge variant="secondary" className="text-xs capitalize">{task.status.replace('_',' ')}</Badge></td>
                  <td className="px-3 py-2 text-xs capitalize">
                    <span className={task.priority === 'urgent' ? 'text-red-400' : task.priority === 'high' ? 'text-orange-400' : task.priority === 'medium' ? 'text-blue-400' : 'text-muted-foreground'}>
                      <Flag className="inline h-3 w-3 mr-0.5" />{task.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5"><AvatarImage src={assignee.avatarUrl} /><AvatarFallback className="text-[8px]">{assignee.name.charAt(0)}</AvatarFallback></Avatar>
                        <span className="text-xs truncate max-w-[80px]">{assignee.name}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className={`px-3 py-2 text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>{task.dueDate?.slice(0,10) ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground text-center">{task.storyPoints ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground text-center">{task.subtasks.length > 0 ? `${completedSubs}/${task.subtasks.length}` : '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground text-center">{task.comments.length || '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(task.createdAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {projectTasks.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No tasks yet</div>}
      </div>
    </div>
  );
};

// ─── Workload View ─────────────────────────────────────────────────────────

const WorkloadView: React.FC<{ projectId: string; onTaskClick: (id: string) => void }> = ({
  projectId, onTaskClick,
}) => {
  const { tasks, users } = useAppState();
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const today = new Date().toISOString().slice(0, 10);

  const workload = useMemo(() => users.map((user) => {
    const userTasks = projectTasks.filter((t) => t.assigneeId === user.id);
    const active = userTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
    const done = userTasks.filter((t) => t.status === 'done');
    const overdue = active.filter((t) => t.dueDate && t.dueDate < today);
    return { user, active, done, overdue };
  }), [users, projectTasks, today]);

  const maxActive = Math.max(...workload.map((w) => w.active.length), 1);
  const unassigned = projectTasks.filter((t) => !t.assigneeId && t.status !== 'done');

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      {workload.map(({ user, active, done, overdue }) => (
        <Card key={user.id} className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={user.avatarUrl} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-blue-400">{active.length} active</span>
                    <span className="text-green-400">{done.length} done</span>
                    {overdue.length > 0 && <span className="text-red-400">{overdue.length} overdue</span>}
                  </div>
                </div>
                <Progress value={(active.length / maxActive) * 100} className="h-1.5 mb-2" />
                <div className="flex flex-wrap gap-1">
                  {active.slice(0, 5).map((task) => (
                    <Badge key={task.id} variant="secondary" className="text-xs cursor-pointer hover:bg-primary/20" onClick={() => onTaskClick(task.id)}>
                      {task.title.slice(0, 25)}{task.title.length > 25 ? '…' : ''}
                    </Badge>
                  ))}
                  {active.length > 5 && <Badge variant="outline" className="text-xs">+{active.length - 5}</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {unassigned.length > 0 && (
        <Card className="glass-card border-dashed">
          <CardHeader className="py-3 px-4"><CardTitle className="text-sm text-muted-foreground">{unassigned.length} Unassigned</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3 flex flex-wrap gap-1">
            {unassigned.slice(0, 8).map((task) => (
              <Badge key={task.id} variant="outline" className="text-xs cursor-pointer" onClick={() => onTaskClick(task.id)}>
                {task.title.slice(0, 30)}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── Stats Bar ──────────────────────────────────────────────────────────────

const ProjectStatsBar: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { tasks } = useAppState();
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => ({
    done: projectTasks.filter((t) => t.status === 'done').length,
    inProgress: projectTasks.filter((t) => t.status === 'in_progress').length,
    review: projectTasks.filter((t) => t.status === 'review').length,
    todo: projectTasks.filter((t) => t.status === 'todo').length,
    overdue: projectTasks.filter((t) => t.dueDate && t.status !== 'done' && t.dueDate < today).length,
    rate: projectTasks.length > 0 ? Math.round((projectTasks.filter((t) => t.status === 'done').length / projectTasks.length) * 100) : 0,
  }), [projectTasks, today]);

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b text-xs text-muted-foreground overflow-x-auto shrink-0 bg-background/60">
      <div className="flex items-center gap-1.5 shrink-0"><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /><span className="font-medium text-foreground">{stats.done}</span> done</div>
      <div className="flex items-center gap-1.5 shrink-0"><Clock className="h-3.5 w-3.5 text-blue-400" /><span className="font-medium text-foreground">{stats.inProgress}</span> in progress</div>
      <div className="flex items-center gap-1.5 shrink-0"><AlertCircle className="h-3.5 w-3.5 text-yellow-400" /><span className="font-medium text-foreground">{stats.review}</span> review</div>
      <div className="flex items-center gap-1.5 shrink-0"><Circle className="h-3.5 w-3.5" /><span className="font-medium text-foreground">{stats.todo}</span> to do</div>
      {stats.overdue > 0 && <div className="flex items-center gap-1.5 shrink-0 text-red-400"><AlertCircle className="h-3.5 w-3.5" /><span className="font-medium">{stats.overdue}</span> overdue</div>}
      <div className="ml-auto flex items-center gap-1.5 shrink-0"><TrendingUp className="h-3.5 w-3.5 text-primary" /><span className="font-medium text-foreground">{stats.rate}%</span> complete</div>
    </div>
  );
};

// ─── Main Project Page ─────────────────────────────────────────────────────

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const { projects, tasks, users, updateProject, deleteProject, milestones, addMilestone } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  const [activeView, setActiveView] = useState<ProjectView>('board');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState<TaskStatus>('todo');
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDue, setMilestoneDue] = useState('');

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    groupBy: 'status',
  });

  if (!project) {
    return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="text-lg font-semibold">Project not found</div>
          <Button onClick={() => router.push('/')}>← Dashboard</Button>
        </div>
    );
  }

  const completedTasks = projectTasks.filter((t) => t.status === 'done').length;
  const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
  const projectMilestones = milestones.filter((m) => m.projectId === projectId);

  return (
    <>
      <div className="flex flex-col h-full -mx-4 -my-4 overflow-hidden">
        {/* Project Header */}
        <div className="px-6 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: project.color ?? '#6366f1' }} />
                <h1 className="text-xl font-bold truncate">{project.name}</h1>
                <Badge variant="secondary" className={`text-xs shrink-0 ${
                  project.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  project.status === 'on_hold' ? 'bg-yellow-500/20 text-yellow-400' :
                  project.status === 'archived' ? 'bg-muted text-muted-foreground' :
                  'bg-primary/20 text-primary'
                }`}>
                  {project.status.replace('_',' ')}
                </Badge>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground truncate ml-10">{project.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 ml-10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Progress value={progress} className="w-24 h-1.5" />
                  <span>{progress}% complete</span>
                </div>
                <span className="text-xs text-muted-foreground">{projectTasks.length} tasks</span>
                {projectMilestones.length > 0 && (
                  <span className="text-xs text-muted-foreground">🏁 {projectMilestones.length} milestones</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex -space-x-1.5">
                {users.slice(0, 4).map((u) => (
                  <Avatar key={u.id} className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={u.avatarUrl} /><AvatarFallback className="text-[9px]">{u.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowMilestoneForm(true)} className="h-8">🏁 Milestone</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-sm">
                  <DropdownMenuItem onClick={() => updateProject(projectId, { status: 'completed' })}><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-400" /> Mark Complete</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateProject(projectId, { status: 'on_hold' })}><Target className="h-3.5 w-3.5 mr-2 text-yellow-400" /> Put On Hold</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateProject(projectId, { status: 'archived' })}><Archive className="h-3.5 w-3.5 mr-2" /> Archive</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => { deleteProject(projectId); router.push('/'); }}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <ProjectStatsBar projectId={projectId} />

        <FilterBar
          activeView={activeView}
          onViewChange={setActiveView}
          filters={filters}
          onFilterChange={setFilters}
          onAddTask={() => { setAddTaskStatus('todo'); setAddTaskOpen(true); }}
          projectId={projectId}
        />

        <div className="flex-1 overflow-hidden">
          {activeView === 'board' && (
            <BoardView
              projectId={projectId}
              onTaskClick={setSelectedTaskId}
              onAddTask={(status) => { setAddTaskStatus(status); setAddTaskOpen(true); }}
              searchQuery={filters.search}
              filterAssignee={filters.assignee}
              filterPriority={filters.priority as TaskPriority | 'all'}
            />
          )}
          {activeView === 'list' && (
            <div className="h-full overflow-auto">
              <ListView
                projectId={projectId}
                onTaskClick={setSelectedTaskId}
                onAddTask={(status) => { setAddTaskStatus(status ?? 'todo'); setAddTaskOpen(true); }}
                filterStatus={filters.status}
                filterPriority={filters.priority as TaskPriority | 'all'}
                filterAssignee={filters.assignee}
                searchQuery={filters.search}
                groupBy={filters.groupBy}
              />
            </div>
          )}
          {activeView === 'timeline' && <TimelineView projectId={projectId} onTaskClick={setSelectedTaskId} />}
          {activeView === 'calendar' && <CalendarView projectId={projectId} onTaskClick={setSelectedTaskId} />}
          {activeView === 'table' && <TableView projectId={projectId} onTaskClick={setSelectedTaskId} />}
          {activeView === 'workload' && <WorkloadView projectId={projectId} onTaskClick={setSelectedTaskId} />}
        </div>
      </div>

      <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      <AddTaskDialog open={addTaskOpen} onClose={() => setAddTaskOpen(false)} projectId={projectId} defaultStatus={addTaskStatus} />

      <Dialog open={showMilestoneForm} onOpenChange={(o) => { if (!o) setShowMilestoneForm(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Milestone</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Milestone title</Label>
              <Input value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} placeholder="e.g. Beta launch" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={milestoneDue} onChange={(e) => setMilestoneDue(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMilestoneForm(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!milestoneTitle.trim() || !milestoneDue) return;
              addMilestone({ projectId, title: milestoneTitle.trim(), description: '', dueDate: milestoneDue, status: 'pending' });
              setMilestoneTitle(''); setMilestoneDue(''); setShowMilestoneForm(false);
            }} disabled={!milestoneTitle.trim() || !milestoneDue}>
              Add Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
