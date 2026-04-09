"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
  const { canManageMembers, users, invitations, projects, tasks } = useAppState();

  if (!canManageMembers) {
    return (
      <Shell>
        <Card className="glass-card max-w-2xl">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>You need owner or admin permissions to view this panel.</CardDescription>
          </CardHeader>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Basic tenant-level operational controls and metrics.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Members</p><p className="text-2xl font-bold">{users.length}</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Pending Invites</p><p className="text-2xl font-bold">{invitations.filter((i) => i.status === 'pending').length}</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Projects</p><p className="text-2xl font-bold">{projects.length}</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Tasks</p><p className="text-2xl font-bold">{tasks.length}</p></CardContent></Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Invitation Queue</CardTitle>
            <CardDescription>Current invitation statuses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitations.length === 0 ? <p className="text-sm text-muted-foreground">No invitations found.</p> : null}
            {invitations.map((invite) => (
              <div key={invite.id} className="border rounded-md p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">Role: {invite.role}</p>
                </div>
                <Badge variant="outline">{invite.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
