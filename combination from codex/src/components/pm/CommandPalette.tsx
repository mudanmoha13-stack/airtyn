"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppState } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  FolderKanban,
  CheckSquare,
  Hash,
  Plus,
  ArrowRight,
  Command,
  LayoutDashboard,
  Calendar,
  GanttChartSquare,
  Users,
  BarChart3,
  Settings,
  Target,
  Zap,
  Flag,
} from 'lucide-react';

type SearchResult = {
  type: 'project' | 'task' | 'page' | 'action';
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string;
  onSelect?: () => void;
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_PAGES: SearchResult[] = [
  { type: 'page', id: 'dashboard', title: 'Dashboard', href: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
  { type: 'page', id: 'timeline', title: 'Timeline', href: '/timeline', icon: <GanttChartSquare className="h-4 w-4" /> },
  { type: 'page', id: 'calendar', title: 'Calendar', href: '/calendar', icon: <Calendar className="h-4 w-4" /> },
  { type: 'page', id: 'workload', title: 'Team Workload', href: '/workload', icon: <Users className="h-4 w-4" /> },
  { type: 'page', id: 'reports', title: 'Reports', href: '/reports', icon: <BarChart3 className="h-4 w-4" /> },
  { type: 'page', id: 'goals', title: 'Goals & OKRs', href: '/goals', icon: <Target className="h-4 w-4" /> },
  { type: 'page', id: 'sprints', title: 'Sprints', href: '/sprints', icon: <Zap className="h-4 w-4" /> },
  { type: 'page', id: 'settings', title: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const { projects, tasks, users } = useAppState();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo((): SearchResult[] => {
    const q = query.toLowerCase().trim();

    if (!q) {
      return [
        ...QUICK_PAGES,
        ...projects.slice(0, 5).map((p) => ({
          type: 'project' as const,
          id: p.id,
          title: p.name,
          subtitle: `${tasks.filter((t) => t.projectId === p.id).length} tasks`,
          href: `/projects/${p.id}`,
          icon: <FolderKanban className="h-4 w-4" />,
          badge: p.status,
        })),
      ];
    }

    const matchedPages = QUICK_PAGES.filter((p) => p.title.toLowerCase().includes(q));

    const matchedProjects = projects
      .filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      .slice(0, 4)
      .map((p) => ({
        type: 'project' as const,
        id: p.id,
        title: p.name,
        subtitle: p.description?.slice(0, 60),
        href: `/projects/${p.id}`,
        icon: <FolderKanban className="h-4 w-4" />,
        badge: p.status,
      }));

    const matchedTasks = tasks
      .filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
      .slice(0, 6)
      .map((t) => {
        const project = projects.find((p) => p.id === t.projectId);
        return {
          type: 'task' as const,
          id: t.id,
          title: t.title,
          subtitle: project?.name,
          href: `/projects/${t.projectId}?taskId=${t.id}`,
          icon: <CheckSquare className="h-4 w-4" />,
          badge: t.status.replace('_', ' '),
        };
      });

    return [...matchedPages, ...matchedProjects, ...matchedTasks];
  }, [query, projects, tasks]);

  const handleSelect = (result: SearchResult) => {
    if (result.onSelect) {
      result.onSelect();
    } else if (result.href) {
      router.push(result.href);
    }
    onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selected]) handleSelect(results[selected]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selected]);

  const typeIcon = (type: SearchResult['type']) => {
    if (type === 'project') return <div className="text-purple-400"><FolderKanban className="h-3.5 w-3.5" /></div>;
    if (type === 'task') return <div className="text-blue-400"><CheckSquare className="h-3.5 w-3.5" /></div>;
    if (type === 'page') return <div className="text-muted-foreground"><Hash className="h-3.5 w-3.5" /></div>;
    return null;
  };

  const groupLabel = (type: SearchResult['type']) => {
    if (type === 'project') return 'Projects';
    if (type === 'task') return 'Tasks';
    if (type === 'page') return 'Pages';
    return 'Actions';
  };

  // Group results by type
  const grouped: { label: string; items: (SearchResult & { idx: number })[] }[] = [];
  let idx = 0;
  const types: SearchResult['type'][] = ['page', 'project', 'task', 'action'];
  types.forEach((type) => {
    const items = results.filter((r) => r.type === type).map((r) => ({ ...r, idx: idx++ }));
    if (items.length > 0) {
      grouped.push({ label: groupLabel(type), items });
    }
  });
  // Recalculate idx after building grouped
  let flatIdx = 0;
  const flatResults = grouped.flatMap((g) => g.items.map((item) => ({ ...item, idx: flatIdx++ })));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search projects, tasks, pages…"
            className="border-none shadow-none focus-visible:ring-0 text-base h-auto p-0"
          />
          <Badge variant="secondary" className="text-xs shrink-0 opacity-60">
            <Command className="h-2.5 w-2.5 mr-0.5" />K
          </Badge>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {results.length === 0 && (
            <div className="py-10 text-center text-muted-foreground text-sm">No results for "{query}"</div>
          )}
          {grouped.map(({ label, items }) => (
            <div key={label}>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/20 sticky top-0">{label}</div>
              {items.map((result) => {
                const isSelected = result.idx === selected;
                return (
                  <button
                    key={result.id}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/30'}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelected(result.idx)}
                  >
                    <div className="shrink-0 text-muted-foreground">{result.icon ?? typeIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                      )}
                    </div>
                    {result.badge && (
                      <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">
                        {result.badge}
                      </Badge>
                    )}
                    {isSelected && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t bg-muted/10 text-[10px] text-muted-foreground">
          <span><kbd className="px-1.5 py-0.5 rounded border text-[10px]">↑↓</kbd> navigate</span>
          <span><kbd className="px-1.5 py-0.5 rounded border text-[10px]">↵</kbd> select</span>
          <span><kbd className="px-1.5 py-0.5 rounded border text-[10px]">esc</kbd> close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
