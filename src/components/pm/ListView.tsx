"use client";

import React, { useMemo, useState } from 'react';
import { useAppState } from '@/lib/store';
import type { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Flag,
  Calendar,
  User,
  MoreHorizontal,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ArrowUpDown,
  Grip,
} from 'lucide-react';

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  todo: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
  in_progress: <Clock className="h-3.5 w-3.5 text-blue-400" />,
  review: <AlertCircle className="h-3.5 w-3.5 text-yellow-400" />,
  done: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
  cancelled: <X className="h-3.5 w-3.5 text-red-400" />,
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  cancelled: 'Cancelled',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  none: 'text-muted-foreground',
  low: 'text-slate-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-500',
};

const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'cancelled'];
const ALL_PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low', 'none'];

interface ListViewProps {
  projectId: string;
  onTaskClick: (taskId: string) => void;
  onAddTask: (status?: TaskStatus) => void;
  filterStatus?: TaskStatus | 'all';
  filterPriority?: TaskPriority | 'all';
  filterAssignee?: string | 'all';
  searchQuery?: string;
  groupBy?: 'status' | 'priority' | 'assignee' | 'none';
}

interface TaskRowProps {
  task: Task;
  depth?: number;
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, depth = 0, onTaskClick, onStatusChange }) => {
  const { users, updateTask, deleteTask } = useAppState();
  const assignee = users.find((u) => u.id === task.assigneeId);
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = task.dueDate && task.status !== 'done' && task.dueDate < today;
  const completedSubs = task.subtasks.filter((s) => s.completed).length;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 border-b hover:bg-muted/20 group cursor-pointer text-sm transition-colors"
      style={{ paddingLeft: `${12 + depth * 20}px` }}
      onClick={() => onTaskClick(task.id)}
    >
      {/* Drag handle (visual) */}
      <Grip className="h-3.5 w-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 shrink-0" />

      {/* Status checkbox */}
      <button
        className="shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done');
        }}
      >
        {STATUS_ICONS[task.status]}
      </button>

      {/* Title */}
      <span className={`flex-1 min-w-0 truncate font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
        {task.title}
      </span>

      {/* Subtask progress */}
      {task.subtasks.length > 0 && (
        <span className="text-xs text-muted-foreground shrink-0">
          {completedSubs}/{task.subtasks.length}
        </span>
      )}

      {/* Tags */}
      {task.tags.slice(0, 2).map((tag) => (
        <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0 h-4 shrink-0">
          {tag}
        </Badge>
      ))}

      {/* Assignee */}
      <div className="shrink-0 w-6" onClick={(e) => e.stopPropagation()}>
        {assignee ? (
          <Avatar className="h-5 w-5">
            <AvatarImage src={assignee.avatarUrl} />
            <AvatarFallback className="text-[9px]">{assignee.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/30 opacity-0 group-hover:opacity-100" />
        )}
      </div>

      {/* Due date */}
      <span className={`text-xs shrink-0 min-w-[70px] text-right ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
        {task.dueDate?.slice(0, 10) ?? ''}
      </span>

      {/* Priority */}
      <div className={`shrink-0 ${PRIORITY_COLORS[task.priority]}`} onClick={(e) => e.stopPropagation()}>
        <Flag className="h-3.5 w-3.5" />
      </div>

      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-sm">
          {ALL_STATUSES.map((s) => (
            <DropdownMenuItem key={s} onClick={() => onStatusChange(task.id, s)}>
              <span className="mr-2">{STATUS_ICONS[s]}</span> {STATUS_LABELS[s]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => deleteTask(task.id)}
          >
            Delete task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface GroupSectionProps {
  title: string;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddTask: () => void;
  color?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
}

const GroupSection: React.FC<GroupSectionProps> = ({
  title, tasks, onTaskClick, onStatusChange, onAddTask, color, icon, defaultOpen = true
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/10 sticky top-0 bg-background/95 backdrop-blur z-10 border-b"
        onClick={() => setOpen((o) => !o)}
      >
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        }
        {icon}
        <span className={`text-sm font-semibold ${color ?? ''}`}>{title}</span>
        <Badge variant="secondary" className="text-xs h-4 px-1.5 ml-1">{tasks.length}</Badge>
      </div>

      {open && (
        <>
          {/* Column headers */}
          {tasks.length === 0 ? (
            <div className="px-10 py-3 text-sm text-muted-foreground">No tasks</div>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
                onStatusChange={onStatusChange}
              />
            ))
          )}
          <div
            className="flex items-center gap-2 px-10 py-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/10"
            onClick={onAddTask}
          >
            <Plus className="h-3.5 w-3.5" /> Add task
          </div>
        </>
      )}
    </div>
  );
};

export const ListView: React.FC<ListViewProps> = ({
  projectId,
  onTaskClick,
  onAddTask,
  filterStatus = 'all',
  filterPriority = 'all',
  filterAssignee = 'all',
  searchQuery = '',
  groupBy = 'status',
}) => {
  const { tasks, users, updateTask } = useAppState();
  const [sortField, setSortField] = useState<'title' | 'dueDate' | 'priority' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const projectTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.projectId === projectId);

    if (filterStatus !== 'all') filtered = filtered.filter((t) => t.status === filterStatus);
    if (filterPriority !== 'all') filtered = filtered.filter((t) => t.priority === filterPriority);
    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') filtered = filtered.filter((t) => !t.assigneeId);
      else filtered = filtered.filter((t) => t.assigneeId === filterAssignee);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      if (sortField === 'title') { aVal = a.title.toLowerCase(); bVal = b.title.toLowerCase(); }
      else if (sortField === 'dueDate') { aVal = a.dueDate ?? '9999'; bVal = b.dueDate ?? '9999'; }
      else if (sortField === 'priority') {
        const order: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
        aVal = order[a.priority]; bVal = order[b.priority];
      }
      else if (sortField === 'createdAt') { aVal = a.createdAt; bVal = b.createdAt; }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, projectId, filterStatus, filterPriority, filterAssignee, searchQuery, sortField, sortDir]);

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, { status });
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  if (groupBy === 'none') {
    return (
      <div className="flex flex-col h-full">
        {/* Column headers */}
        <div className="flex items-center gap-2 px-3 py-2 border-b text-xs font-medium text-muted-foreground bg-muted/20 sticky top-0 z-10">
          <div className="w-5 shrink-0" />
          <div className="w-4 shrink-0" />
          <button className="flex-1 text-left flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('title')}>
            Task name <ArrowUpDown className="h-3 w-3" />
          </button>
          <div className="w-16 text-center">Assignee</div>
          <button className="w-20 text-right flex items-center justify-end gap-1 hover:text-foreground" onClick={() => toggleSort('dueDate')}>
            Due <ArrowUpDown className="h-3 w-3" />
          </button>
          <button className="w-6 flex items-center justify-end hover:text-foreground" onClick={() => toggleSort('priority')}>
            <Flag className="h-3 w-3" />
          </button>
          <div className="w-5" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {projectTasks.map((task) => (
            <TaskRow key={task.id} task={task} onTaskClick={onTaskClick} onStatusChange={handleStatusChange} />
          ))}
          <div
            className="flex items-center gap-2 px-10 py-2.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/10"
            onClick={() => onAddTask()}
          >
            <Plus className="h-3.5 w-3.5" /> Add task
          </div>
        </div>
      </div>
    );
  }

  if (groupBy === 'status') {
    return (
      <div className="overflow-y-auto">
        {/* Column headers */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b text-xs font-medium text-muted-foreground bg-muted/20 sticky top-0 z-20">
          <div className="w-5 shrink-0" />
          <div className="w-4 shrink-0" />
          <div className="flex-1">Task name</div>
          <div className="w-16 text-center">Assignee</div>
          <div className="w-20 text-right">Due</div>
          <div className="w-6 text-right"><Flag className="h-3 w-3 ml-auto" /></div>
          <div className="w-5" />
        </div>
        {ALL_STATUSES.map((status) => {
          const statusTasks = projectTasks.filter((t) => t.status === status);
          if (filterStatus !== 'all' && filterStatus !== status) return null;
          return (
            <GroupSection
              key={status}
              title={STATUS_LABELS[status]}
              tasks={statusTasks}
              onTaskClick={onTaskClick}
              onStatusChange={handleStatusChange}
              onAddTask={() => onAddTask(status)}
              icon={STATUS_ICONS[status]}
              defaultOpen={status !== 'done' && status !== 'cancelled'}
            />
          );
        })}
      </div>
    );
  }

  if (groupBy === 'priority') {
    return (
      <div className="overflow-y-auto">
        {ALL_PRIORITIES.map((priority) => {
          const priorityTasks = projectTasks.filter((t) => t.priority === priority);
          return (
            <GroupSection
              key={priority}
              title={priority === 'none' ? 'No Priority' : priority.charAt(0).toUpperCase() + priority.slice(1)}
              tasks={priorityTasks}
              onTaskClick={onTaskClick}
              onStatusChange={handleStatusChange}
              onAddTask={() => onAddTask()}
              icon={<Flag className={`h-3.5 w-3.5 ${PRIORITY_COLORS[priority]}`} />}
            />
          );
        })}
      </div>
    );
  }

  if (groupBy === 'assignee') {
    const assigneeGroups: { id: string | null; name: string; avatar?: string }[] = [
      ...users.map((u) => ({ id: u.id, name: u.name, avatar: u.avatarUrl })),
      { id: null, name: 'Unassigned' },
    ];
    return (
      <div className="overflow-y-auto">
        {assigneeGroups.map(({ id, name, avatar }) => {
          const assigneeTasks = projectTasks.filter((t) =>
            id === null ? !t.assigneeId : t.assigneeId === id
          );
          return (
            <GroupSection
              key={id ?? 'unassigned'}
              title={name}
              tasks={assigneeTasks}
              onTaskClick={onTaskClick}
              onStatusChange={handleStatusChange}
              onAddTask={() => onAddTask()}
              icon={
                <Avatar className="h-4 w-4">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="text-[8px]">{name.charAt(0)}</AvatarFallback>
                </Avatar>
              }
            />
          );
        })}
      </div>
    );
  }

  return null;
};

export default ListView;
