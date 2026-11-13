import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity as ActivityIcon,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Circle,
  Handshake,
  Phone,
  Plus,
  Target,
  Trophy,
  Users,
  Video,
  Mail,
  StickyNote,
  Repeat,
} from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { setTaskStatus } from '@/features/tasksSlice';
import { useScopedData, useUserName } from '@/hooks/useScopedData';
import { usePermission, useToast } from '@/app/hooks';
import { Card, CardHeader, ProgressBar, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/Feedback';
import ChartTooltip from '@/components/charts/ChartTooltip';
import { ACTIVITY_TYPES, CHART, priorityMeta, ROLE_LABEL, stageMeta } from '@/utils/constants';
import { cn, formatCurrency, formatDate, formatPercent, friendlyDay, relativeTime, safeParse } from '@/utils/format';
import { conversionRate, isOpenDeal, isOpenLead, isOverdue, leadStatusCounts, monthlySeries, pctChange, taskStats, winRate } from '@/utils/metrics';
import type { ActivityType } from '@/types';

const ACTIVITY_ICON: Record<ActivityType, typeof Phone> = {
  call: Phone,
  meeting: Video,
  email: Mail,
  note: StickyNote,
  follow_up: Repeat,
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const can = usePermission();
  const userName = useUserName();
  const data = useScopedData();
  const { user, leads, deals, customers, tasks, activities, isManager } = data;

  const series = useMemo(() => monthlySeries(data, 6), [data]);
  const thisMonth = series[series.length - 1];
  const lastMonth = series[series.length - 2];
  const target = isManager ? data.users.filter((u) => u.role !== 'employee').reduce((sum, u) => sum + u.monthlyTarget, 0) : user.monthlyTarget;
  const hasTarget = target > 0;

  const openLeads = leads.filter(isOpenLead);
  const activeCustomers = customers.filter((c) => c.status === 'active');
  const openDeals = deals.filter(isOpenDeal);
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const stats = taskStats(tasks);
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');

  const priorities = useMemo(
    () =>
      [...pendingTasks]
        .sort((a, b) => (safeParse(a.dueDate)?.getTime() ?? 0) - (safeParse(b.dueDate)?.getTime() ?? 0))
        .slice(0, 5),
    [pendingTasks],
  );

  const upcoming = useMemo(
    () =>
      activities
        .filter((a) => (safeParse(a.date)?.getTime() ?? 0) > Date.now() && (a.type === 'meeting' || a.type === 'call'))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4),
    [activities],
  );

  const recent = useMemo(
    () =>
      activities
        .filter((a) => (safeParse(a.date)?.getTime() ?? 0) <= Date.now())
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [activities],
  );

  const topDeals = useMemo(() => [...openDeals].sort((a, b) => b.value - a.value).slice(0, 4), [openDeals]);
  const statusData = leadStatusCounts(leads).filter((s) => s.count > 0);
  const customerName = (id: string) => data.customers.find((c) => c.id === id)?.company ?? '—';

  const progress = hasTarget ? (thisMonth.revenue / target) * 100 : stats.rate;

  const toggleTask = (id: string, done: boolean) => {
    dispatch(setTaskStatus({ id, status: done ? 'pending' : 'completed' }));
    if (!done) toast('success', 'Task completed', 'Nice work — keep the momentum going.');
  };

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]}`}
        subtitle={`${ROLE_LABEL[user.role]} · ${formatDate(new Date().toISOString(), 'EEEE, MMMM d')}${isManager ? ' · Team view' : ''}`}
        actions={
          <>
            {can('leads.create') && (
              <Link to="/leads?new=1">
                <Button variant="secondary" icon={<Plus className="h-4 w-4" />}>
                  New lead
                </Button>
              </Link>
            )}
            <Link to="/tasks?new=1">
              <Button icon={<Plus className="h-4 w-4" />}>New task</Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={isManager ? 'Team leads' : 'Assigned leads'} value={String(openLeads.length)} icon={Target} accent={CHART.blue} hint={`${leads.filter((l) => l.status === 'new').length} new this period`} />
        <StatCard label="Active customers" value={String(activeCustomers.length)} icon={Users} accent={CHART.aqua} hint={`of ${customers.length} total accounts`} />
        <StatCard label="Ongoing deals" value={String(openDeals.length)} icon={Handshake} accent={CHART.violet} hint={`${formatCurrency(pipelineValue, true)} in pipeline`} />
        <StatCard label="Pending tasks" value={String(pendingTasks.length)} icon={CheckSquare} accent={CHART.yellow} hint={stats.overdue ? `${stats.overdue} overdue` : 'None overdue'} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue trend"
            subtitle={hasTarget ? 'Closed-won revenue vs monthly target · last 6 months' : 'Closed-won revenue · last 6 months'}
            action={
              <Badge tone={pctChange(thisMonth.revenue, lastMonth.revenue) >= 0 ? 'emerald' : 'rose'}>
                {pctChange(thisMonth.revenue, lastMonth.revenue) >= 0 ? '▲' : '▼'} {Math.abs(pctChange(thisMonth.revenue, lastMonth.revenue)).toFixed(0)}% vs last month
              </Badge>
            }
          />
          <div className="h-[290px] px-2 pb-4 pt-4 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={CHART.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: CHART.grid }} />
                <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => formatCurrency(v, true)} />
                <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} cursor={{ stroke: CHART.axis, strokeDasharray: '3 3' }} />
                {hasTarget && <ReferenceLine y={target} stroke={CHART.yellow} strokeDasharray="5 5" label={{ value: 'Target', fill: CHART.yellow, fontSize: 11, position: 'insideTopLeft' }} />}
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART.blue} strokeWidth={2.5} fill="url(#rev)" activeDot={{ r: 5, stroke: '#10162a', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title={hasTarget ? 'Monthly target' : 'Task completion'} subtitle={hasTarget ? formatDate(new Date().toISOString(), 'MMMM yyyy') : 'All time'} />
          <div className="px-5 pb-5 pt-4">
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold tracking-tight text-white">
                {hasTarget ? formatCurrency(thisMonth.revenue) : formatPercent(stats.rate)}
              </p>
              <p className="pb-1 text-sm text-muted">{hasTarget ? `of ${formatCurrency(target)}` : `${stats.completed} of ${stats.total}`}</p>
            </div>
            <ProgressBar className="mt-3 h-2.5" value={progress} color={progress >= 100 ? '#0ca30c' : CHART.blue} />
            <p className="mt-2 text-xs text-muted">
              {hasTarget ? `${Math.min(progress, 999).toFixed(0)}% of target reached` : `${stats.overdue} overdue · ${stats.inProgress} in progress`}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: 'Deal win rate', value: formatPercent(winRate(deals)), icon: Trophy },
                { label: 'Lead conversion', value: formatPercent(conversionRate(leads)), icon: Target },
                { label: 'Deals won (MTD)', value: String(thisMonth.won), icon: Handshake },
                { label: 'Tasks done (MTD)', value: String(thisMonth.tasksDone), icon: CheckCircle2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-line bg-elevated/40 p-3">
                  <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Today's priorities" subtitle="Tasks sorted by due date" action={<Link to="/tasks" className="text-xs font-medium text-brand-300 hover:text-brand-200">View all</Link>} />
          <ul className="mt-3 divide-y divide-line/70 px-2 pb-2">
            {priorities.map((t) => {
              const overdue = isOverdue(t);
              return (
                <li key={t.id} className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[0.03]">
                  <button type="button" onClick={() => toggleTask(t.id, false)} aria-label={`Mark "${t.title}" complete`} className="mt-0.5 text-muted transition hover:text-emerald-400">
                    <Circle className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-100">{t.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className={cn(overdue ? 'text-rose-300' : 'text-muted')}>{overdue ? 'Overdue · ' : ''}{friendlyDay(t.dueDate)}</span>
                      <Badge tone={priorityMeta(t.priority).tone}>{priorityMeta(t.priority).label}</Badge>
                    </div>
                  </div>
                </li>
              );
            })}
            {priorities.length === 0 && <EmptyState icon={CheckCircle2} title="All clear" description="You have no pending tasks." className="py-10" />}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Upcoming meetings & calls" subtitle="Your next scheduled touchpoints" action={<Link to="/activities" className="text-xs font-medium text-brand-300 hover:text-brand-200">Schedule</Link>} />
          <ul className="mt-3 space-y-1 px-2 pb-2">
            {upcoming.map((a) => {
              const Icon = ACTIVITY_ICON[a.type];
              return (
                <li key={a.id} className="group flex gap-3 rounded-xl px-3 py-3 transition-all duration-150 hover:bg-blue-600/[0.08] cursor-pointer">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 group-hover:scale-105 transition-transform">
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100 group-hover:text-blue-300 transition-colors">{a.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <Calendar className="h-3.5 w-3.5" aria-hidden /> {friendlyDay(a.date)} · {formatDate(a.date, 'h:mm a')}
                      {a.duration ? ` · ${a.duration} min` : ''}
                    </p>
                    {isManager && <p className="mt-0.5 text-xs text-muted">with {userName(a.ownerId)}</p>}
                  </div>
                </li>
              );
            })}
            {upcoming.length === 0 && <EmptyState icon={Calendar} title="Nothing scheduled" description="Log a meeting or call to see it here." className="py-10" />}
          </ul>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Lead status mix" subtitle={`${leads.length} leads in scope`} />
          <div className="flex flex-col items-center gap-4 px-5 pb-5 pt-2 sm:flex-row xl:flex-col 2xl:flex-row">
            <div className="h-[180px] w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="count" nameKey="label" innerRadius={54} outerRadius={82} paddingAngle={3} stroke="#10162a" strokeWidth={2}>
                    {statusData.map((s) => (
                      <Cell key={s.value} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-1">
              {statusData.map((s) => (
                <li key={s.value} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
                    {s.label}
                  </span>
                  <span className="font-semibold tabular-nums text-white">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Top open deals" subtitle="Highest value opportunities" action={<Link to="/pipeline" className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200">Pipeline <ArrowRight className="h-3 w-3" /></Link>} />
          <div className="mt-3 overflow-x-auto px-2 pb-2">
            <table className="w-full min-w-[460px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Deal</th>
                  <th className="px-3 py-2 font-medium">Stage</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                  <th className="px-3 py-2 text-right font-medium">Close</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {topDeals.map((d) => (
                  <tr key={d.id} className="transition-colors duration-150 hover:bg-blue-600/[0.08]">
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-100 hover:text-blue-300 transition-colors">{d.title}</p>
                      <p className="text-xs text-muted">{customerName(d.customerId)}</p>
                    </td>
                    <td className="px-3 py-3"><Badge tone={stageMeta(d.stage).tone}>{stageMeta(d.stage).label}</Badge></td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-white">{formatCurrency(d.value)}</td>
                    <td className="px-3 py-3 text-right text-xs text-muted">{formatDate(d.expectedClose, 'MMM d')}</td>
                  </tr>
                ))}
                {topDeals.length === 0 && (
                  <tr>
                    <td colSpan={4}><EmptyState icon={Handshake} title="No open deals" className="py-10" /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent activity" subtitle="Latest logged interactions" action={<Link to="/activities" className="text-xs font-medium text-brand-300 hover:text-brand-200">View all</Link>} />
          <ul className="mt-3 space-y-1 px-2 pb-2">
            {recent.map((a) => {
              const Icon = ACTIVITY_ICON[a.type] ?? ActivityIcon;
              const meta = ACTIVITY_TYPES.find((t) => t.value === a.type)!;
              return (
                <li key={a.id} className="group flex gap-3 rounded-xl px-3 py-3 transition-colors duration-150 hover:bg-blue-600/[0.08] cursor-pointer">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated text-slate-300 group-hover:scale-105 group-hover:text-blue-400 transition-all">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-100 group-hover:text-blue-300 transition-colors">{a.title}</p>
                      <span className="shrink-0 text-xs text-muted">{relativeTime(a.date)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">{a.description}</p>
                    <Badge tone={meta.tone} className="mt-1.5">{meta.label}</Badge>
                  </div>
                </li>
              );
            })}
            {recent.length === 0 && <EmptyState icon={ActivityIcon} title="No activity yet" className="py-10" />}
          </ul>
        </Card>
      </div>
    </>
  );
}
