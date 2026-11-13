import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, Handshake, Percent, Target, Trophy } from 'lucide-react';
import { useToast } from '@/app/hooks';
import { useScopedData } from '@/hooks/useScopedData';
import { CHART, DEAL_STAGES } from '@/utils/constants';
import { downloadCsv, formatCurrency, formatPercent } from '@/utils/format';
import { conversionRate, isOpenDeal, leadStatusCounts, monthlySeries, pctChange, taskStats, winRate } from '@/utils/metrics';
import Button from '@/components/ui/Button';
import { Card, CardHeader, ProgressBar, StatCard } from '@/components/ui/Card';
import { FilterSelect } from '@/components/ui/Field';
import PageHeader from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import ChartTooltip from '@/components/charts/ChartTooltip';

type Scope = 'team' | 'mine';

const legendStyle = { fontSize: 12, color: CHART.axis, paddingTop: 8 } as const;

export default function Reports() {
  const toast = useToast();
  const [scope, setScope] = useState<Scope>('team');
  const [months, setMonths] = useState('6');
  const base = useScopedData();
  const data = useScopedData({ onlyMine: scope === 'mine' });
  const { user, deals, leads, tasks, users, isManager } = data;

  const range = Number(months);
  const series = useMemo(() => monthlySeries(data, range), [data, range]);
  const current = series[series.length - 1];
  const previous = series[series.length - 2];

  const periodRevenue = series.reduce((s, m) => s + m.revenue, 0);
  const periodWon = series.reduce((s, m) => s + m.won, 0);
  const periodLeads = series.reduce((s, m) => s + m.leads, 0);
  const periodLeadsWon = series.reduce((s, m) => s + m.leadsWon, 0);
  const periodConversion = periodLeads ? (periodLeadsWon / periodLeads) * 100 : 0;
  const stats = taskStats(tasks);
  const target = isManager && scope === 'team' ? users.filter((u) => u.role !== 'employee').reduce((s, u) => s + u.monthlyTarget, 0) : user.monthlyTarget;

  const funnel = DEAL_STAGES.filter((s) => s.value !== 'lost').map((s) => {
    const items = deals.filter((d) => (s.value === 'won' ? d.stage === 'won' : d.stage === s.value));
    return { name: s.label, count: items.length, value: items.reduce((sum, d) => sum + d.value, 0), color: s.color };
  });
  const openFunnel = funnel.filter((f) => f.name !== 'Closed won');

  const leadMix = leadStatusCounts(leads).filter((s) => s.count > 0);
  const taskPie = [
    { name: 'Completed', value: stats.completed, color: '#0ca30c' },
    { name: 'In progress', value: stats.inProgress, color: CHART.blue },
    { name: 'Pending', value: Math.max(0, stats.pending - stats.overdue), color: CHART.yellow },
    { name: 'Overdue', value: stats.overdue, color: '#d03b3b' },
  ].filter((t) => t.value > 0);

  const leaderboard = useMemo(() => {
    if (!isManager || scope !== 'team') return [];
    return users
      .filter((u) => u.role !== 'employee')
      .map((u) => {
        const mine = base.deals.filter((d) => d.ownerId === u.id);
        const won = mine.filter((d) => d.stage === 'won');
        const thisMonth = monthlySeries({ deals: mine, leads: [], tasks: [], activities: [] }, 1)[0];
        return {
          id: u.id,
          name: u.name,
          revenue: won.reduce((s, d) => s + d.value, 0),
          monthRevenue: thisMonth.revenue,
          target: u.monthlyTarget,
          won: won.length,
          rate: winRate(mine),
          open: mine.filter(isOpenDeal).length,
        };
      })
      .sort((a, b) => b.monthRevenue - a.monthRevenue);
  }, [isManager, scope, users, base.deals]);

  const exportCsv = () => {
    downloadCsv(
      `performance-${months}m.csv`,
      series.map((m) => ({ Month: m.key, Revenue: m.revenue, 'Deals won': m.won, 'Deals lost': m.lost, 'New leads': m.leads, 'Lead conversion %': m.conversion, 'Tasks completed': m.tasksDone })),
    );
    toast('success', 'Report exported', 'Your CSV download has started.');
  };

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle={isManager && scope === 'team' ? 'Team performance overview' : 'Your personal sales performance'}
        actions={
          <>
            {isManager && (
              <Tabs<Scope> value={scope} onChange={setScope} items={[{ value: 'team', label: 'Team' }, { value: 'mine', label: 'My performance' }]} />
            )}
            <FilterSelect label="Time range" value={months} onChange={setMonths} options={[{ value: '3', label: 'Last 3 months' }, { value: '6', label: 'Last 6 months' }, { value: '12', label: 'Last 12 months' }]} />
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>Export CSV</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(periodRevenue, true)} icon={Trophy} accent={CHART.blue} delta={pctChange(current.revenue, previous.revenue)} hint="this month vs last" />
        <StatCard label="Deals won" value={String(periodWon)} icon={Handshake} accent={CHART.aqua} hint={`${formatPercent(winRate(deals))} win rate`} />
        <StatCard label="Lead conversion" value={formatPercent(periodConversion)} icon={Percent} accent={CHART.violet} hint={`${periodLeadsWon} of ${periodLeads} new leads`} />
        <StatCard label="Tasks completed" value={`${stats.completed}/${stats.total}`} icon={Target} accent={CHART.yellow} hint={`${formatPercent(stats.rate)} completion`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Sales performance" subtitle="Closed-won revenue by month" />
          <div className="h-[300px] px-2 pb-4 pt-4 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: CHART.grid }} />
                <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => formatCurrency(v, true)} />
                <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="revenue" name="Revenue" fill={CHART.blue} radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Target attainment" subtitle="Current month" />
          <div className="px-5 pb-5 pt-4">
            {target > 0 ? (
              <>
                <p className="text-3xl font-semibold tracking-tight text-white">{formatPercent((current.revenue / target) * 100)}</p>
                <p className="mt-1 text-sm text-muted">{formatCurrency(current.revenue)} of {formatCurrency(target)}</p>
                <ProgressBar className="mt-4 h-2.5" value={(current.revenue / target) * 100} color={current.revenue >= target ? '#0ca30c' : CHART.blue} />
                <p className="mt-3 text-xs text-muted">
                  {current.revenue >= target ? 'Target reached — great work!' : `${formatCurrency(target - current.revenue)} remaining to hit target.`}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">No revenue target is set for your role.</p>
            )}
            <dl className="mt-6 space-y-3 text-sm">
              {[
                ['Avg. deal size', periodWon ? formatCurrency(periodRevenue / periodWon) : '—'],
                ['Open pipeline', formatCurrency(deals.filter(isOpenDeal).reduce((s, d) => s + d.value, 0), true)],
                ['Deals lost', String(series.reduce((s, m) => s + m.lost, 0))],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-t border-line pt-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-semibold text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Lead conversion rate" subtitle="% of new leads converted to won, by creation month" />
          <div className="h-[260px] px-2 pb-4 pt-4 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: CHART.grid }} />
                <YAxis tickLine={false} axisLine={false} width={40} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} cursor={{ stroke: CHART.axis, strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="conversion" name="Conversion" stroke={CHART.violet} strokeWidth={2.5} dot={{ r: 3, fill: CHART.violet, stroke: '#10162a', strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Deals won vs lost" subtitle="Closed deals by month" />
          <div className="h-[260px] px-2 pb-4 pt-4 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: CHART.grid }} />
                <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
                <Bar dataKey="won" name="Won" fill={CHART.aqua} radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="lost" name="Lost" fill={CHART.orange} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Open pipeline by stage" subtitle="Deal value in each active stage" />
          <div className="h-[260px] px-2 pb-4 pt-4 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={openFunnel} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrency(v, true)} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={96} />
                <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]} maxBarSize={26}>
                  {openFunnel.map((f) => <Cell key={f.name} fill={f.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Lead status" subtitle={`${leads.length} leads`} />
          <div className="flex h-[260px] flex-col items-center px-4 pb-4 pt-2">
            <div className="min-h-0 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadMix} dataKey="count" nameKey="label" innerRadius={48} outerRadius={78} paddingAngle={3} stroke="#10162a" strokeWidth={2}>
                    {leadMix.map((s) => <Cell key={s.value} fill={s.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-300">
              {leadMix.map((s) => (
                <li key={s.value} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} aria-hidden /> {s.label} · {s.count}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <CardHeader title="Task statistics" subtitle={`${stats.total} tasks · ${formatPercent(stats.rate)} complete`} />
          <div className="flex h-[260px] flex-col items-center px-4 pb-4 pt-2">
            <div className="min-h-0 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskPie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3} stroke="#10162a" strokeWidth={2}>
                    {taskPie.map((t) => <Cell key={t.name} fill={t.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-300">
              {taskPie.map((t) => (
                <li key={t.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: t.color }} aria-hidden /> {t.name} · {t.value}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {leaderboard.length > 0 && (
        <Card className="mt-4">
          <CardHeader title="Team leaderboard" subtitle="Ranked by revenue closed this month" />
          <div className="mt-3 overflow-x-auto pb-2">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Team member</th>
                  <th className="px-3 py-3 text-right font-medium">This month</th>
                  <th className="px-3 py-3 font-medium">Target</th>
                  <th className="px-3 py-3 text-right font-medium">Deals won</th>
                  <th className="px-3 py-3 text-right font-medium">Win rate</th>
                  <th className="px-5 py-3 text-right font-medium">Open deals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {leaderboard.map((r, i) => (
                  <tr key={r.id} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5 text-muted">{i + 1}</td>
                    <td className="px-3 py-3.5 font-medium text-slate-100">{r.name}</td>
                    <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-white">{formatCurrency(r.monthRevenue)}</td>
                    <td className="w-48 px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <ProgressBar className="h-1.5" value={r.target ? (r.monthRevenue / r.target) * 100 : 0} color={r.monthRevenue >= r.target ? '#0ca30c' : CHART.blue} />
                        <span className="w-10 text-right text-xs text-muted">{r.target ? Math.round((r.monthRevenue / r.target) * 100) : 0}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-slate-300">{r.won}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-slate-300">{formatPercent(r.rate)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-slate-300">{r.open}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="mt-4 text-xs text-muted">
        Lead conversion across all-time leads: <span className="text-slate-300">{formatPercent(conversionRate(leads))}</span> of closed leads were won.
      </p>
    </>
  );
}
