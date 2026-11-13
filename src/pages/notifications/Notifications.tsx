import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, CalendarClock, CheckCheck, CheckSquare, Handshake, Info, Mail, Target, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCurrentUser } from '@/app/hooks';
import { markAllRead, markRead, markUnread, removeNotification } from '@/features/notificationsSlice';
import type { NotificationType } from '@/types';
import { NOTIFICATION_META } from '@/utils/constants';
import { cn, relativeTime } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import PageHeader from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';

const ICONS: Record<NotificationType, typeof Bell> = {
  lead_assigned: Target,
  task_reminder: CheckSquare,
  meeting: CalendarClock,
  deal: Handshake,
  update: Info,
};

type Tab = 'all' | 'unread' | NotificationType;

export default function Notifications() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const all = useAppSelector((s) => s.notifications.items);
  const [tab, setTab] = useState<Tab>('all');

  const mine = useMemo(
    () =>
      all
        .filter((n) => n.userId === user.id || n.userId === 'all' || !n.userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [all, user.id],
  );
  const unread = mine.filter((n) => !n.read).length;
  const list = mine.filter((n) => (tab === 'all' ? true : tab === 'unread' ? !n.read : n.type === tab));

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `You have ${unread} unread ${unread === 1 ? 'notification' : 'notifications'}` : "You're all caught up"}
        actions={<Button variant="secondary" icon={<CheckCheck className="h-4 w-4" />} disabled={!unread} onClick={() => dispatch(markAllRead(user.id))}>Mark all as read</Button>}
      />

      <Tabs<Tab>
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'all', label: 'All', count: mine.length },
          { value: 'unread', label: 'Unread', count: unread },
          { value: 'lead_assigned', label: 'Leads' },
          { value: 'task_reminder', label: 'Tasks' },
          { value: 'meeting', label: 'Meetings' },
          { value: 'deal', label: 'Deals' },
          { value: 'update', label: 'Updates' },
        ]}
      />

      <Card>
        {list.length === 0 ? (
          <EmptyState icon={BellOff} title="No notifications" description={tab === 'unread' ? 'Everything has been read.' : 'Lead assignments, task reminders and updates will appear here.'} />
        ) : (
          <ul className="divide-y divide-line/70">
            {list.map((n) => {
              const Icon = ICONS[n.type] ?? Mail;
              const meta = NOTIFICATION_META[n.type];
              return (
                <li key={n.id} className={cn('group flex items-start gap-4 px-4 py-4 transition hover:bg-white/[0.03] sm:px-5', !n.read && 'bg-brand-500/[0.05]')}>
                  <span className={cn('relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', n.read ? 'bg-elevated text-muted' : 'bg-brand-500/15 text-brand-300')}>
                    <Icon className="h-5 w-5" aria-hidden />
                    {!n.read && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-400 ring-2 ring-surface" aria-label="Unread" />}
                  </span>
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      dispatch(markRead(n.id));
                      if (n.link) navigate(n.link);
                    }}
                  >
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className={cn('text-sm', n.read ? 'font-medium text-slate-300' : 'font-semibold text-white')}>{n.title}</span>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </span>
                    <span className="mt-1 block text-sm text-slate-400">{n.message}</span>
                    <span className="mt-1.5 block text-xs text-muted">{relativeTime(n.createdAt)}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <IconButton label={n.read ? 'Mark as unread' : 'Mark as read'} onClick={() => dispatch(n.read ? markUnread(n.id) : markRead(n.id))}>
                      <CheckCheck className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Delete notification" onClick={() => dispatch(removeNotification(n.id))} className="hover:text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
