"use client";

import React, { useState, useMemo } from 'react';
import { useAppState } from '@/lib/store';
import type { Goal, KeyResult, GoalStatus } from '@/lib/types';
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
  Target,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Edit3,
  Trash2,
  BarChart3,
  Users,
  Calendar,
  Flag,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  on_track: {
    label: 'On Track',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: <TrendingUp className="h-3.5 w-3.5" />,
  },
  at_risk: {
    label: 'At Risk',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  off_track: {
    label: 'Off Track',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: <TrendingDown className="h-3.5 w-3.5" />,
  },
  completed: {
    label: 'Completed',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  draft: {
    label: 'Draft',
    color: 'text-muted-foreground',
    bg: 'bg-muted/30',
    border: 'border-muted/30',
    icon: <Circle className="h-3.5 w-3.5" />,
  },
};

const GOAL_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

// ─── Key Result Row ───────────────────────────────────────────────────────────

const KeyResultRow: React.FC<{
  kr: KeyResult;
  goalId: string;
}> = ({ kr, goalId }) => {
  const { updateKeyResult } = useAppState();
  const [editing, setEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(String(kr.currentValue));

  const handleSave = () => {
    const val = parseFloat(currentVal);
    if (!isNaN(val)) {
      const progress = kr.targetValue !== kr.startValue
        ? Math.round(Math.max(0, Math.min(100, ((val - kr.startValue) / (kr.targetValue - kr.startValue)) * 100)))
        : val >= kr.targetValue ? 100 : 0;
      updateKeyResult(goalId, kr.id, val);
    }
    setEditing(false);
  };

  const formatValue = (v: number) => {
    if (kr.type === 'percentage') return `${v}%`;
    if (kr.type === 'currency') return `$${v.toLocaleString()}`;
    if (kr.type === 'boolean') return v >= 1 ? 'Done' : 'Not done';
    return `${v}${kr.unit ? ` ${kr.unit}` : ''}`;
  };

  return (
    <div className="flex items-center gap-3 py-2 group">
      {/* Progress circle indicator */}
      <div className="shrink-0 relative h-7 w-7">
        <svg className="h-7 w-7 -rotate-90" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="11" strokeWidth="2.5" stroke="hsl(var(--muted))" fill="none" />
          <circle
            cx="14" cy="14" r="11"
            strokeWidth="2.5"
            stroke={kr.progress >= 100 ? 'hsl(142 71% 45%)' : kr.progress >= 70 ? 'hsl(217 91% 60%)' : kr.progress >= 40 ? 'hsl(48 96% 53%)' : 'hsl(0 84% 60%)'}
            fill="none"
            strokeDasharray={`${2 * Math.PI * 11}`}
            strokeDashoffset={`${2 * Math.PI * 11 * (1 - kr.progress / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
          {kr.progress}%
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{kr.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">
            {formatValue(kr.startValue)} → <span className="font-semibold text-foreground">{formatValue(kr.currentValue)}</span> / {formatValue(kr.targetValue)}
          </span>
        </div>
      </div>

      {/* Edit current value */}
      {editing ? (
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            value={currentVal}
            onChange={(e) => setCurrentVal(e.target.value)}
            className="h-6 w-20 text-xs px-2"
            onBlur={handleSave}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
          />
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity px-2"
          onClick={() => setEditing(true)}
        >
          Update
        </Button>
      )}
    </div>
  );
};

// ─── Goal Card ────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete }) => {
  const { users } = useAppState();
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[goal.status];
  const owner = users.find((u) => u.id === goal.ownerId);
  const daysRemaining = differenceInDays(new Date(goal.dueDate), new Date());
  const isOverdue = goal.status !== 'completed' && daysRemaining < 0;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${cfg.border}`}>
      {/* Color strip */}
      {goal.color && (
        <div className="h-1" style={{ backgroundColor: goal.color }} />
      )}

      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <button onClick={() => setExpanded(e => !e)} className="shrink-0 mt-0.5">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold">{goal.title}</span>
            <Badge variant="secondary" className={`text-[10px] h-4 px-1.5 gap-0.5 ${cfg.color} ${cfg.bg}`}>
              {cfg.icon} {cfg.label}
            </Badge>
          </div>
          {goal.description && (
            <p className="text-xs text-muted-foreground truncate mb-2">{goal.description}</p>
          )}

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{goal.keyResults.length} Key Result{goal.keyResults.length !== 1 ? 's' : ''}</span>
              <span className="font-semibold">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>
        </div>

        {/* Meta */}
        <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0 text-xs text-muted-foreground">
          {owner && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={owner.avatarUrl} />
                <AvatarFallback className="text-[8px]">{owner.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{owner.name}</span>
            </div>
          )}
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : daysRemaining <= 7 ? 'text-orange-400' : ''}`}>
            <Calendar className="h-3 w-3" />
            {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : daysRemaining === 0 ? 'Due today' : `${daysRemaining}d left`}
          </span>
          <span className="text-[10px]">{format(new Date(goal.startDate), 'MMM d')} – {format(new Date(goal.dueDate), 'MMM d, yyyy')}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={onEdit}>
              <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit Goal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Key Results */}
      {expanded && goal.keyResults.length > 0 && (
        <div className="border-t px-4 py-2 divide-y divide-muted/20">
          {goal.keyResults.map((kr) => (
            <KeyResultRow key={kr.id} kr={kr} goalId={goal.id} />
          ))}
        </div>
      )}

      {expanded && goal.keyResults.length === 0 && (
        <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground/50">
          No key results yet
        </div>
      )}
    </div>
  );
};

// ─── Create / Edit Goal Dialog ────────────────────────────────────────────────

interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  existing?: Goal;
}

const GoalDialog: React.FC<GoalDialogProps> = ({ open, onClose, existing }) => {
  const { users, currentUser, addGoal, updateGoal } = useAppState();
  const isEdit = !!existing;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [status, setStatus] = useState<GoalStatus>(existing?.status ?? 'draft');
  const [ownerId, setOwnerId] = useState(existing?.ownerId ?? currentUser?.id ?? '');
  const [startDate, setStartDate] = useState(existing?.startDate ?? '');
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? '');
  const [color, setColor] = useState(existing?.color ?? GOAL_COLORS[0]);
  const [krs, setKrs] = useState<Omit<KeyResult, 'id' | 'goalId' | 'createdAt'>[]>(
    existing?.keyResults.map(kr => ({
      title: kr.title,
      type: kr.type,
      startValue: kr.startValue,
      targetValue: kr.targetValue,
      currentValue: kr.currentValue,
      unit: kr.unit,
      progress: kr.progress,
    })) ?? [{ title: '', type: 'percentage', startValue: 0, targetValue: 100, currentValue: 0, unit: undefined, progress: 0 }]
  );

  const addKR = () => {
    setKrs(prev => [...prev, { title: '', type: 'percentage', startValue: 0, targetValue: 100, currentValue: 0, progress: 0 }]);
  };

  const removeKR = (i: number) => setKrs(prev => prev.filter((_, idx) => idx !== i));
  const updateKR = (i: number, field: string, value: string | number) => {
    setKrs(prev => prev.map((kr, idx) => idx === i ? { ...kr, [field]: value } : kr));
  };

  const handleSubmit = () => {
    if (!title.trim() || !startDate || !dueDate) return;
    const validKrs = krs.filter(kr => kr.title.trim());
    if (isEdit && existing) {
      updateGoal(existing.id, { title: title.trim(), description, status, ownerId, startDate, dueDate, color });
    } else {
      const fullKrs: KeyResult[] = validKrs.map((kr, i) => ({
        ...kr,
        id: `kr-${Date.now()}-${i}`,
        goalId: '',            // will be overwritten in addGoal spread
        createdAt: new Date().toISOString(),
      }));
      addGoal({
        title: title.trim(),
        description,
        status,
        progress: 0,
        ownerId,
        startDate,
        dueDate,
        color,
        keyResults: fullKrs,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Goal Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Increase monthly revenue by 30%" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why is this goal important?" rows={2} className="resize-none text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as GoalStatus)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={u.avatarUrl} />
                          <AvatarFallback className="text-[8px]">{u.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {u.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date *</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9" />
            </div>
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Key Results */}
          {!isEdit && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Key Results</Label>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addKR}>
                  <Plus className="h-3 w-3 mr-1" /> Add KR
                </Button>
              </div>
              <div className="space-y-2">
                {krs.map((kr, i) => (
                  <div key={i} className="border rounded-lg p-2.5 space-y-2 bg-muted/10">
                    <div className="flex items-center gap-1">
                      <Input
                        value={kr.title}
                        onChange={(e) => updateKR(i, 'title', e.target.value)}
                        placeholder={`Key result ${i + 1}`}
                        className="h-7 text-xs flex-1"
                      />
                      {krs.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" onClick={() => removeKR(i)}>
                          ×
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <Select value={kr.type} onValueChange={(v) => updateKR(i, 'type', v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" placeholder="Start" value={kr.startValue} onChange={(e) => updateKR(i, 'startValue', parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
                      <Input type="number" placeholder="Target" value={kr.targetValue} onChange={(e) => updateKR(i, 'targetValue', parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !startDate || !dueDate}>
            {isEdit ? 'Save Changes' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function GoalsPage() {
  const { goals, deleteGoal } = useAppState();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredGoals = useMemo(() => {
    let g = [...goals];
    if (filterStatus !== 'all') g = g.filter((goal) => goal.status === filterStatus);
    const order: Record<GoalStatus, number> = { on_track: 0, at_risk: 1, off_track: 2, draft: 3, completed: 4 };
    return g.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }, [goals, filterStatus]);

  const stats = useMemo(() => {
    const onTrack = goals.filter(g => g.status === 'on_track').length;
    const atRisk = goals.filter(g => g.status === 'at_risk').length;
    const offTrack = goals.filter(g => g.status === 'off_track').length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const avgProgress = goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;
    return { onTrack, atRisk, offTrack, completed, avgProgress };
  }, [goals]);

  const openCreate = () => { setEditingGoal(undefined); setDialogOpen(true); };
  const openEdit = (goal: Goal) => { setEditingGoal(goal); setDialogOpen(true); };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Goals & OKRs</h1>
            <p className="text-xs text-muted-foreground">Track objectives and key results across your organization</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Goal
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'On Track', value: stats.onTrack, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'At Risk', value: stats.atRisk, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { label: 'Off Track', value: stats.offTrack, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Completed', value: stats.completed, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Avg Progress', value: `${stats.avgProgress}%`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border rounded-xl p-3 text-center">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Overall progress */}
        {goals.length > 0 && (
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Overall Goal Progress</span>
              </div>
              <span className="text-sm font-bold">{stats.avgProgress}%</span>
            </div>
            <Progress value={stats.avgProgress} className="h-3" />
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" /> On Track ({stats.onTrack})</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400 inline-block" /> At Risk ({stats.atRisk})</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" /> Off Track ({stats.offTrack})</span>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2">
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
            {filteredGoals.length} goal{filteredGoals.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Goal list */}
        {filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Target className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">No goals found</p>
            <p className="text-xs mt-1 opacity-60">Create your first goal to start tracking OKRs</p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => openEdit(goal)}
                onDelete={() => deleteGoal(goal.id)}
              />
            ))}
          </div>
        )}
      </div>

      <GoalDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingGoal(undefined); }}
        existing={editingGoal}
      />
    </div>
  );
}

export default function GoalsPageWrapper() {
  return (
      <GoalsPage />
  );
}
