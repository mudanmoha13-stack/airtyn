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

export default function ExportsScalePage() {
  const { warehouseExports, addWarehouseExport, runWarehouseExport } = useAppState();
  const [destination, setDestination] = useState<'bigquery' | 'snowflake' | 'redshift' | 'azure_synapse'>('bigquery');
  const [frequency, setFrequency] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [dataset, setDataset] = useState('pinkplan_prod.workspace_metrics');

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Data Warehouse Export</h1>
          <p className="text-muted-foreground">Export operational data to your enterprise analytics stack.</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Create Export Job</CardTitle>
            <CardDescription>Schedule recurring warehouse sync jobs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Destination</Label>
                <Select value={destination} onValueChange={(v: 'bigquery' | 'snowflake' | 'redshift' | 'azure_synapse') => setDestination(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bigquery">BigQuery</SelectItem>
                    <SelectItem value="snowflake">Snowflake</SelectItem>
                    <SelectItem value="redshift">Redshift</SelectItem>
                    <SelectItem value="azure_synapse">Azure Synapse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v: 'hourly' | 'daily' | 'weekly') => setFrequency(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Dataset</Label><Input value={dataset} onChange={(e) => setDataset(e.target.value)} /></div>
            </div>
            <Button className="w-full" onClick={() => addWarehouseExport({ destination, frequency, dataset })}>Create Export Job</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouseExports.map((job) => (
            <Card key={job.id} className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">{job.destination}</CardTitle>
                <CardDescription>{job.dataset}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Frequency</span><span>{job.frequency}</span></div>
                <div className="flex justify-between"><span>Status</span><Badge variant={job.status === 'failed' ? 'destructive' : 'secondary'}>{job.status}</Badge></div>
                <div className="flex justify-between"><span>Last Run</span><span>{job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : 'Never'}</span></div>
                <div className="flex justify-between"><span>Rows Exported</span><span>{job.rowCount.toLocaleString()}</span></div>
                <Button size="sm" className="w-full" onClick={() => runWarehouseExport(job.id)}>Run Export</Button>
              </CardContent>
            </Card>
          ))}
          {warehouseExports.length === 0 && <p className="text-sm text-muted-foreground">No warehouse export jobs configured yet.</p>}
        </div>
      </div>
    </Shell>
  );
}
