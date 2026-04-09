"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const PERMISSIONS = [
  'projects.read', 'projects.write', 'tasks.read', 'tasks.write', 'members.read', 'members.write',
  'billing.read', 'settings.write', 'automation.write', 'reports.read', 'compliance.read', 'compliance.write',
] as const;

export default function RolesScalePage() {
  const { customRoles, users, addCustomRole, deleteCustomRole } = useAppState();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>(['projects.read', 'tasks.read', 'reports.read']);

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Custom Roles and Permissions</h1>
          <p className="text-muted-foreground">Create granular access models for enterprise teams.</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Create Custom Role</CardTitle>
            <CardDescription>Define reusable permission bundles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Role Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Program Manager" /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Owns planning and delivery workflows" /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3">
              {PERMISSIONS.map((perm) => (
                <label key={perm} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.includes(perm)}
                    onCheckedChange={(checked) => {
                      setSelected((prev) => checked ? [...prev, perm] : prev.filter((p) => p !== perm));
                    }}
                  />
                  <span>{perm}</span>
                </label>
              ))}
            </div>
            <Button
              onClick={() => {
                if (!name.trim()) return;
                addCustomRole({ name: name.trim(), description: description.trim(), permissions: selected as never[], userIds: [] });
                setName('');
                setDescription('');
                setSelected(['projects.read', 'tasks.read', 'reports.read']);
              }}
              className="w-full"
            >
              Create Role
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customRoles.map((role) => (
            <Card key={role.id} className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{role.name}</span>
                  <Button variant="destructive" size="sm" onClick={() => deleteCustomRole(role.id)} disabled={role.system}>Delete</Button>
                </CardTitle>
                <CardDescription>{role.description || 'No description provided.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-[11px]">{permission}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Assigned users: {users.filter((u) => role.userIds.includes(u.id)).length}</p>
              </CardContent>
            </Card>
          ))}
          {customRoles.length === 0 && <p className="text-sm text-muted-foreground">No custom roles yet.</p>}
        </div>
      </div>
    </Shell>
  );
}
