"use client";

import React, { useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function PortfolioScalePage() {
  const { portfolios, projects, tasks, currentUser, addPortfolio } = useAppState();
  const [name, setName] = useState('Core Platform Portfolio');
  const [description, setDescription] = useState('All initiatives for platform reliability and growth');
  const [targetDate, setTargetDate] = useState('');
  const [budget, setBudget] = useState('120000');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) => prev.includes(projectId) ? prev.filter((p) => p !== projectId) : [...prev, projectId]);
  };

  const portfolioSummaries = useMemo(() => {
    return portfolios.map((portfolio) => {
      const relevantProjects = projects.filter((p) => portfolio.projectIds.includes(p.id));
      const relevantTasks = tasks.filter((t) => portfolio.projectIds.includes(t.projectId));
      const completed = relevantTasks.filter((t) => t.status === 'done').length;
      const progress = relevantTasks.length > 0 ? Math.round((completed / relevantTasks.length) * 100) : 0;
      return { portfolio, projectCount: relevantProjects.length, taskCount: relevantTasks.length, progress };
    });
  }, [portfolios, projects, tasks]);

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Management</h1>
          <p className="text-muted-foreground">Group strategic projects and track delivery at portfolio level.</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Create Portfolio</CardTitle>
            <CardDescription>Organize projects by strategic objective.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Target Date</Label><Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Budget (USD)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Projects</Label>
              <div className="border rounded-md p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {projects.map((project) => (
                  <button key={project.id} className={`text-left text-sm border rounded px-2 py-1 ${selectedProjects.includes(project.id) ? 'bg-primary/10 border-primary/40' : ''}`} onClick={() => toggleProject(project.id)}>
                    {project.name}
                  </button>
                ))}
                {projects.length === 0 && <p className="text-sm text-muted-foreground">Create projects first to build portfolios.</p>}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (!name.trim() || !currentUser) return;
                addPortfolio({ name: name.trim(), description: description.trim(), ownerId: currentUser.id, projectIds: selectedProjects, targetDate: targetDate || undefined, budgetUsd: budget ? Number(budget) : undefined });
              }}
            >
              Create Portfolio
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolioSummaries.map(({ portfolio, projectCount, taskCount, progress }) => (
            <Card key={portfolio.id} className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{portfolio.name}</span>
                  <Badge variant="outline">${portfolio.budgetUsd?.toLocaleString() ?? 'N/A'}</Badge>
                </CardTitle>
                <CardDescription>{portfolio.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span>Projects</span><span>{projectCount}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Tasks</span><span>{taskCount}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Target Date</span><span>{portfolio.targetDate ?? 'Unset'}</span></div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">Portfolio completion: {progress}%</p>
              </CardContent>
            </Card>
          ))}
          {portfolios.length === 0 && <p className="text-sm text-muted-foreground">No portfolios yet.</p>}
        </div>
      </div>
    </Shell>
  );
}
