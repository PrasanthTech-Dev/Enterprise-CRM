import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Activity as ActivityIcon, ArrowLeft, Calendar, Globe, Handshake, Mail, MapPin, Pencil, Phone, Plus, Repeat, StickyNote, Users, Video } from 'lucide-react';
import { useAppSelector, usePermission } from '@/app/hooks';
import { useScopedData, useUserName } from '@/hooks/useScopedData';
import type { ActivityType } from '@/types';
import { ACTIVITY_TYPES, customerStatusMeta, stageMeta } from '@/utils/constants';
import { cn, formatCurrency, formatDate, formatDateTime, relativeTime, safeParse } from '@/utils/format';
import Avatar from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Tabs } from '@/components/ui/Tabs';
import ActivityFormModal from '@/pages/activities/ActivityFormModal';
import CustomerFormModal from './CustomerFormModal';

const ICONS: Record<ActivityType, typeof Mail> = { call: Phone, meeting: Video, email: Mail, note: StickyNote, follow_up: Repeat };
const OUTCOME_TONE = { positive: 'emerald', neutral: 'slate', negative: 'rose' } as const;

type Tab = 'timeline' | 'deals' | 'tasks';

export default function CustomerDetail() {
  const { id } = useParams();
  const can = usePermission();
  const userName = useUserName();
  const { customers, deals, activities, tasks } = useScopedData();
  const customerInStore = useAppSelector((s) => s.customers.items.find((c) => c.id === id));
  const customer = customers.find((c) => c.id === id);
  const [tab, setTab] = useState<Tab>('timeline');
  const [editOpen, setEditOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const customerDeals = useMemo(() => deals.filter((d) => d.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [deals, id]);
  const timeline = useMemo(() => activities.filter((a) => a.customerId === id).sort((a, b) => b.date.localeCompare(a.date)), [activities, id]);
  const customerTasks = useMemo(() => tasks.filter((t) => t.customerId === id).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [tasks, id]);

  if (!customer) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title={customerInStore ? 'You don\'t have access to this customer' : 'Customer not found'}
          description={customerInStore ? 'This account is managed by another team member.' : 'It may have been removed or the link is incorrect.'}
          action={<Link to="/customers"><Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>Back to customers</Button></Link>}
        />
      </Card>
    );
  }

  const meta = customerStatusMeta(customer.status);
  const won = customerDeals.filter((d) => d.stage === 'won');
  const open = customerDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
  const lifetime = won.reduce((s, d) => s + d.value, 0);
  const lastContact = timeline.find((a) => (safeParse(a.date)?.getTime() ?? 0) <= Date.now());

  return (
    <>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All customers
      </Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={customer.company} size={64} className="rounded-2xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight text-white">{customer.company}</h1>
                <Badge tone={meta.tone} dot>{meta.label}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{customer.industry} · Customer since {formatDate(customer.since, 'MMM yyyy')}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {customer.tags.map((t) => <Badge key={t} tone="brand">{t}</Badge>)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {can('activities.log') && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setLogOpen(true)}>Log activity</Button>}
            {can('customers.edit') && <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>Edit</Button>}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Lifetime value', value: formatCurrency(lifetime) },
            { label: 'Open deals', value: `${open.length} · ${formatCurrency(open.reduce((s, d) => s + d.value, 0), true)}` },
            { label: 'Interactions', value: String(timeline.filter((a) => (safeParse(a.date)?.getTime() ?? 0) <= Date.now()).length) },
            { label: 'Last contact', value: lastContact ? relativeTime(lastContact.date) : 'Never' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-elevated/40 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{s.label}</p>
              <p className="mt-1 truncate text-lg font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="h-fit xl:col-span-1">
          <CardHeader title="Contact information" />
          <div className="space-y-4 px-5 pb-5 pt-4">
            <div className="flex items-center gap-3">
              <Avatar name={customer.name} size={40} />
              <div>
                <p className="text-sm font-medium text-white">{customer.name}</p>
                <p className="text-xs text-muted">Primary contact</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden /><a href={`mailto:${customer.email}`} className="break-all text-slate-200 hover:text-brand-300">{customer.email}</a></li>
              <li className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden /><a href={`tel:${customer.phone}`} className="text-slate-200 hover:text-brand-300">{customer.phone}</a></li>
              <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden /><span className="text-slate-200">{customer.location}</span></li>
              {customer.website && <li className="flex items-start gap-3"><Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden /><a href={`https://${customer.website}`} target="_blank" rel="noreferrer" className="break-all text-slate-200 hover:text-brand-300">{customer.website}</a></li>}
              <li className="flex items-start gap-3"><Users className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden /><span className="text-slate-200">Owner: {userName(customer.ownerId)}</span></li>
            </ul>
            {customer.notes && (
              <div className="rounded-xl border border-line bg-elevated/40 p-3.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Account notes</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{customer.notes}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <Tabs<Tab>
            value={tab}
            onChange={setTab}
            items={[
              { value: 'timeline', label: 'Interaction history', count: timeline.length },
              { value: 'deals', label: 'Related deals', count: customerDeals.length },
              { value: 'tasks', label: 'Tasks', count: customerTasks.length },
            ]}
          />

          <Card>
            {tab === 'timeline' && (
              timeline.length === 0 ? (
                <EmptyState icon={ActivityIcon} title="No interactions yet" description="Log a call, meeting or email to build the account history." action={can('activities.log') ? <Button onClick={() => setLogOpen(true)} icon={<Plus className="h-4 w-4" />}>Log activity</Button> : undefined} />
              ) : (
                <ol className="relative space-y-0 px-5 py-5">
                  <span className="absolute bottom-8 left-[39px] top-8 w-px bg-line" aria-hidden />
                  {timeline.slice(0, 25).map((a) => {
                    const Icon = ICONS[a.type];
                    const m = ACTIVITY_TYPES.find((t) => t.value === a.type)!;
                    const upcoming = (safeParse(a.date)?.getTime() ?? 0) > Date.now();
                    return (
                      <li key={a.id} className="relative flex gap-4 pb-6 last:pb-0">
                        <span className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface', upcoming ? 'text-amber-300' : 'text-brand-300')}>
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-sm font-medium text-white">{a.title}</p>
                            <Badge tone={m.tone}>{m.label}</Badge>
                            {upcoming && <Badge tone="amber">Upcoming</Badge>}
                            {a.outcome && <Badge tone={OUTCOME_TONE[a.outcome]}>{a.outcome}</Badge>}
                          </div>
                          {a.description && <p className="mt-1 text-sm text-slate-400">{a.description}</p>}
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                            <Calendar className="h-3.5 w-3.5" aria-hidden /> {formatDateTime(a.date)}
                            {a.duration ? ` · ${a.duration} min` : ''} · {userName(a.ownerId)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )
            )}

            {tab === 'deals' && (
              customerDeals.length === 0 ? (
                <EmptyState icon={Handshake} title="No deals yet" description="Deals created for this customer will appear here." action={<Link to="/pipeline"><Button variant="secondary">Open pipeline</Button></Link>} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                        <th className="px-5 py-3 font-medium">Deal</th>
                        <th className="px-3 py-3 font-medium">Stage</th>
                        <th className="px-3 py-3 text-right font-medium">Value</th>
                        <th className="px-5 py-3 text-right font-medium">Close date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/70">
                      {customerDeals.slice(0, 20).map((d) => (
                        <tr key={d.id} className="hover:bg-white/[0.03]">
                          <td className="px-5 py-3.5 font-medium text-slate-100">{d.title}</td>
                          <td className="px-3 py-3.5"><Badge tone={stageMeta(d.stage).tone}>{stageMeta(d.stage).label}</Badge></td>
                          <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-white">{formatCurrency(d.value)}</td>
                          <td className="px-5 py-3.5 text-right text-xs text-muted">{formatDate(d.closedAt ?? d.expectedClose)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {tab === 'tasks' && (
              customerTasks.length === 0 ? (
                <EmptyState icon={Calendar} title="No linked tasks" description="Tasks linked to this customer will show up here." action={<Link to="/tasks?new=1"><Button variant="secondary" icon={<Plus className="h-4 w-4" />}>Create task</Button></Link>} />
              ) : (
                <ul className="divide-y divide-line/70">
                  {customerTasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <div className="min-w-0">
                        <p className={cn('truncate text-sm font-medium', t.status === 'completed' ? 'text-muted line-through' : 'text-slate-100')}>{t.title}</p>
                        <p className="text-xs text-muted">Due {formatDate(t.dueDate, 'MMM d')}</p>
                      </div>
                      <Badge tone={t.status === 'completed' ? 'emerald' : t.status === 'in_progress' ? 'brand' : 'amber'}>{t.status.replace('_', ' ')}</Badge>
                    </li>
                  ))}
                </ul>
              )
            )}
          </Card>
        </div>
      </div>

      <CustomerFormModal open={editOpen} customer={customerInStore} onClose={() => setEditOpen(false)} />
      <ActivityFormModal open={logOpen} defaults={{ customerId: customer.id }} onClose={() => setLogOpen(false)} />
    </>
  );
}
