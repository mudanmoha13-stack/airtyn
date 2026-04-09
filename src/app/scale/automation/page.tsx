"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function AutomationScalePage() {
  const { automations, addAutomation, runAutomation } = useAppState();
  const [name, setName] = useState('Escalate overdue urgent tasks');
  const [active, setActive] = useState(true);
  const [trigger, setTrigger] = useState<'task.created' | 'task.overdue' | 'milestone.completed' | 'project.completed' | 'webhook.received'>('task.overdue');
  const [conditions, setConditions] = useState('priority = urgent');
  const [actions, setActions] = useState('notify_slack #ops; assign oncall manager');

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Advanced Workflow Automation</h1>
          <p className="text-muted-foreground">Build enterprise-grade trigger-condition-action workflows.</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Create Automation</CardTitle>
            <CardDescription>Compose automation rules with custom conditions and actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="flex items-center justify-between border rounded-md p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Run this automation on matching events.</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={trigger} onValueChange={(v: 'task.created' | 'task.overdue' | 'milestone.completed' | 'project.completed' | 'webhook.received') => setTrigger(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="task.created">task.created</SelectItem>
                  <SelectItem value="task.overdue">task.overdue</SelectItem>
                  <SelectItem value="milestone.completed">milestone.completed</SelectItem>
                  <SelectItem value="project.completed">project.completed</SelectItem>
                  <SelectItem value="webhook.received">webhook.received</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Conditions (semicolon separated)</Label><Input value={conditions} onChange={(e) => setConditions(e.target.value)} /></div>
            <div className="space-y-2"><Label>Actions (semicolon separated)</Label><Input value={actions} onChange={(e) => setActions(e.target.value)} /></div>
            <Button
              className="w-full"
              onClick={() => {
                if (!name.trim()) return;
                addAutomation({ name: name.trim(), active, trigger, conditions: conditions.split(';').map((x) => x.trim()).filter(Boolean), actions: actions.split(';').map((x) => x.trim()).filter(Boolean) });
              }}
            >
              Save Automation
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {automations.map((automation) => (
            <Card key={automation.id} className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">{automation.name}</CardTitle>
                <CardDescription>{automation.trigger} • {automation.active ? 'active' : 'inactive'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Conditions</p>
                  <ul className="text-sm space-y-1">{automation.conditions.map((c) => <li key={c}>• {c}</li>)}</ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Actions</p>
                  <ul className="text-sm space-y-1">{automation.actions.map((a) => <li key={a}>• {a}</li>)}</ul>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Runs: {automation.runCount}</span>
                  <span>{automation.lastRunAt ? new Date(automation.lastRunAt).toLocaleString() : 'Never run'}</span>
                </div>
                <Button size="sm" className="w-full" onClick={() => runAutomation(automation.id)}>Run Now</Button>
              </CardContent>
            </Card>
          ))}
          {automations.length === 0 && <p className="text-sm text-muted-foreground">No automations configured yet.</p>}
        </div>
      </div>
    </Shell>
  );
}
