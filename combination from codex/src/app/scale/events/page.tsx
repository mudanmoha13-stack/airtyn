"use client";

import React, { useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function EventProcessingScalePage() {
  const { eventStats, refreshEventStats } = useAppState();

  const totals = useMemo(() => {
    return eventStats.reduce((acc, stat) => {
      acc.throughput += stat.throughputPerMin;
      acc.deadLetter += stat.deadLetterCount;
      acc.lag += stat.lagMs;
      return acc;
    }, { throughput: 0, deadLetter: 0, lag: 0 });
  }, [eventStats]);

  const avgLag = eventStats.length > 0 ? Math.round(totals.lag / eventStats.length) : 0;

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">High-Scale Event Processing</h1>
            <p className="text-muted-foreground">Monitor throughput, lag, and dead-letter queues.</p>
          </div>
          <Button onClick={refreshEventStats}>Refresh Streams</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card"><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Throughput/min</p><p className="text-2xl font-bold">{totals.throughput.toLocaleString()}</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Average Lag</p><p className="text-2xl font-bold">{avgLag} ms</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Dead-letter</p><p className="text-2xl font-bold">{totals.deadLetter}</p></CardContent></Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Stream Health</CardTitle>
            <CardDescription>Operational telemetry across event streams.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventStats.map((stream) => (
              <div key={stream.id} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{stream.stream}</p>
                  <Badge variant={stream.errorRatePct > 1 ? 'destructive' : 'secondary'}>{stream.errorRatePct}% error</Badge>
                </div>
                <div className="grid grid-cols-3 mt-2 text-xs text-muted-foreground">
                  <p>Throughput: {stream.throughputPerMin}/min</p>
                  <p>Lag: {stream.lagMs} ms</p>
                  <p>DLQ: {stream.deadLetterCount}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
