"use client";

import React, { useMemo, useState } from 'react';
import { useAppState } from '@/lib/store';
import type { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Flag,
  MessageSquare,
  CheckSquare,
  Paperclip,
  Timer,
  MoreHorizontal,
  Calendar,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  GripVertical,
} from 'lucide-react';

const COLUMNS: { status: TaskStatus; label: string; color: string; headerColor: string }[] = [
  { status: 'todo', label: 'To Do', color: 'border-slate-500/30', headerColor: 'bg-slate-500/10 text-slate-400' },
  { status: 'in_progress', label: 'In Progress', color: 'border-blue-500/30', headerColor: 'bg-blue-500/10 text-blue-400' },
  { status: 'review', label: 'Review', color: 'border-yellow-500/30', headerColor: 'bg-yellow-500/10 text-yellow-400' },
  { status: 'done', label: 'Done', color: 'border-green-500/30', headerColor: 'bg-green-500/10 text-green-400' },
];

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  none: { label: 'None', color: 'text-muted-foreground', bg: '' },
  low: { label: 'Low', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  medium: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  urgent: { label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/10' },
};

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onStatusChange, onDelete }) => {
  const { users } = useAppState();
  const assignee = users.find((u) => u.id === task.assigneeId);
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = task.dueDate && task.status !== 'done' && task.dueDate < today;
  const isDueSoon = task.dueDate && task.status !== 'done' && !isOverdue
    && task.dueDate <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const completedSubs = task.subtasks.filter((s) => s.completed).length;
  const totalSubs = task.subtasks.length;
  const pConfig = PRIORITY_CONFIG[task.priority];

  return (
    <div
      className="bg-card border rounded-lg p-3 shadow-sm hover:shadow-md cursor-pointer group transition-all duration-150 hover:translate-y-[-1px] active:translate-y-0"
      onClick={onClick}
    >
      {/* Cover strip for priority */}
      {task.coverColor && (
        <div className="h-1 -mx-3 -mt-3 mb-3 rounded-t-lg" style={{ backgroundColor: task.coverColor }} />
      )}

      {/* Card header */}
      <div className="flex items-start justify-between gap-1.5 mb-2">
        <div className="flex-1 min-w-0">
          {/* Priority + Tags row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {task.priority !== 'none' && (
              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 gap-0.5 ${pConfig.color} ${pConfig.bg}`}>
                <Flag className="h-2.5 w-2.5" /> {pConfig.label}
              </Badge>
            )}
            {task.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <p className={`text-sm font-medium leading-snug ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            {COLUMNS.map((col) => (
              <DropdownMenuItem
                key={col.status}
                onClick={(e) => { e.stopPropagation(); onStatusChange(col.status); }}
              >
                Move to {col.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Subtask progress */}
      {totalSubs > 0 && (
        <div className="mb-2 space-y-0.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckSquare className="h-2.5 w-2.5" />
              {completedSubs}/{totalSubs}
            </span>
            <span>{Math.round((completedSubs / totalSubs) * 100)}%</span>
          </div>
          <Progress value={(completedSubs / totalSubs) * 100} className="h-1" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {task.comments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <MessageSquare className="h-3 w-3" /> {task.comments.length}
            </span>
          )}
          {(task.attachments ?? []).length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <Paperclip className="h-3 w-3" /> {(task.attachments ?? []).length}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <Timer className="h-3 w-3" /> {Math.round(task.estimatedMinutes / 60)}h
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {task.dueDate && (
            <span className={`text-[10px] flex items-center gap-0.5 ${
              isOverdue ? 'text-red-400' : isDueSoon ? 'text-orange-400' : 'text-muted-foreground'
            }`}>
              <Calendar className="h-2.5 w-2.5" />
              {task.dueDate.slice(5)}
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
    </div>
  );
};

interface BoardViewProps {
  projectId: string;
  onTaskClick: (taskId: string) => void;
  onAddTask: (status: TaskStatus) => void;
  searchQuery?: string;
  filterAssignee?: string | 'all';
  filterPriority?: TaskPriority | 'all';
}

export const BoardView: React.FC<BoardViewProps> = ({
  projectId,
  onTaskClick,
  onAddTask,
  searchQuery = '',
  filterAssignee = 'all',
  filterPriority = 'all',
}) => {
  const { tasks, updateTask, deleteTask } = useAppState();

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.projectId === projectId);

    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') filtered = filtered.filter((t) => !t.assigneeId);
      else filtered = filtered.filter((t) => t.assigneeId === filterAssignee);
    }
    if (filterPriority !== 'all') filtered = filtered.filter((t) => t.priority === filterPriority);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [tasks, projectId, filterAssignee, filterPriority, searchQuery]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [], in_progress: [], review: [], done: [], cancelled: [],
    };
    filteredTasks.forEach((t) => {
      map[t.status].push(t);
    });
    return map;
  }, [filteredTasks]);

  return (
    <div className="flex gap-3 p-4 overflow-x-auto h-full pb-6">
      {COLUMNS.map((col) => {
        const colTasks = tasksByStatus[col.status];
        const totalPoints = colTasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0);

        return (
          <div
            key={col.status}
            className={`flex flex-col min-w-[280px] max-w-[280px] border rounded-xl ${col.color} overflow-hidden`}
          >
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2.5 ${col.headerColor} border-b`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{col.label}</span>
                <Badge variant="secondary" className="text-xs h-4 px-1.5">
                  {colTasks.length}
                </Badge>
                {totalPoints > 0 && (
                  <span className="text-[10px] text-muted-foreground">{totalPoints} pts</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => onAddTask(col.status)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {colTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task.id)}
                  onStatusChange={(status) => updateTask(task.id, { status })}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}

              {colTasks.length === 0 && (
                <div
                  className="flex flex-col items-center justify-center py-8 text-muted-foreground/50 cursor-pointer rounded-lg hover:bg-muted/10 transition-colors border border-dashed border-muted/30"
                  onClick={() => onAddTask(col.status)}
                >
                  <Plus className="h-5 w-5 mb-1" />
                  <span className="text-xs">Add task</span>
                </div>
              )}
            </div>

            {/* Add task footer */}
            {colTasks.length > 0 && (
              <button
                className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors border-t"
                onClick={() => onAddTask(col.status)}
              >
                <Plus className="h-3.5 w-3.5" /> Add task
              </button>
            )}
          </div>
        );
      })}

      {/* Cancelled column (collapsed by default) */}
      <div className="flex flex-col min-w-[280px] max-w-[280px] border rounded-xl border-red-500/20 overflow-hidden opacity-60">
        <div className="flex items-center justify-between px-3 py-2.5 bg-red-500/10 text-red-400 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Cancelled</span>
            <Badge variant="secondary" className="text-xs h-4 px-1.5">
              {tasksByStatus.cancelled.length}
            </Badge>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {tasksByStatus.cancelled.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              onStatusChange={(status) => updateTask(task.id, { status })}
              onDelete={() => deleteTask(task.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BoardView;
