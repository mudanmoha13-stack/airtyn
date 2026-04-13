"use client";

import React, { useState, useMemo } from 'react';
import { useAppState } from '@/lib/store';
import type { Sprint, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Flag,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Target,
  AlertTriangle,
  CheckSquare,
  Circle,
  Calendar,
  TrendingUp,
  Package,
  Flame,
} from 'lucide-react';
import { formatDistanceToNow, format, differenceInDays, isAfter, isBefore } from 'date-fns';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  completed: { label: 'Completed', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

function daysLeft(endDate: string): number {
  return differenceInDays(new Date(endDate), new Date());
}

function sprintProgress(sprint: Sprint): number {
  const total = differenceInDays(new Date(sprint.endDate), new Date(sprint.startDate));
  const elapsed = differenceInDays(new Date(), new Date(sprint.startDate));
  return Math.max(0, Math.min(100, Math.round((elapsed / Math.max(total, 1)) * 100)));
}

// ─── Create Sprint Dialog ────────────────────────────────────────────────────

interface CreateSprintDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
}

const CreateSprintDialog: React.FC<CreateSprintDialogProps> = ({ open, onClose, projectId }) => {
  const { projects, addSprint } = useAppState();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedProject, setSelectedProject] = useState(projectId ?? '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !selectedProject || !startDate || !endDate) return;
    addSprint({
      projectId: selectedProject,
      name: name.trim(),
      goal: goal.trim() || undefined,
      status: 'planning',
      startDate,
      endDate,
    });
    setName(''); setGoal(''); setStartDate(''); setEndDate('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Sprint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Sprint Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint 1" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Sprint Goal</Label>
            <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What do you want to achieve?" rows={2} className="resize-none text-sm" />
          </div>
          {!projectId && (
            <div className="space-y-1.5">
              <Label>Project *</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.filter(p => p.status === 'active').map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>End Date *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !selectedProject || !startDate || !endDate}>
            Create Sprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Sprint Card ─────────────────────────────────────────────────────────────

interface SprintCardProps {
  sprint: Sprint;
  tasks: Task[];
  projectName: string;
  projectColor?: string;
  onStart: () => void;
  onComplete: () => void;
  onUpdate: (data: Partial<Sprint>) => void;
}

const SprintCard: React.FC<SprintCardProps> = ({
  sprint, tasks, projectName, projectColor, onStart, onComplete, onUpdate,
}) => {
  const [expanded, setExpanded] = useState(sprint.status === 'active');
  const cfg = STATUS_CONFIG[sprint.status];

  const sprintTasks = tasks.filter(t => t.sprintId === sprint.id);
  const doneTasks = sprintTasks.filter(t => t.status === 'done');
  const totalPoints = sprintTasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
  const donePoints = doneTasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
  const completionPct = sprintTasks.length ? Math.round((doneTasks.length / sprintTasks.length) * 100) : 0;
  const timeProgress = sprintProgress(sprint);
  const remaining = daysLeft(sprint.endDate);
  const isOverdue = sprint.status === 'active' && remaining < 0;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${cfg.border} ${sprint.status === 'active' ? 'shadow-md' : ''}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 ${cfg.bg}`}>
        <button onClick={() => setExpanded(e => !e)} className="shrink-0">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{sprint.name}</span>
            <Badge variant="secondary" className={`text-[10px] h-4 px-1.5 ${cfg.color} ${cfg.bg}`}>
              {cfg.label}
            </Badge>
            {sprint.status === 'active' && isOverdue && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Overdue
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              • {projectName}
            </span>
          </div>
          {sprint.goal && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{sprint.goal}</p>
          )}
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
          <span className="flex items-center gap-1">
            <CheckSquare className="h-3 w-3" />
            {doneTasks.length}/{sprintTasks.length}
          </span>
          {totalPoints > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {donePoints}/{totalPoints} pts
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(sprint.startDate), 'MMM d')} – {format(new Date(sprint.endDate), 'MMM d')}
          </span>
          {sprint.status === 'active' && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-medium' : remaining <= 3 ? 'text-orange-400' : ''}`}>
              <Clock className="h-3 w-3" />
              {isOverdue ? `${Math.abs(remaining)}d overdue` : `${remaining}d left`}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {sprint.status === 'planning' && (
            <Button size="sm" className="h-7 text-xs gap-1" onClick={onStart}>
              <Play className="h-3 w-3" /> Start
            </Button>
          )}
          {sprint.status === 'active' && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-400 border-emerald-500/30" onClick={onComplete}>
              <CheckCircle2 className="h-3 w-3" /> Complete
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              {sprint.status === 'planning' && (
                <DropdownMenuItem onClick={onStart}>Start Sprint</DropdownMenuItem>
              )}
              {sprint.status === 'active' && (
                <DropdownMenuItem onClick={onComplete}>Complete Sprint</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onUpdate({ status: 'cancelled' })}
              >
                Cancel Sprint
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress bars (always visible) */}
      <div className="px-4 py-2 border-t border-dashed border-muted/30 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Task completion</span>
            <span>{completionPct}%</span>
          </div>
          <Progress value={completionPct} className="h-1.5" />
        </div>
        {sprint.status === 'active' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Time elapsed</span>
              <span>{timeProgress}%</span>
            </div>
            <Progress
              value={timeProgress}
              className={`h-1.5 ${timeProgress > completionPct + 20 ? '[&>div]:bg-red-400' : timeProgress > completionPct ? '[&>div]:bg-orange-400' : '[&>div]:bg-emerald-400'}`}
            />
          </div>
        )}
      </div>

      {/* Task list (expanded) */}
      {expanded && (
        <div className="divide-y divide-muted/20">
          {sprintTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground/50">
              No tasks in this sprint yet
            </div>
          ) : (
            sprintTasks.map((task) => (
              <SprintTaskRow key={task.id} task={task} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Sprint Task Row ─────────────────────────────────────────────────────────

const SprintTaskRow: React.FC<{ task: Task }> = ({ task }) => {
  const { users, updateTask } = useAppState();
  const assignee = users.find(u => u.id === task.assigneeId);
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = task.dueDate && task.status !== 'done' && task.dueDate < today;

  const STATUS_ICONS = {
    todo: <Circle className="h-3.5 w-3.5 text-slate-400" />,
    in_progress: <Clock className="h-3.5 w-3.5 text-blue-400" />,
    review: <Flag className="h-3.5 w-3.5 text-yellow-400" />,
    done: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
    cancelled: <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />,
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-muted/20 transition-colors group">
      <button
        onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
        className="shrink-0"
      >
        {STATUS_ICONS[task.status]}
      </button>

      <span className={`flex-1 text-sm truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
        {task.title}
      </span>

      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        {task.storyPoints != null && task.storyPoints > 0 && (
          <span className="flex items-center gap-0.5">
            <Package className="h-3 w-3" />{task.storyPoints}
          </span>
        )}
        {task.dueDate && (
          <span className={isOverdue ? 'text-red-400' : ''}>
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
        {assignee && (
          <Avatar className="h-5 w-5">
            <AvatarImage src={assignee.avatarUrl} />
            <AvatarFallback className="text-[8px]">{assignee.name.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};

// ─── Velocity Chart (simple SVG) ────────────────────────────────────────────

const VelocityChart: React.FC<{ sprints: Sprint[] }> = ({ sprints }) => {
  const completedSprints = sprints.filter(s => s.status === 'completed').slice(-6);
  if (completedSprints.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/50">
        No completed sprints yet
      </div>
    );
  }

  const maxPoints = Math.max(...completedSprints.map(s => s.completedPoints ?? 0), 1);
  const chartH = 80;
  const barW = 32;
  const gap = 12;
  const totalW = completedSprints.length * (barW + gap);

  return (
    <svg width="100%" height={chartH + 20} viewBox={`0 0 ${totalW} ${chartH + 20}`} preserveAspectRatio="xMidYMid meet">
      {completedSprints.map((s, i) => {
        const points = s.completedPoints ?? 0;
        const barH = Math.round((points / maxPoints) * chartH);
        const x = i * (barW + gap);
        const y = chartH - barH;
        return (
          <g key={s.id}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill="hsl(var(--primary))" opacity={0.7} />
            <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))">
              {s.name.replace('Sprint ', 'S')}
            </text>
            {points > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={9} fill="hsl(var(--foreground))" fontWeight="600">
                {points}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

function SprintsPage() {
  const { sprints, projects, tasks, startSprint, completeSprint, updateSprint } = useAppState();
  const [createOpen, setCreateOpen] = useState(false);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredSprints = useMemo(() => {
    let s = [...sprints];
    if (filterProject !== 'all') s = s.filter(sp => sp.projectId === filterProject);
    if (filterStatus !== 'all') s = s.filter(sp => sp.status === filterStatus);
    // Sort: active first, then planning, then completed, then cancelled
    const order = { active: 0, planning: 1, completed: 2, cancelled: 3 };
    return s.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [sprints, filterProject, filterStatus]);

  const activeSprints = sprints.filter(s => s.status === 'active');
  const planningSprints = sprints.filter(s => s.status === 'planning');
  const completedSprints = sprints.filter(s => s.status === 'completed');
  const totalVelocity = completedSprints.reduce((s, sp) => s + (sp.completedPoints ?? 0), 0);
  const avgVelocity = completedSprints.length ? Math.round(totalVelocity / completedSprints.length) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Sprints</h1>
            <p className="text-xs text-muted-foreground">Plan and track agile sprints across all projects</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Sprint
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Sprints', value: activeSprints.length, icon: <Zap className="h-4 w-4 text-emerald-400" />, color: 'text-emerald-400' },
            { label: 'In Planning', value: planningSprints.length, icon: <Clock className="h-4 w-4 text-blue-400" />, color: 'text-blue-400' },
            { label: 'Completed', value: completedSprints.length, icon: <CheckCircle2 className="h-4 w-4 text-slate-400" />, color: 'text-slate-400' },
            { label: 'Avg Velocity', value: avgVelocity ? `${avgVelocity} pts` : '—', icon: <TrendingUp className="h-4 w-4 text-purple-400" />, color: 'text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border rounded-xl p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div>
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Velocity chart */}
        {completedSprints.length > 0 && (
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Velocity Chart</span>
              <span className="text-xs text-muted-foreground ml-1">(last 6 completed sprints)</span>
            </div>
            <VelocityChart sprints={sprints} />
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-1">
            {filteredSprints.length} sprint{filteredSprints.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Sprint list */}
        {filteredSprints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Zap className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">No sprints found</p>
            <p className="text-xs mt-1 opacity-60">Create a sprint to start planning your work</p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New Sprint
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSprints.map((sprint) => {
              const project = projects.find(p => p.id === sprint.projectId);
              return (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  tasks={tasks}
                  projectName={project?.name ?? 'Unknown Project'}
                  projectColor={project?.color}
                  onStart={() => startSprint(sprint.id)}
                  onComplete={() => completeSprint(sprint.id)}
                  onUpdate={(data) => updateSprint(sprint.id, data)}
                />
              );
            })}
          </div>
        )}
      </div>

      <CreateSprintDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

export default function SprintsPageWrapper() {
  return (
      <SprintsPage />
  );
}
