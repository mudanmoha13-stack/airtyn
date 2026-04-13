"use client";

import React, { useState } from 'react';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle2,
  Clock,
  Copy,
  Link2,
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  Send,
  Shield,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

// ─── Role badge colours ──────────────────────────────────────────────────────
const ROLE_COLOURS: Record<string, string> = {
  owner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  member: 'bg-green-500/20 text-green-400 border-green-500/30',
};

// ─── Invite status colours ───────────────────────────────────────────────────
const INVITE_STATUS_COLOURS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  accepted: 'bg-green-500/20 text-green-400',
  revoked: 'bg-muted text-muted-foreground',
};

type InviteResult = { ok: true; inviteLink: string; warning?: string } | { ok: false; error: string };

export default function TeamsPage() {
  const {
    users,
    invitations,
    currentUser,
    currentTenant,
    currentWorkspace,
    updateUserRole,
    inviteUser,
    canManageMembers,
  } = useAppState();

  // ── Invite dialog state ───────────────────────────────────────────────────
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [sending, setSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);

  // ── Send invite ───────────────────────────────────────────────────────────
  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !currentTenant || !currentUser) return;

    setSending(true);
    setInviteResult(null);

    try {
      const res = await fetch('/api/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          tenantId: currentTenant.id,
          tenantName: currentTenant.name,
          workspaceName: currentWorkspace?.name ?? currentTenant.name,
          invitedByName: currentUser.name,
        }),
      });

      const data = (await res.json()) as { ok: boolean; inviteLink?: string; warning?: string; error?: string };

      if (data.ok && data.inviteLink) {
        // Also record in local state so invitations list shows the pending invite
        inviteUser(inviteEmail.trim().toLowerCase(), inviteRole);
        setInviteResult({ ok: true, inviteLink: data.inviteLink, warning: data.warning });
      } else {
        setInviteResult({ ok: false, error: data.error ?? 'Failed to send invitation' });
      }
    } catch {
      setInviteResult({ ok: false, error: 'Network error — please try again.' });
    } finally {
      setSending(false);
    }
  };

  const handleInviteClose = () => {
    setInviteOpen(false);
    setInviteEmail('');
    setInviteRole('member');
    setInviteResult(null);
  };

  const copyLink = (link: string) => {
    void navigator.clipboard.writeText(link);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage workspace members, roles, and invitations.</p>
        </div>
        {canManageMembers && (
          <Button onClick={() => setInviteOpen(true)} className="gap-2 shrink-0">
            <UserPlus className="h-4 w-4" />
            Invite member
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invitations.filter((i) => i.status === 'pending').length}</p>
                <p className="text-xs text-muted-foreground">Pending invites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invitations.filter((i) => i.status === 'accepted').length}</p>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members table */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Members
          </CardTitle>
          <CardDescription>Current workspace users and their roles.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="px-6 py-10 text-center text-muted-foreground text-sm">
              No members yet. Invite someone to get started.
            </div>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.name}
                        {user.id === currentUser?.id && (
                          <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-xs ${ROLE_COLOURS[user.role]}`}>
                      {user.role}
                    </Badge>

                    {canManageMembers && user.id !== currentUser?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-sm">
                          <DropdownMenuItem onClick={() => updateUserRole(user.id, 'admin')}>
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateUserRole(user.id, 'member')}>
                            Make Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateUserRole(user.id, 'owner')} className="text-purple-400">
                            Transfer Ownership
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitations list */}
      {invitations.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" /> Invitations
            </CardTitle>
            <CardDescription>Email invitations sent to this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited as <span className="font-medium">{inv.role}</span>
                        {' · '}
                        {new Date(inv.invitedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <Badge className={`text-xs shrink-0 ${INVITE_STATUS_COLOURS[inv.status]}`}>
                    {inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Invite dialog ─────────────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { if (!o) handleInviteClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4" /> Invite team member
            </DialogTitle>
            <DialogDescription>
              An email will be sent with a link to create their account and join the workspace.
            </DialogDescription>
          </DialogHeader>

          {/* ── Success state ─────────────────────────────────────────────── */}
          {inviteResult?.ok ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-500">Invitation sent!</p>
                  <p className="text-muted-foreground mt-0.5">
                    {inviteResult.warning
                      ? inviteResult.warning
                      : `An email was sent to ${inviteEmail}. They'll receive a link to join the workspace.`}
                  </p>
                </div>
              </div>

              {/* Invite link copy (always show as backup) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Link2 className="h-3 w-3" /> Invite link (share manually as backup)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteResult.inviteLink}
                    readOnly
                    className="text-xs font-mono bg-muted/30"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => inviteResult.ok && copyLink(inviteResult.inviteLink)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleInviteClose}>Close</Button>
                <Button onClick={() => {
                  setInviteEmail('');
                  setInviteRole('member');
                  setInviteResult(null);
                }}>
                  <Plus className="h-4 w-4 mr-1.5" /> Invite another
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* ── Form state ─────────────────────────────────────────────── */
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={sending}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && !sending && void handleSendInvite()}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)} disabled={sending}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div>
                        <span className="font-medium">Member</span>
                        <span className="text-xs text-muted-foreground ml-2">Can view and manage tasks</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div>
                        <span className="font-medium">Admin</span>
                        <span className="text-xs text-muted-foreground ml-2">Can manage members and projects</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="owner">
                      <div>
                        <span className="font-medium">Owner</span>
                        <span className="text-xs text-muted-foreground ml-2">Full workspace access</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {inviteResult && !inviteResult.ok && (
                <p className="text-sm text-destructive flex items-start gap-1.5">
                  <X className="h-4 w-4 shrink-0 mt-0.5" /> {inviteResult.error}
                </p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={handleInviteClose} disabled={sending}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleSendInvite()}
                  disabled={!inviteEmail.trim() || sending}
                  className="gap-2"
                >
                  {sending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="h-4 w-4" /> Send invitation</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
