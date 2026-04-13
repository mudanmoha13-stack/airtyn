"use client";

import React from 'react';
import { useAppState } from '@/lib/store';
import type { TaskPriority, TaskStatus, ProjectView } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Users,
  Flag,
  Kanban,
  List,
  GanttChartSquare,
  CalendarDays,
  Table2,
  UsersRound,
  SlidersHorizontal,
  X,
  ChevronDown,
  Circle,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const VIEW_OPTIONS: { value: ProjectView; label: string; icon: React.ReactNode }[] = [
  { value: 'board', label: 'Board', icon: <Kanban className="h-3.5 w-3.5" /> },
  { value: 'list', label: 'List', icon: <List className="h-3.5 w-3.5" /> },
  { value: 'timeline', label: 'Timeline', icon: <GanttChartSquare className="h-3.5 w-3.5" /> },
  { value: 'calendar', label: 'Calendar', icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { value: 'table', label: 'Table', icon: <Table2 className="h-3.5 w-3.5" /> },
  { value: 'workload', label: 'Workload', icon: <UsersRound className="h-3.5 w-3.5" /> },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: 'text-red-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'medium', label: 'Medium', color: 'text-blue-400' },
  { value: 'low', label: 'Low', color: 'text-slate-400' },
  { value: 'none', label: 'No Priority', color: 'text-muted-foreground' },
];

const GROUP_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'none', label: 'No Grouping' },
] as const;

export interface FilterState {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  assignee: string | 'all';
  groupBy: 'status' | 'priority' | 'assignee' | 'none';
}

interface FilterBarProps {
  activeView: ProjectView;
  onViewChange: (view: ProjectView) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onAddTask?: () => void;
  projectId: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeView,
  onViewChange,
  filters,
  onFilterChange,
  onAddTask,
  projectId,
}) => {
  const { users } = useAppState();

  const activeFilterCount = [
    filters.status !== 'all' ? 1 : 0,
    filters.priority !== 'all' ? 1 : 0,
    filters.assignee !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    onFilterChange({ ...filters, status: 'all', priority: 'all', assignee: 'all' });
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b bg-background/95 backdrop-blur-sm shrink-0 flex-wrap">
      {/* View switcher */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
        {VIEW_OPTIONS.map((v) => (
          <button
            key={v.value}
            onClick={() => onViewChange(v.value)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === v.value
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {v.icon}
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search tasks…"
            className="h-7 pl-8 pr-3 text-xs w-36"
          />
          {filters.search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => onFilterChange({ ...filters, search: '' })}
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Assignee filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={`h-7 text-xs gap-1.5 ${filters.assignee !== 'all' ? 'border-primary text-primary' : ''}`}>
              <Users className="h-3.5 w-3.5" />
              {filters.assignee === 'all' ? 'Assignee' : users.find((u) => u.id === filters.assignee)?.name ?? 'Filter'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="text-xs">
            <DropdownMenuLabel>Assignee</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFilterChange({ ...filters, assignee: 'all' })}>
              All members
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange({ ...filters, assignee: 'unassigned' })}>
              Unassigned
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {users.map((u) => (
              <DropdownMenuItem
                key={u.id}
                onClick={() => onFilterChange({ ...filters, assignee: u.id })}
              >
                <Avatar className="h-4 w-4 mr-1.5">
                  <AvatarImage src={u.avatarUrl} />
                  <AvatarFallback className="text-[8px]">{u.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {u.name}
                {filters.assignee === u.id && ' ✓'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={`h-7 text-xs gap-1.5 ${filters.priority !== 'all' ? 'border-primary text-primary' : ''}`}>
              <Flag className="h-3.5 w-3.5" />
              {filters.priority === 'all' ? 'Priority' : filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="text-xs">
            <DropdownMenuLabel>Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFilterChange({ ...filters, priority: 'all' })}>
              All priorities
            </DropdownMenuItem>
            {PRIORITY_OPTIONS.map((p) => (
              <DropdownMenuItem
                key={p.value}
                onClick={() => onFilterChange({ ...filters, priority: p.value })}
              >
                <Flag className={`h-3 w-3 mr-1.5 ${p.color}`} /> {p.label}
                {filters.priority === p.value && ' ✓'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Group by (list view) */}
        {activeView === 'list' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Group: {GROUP_OPTIONS.find((g) => g.value === filters.groupBy)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-xs">
              <DropdownMenuLabel>Group by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {GROUP_OPTIONS.map((g) => (
                <DropdownMenuItem
                  key={g.value}
                  onClick={() => onFilterChange({ ...filters, groupBy: g.value })}
                >
                  {g.label} {filters.groupBy === g.value && ' ✓'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground gap-1"
            onClick={clearAllFilters}
          >
            <X className="h-3 w-3" />
            Clear ({activeFilterCount})
          </Button>
        )}

        {/* Add task */}
        {onAddTask && (
          <Button size="sm" className="h-7 text-xs ml-2" onClick={onAddTask}>
            <span className="mr-1">+</span> Add Task
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
