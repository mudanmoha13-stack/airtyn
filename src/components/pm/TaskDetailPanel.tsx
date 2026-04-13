"use client";

import React, { useState, useRef } from 'react';
import { useAppState } from '@/lib/store';
import type { Task, TaskPriority, TaskStatus, Subtask } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  X,
  User,
  Calendar,
  Flag,
  Clock,
  MessageSquare,
  CheckSquare,
  Paperclip,
  Timer,
  Plus,
  Trash2,
  Edit3,
  AlignLeft,
  Tag,
  Link2,
  AlertCircle,
  CheckCircle2,
  Circle,
} from 'lucide-react';

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'todo', label: 'To Do', icon: <Circle className="h-3 w-3 text-muted-foreground" /> },
  { value: 'in_progress', label: 'In Progress', icon: <Clock className="h-3 w-3 text-blue-500" /> },
  { value: 'review', label: 'Review', icon: <AlertCircle className="h-3 w-3 text-yellow-500" /> },
  { value: 'done', label: 'Done', icon: <CheckCircle2 className="h-3 w-3 text-green-500" /> },
  { value: 'cancelled', label: 'Cancelled', icon: <X className="h-3 w-3 text-red-500" /> },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'none', label: 'No priority', color: 'text-muted-foreground' },
  { value: 'low', label: 'Low', color: 'text-slate-400' },
  { value: 'medium', label: 'Medium', color: 'text-blue-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-500/20 text-blue-400',
  review: 'bg-yellow-500/20 text-yellow-400',
  done: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  none: 'bg-muted text-muted-foreground',
  low: 'bg-slate-500/20 text-slate-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400',
};

interface TaskDetailPanelProps {
  taskId: string | null;
  onClose: () => void;
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ taskId, onClose }) => {
  const {
    tasks,
    users,
    projects,
    currentUser,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    addComment,
    addTimeEntry,
    deleteTimeEntry,
    addAttachment,
    removeAttachment,
  } = useAppState();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newTimeMinutes, setNewTimeMinutes] = useState('');
  const [newTimeDesc, setNewTimeDesc] = useState('');
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const task = tasks.find((t) => t.id === taskId);

  if (!task) return null;

  const project = projects.find((p) => p.id === task.projectId);
  const assignee = users.find((u) => u.id === task.assigneeId);
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const subtaskProgress = task.subtasks.length > 0
    ? Math.round((completedSubtasks / task.subtasks.length) * 100)
    : 0;
  const totalLoggedMinutes = (task.timeEntries ?? []).reduce((sum, e) => sum + e.minutes, 0);

  const handleTitleSave = () => {
    if (titleDraft.trim()) {
      updateTask(task.id, { title: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  const handleDescSave = () => {
    updateTask(task.id, { description: descDraft });
    setEditingDescription(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    addSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(task.id, newComment.trim());
    setNewComment('');
  };

  const handleLogTime = () => {
    const mins = parseInt(newTimeMinutes, 10);
    if (!mins || mins <= 0) return;
    addTimeEntry(task.id, { minutes: mins, description: newTimeDesc || 'Time logged' });
    setNewTimeMinutes('');
    setNewTimeDesc('');
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag || (task.tags ?? []).includes(tag)) return;
    updateTask(task.id, { tags: [...(task.tags ?? []), tag] });
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    updateTask(task.id, { tags: (task.tags ?? []).filter((t) => t !== tag) });
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addAttachment(task.id, {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const isOverdue = task.dueDate && task.status !== 'done'
    ? task.dueDate < new Date().toISOString().slice(0, 10)
    : false;

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-6 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={STATUS_COLORS[task.status]} variant="secondary">
                  {STATUS_OPTIONS.find((s) => s.value === task.status)?.label}
                </Badge>
                <Badge className={PRIORITY_COLORS[task.priority]} variant="secondary">
                  <Flag className="h-3 w-3 mr-1" />
                  {PRIORITY_OPTIONS.find((p) => p.value === task.priority)?.label}
                </Badge>
                {project && (
                  <Badge variant="outline" className="text-xs">
                    {project.name}
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">Overdue</Badge>
                )}
              </div>
              {editingTitle ? (
                <div className="flex gap-2">
                  <Input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false); }}
                    className="text-lg font-semibold"
                    autoFocus
                  />
                </div>
              ) : (
                <SheetTitle
                  className="text-lg font-semibold cursor-pointer hover:text-primary/80 transition-colors text-left pr-8"
                  onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
                >
                  {task.title}
                  <Edit3 className="inline h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-100" />
                </SheetTitle>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mt-1">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[1fr_auto] gap-0 h-full">
            {/* Main area */}
            <div className="overflow-y-auto border-r">
              <Tabs defaultValue="overview" className="h-full">
                <TabsList className="w-full justify-start rounded-none border-b px-4 h-10 bg-transparent">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="subtasks" className="text-xs">
                    Subtasks {task.subtasks.length > 0 && <span className="ml-1 text-muted-foreground">({completedSubtasks}/{task.subtasks.length})</span>}
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="text-xs">
                    Comments {task.comments.length > 0 && <span className="ml-1 text-muted-foreground">({task.comments.length})</span>}
                  </TabsTrigger>
                  <TabsTrigger value="time" className="text-xs">
                    Time {totalLoggedMinutes > 0 && <span className="ml-1 text-muted-foreground">({formatMinutes(totalLoggedMinutes)})</span>}
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="text-xs">
                    Files {(task.attachments ?? []).length > 0 && <span className="ml-1 text-muted-foreground">({(task.attachments ?? []).length})</span>}
                  </TabsTrigger>
                </TabsList>

                {/* Overview tab */}
                <TabsContent value="overview" className="mt-0 p-4 space-y-4">
                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <AlignLeft className="h-3 w-3" /> Description
                    </Label>
                    {editingDescription ? (
                      <div className="space-y-2">
                        <Textarea
                          value={descDraft}
                          onChange={(e) => setDescDraft(e.target.value)}
                          rows={5}
                          className="resize-none text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleDescSave}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingDescription(false)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="text-sm text-muted-foreground min-h-[60px] p-3 rounded-md border border-transparent hover:border-border hover:bg-muted/30 cursor-text transition-colors"
                        onClick={() => { setDescDraft(task.description ?? ''); setEditingDescription(true); }}
                      >
                        {task.description || <span className="italic">Click to add description…</span>}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Tag className="h-3 w-3" /> Tags
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(task.tags ?? []).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs gap-1 cursor-pointer hover:opacity-80" onClick={() => handleRemoveTag(tag)}>
                          {tag} <X className="h-2.5 w-2.5" />
                        </Badge>
                      ))}
                      <div className="flex gap-1">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
                          placeholder="Add tag…"
                          className="h-6 text-xs w-24 px-2"
                        />
                        {newTag && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddTag}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Story points / estimates */}
                  {task.estimatedMinutes !== undefined && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Estimate vs Logged</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <span>{formatMinutes(task.estimatedMinutes)}</span>
                        <span className="text-muted-foreground">estimated</span>
                        <span className="mx-1 text-muted-foreground">·</span>
                        <span className={totalLoggedMinutes > (task.estimatedMinutes ?? 0) ? 'text-red-400' : ''}>
                          {formatMinutes(totalLoggedMinutes)}
                        </span>
                        <span className="text-muted-foreground">logged</span>
                      </div>
                      <Progress
                        value={task.estimatedMinutes > 0 ? Math.min(100, (totalLoggedMinutes / task.estimatedMinutes) * 100) : 0}
                        className="h-1.5"
                      />
                    </div>
                  )}
                </TabsContent>

                {/* Subtasks tab */}
                <TabsContent value="subtasks" className="mt-0 p-4 space-y-3">
                  {task.subtasks.length > 0 && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{completedSubtasks}/{task.subtasks.length} completed</span>
                      <Progress value={subtaskProgress} className="w-24 h-1.5" />
                    </div>
                  )}
                  <div className="space-y-1">
                    {task.subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-muted/30 group">
                        <Checkbox
                          checked={sub.completed}
                          onCheckedChange={() => toggleSubtask(task.id, sub.id)}
                          className="h-3.5 w-3.5"
                        />
                        <span className={`text-sm flex-1 ${sub.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(); }}
                      placeholder="Add a subtask…"
                      className="h-8 text-sm"
                    />
                    <Button size="sm" onClick={handleAddSubtask} disabled={!newSubtask.trim()}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TabsContent>

                {/* Comments tab */}
                <TabsContent value="comments" className="mt-0 p-4 space-y-4">
                  <div className="space-y-4">
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                          <AvatarImage src={comment.userAvatar} />
                          <AvatarFallback className="text-xs">{comment.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {currentUser && (
                    <div className="flex gap-2 pt-2">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={currentUser.avatarUrl} />
                        <AvatarFallback className="text-xs">{currentUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment…"
                          className="text-sm resize-none"
                          rows={3}
                        />
                        <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Comment
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Time tracking tab */}
                <TabsContent value="time" className="mt-0 p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3 text-center">
                      <div className="text-lg font-bold">{formatMinutes(totalLoggedMinutes)}</div>
                      <div className="text-xs text-muted-foreground">Total logged</div>
                    </div>
                    {task.estimatedMinutes && (
                      <div className="rounded-lg border p-3 text-center">
                        <div className="text-lg font-bold">{formatMinutes(task.estimatedMinutes)}</div>
                        <div className="text-xs text-muted-foreground">Estimated</div>
                      </div>
                    )}
                    {task.estimatedMinutes && (
                      <div className={`rounded-lg border p-3 text-center ${totalLoggedMinutes > task.estimatedMinutes ? 'border-red-500/30' : ''}`}>
                        <div className={`text-lg font-bold ${totalLoggedMinutes > task.estimatedMinutes ? 'text-red-400' : 'text-green-400'}`}>
                          {totalLoggedMinutes > task.estimatedMinutes
                            ? `+${formatMinutes(totalLoggedMinutes - task.estimatedMinutes)}`
                            : `-${formatMinutes(task.estimatedMinutes - totalLoggedMinutes)}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {totalLoggedMinutes > task.estimatedMinutes ? 'Over' : 'Under'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time entries list */}
                  <div className="space-y-2">
                    {(task.timeEntries ?? []).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between gap-2 p-2 rounded-md border hover:bg-muted/20 group">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Timer className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{formatMinutes(entry.minutes)}</div>
                            <div className="text-xs text-muted-foreground truncate">{entry.description} · {entry.userName}</div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteTimeEntry(task.id, entry.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Log time form */}
                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-xs text-muted-foreground">Log Time</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={newTimeMinutes}
                        onChange={(e) => setNewTimeMinutes(e.target.value)}
                        placeholder="Minutes"
                        className="h-8 text-sm w-24"
                      />
                      <Input
                        value={newTimeDesc}
                        onChange={(e) => setNewTimeDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="h-8 text-sm flex-1"
                      />
                      <Button size="sm" onClick={handleLogTime}>Log</Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Attachments tab */}
                <TabsContent value="attachments" className="mt-0 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(task.attachments ?? []).map((att) => (
                      <div key={att.id} className="group relative rounded-lg border p-2.5 hover:bg-muted/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{att.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {(att.size / 1024).toFixed(1)} KB · {att.uploadedBy}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
                          onClick={() => removeAttachment(task.id, att.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileAttach}
                  />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-3.5 w-3.5 mr-1.5" /> Attach File
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar properties */}
            <div className="w-52 overflow-y-auto p-4 space-y-5 text-sm shrink-0">
              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={task.status} onValueChange={(v) => updateTask(task.id, { status: v as TaskStatus })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          {s.icon} {s.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select value={task.priority} onValueChange={(v) => updateTask(task.id, { priority: v as TaskPriority })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-xs">
                        <span className={p.color}><Flag className="inline h-3 w-3 mr-1" />{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Assignee</Label>
                <Select
                  value={task.assigneeId ?? 'unassigned'}
                  onValueChange={(v) => updateTask(task.id, { assigneeId: v === 'unassigned' ? undefined : v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned" className="text-xs">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs">
                        <div className="flex items-center gap-1.5">
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

              {/* Due Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <Input
                  type="date"
                  value={task.dueDate ?? ''}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value || undefined })}
                  className={`h-8 text-xs ${isOverdue ? 'border-red-500/50 text-red-400' : ''}`}
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  type="date"
                  value={task.startDate ?? ''}
                  onChange={(e) => updateTask(task.id, { startDate: e.target.value || undefined })}
                  className="h-8 text-xs"
                />
              </div>

              {/* Story Points */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Story Points</Label>
                <Input
                  type="number"
                  value={task.storyPoints ?? ''}
                  onChange={(e) => updateTask(task.id, { storyPoints: parseInt(e.target.value, 10) || undefined })}
                  placeholder="0"
                  className="h-8 text-xs"
                  min={0}
                />
              </div>

              {/* Estimate */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Estimate (minutes)</Label>
                <Input
                  type="number"
                  value={task.estimatedMinutes ?? ''}
                  onChange={(e) => updateTask(task.id, { estimatedMinutes: parseInt(e.target.value, 10) || undefined })}
                  placeholder="e.g. 120"
                  className="h-8 text-xs"
                  min={0}
                />
              </div>

              <Separator />

              {/* Metadata */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>Created: {new Date(task.createdAt).toLocaleDateString()}</div>
                {task.updatedAt && <div>Updated: {new Date(task.updatedAt).toLocaleDateString()}</div>}
              </div>

              <Separator />

              {/* Delete */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  deleteTask(task.id);
                  onClose();
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Task
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailPanel;
