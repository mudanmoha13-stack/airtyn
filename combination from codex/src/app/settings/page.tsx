"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SettingsPage() {
  const { currentTenant, currentWorkspace, currentUser } = useAppState();

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Workspace and tenant profile overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Tenant</CardTitle>
              <CardDescription>Organization profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {currentTenant?.name}</p>
              <p><span className="text-muted-foreground">Slug:</span> {currentTenant?.slug}</p>
              <p><span className="text-muted-foreground">Plan:</span> {currentTenant?.plan}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>Current workspace details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {currentWorkspace?.name}</p>
              <p><span className="text-muted-foreground">ID:</span> {currentWorkspace?.id}</p>
              <p><span className="text-muted-foreground">Created:</span> {currentWorkspace ? new Date(currentWorkspace.createdAt).toLocaleDateString() : '-'}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Current User</CardTitle>
              <CardDescription>Your active role and account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {currentUser?.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {currentUser?.email}</p>
              <p><span className="text-muted-foreground">Role:</span> {currentUser?.role}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
