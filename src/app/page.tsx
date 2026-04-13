"use client";

import React, { useMemo } from 'react';
import { useAppState } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
  AlertTriangle,
  FolderKanban,
  Zap,
  Target,
  ArrowRight,
  Flag,
  Calendar,
  Users,
  BarChart3,
  Plus,
  Circle,
  Flame,
  Star,
  Activity,
} from 'lucide-react';
import { ProjectSummary } from '@/components/ai/ProjectSummary';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, iconBg, trend, trendUp, onClick }) => (
  <Card
    className={`glass-card transition-all ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}`}
    onClick={onClick}
  >
    <CardContent className="pt-5 pb-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${trendUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </CardContent>
  </Card>
);

// ─── Quick Task Row ───────────────────────────────────────────────────────────

const QuickTaskRow: React.FC<{
  task: ReturnType<typeof useAppState>['tasks'][0];
  projectName: string;
  onClick: () => void;
}> = ({ task, projectName, onClick }) => {
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = task.dueDate && task.status !== 'done' && task.dueDate < today;
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isDueTomorrow = task.dueDate && isTomorrow(new Date(task.dueDate));

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-blue-400',
    low: 'text-slate-400',
    none: 'text-muted-foreground',
  };

  return (
    <div
      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="shrink-0">
        {task.status === 'done'
          ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          : task.status === 'in_progress'
            ? <Clock className="h-4 w-4 text-blue-400" />
            : <Circle className="h-4 w-4 text-muted-foreground" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">{projectName}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {task.priority !== 'none' && (
          <Flag className={`h-3 w-3 ${PRIORITY_COLORS[task.priority]}`} />
        )}
        {task.dueDate && (
          <span className={`text-[10px] ${isOverdue ? 'text-red-400 font-medium' : isDueToday ? 'text-orange-400 font-medium' : 'text-muted-foreground'}`}>
            {isOverdue ? 'Overdue' : isDueToday ? 'Today' : isDueTomorrow ? 'Tomorrow' : format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Project Health Row ───────────────────────────────────────────────────────

const ProjectHealthRow: React.FC<{
  project: ReturnType<typeof useAppState>['projects'][0];
  taskCount: number;
  doneCount: number;
  overdueCount: number;
  onClick: () => void;
}> = ({ project, taskCount, doneCount, overdueCount, onClick }) => {
  const completion = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;
  const health = overdueCount > 2 ? 'at_risk' : overdueCount > 0 ? 'caution' : 'healthy';

  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white"
        style={{ backgroundColor: project.color ?? '#6366f1' }}
      >
        {project.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate">{project.name}</span>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">{completion}%</span>
        </div>
        <Progress value={completion} className="h-1.5" />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {overdueCount > 0 && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 text-red-400 bg-red-500/10">
            {overdueCount} overdue
          </Badge>
        )}
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
          {taskCount} tasks
        </Badge>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const DashboardContent = () => {
  const { projects, tasks, users, currentUser, currentWorkspace, sprints, goals } = useAppState();
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Task stats
  const taskStats = useMemo(() => {
    const myTasks = currentUser ? tasks.filter(t => t.assigneeId === currentUser.id) : [];
    const overdue = tasks.filter(t => t.dueDate && t.status !== 'done' && t.dueDate < today);
    const dueToday = tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== 'done');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const done = tasks.filter(t => t.status === 'done');
    return { total: tasks.length, overdue, dueToday, inProgress, done, myTasks };
  }, [tasks, currentUser, today]);

  // Sprint stats
  const activeSprints = sprints.filter(s => s.status === 'active');
  const goalStats = useMemo(() => ({
    total: goals.length,
    onTrack: goals.filter(g => g.status === 'on_track').length,
    atRisk: goals.filter(g => g.status === 'at_risk' || g.status === 'off_track').length,
    avgProgress: goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0,
  }), [goals]);

  // My tasks (due soon or overdue) - show top 6
  const myPriorityTasks = useMemo(() => {
    if (!currentUser) return tasks.slice(0, 6);
    const mine = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== 'done' && t.status !== 'cancelled');
    return mine
      .sort((a, b) => {
        const aScore = (a.dueDate && a.dueDate < today ? 2 : a.dueDate && isToday(new Date(a.dueDate)) ? 1 : 0);
        const bScore = (b.dueDate && b.dueDate < today ? 2 : b.dueDate && isToday(new Date(b.dueDate)) ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, 6);
  }, [tasks, currentUser, today]);

  // Project health
  const projectsWithStats = useMemo(() => {
    return projects
      .filter(p => p.status === 'active')
      .map(p => {
        const ptasks = tasks.filter(t => t.projectId === p.id);
        const done = ptasks.filter(t => t.status === 'done').length;
        const overdue = ptasks.filter(t => t.dueDate && t.status !== 'done' && t.dueDate < today).length;
        return { project: p, taskCount: ptasks.length, doneCount: done, overdueCount: overdue };
      })
      .sort((a, b) => b.overdueCount - a.overdueCount)
      .slice(0, 6);
  }, [projects, tasks, today]);

  // Chart: tasks by status
  const taskDistChart = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#64748b' },
    { name: 'In Progress', value: taskStats.inProgress.length, color: '#3b82f6' },
    { name: 'Review', value: tasks.filter(t => t.status === 'review').length, color: '#eab308' },
    { name: 'Done', value: taskStats.done.length, color: '#22c55e' },
  ];

  // Chart: tasks by priority
  const priorityChart = [
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length, color: '#ef4444' },
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#f97316' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#3b82f6' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#94a3b8' },
  ];

  // Workload per user
  const workloadData = useMemo(() => {
    return users.slice(0, 6).map(u => ({
      name: u.name.split(' ')[0],
      tasks: tasks.filter(t => t.assigneeId === u.id && t.status !== 'done').length,
    }));
  }, [users, tasks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{format(new Date(), 'EEEE, MMMM d')}</p>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {greeting}, {currentUser?.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {currentWorkspace?.name} · {taskStats.myTasks.length} tasks assigned to you
            {taskStats.overdue.length > 0 && ` · `}
            {taskStats.overdue.length > 0 && <span className="text-red-400 font-medium">{taskStats.overdue.length} overdue</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectSummary />
          <Button size="sm" className="gap-1.5" onClick={() => router.push('/projects')}>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Active Projects"
          value={projects.filter(p => p.status === 'active').length}
          icon={<FolderKanban className="h-4 w-4 text-indigo-400" />}
          iconBg="bg-indigo-500/10"
          onClick={() => router.push('/projects')}
        />
        <StatCard
          label="Total Tasks"
          value={taskStats.total}
          icon={<ListTodo className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
        />
        <StatCard
          label="In Progress"
          value={taskStats.inProgress.length}
          icon={<Clock className="h-4 w-4 text-blue-400" />}
          iconBg="bg-blue-500/10"
        />
        <StatCard
          label="Completed"
          value={taskStats.done.length}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          label="Overdue"
          value={taskStats.overdue.length}
          icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
          iconBg="bg-red-500/10"
          trendUp={taskStats.overdue.length === 0}
        />
        <StatCard
          label="Active Sprints"
          value={activeSprints.length}
          icon={<Zap className="h-4 w-4 text-cyan-400" />}
          iconBg="bg-cyan-500/10"
          onClick={() => router.push('/sprints')}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* My Tasks */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400" /> My Tasks
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{myPriorityTasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {myPriorityTasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground/50">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                All clear! No pending tasks.
              </div>
            ) : (
              <div className="-mx-1">
                {myPriorityTasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <QuickTaskRow
                      key={task.id}
                      task={task}
                      projectName={project?.name ?? ''}
                      onClick={() => router.push(`/projects/${task.projectId}?taskId=${task.id}`)}
                    />
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground mt-1"
                  onClick={() => router.push('/my-tasks')}
                >
                  View all tasks <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Health */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Project Health
                </CardTitle>
                <CardDescription className="text-xs">{projectsWithStats.length} active projects</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => router.push('/projects')}>
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {projectsWithStats.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground/50">
                <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No active projects yet.
              </div>
            ) : (
              <div className="-mx-1">
                {projectsWithStats.map(({ project, taskCount, doneCount, overdueCount }) => (
                  <ProjectHealthRow
                    key={project.id}
                    project={project}
                    taskCount={taskCount}
                    doneCount={doneCount}
                    overdueCount={overdueCount}
                    onClick={() => router.push(`/projects/${project.id}`)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Task Distribution */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Task Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskDistChart} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                    {taskDistChart.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: 'white' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              {taskDistChart.map(item => (
                <div key={item.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  {item.name} ({item.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChart} layout="vertical" margin={{ left: -10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: 'white' }}
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {priorityChart.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Team Workload */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Team Workload</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={() => router.push('/workload')}>
                Full view
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} margin={{ bottom: -5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis hide />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: 'white' }}
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Sprints + Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Active Sprints */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" /> Active Sprints
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => router.push('/sprints')}>
                All sprints <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activeSprints.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground/50">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No active sprints
              </div>
            ) : (
              <div className="space-y-3">
                {activeSprints.slice(0, 3).map(sprint => {
                  const project = projects.find(p => p.id === sprint.projectId);
                  const sprintTasks = tasks.filter(t => t.sprintId === sprint.id);
                  const done = sprintTasks.filter(t => t.status === 'done').length;
                  const pct = sprintTasks.length ? Math.round((done / sprintTasks.length) * 100) : 0;
                  const remaining = differenceInDays(new Date(sprint.endDate), new Date());
                  return (
                    <div key={sprint.id} className="space-y-1.5 cursor-pointer hover:bg-muted/20 p-2 rounded-lg transition-colors" onClick={() => router.push('/sprints')}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{sprint.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{project?.name}</span>
                        </div>
                        <span className={`text-[10px] ${remaining <= 0 ? 'text-red-400' : remaining <= 3 ? 'text-orange-400' : 'text-muted-foreground'}`}>
                          {remaining <= 0 ? 'Overdue' : `${remaining}d left`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{done}/{sprintTasks.length} tasks</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Overview */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" /> Goals & OKRs
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => router.push('/goals')}>
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {goals.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground/50">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No goals defined yet
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { label: 'On Track', val: goalStats.onTrack, color: 'text-emerald-400' },
                    { label: 'At Risk', val: goalStats.atRisk, color: 'text-orange-400' },
                    { label: 'Avg', val: `${goalStats.avgProgress}%`, color: 'text-purple-400' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 bg-muted/20 rounded-lg">
                      <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
                      <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
                {goals.slice(0, 3).map(goal => (
                  <div key={goal.id} className="cursor-pointer hover:bg-muted/20 p-2 rounded-lg transition-colors" onClick={() => router.push('/goals')}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate flex-1">{goal.title}</span>
                      <span className="text-xs font-bold ml-2">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function Home() {
  return (
      <DashboardContent />
  );
}
