"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function ComplianceScalePage() {
  const { complianceControls, runComplianceCheck, addComplianceControl } = useAppState();
  const [framework, setFramework] = useState<'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA'>('SOC2');
  const [controlId, setControlId] = useState('CC7.2');
  const [title, setTitle] = useState('Change management approvals');
  const [nextReviewDate, setNextReviewDate] = useState('');

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Compliance Tooling</h1>
            <p className="text-muted-foreground">Track controls, evidence, and periodic reviews.</p>
          </div>
          <Button onClick={runComplianceCheck}>Run Compliance Check</Button>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Add Control</CardTitle>
            <CardDescription>Create and assign governance controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Framework</Label>
                <Select value={framework} onValueChange={(v: 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA') => setFramework(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOC2">SOC2</SelectItem>
                    <SelectItem value="ISO27001">ISO27001</SelectItem>
                    <SelectItem value="GDPR">GDPR</SelectItem>
                    <SelectItem value="HIPAA">HIPAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Control ID</Label><Input value={controlId} onChange={(e) => setControlId(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Next Review Date</Label><Input type="date" value={nextReviewDate} onChange={(e) => setNextReviewDate(e.target.value)} /></div>
            <Button
              className="w-full"
              onClick={() => addComplianceControl({
                id: `cc-${Date.now()}`,
                framework,
                controlId,
                title,
                status: 'warn',
                evidenceCount: 0,
                nextReviewDate: nextReviewDate || new Date().toISOString().slice(0, 10),
              })}
            >
              Add Control
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complianceControls.map((control) => (
            <Card key={control.id} className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">{control.framework} • {control.controlId}</CardTitle>
                <CardDescription>{control.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Status</span><Badge variant={control.status === 'fail' ? 'destructive' : 'secondary'}>{control.status}</Badge></div>
                <div className="flex justify-between"><span>Evidence</span><span>{control.evidenceCount}</span></div>
                <div className="flex justify-between"><span>Next Review</span><span>{control.nextReviewDate}</span></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
