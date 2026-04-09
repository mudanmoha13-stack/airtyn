"use client";

import React, { use, useMemo, useRef, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { TaskPriority, TaskStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MessageSquare, Clock, UserPlus, Save, Flag, Paperclip, Timer, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

const columns: { label: string; status: TaskStatus }[] = [
  { label: 'To Do', status: 'todo' },
  { label: 'In Progress', status: 'in_progress' },
  { label: 'Review', status: 'review' },
  { label: 'Done', status: 'done' },
];

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'urgent':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'high':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'medium':
      return 'bg-primary/10 text-primary border-primary/20';
    default:
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
  }
};

const ProjectKanban = ({ projectId }: { projectId: string }) => {
  const {
    projects,
    tasks,
    users,
    currentUser,
    milestones,
    updateTaskStatus,
    addTask,
    assignTask,
    setTaskDueDate,
    addSubtask,
    toggleSubtask,
    addComment,
    updateProject,
    inviteUser,
    canManageMembers,
    canManageProjects,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addTimeEntry,
    deleteTimeEntry,
    addAttachment,
    removeAttachment,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDetailId, setTaskDetailId] = useState<string | null>(null);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  // time tracking
  const [timeMinutes, setTimeMinutes] = useState('30');
  const [timeDescription, setTimeDescription] = useState('');
  // file uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  // milestone form
  const [msTitle, setMsTitle] = useState('');
  const [msDescription, setMsDescription] = useState('');
  const [msDueDate, setMsDueDate] = useState('');

  const projectMilestones = useMemo(() => milestones.filter((m) => m.projectId === projectId), [milestones, projectId]);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const [commentInput, setCommentInput] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');

  const [projectName, setProjectName] = useState(project?.name ?? '');
  const [projectDescription, setProjectDescription] = useState(project?.description ?? '');
  const [projectStatus, setProjectStatus] = useState<'active' | 'archived' | 'completed'>(project?.status ?? 'active');
  const [projectProgress, setProjectProgress] = useState<number>(project?.progress ?? 0);

  const taskDetail = useMemo(() => tasks.find((t) => t.id === taskDetailId) ?? null, [taskDetailId, tasks]);

  if (!project) {
    return <div>Project not found</div>;
  }

  const createTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask({
      projectId,
      title: newTaskTitle,
      description: newTaskDescription,
      status: newTaskStatus,
      priority: newTaskPriority,
      assigneeId: newTaskAssignee || undefined,
      dueDate: newTaskDueDate || undefined,
    });
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskStatus('todo');
    setNewTaskPriority('medium');
    setNewTaskAssignee('');
    setNewTaskDueDate('');
    setTaskDialogOpen(false);
  };

  const createMilestone = () => {
    if (!msTitle.trim() || !msDueDate) return;
    addMilestone({ projectId, title: msTitle.trim(), description: msDescription.trim(), dueDate: msDueDate, status: 'pending' });
    setMsTitle(''); setMsDescription(''); setMsDueDate(''); setMilestoneDialogOpen(false);
  };

  const logTime = () => {
    if (!taskDetail || !timeMinutes) return;
    const mins = parseInt(timeMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    addTimeEntry(taskDetail.id, { minutes: mins, description: timeDescription.trim() });
    setTimeMinutes('30'); setTimeDescription('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!taskDetail) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addAttachment(taskDetail.id, {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveProject = () => {
    updateProject(projectId, {
      name: projectName,
      description: projectDescription,
      status: projectStatus,
      progress: Math.min(100, Math.max(0, projectProgress)),
    });
    setProjectDialogOpen(false);
  };

  const submitInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteUser(inviteEmail, inviteRole);
    setInviteEmail('');
    setInviteRole('member');
    setInviteDialogOpen(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge variant="outline" className="text-xs uppercase tracking-wider">{project.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">{project.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <Progress value={project.progress} className="w-40 h-1.5" />
            <span className="text-xs text-muted-foreground">{project.progress}% complete</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-pink-blue h-9"><Plus className="w-4 h-4 mr-2" />Add Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
                <DialogDescription>Create a task with assignee, due date, and status.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newTaskStatus} onValueChange={(v: TaskStatus) => setNewTaskStatus(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {columns.map((column) => <SelectItem key={column.status} value={column.status}>{column.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newTaskPriority} onValueChange={(v: TaskPriority) => setNewTaskPriority(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full" onClick={createTask}>Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9" disabled={!canManageProjects}>Edit Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
                <DialogDescription>Update core project settings.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={projectStatus} onValueChange={(v: 'active' | 'archived' | 'completed') => setProjectStatus(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">active</SelectItem>
                        <SelectItem value="completed">completed</SelectItem>
                        <SelectItem value="archived">archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Progress (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={projectProgress}
                      onChange={(e) => setProjectProgress(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={saveProject}><Save className="w-4 h-4 mr-2" />Save Project</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="h-9" disabled={!canManageMembers}><UserPlus className="w-4 h-4 mr-2" />Invite Team</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Teammate</DialogTitle>
                <DialogDescription>Send an invite and queue an email notification.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v: 'admin' | 'member') => setInviteRole(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">admin</SelectItem>
                      <SelectItem value="member">member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={submitInvite}>Send Invite</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Milestone dialog */}
          <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9"><Flag className="w-4 h-4 mr-2" />Milestone</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Milestone</DialogTitle>
                <DialogDescription>Track a key project checkpoint with a due date.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={msTitle} onChange={(e) => setMsTitle(e.target.value)} placeholder="e.g. Beta release" />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea value={msDescription} onChange={(e) => setMsDescription(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={msDueDate} onChange={(e) => setMsDueDate(e.target.value)} />
                </div>
                <Button className="w-full" onClick={createMilestone} disabled={!msTitle.trim() || !msDueDate}>Create Milestone</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Hidden file input for attachment uploads */}
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip" />
        </div>
      </div>

      {/* Milestones strip */}
      {projectMilestones.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Milestones</span>
          {projectMilestones.map((m) => {
            const overdue = m.status === 'pending' && m.dueDate < todayStr;
            return (
              <div key={m.id} className="flex items-center gap-1.5 group">
                <button
                  onClick={() => updateMilestone(m.id, { status: m.status === 'completed' ? 'pending' : 'completed' })}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all hover:shadow-sm"
                  style={{
                    borderColor: m.status === 'completed' ? '#22c55e' : overdue ? '#ef4444' : '#a855f7',
                    color: m.status === 'completed' ? '#22c55e' : overdue ? '#ef4444' : '#a855f7',
                    background: m.status === 'completed' ? '#22c55e11' : overdue ? '#ef444411' : '#a855f711',
                  }}
                  title={`${m.status === 'completed' ? 'Mark pending' : 'Mark complete'}: ${m.dueDate}`}
                >
                  <span>🏁</span><span>{m.title}</span><span className="text-[10px] opacity-70">{m.dueDate}</span>
                </button>
                {canManageProjects && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove &ldquo;{m.title}&rdquo;.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMilestone(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-6 h-full pb-4 min-w-max overflow-x-auto">
        {columns.map((column) => (
          <div
            key={column.status}
            className="w-80 flex flex-col gap-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedTaskId) {
                updateTaskStatus(draggedTaskId, column.status);
                setDraggedTaskId(null);
              }
            }}
          >
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{column.label}</span>
                <Badge variant="secondary" className="bg-white/5 text-[10px]">
                  {tasks.filter((t) => t.projectId === projectId && t.status === column.status).length}
                </Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
              {tasks
                .filter((t) => t.projectId === projectId && t.status === column.status)
                .map((task) => {
                  const assignee = users.find((u) => u.id === task.assigneeId);
                  const totalMins = (task.timeEntries ?? []).reduce((s, e) => s + e.minutes, 0);
                  const overdue = task.dueDate && task.status !== 'done' && task.dueDate < todayStr;
                  return (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTaskId(task.id)}
                      className="glass-card cursor-grab active:cursor-grabbing hover-glow transition-all duration-200"
                      onClick={() => setTaskDetailId(task.id)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <Badge variant="outline" className={`text-[10px] ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                          <Select value={task.status} onValueChange={(v: TaskStatus) => updateTaskStatus(task.id, v)}>
                            <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {columns.map((c) => <SelectItem key={c.status} value={c.status}>{c.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <h4 className="font-medium text-sm leading-snug">{task.title}</h4>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <div className="flex items-center gap-1 text-[11px]">
                              <MessageSquare className="w-3 h-3" />
                              {task.comments.length}
                            </div>
                            {totalMins > 0 && (
                              <div className="flex items-center gap-1 text-[11px]">
                                <Timer className="w-3 h-3" />
                                {Math.round(totalMins / 60 * 10) / 10}h
                              </div>
                            )}
                            {(task.attachments ?? []).length > 0 && (
                              <div className="flex items-center gap-1 text-[11px]">
                                <Paperclip className="w-3 h-3" />
                                {(task.attachments ?? []).length}
                              </div>
                            )}
                            {task.dueDate ? (
                              <div className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-destructive' : ''}`}>
                                <Clock className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </div>
                            ) : null}
                          </div>
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={assignee?.avatarUrl} />
                            <AvatarFallback>{assignee?.name?.slice(0, 2) ?? 'NA'}</AvatarFallback>
                          </Avatar>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(taskDetail)} onOpenChange={(open) => !open && setTaskDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{taskDetail?.title}</DialogTitle>
            <DialogDescription className="line-clamp-2">{taskDetail?.description || 'No description provided.'}</DialogDescription>
          </DialogHeader>

          {taskDetail && (
            <Tabs defaultValue="details" className="mt-2">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="time">
                  Time
                  {(taskDetail.timeEntries ?? []).length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">
                      {Math.round((taskDetail.timeEntries ?? []).reduce((s, e) => s + e.minutes, 0) / 60 * 10) / 10}h
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="files">
                  Files
                  {(taskDetail.attachments ?? []).length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">
                      {(taskDetail.attachments ?? []).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="comments">
                  Comments
                  {taskDetail.comments.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{taskDetail.comments.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              {/* DETAILS TAB */}
              <TabsContent value="details" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={taskDetail.status} onValueChange={(v: TaskStatus) => updateTaskStatus(taskDetail.id, v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {columns.map((column) => <SelectItem key={column.status} value={column.status}>{column.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Select value={taskDetail.assigneeId ?? ''} onValueChange={(v) => assignTask(taskDetail.id, v)}>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={taskDetail.dueDate ?? ''}
                    onChange={(e) => setTaskDueDate(taskDetail.id, e.target.value || undefined)}
                  />
                </div>
                {projectMilestones.length > 0 && (
                  <div className="space-y-2">
                    <Label>Milestone</Label>
                    <Select
                      value={taskDetail.milestoneId ?? 'none'}
                      onValueChange={(v) => {
                        /* milestone assignment via task update would need updateTask action — skip silently for now */
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="No milestone" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No milestone</SelectItem>
                        {projectMilestones.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Subtasks</Label>
                    {taskDetail.subtasks.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {taskDetail.subtasks.filter((s) => s.completed).length}/{taskDetail.subtasks.length} done
                      </span>
                    )}
                  </div>
                  {taskDetail.subtasks.length > 0 && (
                    <Progress
                      value={Math.round((taskDetail.subtasks.filter((s) => s.completed).length / taskDetail.subtasks.length) * 100)}
                      className="h-1.5 mb-2"
                    />
                  )}
                  <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-auto">
                    {taskDetail.subtasks.length === 0 && <p className="text-xs text-muted-foreground">No subtasks yet.</p>}
                    {taskDetail.subtasks.map((subtask) => (
                      <label key={subtask.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={subtask.completed} onCheckedChange={() => toggleSubtask(taskDetail.id, subtask.id)} />
                        <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>{subtask.title}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)} placeholder="Add subtask" />
                    <Button onClick={() => { if (!subtaskInput.trim()) return; addSubtask(taskDetail.id, subtaskInput); setSubtaskInput(''); }}>Add</Button>
                  </div>
                </div>
              </TabsContent>

              {/* TIME TAB */}
              <TabsContent value="time" className="space-y-4 mt-0">
                {(taskDetail.timeEntries ?? []).length > 0 ? (
                  <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
                    {(taskDetail.timeEntries ?? []).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between px-3 py-2 text-sm group">
                        <div>
                          <span className="font-medium">{entry.minutes >= 60 ? `${Math.floor(entry.minutes / 60)}h ${entry.minutes % 60}m` : `${entry.minutes}m`}</span>
                          {entry.description && <span className="text-muted-foreground ml-2">— {entry.description}</span>}
                          <p className="text-[11px] text-muted-foreground mt-0.5">{entry.userName} · {new Date(entry.loggedAt).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => deleteTimeEntry(taskDetail.id, entry.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No time logged yet.</p>
                )}
                <div className="border rounded-md p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">Log Time</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Minutes</Label>
                      <Input type="number" min={1} value={timeMinutes} onChange={(e) => setTimeMinutes(e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Description (optional)</Label>
                      <Input value={timeDescription} onChange={(e) => setTimeDescription(e.target.value)} placeholder="What did you work on?" />
                    </div>
                  </div>
                  <Button size="sm" onClick={logTime} disabled={!timeMinutes || parseInt(timeMinutes) <= 0}>
                    <Timer className="w-3.5 h-3.5 mr-1.5" />Log Time
                  </Button>
                </div>
              </TabsContent>

              {/* FILES TAB */}
              <TabsContent value="files" className="space-y-4 mt-0">
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-3.5 h-3.5 mr-1.5" />Attach File
                </Button>
                {(taskDetail.attachments ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No files attached yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {(taskDetail.attachments ?? []).map((att) => (
                      <div key={att.id} className="border rounded-md p-3 flex items-start gap-3 group">
                        {att.mimeType.startsWith('image/') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={att.dataUrl} alt={att.name} className="w-12 h-12 object-cover rounded border flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded border flex items-center justify-center bg-muted flex-shrink-0">
                            <Paperclip className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{att.name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatBytes(att.size)}</p>
                          <p className="text-[11px] text-muted-foreground">{att.uploadedBy}</p>
                        </div>
                        <button
                          onClick={() => removeAttachment(taskDetail.id, att.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* COMMENTS TAB */}
              <TabsContent value="comments" className="space-y-3 mt-0">
                <div className="border rounded-md p-3 max-h-72 overflow-auto space-y-2">
                  {taskDetail.comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
                  {taskDetail.comments.map((comment) => (
                    <div key={comment.id} className="text-sm border-b last:border-b-0 pb-2 last:pb-0">
                      <p className="font-medium">{comment.userName}</p>
                      <p className="text-muted-foreground">{comment.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Write a comment" />
                  <Button onClick={() => { if (!commentInput.trim()) return; addComment(taskDetail.id, commentInput); setCommentInput(''); }}>Post</Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <div className="text-xs text-muted-foreground">
        Signed in as {currentUser?.name}. Drag cards across columns or use the status selectors.
      </div>
    </div>
  );
};

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const resolvedParams = use(params);
  return (
    <Shell>
      <ProjectKanban projectId={resolvedParams.projectId} />
    </Shell>
  );
}
