"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
import { Plus, Trash2, Webhook, Slack, Mail, RefreshCw, ExternalLink } from 'lucide-react';

const WEBHOOK_EVENTS = [
  { id: 'task.created', label: 'Task Created' },
  { id: 'task.status_changed', label: 'Task Status Changed' },
  { id: 'task.assigned', label: 'Task Assigned' },
  { id: 'project.created', label: 'Project Created' },
  { id: 'project.updated', label: 'Project Updated' },
  { id: 'milestone.completed', label: 'Milestone Completed' },
  { id: 'member.invited', label: 'Member Invited' },
  { id: 'comment.added', label: 'Comment Added' },
];

export default function IntegrationsPage() {
  const { webhooks, addWebhook, updateWebhook, deleteWebhook, canManageMembers } = useAppState();

  // New webhook form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [whName, setWhName] = useState('');
  const [whUrl, setWhUrl] = useState('');
  const [whSecret, setWhSecret] = useState('');
  const [whEvents, setWhEvents] = useState<string[]>(['task.created', 'task.status_changed']);

  // Slack mock state
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [slackChannel, setSlackChannel] = useState('#general');

  // Email integration mock
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smtpHost, setSmtpHost] = useState('smtp.example.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpFrom, setSmtpFrom] = useState('noreply@yourorg.com');

  const handleAddWebhook = () => {
    if (!whName.trim() || !whUrl.trim() || whEvents.length === 0) return;
    addWebhook({ name: whName.trim(), url: whUrl.trim(), events: whEvents, active: true, secret: whSecret.trim() });
    setWhName(''); setWhUrl(''); setWhSecret(''); setWhEvents(['task.created']); setDialogOpen(false);
  };

  const toggleEvent = (eventId: string) => {
    setWhEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const simulateWebhookTest = (webhookId: string) => {
    updateWebhook(webhookId, {});
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">Webhooks, Slack notifications, and email workflow settings.</p>
        </div>

        {/* Webhooks section */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Webhook className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Webhooks</CardTitle>
                  <CardDescription>Send real-time event payloads to external URLs.</CardDescription>
                </div>
              </div>
              {canManageMembers && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>New Webhook</DialogTitle>
                      <DialogDescription>Configure an endpoint to receive Pinkplan events.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={whName} onChange={(e) => setWhName(e.target.value)} placeholder="e.g. CI/CD Trigger" />
                      </div>
                      <div className="space-y-2">
                        <Label>Endpoint URL</Label>
                        <Input value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="https://api.example.com/webhook" />
                      </div>
                      <div className="space-y-2">
                        <Label>Secret (optional)</Label>
                        <Input value={whSecret} onChange={(e) => setWhSecret(e.target.value)} placeholder="Used to sign payloads" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label>Events to subscribe</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {WEBHOOK_EVENTS.map((evt) => (
                            <div key={evt.id} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                id={evt.id}
                                checked={whEvents.includes(evt.id)}
                                onCheckedChange={() => toggleEvent(evt.id)}
                              />
                              <label htmlFor={evt.id} className="cursor-pointer">{evt.label}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleAddWebhook}
                        disabled={!whName.trim() || !whUrl.trim() || whEvents.length === 0}
                      >
                        Create Webhook
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {webhooks.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No webhooks configured. Add one to receive real-time event payloads.
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{wh.name}</p>
                          <Badge variant={wh.active ? 'default' : 'secondary'} className="text-xs">
                            {wh.active ? 'Active' : 'Paused'}
                          </Badge>
                          {wh.lastStatus && (
                            <Badge
                              variant={wh.lastStatus === 'success' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              Last: {wh.lastStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">{wh.url}</p>
                        {wh.lastTriggered && (
                          <p className="text-xs text-muted-foreground">Last triggered: {new Date(wh.lastTriggered).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {canManageMembers && (
                          <>
                            <Switch
                              checked={wh.active}
                              onCheckedChange={(checked) => updateWebhook(wh.id, { active: checked })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => simulateWebhookTest(wh.id)}
                              title="Test webhook"
                            >
                              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {`"${wh.name}"`} will stop receiving events immediately.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteWebhook(wh.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map((e) => (
                        <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slack integration */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Slack className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Slack</CardTitle>
                  <CardDescription>Send Pinkplan notifications to a Slack channel.</CardDescription>
                </div>
              </div>
              <Switch
                checked={slackEnabled}
                onCheckedChange={setSlackEnabled}
                disabled={!canManageMembers}
              />
            </div>
          </CardHeader>
          {slackEnabled && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Slack Incoming Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={slackWebhookUrl}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Setup
                    </a>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Input
                  value={slackChannel}
                  onChange={(e) => setSlackChannel(e.target.value)}
                  placeholder="#general"
                />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                Notifications will include: task assignments, status changes, milestone completions, and new member joins. Real Slack delivery requires a server-side integration (Phase 3).
              </div>
              {canManageMembers && (
                <Button size="sm" onClick={() => alert('Slack test message sent (mock).')}>
                  Send Test Message
                </Button>
              )}
            </CardContent>
          )}
        </Card>

        {/* Email workflow */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Email Notifications</CardTitle>
                  <CardDescription>Configure SMTP for outbound email workflows.</CardDescription>
                </div>
              </div>
              <Switch
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
                disabled={!canManageMembers}
              />
            </div>
          </CardHeader>
          {emailEnabled && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} disabled={!canManageMembers} />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} disabled={!canManageMembers} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>From Address</Label>
                <Input value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} disabled={!canManageMembers} />
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Triggered by</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {['Invitation sent', 'Task assigned', 'Milestone due soon', 'Comment mention', 'Role changed'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                Emails are currently queued in-app and visible on the Activity page. Real SMTP delivery is wired in Phase 3 via server actions.
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </Shell>
  );
}
