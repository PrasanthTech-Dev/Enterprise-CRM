import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, Eye, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { useAppDispatch, usePermission, useToast } from '@/app/hooks';
import { deleteLead, setLeadStatus } from '@/features/leadsSlice';
import { useScopedData, useUserName } from '@/hooks/useScopedData';
import type { Lead, LeadStatus } from '@/types';
import { delay } from '@/utils/async';
import { LEAD_SOURCES, LEAD_STATUS, leadStatusMeta, sourceLabel } from '@/utils/constants';
import { cn, formatCurrency, formatDate, safeParse } from '@/utils/format';
import { isOpenLead } from '@/utils/metrics';
import Button, { IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { FilterSelect, SearchInput } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import Avatar from '@/components/ui/Avatar';
import LeadFormModal from './LeadFormModal';
import LeadDrawer from './LeadDrawer';

const PAGE_SIZE = 8;

type Sort = 'recent' | 'value' | 'followup' | 'name';

const nextFollowUp = (l: Lead) =>
  l.followUps
    .filter((f) => !f.done)
    .map((f) => f.date)
    .sort()[0];

export default function Leads() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const can = usePermission();
  const userName = useUserName();
  const { leads, users, isManager } = useScopedData();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [owner, setOwner] = useState('all');
  const [sort, setSort] = useState<Sort>('recent');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | undefined>();
  const [viewId, setViewId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.get('new') === '1' && can('leads.create')) {
      setEditing(undefined);
      setFormOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, can, setParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = leads.filter(
      (l) =>
        (status === 'all' || l.status === status) &&
        (source === 'all' || l.source === source) &&
        (owner === 'all' || l.ownerId === owner) &&
        (!q || [l.name, l.company, l.email].some((v) => v.toLowerCase().includes(q))),
    );
    return list.sort((a, b) => {
      if (sort === 'value') return b.value - a.value;
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'followup') {
        const fa = nextFollowUp(a);
        const fb = nextFollowUp(b);
        if (!fa && !fb) return 0;
        if (!fa) return 1;
        if (!fb) return -1;
        return fa.localeCompare(fb);
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [leads, query, status, source, owner, sort]);

  useEffect(() => setPage(1), [query, status, source, owner, sort]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const open = leads.filter(isOpenLead);
  const dueSoon = open.filter((l) => {
    const f = nextFollowUp(l);
    const d = safeParse(f);
    return d && d.getTime() < Date.now() + 86_400_000;
  }).length;

  const openNew = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (l: Lead) => {
    setViewId(null);
    setEditing(l);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    await delay(500);
    dispatch(deleteLead(toDelete.id));
    setDeleting(false);
    toast('success', 'Lead deleted', `${toDelete.name} was removed.`);
    setToDelete(null);
  };

  const changeStatus = (l: Lead, s: LeadStatus) => {
    dispatch(setLeadStatus({ id: l.id, status: s }));
    toast('info', 'Status updated', `${l.name} → ${leadStatusMeta(s).label}`);
  };

  const statusControl = (l: Lead) =>
    can('leads.edit') ? (
      <select
        aria-label={`Status for ${l.name}`}
        value={l.status}
        onChange={(e) => changeStatus(l, e.target.value as LeadStatus)}
        className={cn('cursor-pointer appearance-none rounded-full py-1 pl-2.5 pr-3 text-xs font-medium ring-1 ring-inset focus:outline-none focus-visible:ring-2', {
          cyan: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/25',
          brand: 'bg-brand-500/15 text-brand-300 ring-brand-500/30',
          violet: 'bg-violet-400/10 text-violet-300 ring-violet-400/25',
          amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
          orange: 'bg-orange-400/10 text-orange-300 ring-orange-400/25',
          emerald: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
          rose: 'bg-rose-400/10 text-rose-300 ring-rose-400/25',
          slate: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
        }[leadStatusMeta(l.status).tone])}
      >
        {LEAD_STATUS.map((s) => (
          <option key={s.value} value={s.value} className="bg-elevated text-slate-100">
            {s.label}
          </option>
        ))}
      </select>
    ) : (
      <Badge tone={leadStatusMeta(l.status).tone} dot>{leadStatusMeta(l.status).label}</Badge>
    );

  const followUpCell = (l: Lead) => {
    const f = nextFollowUp(l);
    if (!f) return <span className="text-xs text-muted">None scheduled</span>;
    const overdue = (safeParse(f)?.getTime() ?? Infinity) < Date.now();
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs', overdue ? 'font-medium text-rose-300' : 'text-slate-300')}>
        <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {overdue ? 'Overdue · ' : ''}
        {formatDate(f, 'MMM d')}
      </span>
    );
  };

  const actions = (l: Lead) => (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton label={`View ${l.name}`} onClick={() => setViewId(l.id)}>
        <Eye className="h-4 w-4" />
      </IconButton>
      {can('leads.edit') && (
        <IconButton label={`Edit ${l.name}`} onClick={() => openEdit(l)}>
          <Pencil className="h-4 w-4" />
        </IconButton>
      )}
      {can('leads.delete') && (
        <IconButton label={`Delete ${l.name}`} onClick={() => setToDelete(l)} className="hover:text-rose-300">
          <Trash2 className="h-4 w-4" />
        </IconButton>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={isManager ? 'All leads across your team' : 'Leads assigned to you'}
        actions={can('leads.create') && <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>New lead</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Open leads', value: open.length },
          { label: 'New', value: leads.filter((l) => l.status === 'new').length },
          { label: 'Qualified+', value: leads.filter((l) => ['qualified', 'proposal', 'negotiation'].includes(l.status)).length },
          { label: 'Follow-ups due', value: dueSoon },
        ].map((s) => (
          <Card key={s.label} className="px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, company or email" className="lg:w-72" />
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:flex-wrap lg:justify-end">
            <FilterSelect label="Filter by status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, ...LEAD_STATUS.map((s) => ({ value: s.value, label: s.label }))]} />
            <FilterSelect label="Filter by source" value={source} onChange={setSource} options={[{ value: 'all', label: 'All sources' }, ...LEAD_SOURCES]} />
            {isManager && (
              <FilterSelect label="Filter by owner" value={owner} onChange={setOwner} options={[{ value: 'all', label: 'All owners' }, ...users.filter((u) => leads.some((l) => l.ownerId === u.id)).map((u) => ({ value: u.id, label: u.name }))]} />
            )}
            <FilterSelect label="Sort leads" value={sort} onChange={(v) => setSort(v as Sort)} options={[{ value: 'recent', label: 'Recently updated' }, { value: 'value', label: 'Highest value' }, { value: 'followup', label: 'Next follow-up' }, { value: 'name', label: 'Name A–Z' }]} />
          </div>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState
            icon={Target}
            title={leads.length ? 'No leads match your filters' : 'No leads yet'}
            description={leads.length ? 'Try adjusting the search or filters.' : 'Create your first lead to start building your pipeline.'}
            action={can('leads.create') && !leads.length ? <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>New lead</Button> : undefined}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Lead</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Source</th>
                    <th className="px-3 py-3 text-right font-medium">Value</th>
                    <th className="px-3 py-3 font-medium">Next follow-up</th>
                    {isManager && <th className="px-3 py-3 font-medium">Owner</th>}
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {pageItems.map((l) => (
                    <tr key={l.id} className="group transition-colors duration-150 hover:bg-blue-600/[0.08]">
                      <td className="px-5 py-3.5">
                        <button type="button" onClick={() => setViewId(l.id)} className="flex items-center gap-3 text-left">
                          <Avatar name={l.name} size={36} className="group-hover:scale-105 transition-transform" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-100 group-hover:text-blue-300 transition-colors">{l.name}</span>
                            <span className="block truncate text-xs text-muted">{l.company}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3.5">{statusControl(l)}</td>
                      <td className="px-3 py-3.5 text-slate-300">{sourceLabel(l.source)}</td>
                      <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-white">{formatCurrency(l.value)}</td>
                      <td className="px-3 py-3.5">{followUpCell(l)}</td>
                      {isManager && <td className="px-3 py-3.5 text-slate-300">{userName(l.ownerId)}</td>}
                      <td className="px-5 py-3.5">{actions(l)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-line/70 md:hidden">
              {pageItems.map((l) => (
                <li key={l.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => setViewId(l.id)} className="flex min-w-0 items-center gap-3 text-left">
                      <Avatar name={l.name} size={40} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-100">{l.name}</span>
                        <span className="block truncate text-xs text-muted">{l.company}</span>
                      </span>
                    </button>
                    <span className="font-semibold tabular-nums text-white">{formatCurrency(l.value, true)}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {statusControl(l)}
                    {followUpCell(l)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{sourceLabel(l.source)}{isManager ? ` · ${userName(l.ownerId)}` : ''}</span>
                    {actions(l)}
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
          </>
        )}
      </Card>

      <LeadFormModal open={formOpen} lead={editing} onClose={() => setFormOpen(false)} />
      <LeadDrawer leadId={viewId} onClose={() => setViewId(null)} onEdit={openEdit} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this lead?"
        message={`“${toDelete?.name}” and all of their follow-ups will be permanently removed. This cannot be undone.`}
      />
    </>
  );
}
