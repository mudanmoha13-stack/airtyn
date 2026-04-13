"use client";

import React, { useState } from 'react';
import { useAppState } from '@/lib/store';
import type { Notification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  AtSign,
  CheckSquare,
  AlertCircle,
  Flag,
  Users,
  Zap,
  Clock,
  FolderKanban,
  Target,
  Mail,
  Star,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

type NotificationType = Notification['type'];

const NOTIFICATION_ICONS: Partial<Record<NotificationType, React.ReactNode>> = {
  task_assigned: <CheckSquare className="h-4 w-4 text-blue-400" />,
  task_comment: <MessageSquare className="h-4 w-4 text-green-400" />,
  task_due_soon: <Clock className="h-4 w-4 text-orange-400" />,
  task_overdue: <AlertCircle className="h-4 w-4 text-red-400" />,
  task_status_changed: <Zap className="h-4 w-4 text-yellow-400" />,
  mention: <AtSign className="h-4 w-4 text-purple-400" />,
  project_updated: <FolderKanban className="h-4 w-4 text-indigo-400" />,
  sprint_started: <Zap className="h-4 w-4 text-cyan-400" />,
  sprint_ended: <Flag className="h-4 w-4 text-slate-400" />,
  goal_updated: <Target className="h-4 w-4 text-emerald-500" />,
  invitation: <Mail className="h-4 w-4 text-violet-400" />,
  milestone_due: <Calendar className="h-4 w-4 text-orange-400" />,
};

const NOTIFICATION_BG: Partial<Record<NotificationType, string>> = {
  task_assigned: 'bg-blue-500/10',
  task_comment: 'bg-green-500/10',
  task_due_soon: 'bg-orange-500/10',
  task_overdue: 'bg-red-500/10',
  task_status_changed: 'bg-yellow-500/10',
  mention: 'bg-purple-500/10',
  project_updated: 'bg-indigo-500/10',
  sprint_started: 'bg-cyan-500/10',
  sprint_ended: 'bg-slate-500/10',
  goal_updated: 'bg-emerald-500/10',
  invitation: 'bg-violet-500/10',
  milestone_due: 'bg-orange-500/10',
};

const NotificationItem: React.FC<{
  notification: Notification;
  onRead: () => void;
}> = ({ notification, onRead }) => {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  const icon = NOTIFICATION_ICONS[notification.type] ?? <Bell className="h-4 w-4 text-muted-foreground" />;
  const bg = NOTIFICATION_BG[notification.type] ?? 'bg-muted/30';

  return (
    <div
      className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/40 ${
        !notification.read ? 'bg-primary/5 border border-primary/10' : ''
      }`}
      onClick={onRead}
    >
      {/* Icon */}
      <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${bg}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{notification.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
          </div>
          {!notification.read && (
            <div className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {notification.actorName && (
            <span className="text-[10px] text-muted-foreground/60 font-medium">{notification.actorName}</span>
          )}
          <span className="text-[10px] text-muted-foreground/50">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppState();
  const [tab, setTab] = useState<'all' | 'unread' | 'mentions'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const mentionNotifications = notifications.filter((n) => n.type === 'mention');

  const displayed =
    tab === 'all'
      ? notifications
      : tab === 'unread'
        ? notifications.filter((n) => !n.read)
        : mentionNotifications;

  const sorted = [...displayed].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:w-[420px] flex flex-col p-0 gap-0">
        <SheetHeader className="flex-row items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <SheetTitle className="text-base">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => markAllNotificationsRead()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex flex-col flex-1 min-h-0">
          <TabsList className="w-full rounded-none border-b bg-background h-9 shrink-0 px-4 justify-start gap-1">
            <TabsTrigger value="all" className="text-xs h-7 px-3 rounded-md data-[state=active]:bg-primary/10">
              All {notifications.length > 0 && <span className="ml-1 text-muted-foreground">({notifications.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs h-7 px-3 rounded-md data-[state=active]:bg-primary/10">
              Unread {unreadCount > 0 && <span className="ml-1 text-primary">({unreadCount})</span>}
            </TabsTrigger>
            <TabsTrigger value="mentions" className="text-xs h-7 px-3 rounded-md data-[state=active]:bg-primary/10">
              Mentions {mentionNotifications.length > 0 && <span className="ml-1 text-muted-foreground">({mentionNotifications.length})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="flex-1 overflow-y-auto mt-0 p-3 space-y-1.5">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">
                  {tab === 'unread' ? 'All caught up!' : tab === 'mentions' ? 'No mentions yet' : 'No notifications'}
                </p>
                <p className="text-xs mt-1 opacity-60">
                  {tab === 'unread' ? "You've read all your notifications." : "We'll notify you when something happens."}
                </p>
              </div>
            ) : (
              sorted.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markNotificationRead(notification.id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="shrink-0 px-4 py-2.5 border-t bg-muted/10 text-center">
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Notification preferences
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Bell trigger button for use in header
export const NotificationBell: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { notifications } = useAppState();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={onClick}>
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
};

export default NotificationCenter;
