"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TeamsPage() {
  const { users, invitations, updateUserRole, acceptInvitation, canManageMembers } = useAppState();
  const [acceptName, setAcceptName] = useState('');
  const [acceptPassword, setAcceptPassword] = useState('');
  const [selectedInvitationId, setSelectedInvitationId] = useState('');
  const [message, setMessage] = useState('');

  const pendingInvites = invitations.filter((inv) => inv.status === 'pending');

  const handleAccept = () => {
    if (!selectedInvitationId || !acceptName || !acceptPassword) return;
    const result = acceptInvitation(selectedInvitationId, { name: acceptName, password: acceptPassword });
    setMessage(result.ok ? 'Invitation accepted successfully.' : result.message ?? 'Unable to accept invitation.');
    if (result.ok) {
      setAcceptName('');
      setAcceptPassword('');
      setSelectedInvitationId('');
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage invitations, roles, and workspace members.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Current workspace users and role assignments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {users.length === 0 ? <p className="text-sm text-muted-foreground">No members yet.</p> : null}
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{user.role}</Badge>
                    <Select
                      value={user.role}
                      onValueChange={(role: 'owner' | 'admin' | 'member') => updateUserRole(user.id, role)}
                      disabled={!canManageMembers}
                    >
                      <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">owner</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="member">member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Accept Invitation</CardTitle>
              <CardDescription>Finalize invited users with account setup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Pending Invitation</Label>
                <Select value={selectedInvitationId} onValueChange={setSelectedInvitationId}>
                  <SelectTrigger><SelectValue placeholder="Select invitation" /></SelectTrigger>
                  <SelectContent>
                    {pendingInvites.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>{inv.email} ({inv.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={acceptName} onChange={(e) => setAcceptName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={acceptPassword} onChange={(e) => setAcceptPassword(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleAccept}>Accept Invitation</Button>
              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
