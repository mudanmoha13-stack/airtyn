"use client";

import React, { useState, useMemo } from 'react';
import { useAppState } from '@/lib/store';
import type { Project } from '@/lib/types';
import { useRouter } from 'next/navigation';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderKanban,
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Archive,
  PauseCircle,
  ArrowRight,
  LayoutGrid,
  List,
  Calendar,
  Users,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <Clock className="h-3 w-3" /> },
  completed: { label: 'Completed', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <CheckCircle2 className="h-3 w-3" /> },
  on_hold: { label: 'On Hold', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: <PauseCircle className="h-3 w-3" /> },
  archived: { label: 'Archived', color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-muted/30', icon: <Archive className="h-3 w-3" /> },
};

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#84cc16', '#a855f7',
];

// ─── Create Project Dialog ────────────────────────────────────────────────────

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onClose }) => {
  const { addProject, currentUser } = useAppState();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !currentUser) return;
    addProject({
      name: name.trim(),
      description,
      status: 'active',
      progress: 0,
      ownerId: currentUser.id,
      color,
      dueDate: dueDate || undefined,
    });
    setName('');
    setDescription('');
    setColor(PROJECT_COLORS[0]);
    setDueDate('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary" />
            New Project
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Project Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) handleSubmit(); }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={2}
              className="resize-none text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-white/40 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Project Card (Grid) ──────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  doneCount: number;
  overdueCount: number;
  memberCount: number;
  onOpen: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project, taskCount, doneCount, overdueCount, memberCount, onOpen, onArchive, onDelete,
}) => {
  const cfg = STATUS_CONFIG[project.status];
  const completion = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : project.progress;

  return (
    <div
      className="group relative bg-card border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer flex flex-col"
      onClick={onOpen}
    >
      {/* Color header strip */}
      <div className="h-1.5" style={{ backgroundColor: project.color ?? '#6366f1' }} />

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold text-white"
              style={{ backgroundColor: project.color ?? '#6366f1' }}
            >
              {project.icon ?? project.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{project.name}</h3>
              <Badge
                variant="secondary"
                className={`text-[10px] h-4 px-1.5 mt-0.5 gap-0.5 ${cfg.color} ${cfg.bg}`}
              >
                {cfg.icon}{cfg.label}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onOpen}>
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" /> Open Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="h-3.5 w-3.5 mr-1.5" />
                {project.status === 'archived' ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
        )}

        {/* Progress */}
        <div className="space-y-1 mt-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{doneCount}/{taskCount} tasks</span>
            <span className="font-medium text-foreground">{completion}%</span>
          </div>
          <Progress value={completion} className="h-1.5" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-muted/20">
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <span className="flex items-center gap-0.5 text-red-400">
                <AlertTriangle className="h-3 w-3" />
                {overdueCount} overdue
              </span>
            )}
            {memberCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Users className="h-3 w-3" />
                {memberCount}
              </span>
            )}
          </div>
          {project.dueDate && (
            <span className="flex items-center gap-0.5">
              <Calendar className="h-3 w-3" />
              {format(new Date(project.dueDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Project List Row ─────────────────────────────────────────────────────────

const ProjectListRow: React.FC<ProjectCardProps> = ({
  project, taskCount, doneCount, overdueCount, memberCount, onOpen, onArchive, onDelete,
}) => {
  const cfg = STATUS_CONFIG[project.status];
  const completion = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : project.progress;

  return (
    <div
      className="group flex items-center gap-4 p-3 rounded-xl border bg-card hover:border-primary/30 hover:bg-muted/20 transition-all cursor-pointer"
      onClick={onOpen}
    >
      {/* Color dot + icon */}
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold text-white"
        style={{ backgroundColor: project.color ?? '#6366f1' }}
      >
        {project.icon ?? project.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{project.name}</span>
          <Badge variant="secondary" className={`text-[10px] h-4 px-1.5 shrink-0 gap-0.5 ${cfg.color} ${cfg.bg}`}>
            {cfg.icon}{cfg.label}
          </Badge>
        </div>
        {project.description && (
          <p className="text-xs text-muted-foreground truncate">{project.description}</p>
        )}
      </div>

      {/* Progress */}
      <div className="hidden md:flex items-center gap-2 w-32 shrink-0">
        <Progress value={completion} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground w-8 text-right">{completion}%</span>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        <span>{doneCount}/{taskCount}</span>
        {overdueCount > 0 && (
          <span className="text-red-400 flex items-center gap-0.5">
            <AlertTriangle className="h-3 w-3" />{overdueCount}
          </span>
        )}
        {project.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(project.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-xs" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onOpen}>Open Project</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onArchive}>
            {project.status === 'archived' ? 'Unarchive' : 'Archive'}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function ProjectsPage() {
  const { projects, tasks, users, updateProject, deleteProject } = useAppState();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const today = new Date().toISOString().slice(0, 10);

  const projectsWithStats = useMemo(() => {
    return projects.map((p) => {
      const ptasks = tasks.filter((t) => t.projectId === p.id);
      const done = ptasks.filter((t) => t.status === 'done').length;
      const overdue = ptasks.filter((t) => t.dueDate && t.status !== 'done' && t.dueDate < today).length;
      const members = p.memberIds?.length ?? 0;
      return { project: p, taskCount: ptasks.length, doneCount: done, overdueCount: overdue, memberCount: members };
    });
  }, [projects, tasks, today]);

  const filtered = useMemo(() => {
    let list = projectsWithStats;
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.project.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.project.name.toLowerCase().includes(q) ||
        p.project.description?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => a.project.name.localeCompare(b.project.name));
  }, [projectsWithStats, statusFilter, search]);

  const stats = useMemo(() => ({
    active: projects.filter((p) => p.status === 'active').length,
    onHold: projects.filter((p) => p.status === 'on_hold').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    archived: projects.filter((p) => p.status === 'archived').length,
  }), [projects]);

  const openProject = (id: string) => router.push(`/projects/${id}`);

  const handleArchive = (project: Project) => {
    const nextStatus: Project['status'] = project.status === 'archived' ? 'active' : 'archived';
    updateProject(project.id, { status: nextStatus });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this project and all its tasks? This cannot be undone.')) {
      deleteProject(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Projects</h1>
            <p className="text-xs text-muted-foreground">
              {stats.active} active · {stats.completed} completed · {stats.onHold} on hold
            </p>
          </div>
        </div>
        <Button className="gap-1.5 gradient-pink-blue text-white shadow-lg shadow-primary/20 self-start sm:self-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="h-9 pl-9 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center bg-muted/40 rounded-lg p-0.5 gap-0.5">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'on_hold', label: 'On Hold' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-muted/40 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} project{filtered.length !== 1 ? 's' : ''} matching &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <FolderKanban className="h-14 w-14 mb-4 opacity-20" />
          <p className="text-base font-medium">
            {search ? 'No projects match your search' : statusFilter !== 'all' ? `No ${statusFilter} projects` : 'No projects yet'}
          </p>
          <p className="text-sm mt-1 opacity-60">
            {!search && statusFilter === 'active' ? 'Create your first project to get started.' : ''}
          </p>
          {!search && (
            <Button className="mt-5 gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New Project
            </Button>
          )}
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(({ project, taskCount, doneCount, overdueCount, memberCount }) => (
            <ProjectCard
              key={project.id}
              project={project}
              taskCount={taskCount}
              doneCount={doneCount}
              overdueCount={overdueCount}
              memberCount={memberCount}
              onOpen={() => openProject(project.id)}
              onArchive={() => handleArchive(project)}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(({ project, taskCount, doneCount, overdueCount, memberCount }) => (
            <ProjectListRow
              key={project.id}
              project={project}
              taskCount={taskCount}
              doneCount={doneCount}
              overdueCount={overdueCount}
              memberCount={memberCount}
              onOpen={() => openProject(project.id)}
              onArchive={() => handleArchive(project)}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

export default function ProjectsPageWrapper() {
  return (
      <ProjectsPage />
  );
}
