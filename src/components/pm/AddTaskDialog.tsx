"use client";

import React, { useState } from 'react';
import { useAppState } from '@/lib/store';
import type { TaskPriority, TaskStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flag } from 'lucide-react';

interface AddTaskDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  defaultStatus?: TaskStatus;
  defaultListId?: string;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'none', label: 'No priority', color: 'text-muted-foreground' },
  { value: 'low', label: 'Low', color: 'text-slate-400' },
  { value: 'medium', label: 'Medium', color: 'text-blue-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
];

export const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  open,
  onClose,
  projectId,
  defaultStatus = 'todo',
  defaultListId,
}) => {
  const { addTask, users, currentUser } = useAppState();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [tags, setTags] = useState('');
  const [storyPoints, setStoryPoints] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    addTask({
      projectId,
      listId: defaultListId,
      title: title.trim(),
      description,
      status,
      priority,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate || undefined,
      startDate: startDate || undefined,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
      storyPoints: storyPoints ? parseInt(storyPoints, 10) : undefined,
    });

    // Reset
    setTitle('');
    setDescription('');
    setStatus(defaultStatus);
    setPriority('medium');
    setAssigneeId('');
    setDueDate('');
    setStartDate('');
    setEstimatedMinutes('');
    setTags('');
    setStoryPoints('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Task name *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task name…"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details…"
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className={p.color}>
                        <Flag className="inline h-3 w-3 mr-1" />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <Select value={assigneeId || 'unassigned'} onValueChange={(v) => setAssigneeId(v === 'unassigned' ? '' : v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={u.avatarUrl} />
                        <AvatarFallback className="text-[9px]">{u.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {u.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9" />
            </div>
          </div>

          {/* Estimate + Story points */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Estimate (minutes)</Label>
              <Input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="e.g. 60"
                className="h-9"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Story Points</Label>
              <Input
                type="number"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                placeholder="e.g. 3"
                className="h-9"
                min={0}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
