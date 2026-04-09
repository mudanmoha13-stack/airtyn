"use client";

import React, { useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { summarizeProjectActivity } from '@/ai/flows/project-summary-ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Lightbulb, TriangleAlert, MessageSquareText, ListChecks } from 'lucide-react';

export default function IntelligencePage() {
  const {
    projects,
    tasks,
    workspaceAiSummary,
    workspaceAiSummaryUpdatedAt,
    recommendations,
    riskAlerts,
    nlReports,
    priorityChanges,
    setWorkspaceAiSummary,
    refreshRecommendations,
    refreshRiskAlerts,
    saveNlReport,
    runIntelligentPrioritization,
  } = useAppState();

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportQuery, setReportQuery] = useState('What is our current delivery health and top risks this week?');
  const [reportAnswer, setReportAnswer] = useState<string>('');

  const workspaceSnapshot = useMemo(() => {
    const openTasks = tasks.filter((t) => t.status !== 'done').length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'done' && t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10)
    ).length;
    const urgentTasks = tasks.filter((t) => t.status !== 'done' && t.priority === 'urgent').length;
    const lines = [
      `Projects: ${projects.length}`,
      `Tasks: ${tasks.length}`,
      `Open Tasks: ${openTasks}`,
      `Overdue Tasks: ${overdueTasks}`,
      `Urgent Open Tasks: ${urgentTasks}`,
      ...projects.map((p) => {
        const scoped = tasks.filter((t) => t.projectId === p.id);
        const done = scoped.filter((t) => t.status === 'done').length;
        return `Project ${p.name}: ${done}/${scoped.length} done, status=${p.status}`;
      }),
    ];
    return lines.join('\n');
  }, [projects, tasks]);

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const result = await summarizeProjectActivity({
        contentToSummarize: workspaceSnapshot,
        summaryLength: 'medium',
        focus: 'executive status, blockers, and next best actions',
      });
      setWorkspaceAiSummary(result.summary);
    } catch {
      setWorkspaceAiSummary('Unable to generate AI summary right now.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const generateNlReport = async () => {
    if (!reportQuery.trim()) return;
    setReportLoading(true);
    try {
      const result = await summarizeProjectActivity({
        contentToSummarize: `Question: ${reportQuery}\n\nWorkspace data:\n${workspaceSnapshot}`,
        summaryLength: 'long',
        focus: reportQuery,
      });
      setReportAnswer(result.summary);
      saveNlReport(reportQuery, result.summary);
    } catch {
      const fallback = 'Unable to generate report right now. Try again in a moment.';
      setReportAnswer(fallback);
      saveNlReport(reportQuery, fallback);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Intelligence</h1>
          <p className="text-muted-foreground">Automation and decision support for faster, safer execution.</p>
        </div>

        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="summary"><Sparkles className="h-4 w-4 mr-1.5" />AI Summaries</TabsTrigger>
            <TabsTrigger value="recommendations"><Lightbulb className="h-4 w-4 mr-1.5" />Smart Recommendations</TabsTrigger>
            <TabsTrigger value="risk"><TriangleAlert className="h-4 w-4 mr-1.5" />Risk Alerts</TabsTrigger>
            <TabsTrigger value="nl"><MessageSquareText className="h-4 w-4 mr-1.5" />Natural Language Reporting</TabsTrigger>
            <TabsTrigger value="priority"><ListChecks className="h-4 w-4 mr-1.5" />Task Prioritization</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>AI Workspace Summary</CardTitle>
                <CardDescription>Executive snapshot generated from current project and task state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={generateSummary} disabled={summaryLoading}>
                  {summaryLoading ? 'Generating...' : 'Generate Summary'}
                </Button>
                <div className="rounded-md border p-3 min-h-28 whitespace-pre-wrap text-sm">
                  {workspaceAiSummary || 'No summary yet.'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated: {workspaceAiSummaryUpdatedAt ? new Date(workspaceAiSummaryUpdatedAt).toLocaleString() : 'Never'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Smart Recommendations</CardTitle>
                <CardDescription>AI-assisted tactical guidance ranked by impact score.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={refreshRecommendations}>Refresh Recommendations</Button>
                <div className="space-y-2">
                  {recommendations.map((item) => (
                    <div key={item.id} className="border rounded-md p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.reason}</p>
                        </div>
                        <Badge>{item.impactScore}</Badge>
                      </div>
                    </div>
                  ))}
                  {recommendations.length === 0 && <p className="text-sm text-muted-foreground">No recommendations yet.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Predictive Delivery Risk Alerts</CardTitle>
                <CardDescription>Project-level risk scoring with key risk drivers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={refreshRiskAlerts}>Run Risk Analysis</Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {riskAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded-md p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm">{alert.projectName}</p>
                        <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                          {alert.severity} ({alert.riskScore})
                        </Badge>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {alert.drivers.map((driver) => <li key={driver}>- {driver}</li>)}
                      </ul>
                    </div>
                  ))}
                  {riskAlerts.length === 0 && <p className="text-sm text-muted-foreground">No risk alerts yet.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nl">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Natural Language Reporting</CardTitle>
                <CardDescription>Ask plain-language questions and generate detailed reports.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input value={reportQuery} onChange={(e) => setReportQuery(e.target.value)} />
                </div>
                <Button onClick={generateNlReport} disabled={reportLoading}>{reportLoading ? 'Generating...' : 'Generate Report'}</Button>
                <div className="space-y-2">
                  <Label>Latest Answer</Label>
                  <Textarea value={reportAnswer} onChange={(e) => setReportAnswer(e.target.value)} rows={8} />
                </div>
                <div className="space-y-2">
                  <Label>Recent Reports</Label>
                  {nlReports.slice(0, 5).map((report) => (
                    <div key={report.id} className="border rounded-md p-3">
                      <p className="text-sm font-medium">{report.query}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{report.answer}</p>
                    </div>
                  ))}
                  {nlReports.length === 0 && <p className="text-sm text-muted-foreground">No reports yet.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="priority">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Intelligent Task Prioritization</CardTitle>
                <CardDescription>Automatically promote risky tasks based on due date and urgency signals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={runIntelligentPrioritization}>Run Prioritization</Button>
                <div className="space-y-2">
                  {priorityChanges.slice(0, 20).map((change) => (
                    <div key={change.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{change.taskTitle}</p>
                        <Badge>{change.fromPriority}{' -> '}{change.toPriority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{change.reason}</p>
                    </div>
                  ))}
                  {priorityChanges.length === 0 && <p className="text-sm text-muted-foreground">No prioritization runs yet.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
