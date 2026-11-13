import type {
  ActivityType,
  CustomerStatus,
  DealStage,
  LeadSource,
  LeadStatus,
  NotificationType,
  Permission,
  Role,
  TaskPriority,
  TaskStatus,
} from '@/types';

export type Tone = 'brand' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate' | 'orange';

export const TONE_CLASSES: Record<Tone, string> = {
  brand: 'bg-brand-500/15 text-brand-300 ring-brand-500/30',
  cyan: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/25',
  emerald: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
  amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  rose: 'bg-rose-400/10 text-rose-300 ring-rose-400/25',
  violet: 'bg-violet-400/10 text-violet-300 ring-violet-400/25',
  orange: 'bg-orange-400/10 text-orange-300 ring-orange-400/25',
  slate: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
};

/** Fixed categorical order for charts (dark-surface steps). Colour follows the entity, never its rank. */
export const CHART = {
  blue: '#3987e5',
  orange: '#d95926',
  aqua: '#199e70',
  yellow: '#c98500',
  magenta: '#d55181',
  violet: '#9085e9',
  grid: '#232c47',
  axis: '#8a94b2',
};

export const LEAD_STATUS: { value: LeadStatus; label: string; tone: Tone; color: string }[] = [
  { value: 'new', label: 'New', tone: 'cyan', color: CHART.blue },
  { value: 'contacted', label: 'Contacted', tone: 'brand', color: CHART.violet },
  { value: 'qualified', label: 'Qualified', tone: 'violet', color: CHART.aqua },
  { value: 'proposal', label: 'Proposal', tone: 'amber', color: CHART.yellow },
  { value: 'negotiation', label: 'Negotiation', tone: 'orange', color: CHART.orange },
  { value: 'won', label: 'Won', tone: 'emerald', color: '#0ca30c' },
  { value: 'lost', label: 'Lost', tone: 'rose', color: '#d03b3b' },
];
export const leadStatusMeta = (s: LeadStatus) => LEAD_STATUS.find((x) => x.value === s)!;

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'cold_call', label: 'Cold call' },
  { value: 'event', label: 'Event' },
  { value: 'email_campaign', label: 'Email campaign' },
];
export const sourceLabel = (s: LeadSource) => LEAD_SOURCES.find((x) => x.value === s)?.label ?? s;

export const DEAL_STAGES: { value: DealStage; label: string; tone: Tone; probability: number; color: string }[] = [
  { value: 'prospecting', label: 'Prospecting', tone: 'cyan', probability: 10, color: CHART.blue },
  { value: 'qualification', label: 'Qualification', tone: 'violet', probability: 30, color: CHART.violet },
  { value: 'proposal', label: 'Proposal', tone: 'amber', probability: 55, color: CHART.yellow },
  { value: 'negotiation', label: 'Negotiation', tone: 'orange', probability: 75, color: CHART.orange },
  { value: 'won', label: 'Closed won', tone: 'emerald', probability: 100, color: '#0ca30c' },
  { value: 'lost', label: 'Closed lost', tone: 'rose', probability: 0, color: '#d03b3b' },
];
export const stageMeta = (s: DealStage) => DEAL_STAGES.find((x) => x.value === s)!;

export const PRIORITIES: { value: TaskPriority; label: string; tone: Tone; rank: number }[] = [
  { value: 'low', label: 'Low', tone: 'slate', rank: 0 },
  { value: 'medium', label: 'Medium', tone: 'cyan', rank: 1 },
  { value: 'high', label: 'High', tone: 'amber', rank: 2 },
  { value: 'urgent', label: 'Urgent', tone: 'rose', rank: 3 },
];
export const priorityMeta = (p: TaskPriority) => PRIORITIES.find((x) => x.value === p)!;

export const TASK_STATUSES: { value: TaskStatus; label: string; tone: Tone }[] = [
  { value: 'pending', label: 'Pending', tone: 'amber' },
  { value: 'in_progress', label: 'In progress', tone: 'brand' },
  { value: 'completed', label: 'Completed', tone: 'emerald' },
];
export const taskStatusMeta = (s: TaskStatus) => TASK_STATUSES.find((x) => x.value === s)!;

export const ACTIVITY_TYPES: { value: ActivityType; label: string; tone: Tone }[] = [
  { value: 'call', label: 'Call', tone: 'emerald' },
  { value: 'meeting', label: 'Meeting', tone: 'brand' },
  { value: 'email', label: 'Email', tone: 'cyan' },
  { value: 'note', label: 'Note', tone: 'slate' },
  { value: 'follow_up', label: 'Follow-up', tone: 'amber' },
];
export const activityMeta = (t: ActivityType) => ACTIVITY_TYPES.find((x) => x.value === t)!;

export const CUSTOMER_STATUSES: { value: CustomerStatus; label: string; tone: Tone }[] = [
  { value: 'active', label: 'Active', tone: 'emerald' },
  { value: 'at_risk', label: 'At risk', tone: 'amber' },
  { value: 'inactive', label: 'Inactive', tone: 'slate' },
];
export const customerStatusMeta = (s: CustomerStatus) => CUSTOMER_STATUSES.find((x) => x.value === s)!;

export const NOTIFICATION_META: Record<NotificationType, { label: string; tone: Tone }> = {
  lead_assigned: { label: 'Lead assigned', tone: 'brand' },
  task_reminder: { label: 'Task reminder', tone: 'amber' },
  meeting: { label: 'Meeting', tone: 'cyan' },
  deal: { label: 'Deal update', tone: 'emerald' },
  update: { label: 'Update', tone: 'violet' },
};

export const INDUSTRIES = [
  'Software', 'Fintech', 'Healthcare', 'Retail', 'Manufacturing', 'Logistics', 'Education', 'Energy', 'Media', 'Real estate',
];

export const ROLE_LABEL: Record<Role, string> = {
  employee: 'Employee',
  sales_rep: 'Sales Representative',
  manager: 'Sales Manager',
};

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  employee: ['leads.edit', 'tasks.manage', 'activities.log'],
  sales_rep: [
    'leads.create', 'leads.edit', 'pipeline.manage', 'customers.create', 'customers.edit', 'tasks.manage', 'activities.log',
  ],
  manager: [
    'leads.create', 'leads.edit', 'leads.delete', 'pipeline.manage', 'customers.create', 'customers.edit',
    'tasks.manage', 'activities.log', 'team.view',
  ],
};

export const TIMEZONES = [
  'Asia/Kolkata', 'UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin',
  'Asia/Dubai', 'Asia/Singapore', 'Australia/Sydney',
];

export const DEMO_OTP = '123456';
