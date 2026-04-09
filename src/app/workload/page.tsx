"use client";

import React, { useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-400',
  in_progress: 'bg-primary',
  review: 'bg-yellow-500',
  done: 'bg-green-500',
};
const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export default function WorkloadPage() {
  const { users, tasks, projects } = useAppState();

  const workloadData = useMemo(() => {
    return users.map((user) => {
      const userTasks = tasks.filter((t) => t.assigneeId === user.id);
      const byStatus = {
        todo: userTasks.filter((t) => t.status === 'todo').length,
        in_progress: userTasks.filter((t) => t.status === 'in_progress').length,
        review: userTasks.filter((t) => t.status === 'review').length,
        done: userTasks.filter((t) => t.status === 'done').length,
      };
      const activeTasks = userTasks.filter((t) => t.status !== 'done');
      const totalMinutes = userTasks.reduce((sum, t) => {
        return sum + (t.timeEntries ?? []).reduce((s, e) => s + e.minutes, 0);
      }, 0);
      const overdue = userTasks.filter(
        (t) => t.dueDate && t.status !== 'done' && t.dueDate < new Date().toISOString().slice(0, 10)
      ).length;
      const projectIds = [...new Set(userTasks.map((t) => t.projectId))];
      return { user, userTasks, byStatus, activeTasks, totalMinutes, overdue, projectIds };
    });
  }, [users, tasks]);

  const maxActive = Math.max(...workloadData.map((w) => w.activeTasks.length), 1);

  const unassigned = useMemo(() => tasks.filter((t) => !t.assigneeId && t.status !== 'done'), [tasks]);

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Team Workload</h1>
          <p className="text-muted-foreground">See how tasks are distributed across your team.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Members</span>
              </div>
              <p className="text-2xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Circle className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Active Tasks</span>
              </div>
              <p className="text-2xl font-bold">{tasks.filter((t) => t.status !== 'done').length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Unassigned</span>
              </div>
              <p className="text-2xl font-bold">{unassigned.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Hours Logged</span>
              </div>
              <p className="text-2xl font-bold">
                {Math.round(tasks.reduce((s, t) => s + (t.timeEntries ?? []).reduce((ss, e) => ss + e.minutes, 0), 0) / 60)}h
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Per-user workload */}
        <div className="space-y-4">
          {workloadData.map(({ user, byStatus, activeTasks, totalMinutes, overdue, projectIds }) => (
            <Card key={user.id} className="glass-card">
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 min-w-48">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <Badge variant="outline" className="text-xs">{user.role}</Badge>
                    </div>
                  </div>

                  {/* Load bar */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}</span>
                      <span>{Math.round(totalMinutes / 60)}h logged</span>
                    </div>
                    <Progress
                      value={(activeTasks.length / maxActive) * 100}
                      className="h-2"
                    />
                    {/* Status breakdown */}
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(byStatus).map(([status, count]) => (
                        count > 0 && (
                          <div key={status} className="flex items-center gap-1 text-xs text-muted-foreground">
                            <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
                            {count} {STATUS_LABELS[status]}
                          </div>
                        )
                      ))}
                      {overdue > 0 && (
                        <Badge variant="destructive" className="text-xs h-5">{overdue} overdue</Badge>
                      )}
                    </div>
                  </div>

                  {/* Projects */}
                  <div className="flex flex-wrap gap-1 min-w-32 max-w-48">
                    {projectIds.slice(0, 3).map((pid) => {
                      const proj = projects.find((p) => p.id === pid);
                      return proj ? (
                        <Badge key={pid} variant="secondary" className="text-xs">{proj.name}</Badge>
                      ) : null;
                    })}
                    {projectIds.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{projectIds.length - 3}</Badge>
                    )}
                    {projectIds.length === 0 && (
                      <span className="text-xs text-muted-foreground">No tasks</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No team members yet. Invite people from the Teams page.</p>
          )}
        </div>

        {/* Unassigned tasks */}
        {unassigned.length > 0 && (
          <Card className="glass-card border-dashed">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                Unassigned Tasks ({unassigned.length})
              </CardTitle>
              <CardDescription>These tasks have no owner yet — assign them from the project Kanban.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {unassigned.slice(0, 8).map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  return (
                    <div key={task.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{task.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">{project?.name}</Badge>
                        <Badge variant="outline" className="text-xs">{task.priority}</Badge>
                      </div>
                    </div>
                  );
                })}
                {unassigned.length > 8 && (
                  <p className="text-xs text-muted-foreground">+{unassigned.length - 8} more unassigned tasks</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}
