import { useEffect, useMemo, useState } from 'react';
import { Activity as ActivityIcon, Calendar, Clock, Mail, Pencil, Phone, Plus, Repeat, StickyNote, Trash2, Video } from 'lucide-react';
import { useAppDispatch, usePermission, useToast } from '@/app/hooks';
import { deleteActivity } from '@/features/activitiesSlice';
import { useScopedData, useUserName } from '@/hooks/useScopedData';
import type { Activity, ActivityType } from '@/types';
import { ACTIVITY_TYPES, activityMeta } from '@/utils/constants';
import { cn, formatDate, friendlyDay, safeParse } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { FilterSelect, SearchInput } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { Tabs } from '@/components/ui/Tabs';
import ActivityFormModal from './ActivityFormModal';

const ICONS: Record<ActivityType, typeof Mail> = { call: Phone, meeting: Video, email: Mail, note: StickyNote, follow_up: Repeat };
const OUTCOME_TONE = { positive: 'emerald', neutral: 'slate', negative: 'rose' } as const;
const PAGE_SIZE = 12;

type Tab = 'history' | 'upcoming';

export default function Activities() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const can = usePermission();
  const userName = useUserName();
  const { activities, customers, leads, isManager } = useScopedData();

  const [tab, setTab] = useState<Tab>('history');
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | undefined>();
  const [toDelete, setToDelete] = useState<Activity | null>(null);

  const now = Date.now();
  const isUpcoming = (a: Activity) => (safeParse(a.date)?.getTime() ?? 0) > now;
  const manage = can('activities.log');

  const counts = useMemo(
    () => ({
      upcoming: activities.filter(isUpcoming).length,
      history: activities.length - activities.filter(isUpcoming).length,
      weekCalls: activities.filter((a) => a.type === 'call' && !isUpcoming(a) && now - (safeParse(a.date)?.getTime() ?? 0) < 7 * 86_400_000).length,
      weekMeetings: activities.filter((a) => a.type === 'meeting' && !isUpcoming(a) && now - (safeParse(a.date)?.getTime() ?? 0) < 7 * 86_400_000).length,
      weekEmails: activities.filter((a) => a.type === 'email' && !isUpcoming(a) && now - (safeParse(a.date)?.getTime() ?? 0) < 7 * 86_400_000).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activities],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activities
      .filter((a) => {
        if (tab === 'upcoming' ? !isUpcoming(a) : isUpcoming(a)) return false;
        if (type !== 'all' && a.type !== type) return false;
        return !q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
      })
      .sort((a, b) => (tab === 'upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, tab, type, query]);

  useEffect(() => setPage(1), [tab, type, query]);
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const groups = useMemo(() => {
    const map = new Map<string, Activity[]>();
    pageItems.forEach((a) => {
      const key = friendlyDay(a.date) === formatDate(a.date, 'EEE, MMM d') ? formatDate(a.date, 'EEEE, MMM d, yyyy') : friendlyDay(a.date);
      map.set(key, [...(map.get(key) ?? []), a]);
    });
    return [...map.entries()];
  }, [pageItems]);

  const related = (a: Activity) =>
    (a.customerId && customers.find((c) => c.id === a.customerId)?.company) || (a.leadId && leads.find((l) => l.id === a.leadId)?.name) || null;

  return (
    <>
      <PageHeader
        title="Activities"
        subtitle="Calls, meetings, emails and follow-ups in one timeline"
        actions={manage && <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>Log activity</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Calls · 7 days', value: counts.weekCalls, icon: Phone },
          { label: 'Meetings · 7 days', value: counts.weekMeetings, icon: Video },
          { label: 'Emails · 7 days', value: counts.weekEmails, icon: Mail },
          { label: 'Upcoming', value: counts.upcoming, icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300"><Icon className="h-[18px] w-[18px]" aria-hidden /></span>
            <div>
              <p className="text-xl font-semibold text-white">{value}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs<Tab> value={tab} onChange={setTab} items={[{ value: 'history', label: 'History', count: counts.history }, { value: 'upcoming', label: 'Upcoming', count: counts.upcoming }]} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={query} onChange={setQuery} placeholder="Search activities" className="sm:w-64" />
          <FilterSelect label="Filter by type" value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, ...ACTIVITY_TYPES.map((t) => ({ value: t.value, label: t.label }))]} />
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={ActivityIcon}
            title={tab === 'upcoming' ? 'Nothing scheduled' : 'No activities found'}
            description="Log a call, meeting, email or note to keep a record of your customer interactions."
            action={manage ? <Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>Log activity</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([label, items]) => (
            <section key={label} aria-label={label}>
              <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</h2>
              <Card className="divide-y divide-line/70">
                {items.map((a) => {
                  const Icon = ICONS[a.type];
                  const m = activityMeta(a.type);
                  const rel = related(a);
                  return (
                    <article key={a.id} className="group flex gap-4 px-4 py-4 sm:px-5">
                      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', isUpcoming(a) ? 'bg-amber-400/10 text-amber-300' : 'bg-brand-500/15 text-brand-300')}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <h3 className="text-sm font-medium text-white">{a.title}</h3>
                          <Badge tone={m.tone}>{m.label}</Badge>
                          {a.outcome && <Badge tone={OUTCOME_TONE[a.outcome]}>{a.outcome}</Badge>}
                        </div>
                        {a.description && <p className="mt-1 text-sm text-slate-400">{a.description}</p>}
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden /> {formatDate(a.date, 'h:mm a')}{a.duration ? ` · ${a.duration} min` : ''}</span>
                          {rel && <span>· {rel}</span>}
                          {isManager && <span>· {userName(a.ownerId)}</span>}
                        </p>
                      </div>
                      {manage && (isManager || true) && (
                        <div className="flex shrink-0 items-start gap-0.5 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                          <IconButton label={`Edit ${a.title}`} onClick={() => { setEditing(a); setFormOpen(true); }}><Pencil className="h-4 w-4" /></IconButton>
                          <IconButton label={`Delete ${a.title}`} onClick={() => setToDelete(a)} className="hover:text-rose-300"><Trash2 className="h-4 w-4" /></IconButton>
                        </div>
                      )}
                    </article>
                  );
                })}
              </Card>
            </section>
          ))}
          {list.length > PAGE_SIZE && (
            <Card className="overflow-hidden">
              <Pagination page={page} pageSize={PAGE_SIZE} total={list.length} onChange={setPage} />
            </Card>
          )}
        </div>
      )}

      <ActivityFormModal open={formOpen} activity={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            dispatch(deleteActivity(toDelete.id));
            toast('success', 'Activity deleted', toDelete.title);
          }
          setToDelete(null);
        }}
        title="Delete this activity?"
        message={`“${toDelete?.title}” will be removed from the timeline.`}
      />
    </>
  );
}
