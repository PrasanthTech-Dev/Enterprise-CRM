import { useMemo, useState, type DragEvent } from 'react';
import { subDays } from 'date-fns';
import { CalendarDays, GripVertical, Handshake, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAppDispatch, usePermission, useToast } from '@/app/hooks';
import { deleteDeal, moveDeal } from '@/features/dealsSlice';
import { useScopedData, useUserName } from '@/hooks/useScopedData';
import type { Deal, DealStage } from '@/types';
import { DEAL_STAGES, stageMeta } from '@/utils/constants';
import { cn, formatCurrency, formatDate, safeParse } from '@/utils/format';
import { isOpenDeal } from '@/utils/metrics';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Card, ProgressBar } from '@/components/ui/Card';
import { FilterSelect, SearchInput } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import DealFormModal from './DealFormModal';

const CLOSED_WINDOW_DAYS = 30;

export default function Pipeline() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const can = usePermission();
  const userName = useUserName();
  const { deals, customers, users, isManager } = useScopedData();

  const [query, setQuery] = useState('');
  const [owner, setOwner] = useState('all');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DealStage | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | undefined>();
  const [newStage, setNewStage] = useState<DealStage | undefined>();
  const [toDelete, setToDelete] = useState<Deal | null>(null);

  const manage = can('pipeline.manage');
  const company = (id: string) => customers.find((c) => c.id === id)?.company ?? 'Unknown customer';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff = subDays(new Date(), CLOSED_WINDOW_DAYS).getTime();
    return deals.filter((d) => {
      if (owner !== 'all' && d.ownerId !== owner) return false;
      if (!isOpenDeal(d) && (safeParse(d.closedAt)?.getTime() ?? 0) < cutoff) return false;
      return !q || d.title.toLowerCase().includes(q) || company(d.customerId).toLowerCase().includes(q);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });
  }, [deals, query, owner, customers]);

  const open = visible.filter(isOpenDeal);
  const openValue = open.reduce((s, d) => s + d.value, 0);
  const forecast = open.reduce((s, d) => s + (d.value * d.probability) / 100, 0);
  const wonValue = visible.filter((d) => d.stage === 'won').reduce((s, d) => s + d.value, 0);

  const move = (deal: Deal, stage: DealStage) => {
    if (!manage || deal.stage === stage) return;
    dispatch(moveDeal({ id: deal.id, stage }));
    toast(stage === 'won' ? 'success' : 'info', stage === 'won' ? '🎉 Deal won!' : 'Deal moved', `${deal.title} → ${stageMeta(stage).label}`);
  };

  const onDrop = (e: DragEvent, stage: DealStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    const deal = deals.find((d) => d.id === id);
    setOverStage(null);
    setDragId(null);
    if (deal) move(deal, stage);
  };

  const openNew = (stage?: DealStage) => {
    setEditing(undefined);
    setNewStage(stage);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Sales Pipeline"
        subtitle={manage ? 'Drag deals between stages to update their progress' : 'Read-only view of your deals'}
        actions={manage && <Button icon={<Plus className="h-4 w-4" />} onClick={() => openNew()}>New deal</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Open deals', value: String(open.length) },
          { label: 'Pipeline value', value: formatCurrency(openValue, true) },
          { label: 'Weighted forecast', value: formatCurrency(forecast, true) },
          { label: `Won · last ${CLOSED_WINDOW_DAYS}d`, value: formatCurrency(wonValue, true) },
        ].map((s) => (
          <Card key={s.label} className="px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={query} onChange={setQuery} placeholder="Search deals or customers" className="sm:w-72" />
        {isManager && (
          <FilterSelect label="Filter by owner" value={owner} onChange={setOwner} options={[{ value: 'all', label: 'Whole team' }, ...users.filter((u) => deals.some((d) => d.ownerId === u.id)).map((u) => ({ value: u.id, label: u.name }))]} />
        )}
      </div>

      <div className="w-full max-w-full overflow-x-auto pb-4 overscroll-x-contain" aria-label="Pipeline board">
        <div className="flex min-w-max gap-4 pb-1">
          {DEAL_STAGES.map((stage) => {
            const items = visible.filter((d) => d.stage === stage.value).sort((a, b) => b.value - a.value);
            const total = items.reduce((s, d) => s + d.value, 0);
            const isOver = overStage === stage.value && dragId !== null;
            return (
              <section
                key={stage.value}
                aria-label={`${stage.label} column`}
                onDragOver={(e) => {
                  if (!manage) return;
                  e.preventDefault();
                  setOverStage(stage.value);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStage(null);
                }}
                onDrop={(e) => onDrop(e, stage.value)}
                className={cn(
                  'flex w-[296px] shrink-0 flex-col rounded-2xl border bg-surface/70 transition',
                  isOver ? 'border-brand-400 bg-brand-500/10 shadow-glow' : 'border-line',
                )}
              >
                <header className="border-b border-line px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} aria-hidden />
                      {stage.label}
                    </h2>
                    <span className="rounded-full bg-elevated px-2 py-0.5 text-xs font-semibold text-slate-300">{items.length}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{formatCurrency(total)}{stage.value === 'won' || stage.value === 'lost' ? ` · last ${CLOSED_WINDOW_DAYS} days` : ''}</p>
                </header>

                <ul className="flex min-h-[140px] flex-1 flex-col gap-3 p-3">
                  {items.map((d) => {
                    const overdue = isOpenDeal(d) && (safeParse(d.expectedClose)?.getTime() ?? Infinity) < Date.now();
                    return (
                      <li
                        key={d.id}
                        draggable={manage}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', d.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDragId(d.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverStage(null);
                        }}
                        className={cn(
                          'group rounded-xl border border-line bg-elevated p-3.5 transition-all duration-200',
                          manage && 'cursor-grab active:cursor-grabbing hover:-translate-y-1',
                          dragId === d.id ? 'opacity-40 scale-95' : 'hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{d.title}</p>
                            <p className="truncate text-xs text-muted">{company(d.customerId)}</p>
                          </div>
                          {manage && <GripVertical className="h-4 w-4 shrink-0 text-muted/60 opacity-0 transition group-hover:opacity-100" aria-hidden />}
                        </div>

                        <p className="mt-3 text-lg font-semibold tabular-nums text-white">{formatCurrency(d.value)}</p>

                        {isOpenDeal(d) && (
                          <div className="mt-2.5">
                            <div className="mb-1 flex justify-between text-[11px] text-muted">
                              <span>Win probability</span>
                              <span className="font-medium text-slate-300">{d.probability}%</span>
                            </div>
                            <ProgressBar value={d.probability} color={stage.color} className="h-1.5" />
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                          <span className={cn('inline-flex items-center gap-1.5', overdue ? 'text-rose-300' : 'text-muted')}>
                            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                            {isOpenDeal(d) ? formatDate(d.expectedClose, 'MMM d') : `Closed ${formatDate(d.closedAt, 'MMM d')}`}
                            {overdue && ' · overdue'}
                          </span>
                          {isManager && (
                            <span title={userName(d.ownerId)}>
                              <Avatar name={userName(d.ownerId)} size={22} />
                            </span>
                          )}
                        </div>

                        {manage && (
                          <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">
                            <select
                              aria-label={`Move ${d.title} to another stage`}
                              value={d.stage}
                              onChange={(e) => move(d, e.target.value as DealStage)}
                              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                            >
                              {DEAL_STAGES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                            <button type="button" aria-label={`Edit ${d.title}`} onClick={() => { setEditing(d); setFormOpen(true); }} className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-white">
                              <Pencil className="h-4 w-4" />
                            </button>
                            {isManager && (
                              <button type="button" aria-label={`Delete ${d.title}`} onClick={() => setToDelete(d)} className="rounded-lg p-1.5 text-muted transition hover:bg-rose-500/10 hover:text-rose-300">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                  {items.length === 0 && (
                    <li className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-line px-3 py-8 text-center text-xs text-muted">
                      <Handshake className="mb-2 h-5 w-5 opacity-60" aria-hidden />
                      {manage ? 'Drop a deal here' : 'No deals'}
                    </li>
                  )}
                </ul>

                {manage && stage.value !== 'won' && stage.value !== 'lost' && (
                  <button
                    type="button"
                    onClick={() => openNew(stage.value)}
                    className="mx-3 mb-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-2 text-xs font-medium text-muted transition hover:border-brand-500/60 hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add deal
                  </button>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <DealFormModal open={formOpen} deal={editing} defaultStage={newStage} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            dispatch(deleteDeal(toDelete.id));
            toast('success', 'Deal deleted', toDelete.title);
          }
          setToDelete(null);
        }}
        title="Delete this deal?"
        message={`“${toDelete?.title}” will be removed from the pipeline permanently.`}
      />
    </>
  );
}
