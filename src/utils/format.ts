import clsx, { type ClassValue } from 'clsx';
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

export const formatCurrency = (value: number, compact = false) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);

export const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

export const formatPercent = (value: number, digits = 0) => `${value.toFixed(digits)}%`;

export const safeParse = (iso?: string | null) => {
  if (!iso) return null;
  const d = parseISO(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (iso?: string | null, pattern = 'MMM d, yyyy') => {
  const d = safeParse(iso);
  return d ? format(d, pattern) : '—';
};

export const formatDateTime = (iso?: string | null) => formatDate(iso, 'MMM d, yyyy · h:mm a');

export const relativeTime = (iso?: string | null) => {
  const d = safeParse(iso);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : '—';
};

export const friendlyDay = (iso?: string | null) => {
  const d = safeParse(iso);
  if (!d) return '—';
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, MMM d');
};

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

const AVATAR_COLORS = ['#6470f3', '#22d3ee', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#38bdf8', '#f472b6'];
export const avatarColor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

/** `yyyy-MM-dd` for <input type="date"> */
export const toDateInput = (iso?: string | null) => {
  const d = safeParse(iso);
  return d ? format(d, 'yyyy-MM-dd') : '';
};

/** `yyyy-MM-ddTHH:mm` for <input type="datetime-local"> */
export const toDateTimeInput = (iso?: string | null) => {
  const d = safeParse(iso);
  return d ? format(d, "yyyy-MM-dd'T'HH:mm") : '';
};

export const fromInput = (value: string) => (value ? new Date(value).toISOString() : '');

export const downloadCsv = (filename: string, rows: Record<string, string | number>[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
