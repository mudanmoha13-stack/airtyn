"use client";

import React, { useState, useMemo } from 'react';
import { useAppState } from '@/lib/store';
import type { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Star,
  CheckCircle2,
  Clock,
  Circle,
  Flag,
  Calendar,
  FolderKanban,
  Search,
  Filter,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Timer,
} from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, differenceInDays } from 'date-fns';
import { useRouter } from 'next/navigation';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-400', dot: 'bg-red-400' },
  high: { label: 'High', color: 'text-orange-400', dot: 'bg-orange-400' },
  medium: { label: 'Medium', color: 'text-blue-400', dot: 'bg-blue-400' },
  low: { label: 'Low', color: 'text-slate-400', dot: 'bg-slate-400' },
  none: { label: 'None', color: 'text-muted-foreground', dot: 'bg-muted' },
};

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  todo: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Clock className="h-4 w-4 text-blue-400" />,
  review: <Flag className="h-4 w-4 text-yellow-400" />,
  done: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  cancelled: <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />,
};

interface TaskRowProps {
  task: Task;
  projectName: string;
  onClick: () => void;
  onToggle: () => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, projectName, onClick, onToggle }) => {
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = task.dueDate && task.status !== 'done' && task.dueDate < today;
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isDueTomorrow = task.dueDate && isTomorrow(new Date(task.dueDate));
  const pCfg = PRIORITY_CONFIG[task.priority];

  const dueDateLabel = !task.dueDate
    ? null
    : isOverdue
      ? `${Math.abs(differenceInDays(new Date(task.dueDate), new Date()))}d overdue`
      : isDueToday
        ? 'Today'
        : isDueTomorrow
          ? 'Tomorrow'
          : format(new Date(task.dueDate), 'MMM d');

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      {/* Status toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="shrink-0 hover:scale-110 transition-transform"
      >
        {STATUS_ICONS[task.status]}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <FolderKanban className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-[10px] text-muted-foreground truncate">{projectName}</span>
          {task.subtasks.length > 0 && (
            <span className="text-[10px] text-muted-foreground ml-1">
              · {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
            </span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 shrink-0">
        {task.priority !== 'none' && (
          <div className={`flex items-center gap-1 text-[10px] ${pCfg.color}`}>
            <div className={`h-1.5 w-1.5 rounded-full ${pCfg.dot}`} />
            <span className="hidden sm:inline">{pCfg.label}</span>
          </div>
        )}
        {dueDateLabel && (
          <span className={`text-[10px] flex items-center gap-0.5 ${
            isOverdue ? 'text-red-400 font-medium' : isDueToday ? 'text-orange-400 font-medium' : 'text-muted-foreground'
          }`}>
            <Calendar className="h-3 w-3" />
            {dueDateLabel}
          </span>
        )}
        {task.estimatedMinutes && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Timer className="h-3 w-3" />
            {Math.round(task.estimatedMinutes / 60)}h
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

// ─── Group Section ────────────────────────────────────────────────────────────

const GroupSection: React.FC<{
  label: string;
  tasks: Task[];
  projects: ReturnType<typeof useAppState>['projects'];
  onTaskClick: (t: Task) => void;
  onToggle: (t: Task) => void;
  defaultOpen?: boolean;
}> = ({ label, tasks, projects, onTaskClick, onToggle, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  if (tasks.length === 0) return null;

  return (
    <div>
      <button
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {open ? '▾' : '▸'} {label}
        <Badge variant="secondary" className="h-4 px-1 text-[10px]">{tasks.length}</Badge>
      </button>
      {open && (
        <div>
          {tasks.map(t => {
            const project = projects.find(p => p.id === t.projectId);
            return (
              <TaskRow
                key={t.id}
                task={t}
                projectName={project?.name ?? ''}
                onClick={() => onTaskClick(t)}
                onToggle={() => onToggle(t)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function MyTasksContent() {
  const { tasks, projects, currentUser, updateTask } = useAppState();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tab, setTab] = useState<'upcoming' | 'all' | 'completed'>('upcoming');

  const today = new Date().toISOString().slice(0, 10);

  const myTasks = useMemo(() => {
    if (!currentUser) return tasks;
    return tasks.filter(t => t.assigneeId === currentUser.id);
  }, [tasks, currentUser]);

  const filtered = useMemo(() => {
    let t = myTasks;
    if (search) {
      const q = search.toLowerCase();
      t = t.filter(task => task.title.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q));
    }
    if (priorityFilter !== 'all') {
      t = t.filter(task => task.priority === priorityFilter);
    }
    return t;
  }, [myTasks, search, priorityFilter]);

  const { upcoming, overdue, dueToday, thisWeek, later, done } = useMemo(() => {
    const active = filtered.filter(t => t.status !== 'done' && t.status !== 'cancelled');
    const completed = filtered.filter(t => t.status === 'done' || t.status === 'cancelled');

    const overdue = active.filter(t => t.dueDate && t.dueDate < today);
    const dueToday = active.filter(t => t.dueDate && isToday(new Date(t.dueDate)));
    const thisWeek = active.filter(t => t.dueDate && !isToday(new Date(t.dueDate)) && isThisWeek(new Date(t.dueDate), { weekStartsOn: 1 }));
    const later = active.filter(t => !t.dueDate || (!overdue.includes(t) && !dueToday.includes(t) && !thisWeek.includes(t)));

    return {
      upcoming: active,
      overdue,
      dueToday,
      thisWeek,
      later,
      done: completed,
    };
  }, [filtered, today]);

  // Stats
  const stats = useMemo(() => ({
    total: myTasks.filter(t => t.status !== 'done').length,
    overdue: myTasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done').length,
    dueToday: myTasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== 'done').length,
    done: myTasks.filter(t => t.status === 'done').length,
    totalPoints: myTasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0),
    donePoints: myTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.storyPoints ?? 0), 0),
  }), [myTasks, today]);

  const goToTask = (task: Task) => {
    router.push(`/projects/${task.projectId}?taskId=${task.id}`);
  };

  const toggleTask = (task: Task) => {
    updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Star className="h-4 w-4 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold">My Tasks</h1>
            <p className="text-xs text-muted-foreground">
              {stats.total} open · {stats.dueToday} due today
              {stats.overdue > 0 && <span className="text-red-400 ml-1">· {stats.overdue} overdue</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-4 px-6 py-2.5 border-b bg-muted/10 overflow-x-auto shrink-0">
        {[
          { label: 'Open', val: stats.total, color: 'text-foreground' },
          { label: 'Due today', val: stats.dueToday, color: stats.dueToday > 0 ? 'text-orange-400' : 'text-muted-foreground' },
          { label: 'Overdue', val: stats.overdue, color: stats.overdue > 0 ? 'text-red-400' : 'text-muted-foreground' },
          { label: 'Completed', val: stats.done, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="text-center min-w-[60px]">
            <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
        {stats.totalPoints > 0 && (
          <>
            <div className="h-6 w-px bg-border mx-2 shrink-0" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{stats.donePoints}/{stats.totalPoints} story points</span>
              <Progress value={stats.totalPoints ? (stats.donePoints / stats.totalPoints) * 100 : 0} className="h-1.5 w-20" />
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my tasks…"
            className="h-7 pl-8 text-xs"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <Flag className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priority</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs + Task list */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-full rounded-none border-b bg-background h-9 shrink-0 px-6 justify-start gap-1">
          <TabsTrigger value="upcoming" className="text-xs h-7 px-3 rounded-md data-[state=active]:bg-primary/10">
            Upcoming <span className="ml-1 text-muted-foreground">({upcoming.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs h-7 px-3 rounded-md data-[state=active]:bg-primary/10">
            All tasks <span className="ml-1 text-muted-foreground">({filtered.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs h-7 px-3 rounded-md data-[state=active]:bg-primary/10">
            Completed <span className="ml-1 text-muted-foreground">({done.length})</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="upcoming" className="mt-0 p-4 space-y-2">
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">All clear!</p>
                <p className="text-xs mt-1 opacity-60">You have no open tasks.</p>
              </div>
            ) : (
              <>
                <GroupSection label="Overdue" tasks={overdue} projects={projects} onTaskClick={goToTask} onToggle={toggleTask} defaultOpen />
                <GroupSection label="Due Today" tasks={dueToday} projects={projects} onTaskClick={goToTask} onToggle={toggleTask} defaultOpen />
                <GroupSection label="This Week" tasks={thisWeek} projects={projects} onTaskClick={goToTask} onToggle={toggleTask} defaultOpen />
                <GroupSection label="Later" tasks={later} projects={projects} onTaskClick={goToTask} onToggle={toggleTask} defaultOpen />
              </>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-0 p-4">
            {filtered.filter(t => t.status !== 'done' && t.status !== 'cancelled').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">No tasks match your filters</p>
              </div>
            ) : (
              filtered
                .filter(t => t.status !== 'done' && t.status !== 'cancelled')
                .sort((a, b) => {
                  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
                  return (priorityOrder[a.priority] ?? 5) - (priorityOrder[b.priority] ?? 5);
                })
                .map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <TaskRow
                      key={task.id}
                      task={task}
                      projectName={project?.name ?? ''}
                      onClick={() => goToTask(task)}
                      onToggle={() => toggleTask(task)}
                    />
                  );
                })
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-0 p-4">
            {done.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Circle className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">No completed tasks yet</p>
              </div>
            ) : (
              done
                .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
                .slice(0, 50)
                .map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <TaskRow
                      key={task.id}
                      task={task}
                      projectName={project?.name ?? ''}
                      onClick={() => goToTask(task)}
                      onToggle={() => toggleTask(task)}
                    />
                  );
                })
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default function MyTasksPage() {
  return (
      <MyTasksContent />
  );
}
