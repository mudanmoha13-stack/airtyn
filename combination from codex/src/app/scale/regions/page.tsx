"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RegionsScalePage() {
  const { regions, addRegion, toggleRegion } = useAppState();
  const [code, setCode] = useState<'us-east' | 'us-west' | 'eu-west' | 'ap-south'>('us-west');
  const [dataResidency, setDataResidency] = useState('US');
  const [latencyMs, setLatencyMs] = useState('95');
  const [rpm, setRpm] = useState('16000');

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Multiple Regions</h1>
          <p className="text-muted-foreground">Manage multi-region availability and data residency.</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Add Region</CardTitle>
            <CardDescription>Provision additional geo regions for scale and compliance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>Region Code</Label>
                <Select value={code} onValueChange={(v: 'us-east' | 'us-west' | 'eu-west' | 'ap-south') => setCode(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-east">us-east</SelectItem>
                    <SelectItem value="us-west">us-west</SelectItem>
                    <SelectItem value="eu-west">eu-west</SelectItem>
                    <SelectItem value="ap-south">ap-south</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Residency</Label><Input value={dataResidency} onChange={(e) => setDataResidency(e.target.value)} /></div>
              <div className="space-y-2"><Label>Latency (ms)</Label><Input type="number" value={latencyMs} onChange={(e) => setLatencyMs(e.target.value)} /></div>
              <div className="space-y-2"><Label>Req/min</Label><Input type="number" value={rpm} onChange={(e) => setRpm(e.target.value)} /></div>
            </div>
            <Button className="w-full" onClick={() => addRegion({ code, active: true, primary: false, dataResidency, latencyMs: Number(latencyMs), requestRatePerMin: Number(rpm) })}>Add Region</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regions.map((region) => (
            <Card key={region.id} className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">{region.code}</CardTitle>
                <CardDescription>{region.dataResidency} residency • {region.primary ? 'Primary' : 'Secondary'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span>Latency</span><span>{region.latencyMs} ms</span></div>
                <div className="flex items-center justify-between text-sm"><span>Request Rate</span><span>{region.requestRatePerMin.toLocaleString()}/min</span></div>
                <div className="flex items-center justify-between text-sm border rounded-md p-2">
                  <span>Active</span>
                  <Switch checked={region.active} onCheckedChange={(checked) => toggleRegion(region.id, checked)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
