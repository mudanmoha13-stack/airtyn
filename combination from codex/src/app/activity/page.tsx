"use client";

import React, { useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Mail, ShieldCheck, Search } from 'lucide-react';

const EVENT_TYPE_LABELS: Record<string, string> = {
  tenant_created: 'Tenant',
  workspace_created: 'Workspace',
  project_created: 'Project',
  project_updated: 'Project',
  task_created: 'Task',
  task_status_changed: 'Task',
  task_assigned: 'Task',
  task_due_date_set: 'Task',
  comment_added: 'Comment',
  invitation_sent: 'Invite',
  invitation_accepted: 'Invite',
  role_updated: 'Team',
  milestone_created: 'Milestone',
  milestone_completed: 'Milestone',
  time_logged: 'Time',
  attachment_added: 'File',
  webhook_triggered: 'Webhook',
  template_used: 'Template',
};

export default function ActivityPage() {
  const { activity, emailNotifications, auditLog } = useAppState();
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState('');

  const actors = useMemo(() => {
    const set = new Set(activity.map((e) => e.actorName));
    return Array.from(set);
  }, [activity]);

  const eventTypes = useMemo(() => {
    const set = new Set(activity.map((e) => e.type));
    return Array.from(set);
  }, [activity]);

  const filteredActivity = useMemo(() => {
    return activity.filter((e) => {
      if (actorFilter !== 'all' && e.actorName !== actorFilter) return false;
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      return true;
    });
  }, [activity, actorFilter, typeFilter]);

  const filteredAuditLog = useMemo(() => {
    if (!auditSearch.trim()) return auditLog;
    const q = auditSearch.toLowerCase();
    return auditLog.filter((e) =>
      e.actorName.toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q) ||
      e.resource.toLowerCase().includes(q) ||
      e.details.toLowerCase().includes(q)
    );
  }, [auditLog, auditSearch]);

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Activity & Audit</h1>
          <p className="text-muted-foreground">Complete log of workspace actions, email events, and audit trail.</p>
        </div>

        <Tabs defaultValue="activity">
          <TabsList>
            <TabsTrigger value="activity" className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activity ({filteredActivity.length})
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Audit Log ({auditLog.length})
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email ({emailNotifications.length})
            </TabsTrigger>
          </TabsList>

          {/* Activity tab */}
          <TabsContent value="activity" className="mt-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <Select value={actorFilter} onValueChange={setActorFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All people" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All People</SelectItem>
                  {actors.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {eventTypes.map((t) => <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t] ?? t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Card className="glass-card">
              <CardContent className="space-y-2 max-h-[520px] overflow-auto pt-4">
                {filteredActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No activity events match the current filters.</p>
                ) : (
                  filteredActivity.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm">{event.actorName}</span>
                          <Badge variant="outline" className="text-[10px] h-4">
                            {EVENT_TYPE_LABELS[event.type] ?? event.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(event.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit log tab */}
          <TabsContent value="audit" className="mt-4">
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search audit log by actor, action, or details…"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
              />
            </div>
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="max-h-[520px] overflow-auto">
                  {filteredAuditLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {auditLog.length === 0
                        ? 'No audit entries yet. Audit log is populated as you make changes.'
                        : 'No results match your search.'}
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Time</th>
                          <th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Actor</th>
                          <th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Action</th>
                          <th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Resource</th>
                          <th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAuditLog.map((entry) => (
                          <tr key={entry.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(entry.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                              <div className="font-medium">{entry.actorName}</div>
                              <div className="text-xs text-muted-foreground">{entry.actorEmail}</div>
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className="text-xs font-mono">{entry.action}</Badge>
                            </td>
                            <td className="px-4 py-2 text-xs">
                              <Badge variant="secondary" className="text-xs">{entry.resource}</Badge>
                            </td>
                            <td className="px-4 py-2 text-xs text-muted-foreground max-w-xs truncate">{entry.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email tab */}
          <TabsContent value="email" className="mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Email Notifications</CardTitle>
                <CardDescription>Queued or sent notifications for invites and assignment updates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-auto">
                {emailNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No email notifications yet.</p>
                ) : (
                  emailNotifications.map((mail) => (
                    <div key={mail.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{mail.subject}</p>
                        <Badge variant="outline">{mail.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">To: {mail.to}</p>
                      <p className="text-sm text-muted-foreground">{mail.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(mail.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
