import { format, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import type { Activity, Deal, Lead, LeadStatus, Task } from '@/types';
import { LEAD_STATUS } from './constants';
import { safeParse } from './format';

export const isOpenLead = (l: Lead) => l.status !== 'won' && l.status !== 'lost';
export const isOpenDeal = (d: Deal) => d.stage !== 'won' && d.stage !== 'lost';
export const isOverdue = (t: Task) => t.status !== 'completed' && (safeParse(t.dueDate)?.getTime() ?? Infinity) < Date.now();

export interface MonthPoint {
  key: string;
  label: string;
  revenue: number;
  won: number;
  lost: number;
  leads: number;
  leadsWon: number;
  conversion: number;
  tasksDone: number;
  activities: number;
}

/** Oldest → newest series of monthly KPIs for the last `months` months (including the current one). */
export function monthlySeries(
  data: { deals: Deal[]; leads: Lead[]; tasks: Task[]; activities: Activity[] },
  months: number,
): MonthPoint[] {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const ref = startOfMonth(subMonths(now, months - 1 - i));
    const inMonth = (iso?: string) => {
      const d = safeParse(iso);
      return !!d && isSameMonth(d, ref);
    };
    const won = data.deals.filter((d) => d.stage === 'won' && inMonth(d.closedAt));
    const lost = data.deals.filter((d) => d.stage === 'lost' && inMonth(d.closedAt));
    const leads = data.leads.filter((l) => inMonth(l.createdAt));
    const leadsWon = leads.filter((l) => l.status === 'won');
    return {
      key: format(ref, 'yyyy-MM'),
      label: format(ref, 'MMM'),
      revenue: won.reduce((sum, d) => sum + d.value, 0),
      won: won.length,
      lost: lost.length,
      leads: leads.length,
      leadsWon: leadsWon.length,
      conversion: leads.length ? Math.round((leadsWon.length / leads.length) * 100) : 0,
      tasksDone: data.tasks.filter((t) => t.status === 'completed' && inMonth(t.completedAt)).length,
      activities: data.activities.filter((a) => inMonth(a.date) && (safeParse(a.date)?.getTime() ?? 0) <= Date.now()).length,
    };
  });
}

export const leadStatusCounts = (leads: Lead[]) =>
  LEAD_STATUS.map((s) => ({ ...s, count: leads.filter((l) => l.status === s.value).length }));

export const winRate = (deals: Deal[]) => {
  const won = deals.filter((d) => d.stage === 'won').length;
  const lost = deals.filter((d) => d.stage === 'lost').length;
  return won + lost ? (won / (won + lost)) * 100 : 0;
};

export const conversionRate = (leads: Lead[]) => {
  const closed = leads.filter((l) => l.status === ('won' as LeadStatus) || l.status === ('lost' as LeadStatus));
  return closed.length ? (leads.filter((l) => l.status === 'won').length / closed.length) * 100 : 0;
};

export const taskStats = (tasks: Task[]) => {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const overdue = tasks.filter(isOverdue).length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  return {
    total: tasks.length,
    completed,
    inProgress,
    pending,
    overdue,
    rate: tasks.length ? (completed / tasks.length) * 100 : 0,
  };
};

export const pctChange = (current: number, previous: number) => (previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100);
