import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, CheckSquare, Flag, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAppDispatch, usePermission, useToast } from '@/app/hooks';
import { deleteTask, setTaskStatus } from '@/features/tasksSlice';
import { useScopedData, useUserName } from '@/hooks/useScopedData';
import type { Task, TaskStatus } from '@/types';
import { PRIORITIES, TASK_STATUSES, priorityMeta, taskStatusMeta } from '@/utils/constants';
import { cn, formatDate, friendlyDay, safeParse } from '@/utils/format';
import { isOverdue, taskStats } from '@/utils/metrics';
import { Badge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import { Card, ProgressBar } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { FilterSelect, SearchInput } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import TaskFormModal from './TaskFormModal';

type Tab = 'all' | 'today' | 'overdue' | 'completed';

const isToday = (iso: string) => {
  const d = safeParse(iso);
  return !!d && d.toDateString() === new Date().toDateString();
};

export default function Tasks() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const can = usePermission();
  const userName = useUserName();
  const { tasks, customers, isManager } = useScopedData();
  const [params, setParams] = useSearchParams();

  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('all');
  const [status, setStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const manage = can('tasks.manage');

  useEffect(() => {
    if (params.get('new') === '1' && manage) {
      setEditing(undefined);
      setFormOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, manage, setParams]);

  const stats = taskStats(tasks);
  const counts = {
    all: tasks.filter((t) => t.status !== 'completed').length,
    today: tasks.filter((t) => t.status !== 'completed' && isToday(t.dueDate)).length,
    overdue: stats.overdue,
    completed: stats.completed,
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (tab === 'all' && t.status === 'completed') return false;
        if (tab === 'today' && !(t.status !== 'completed' && isToday(t.dueDate))) return false;
        if (tab === 'overdue' && !isOverdue(t)) return false;
        if (tab === 'completed' && t.status !== 'completed') return false;
        if (priority !== 'all' && t.priority !== priority) return false;
        if (status !== 'all' && t.status !== status) return false;
        return !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (tab === 'completed') return (b.completedAt ?? '').localeCompare(a.completedAt ?? '');
        const byDue = a.dueDate.localeCompare(b.dueDate);
        return byDue !== 0 ? byDue : priorityMeta(b.priority).rank - priorityMeta(a.priority).rank;
      });
  }, [tasks, tab, query, priority, status]);

  const relatedLabel = (t: Task) => (t.customerId ? customers.find((c) => c.id === t.customerId)?.company : undefined);

  const complete = (t: Task) => {
    const done = t.status === 'completed';
    dispatch(setTaskStatus({ id: t.id, status: done ? 'pending' : 'completed' }));
    toast(done ? 'info' : 'success', done ? 'Task reopened' : 'Task completed', t.title);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle={isManager ? 'Tasks across your team' : 'Stay on top of your to-dos and deadlines'}
        actions={manage && <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>New task</Button>}
      />

      <Card className="mb-4 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted">Completion rate</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-white">{Math.round(stats.rate)}%</p>
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-4">
            {[
              { label: 'Pending', value: stats.pending, cls: 'text-amber-300' },
              { label: 'In progress', value: stats.inProgress, cls: 'text-brand-300' },
              { label: 'Completed', value: stats.completed, cls: 'text-emerald-300' },
              { label: 'Overdue', value: stats.overdue, cls: 'text-rose-300' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-elevated/40 px-3.5 py-2.5">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">{s.label}</dt>
                <dd className={cn('text-xl font-semibold', s.cls)}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ProgressBar className="mt-4" value={stats.rate} color="#34d399" />
      </Card>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          items={[
            { value: 'all', label: 'Active', count: counts.all },
            { value: 'today', label: 'Due today', count: counts.today },
            { value: 'overdue', label: 'Overdue', count: counts.overdue },
            { value: 'completed', label: 'Completed', count: counts.completed },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={query} onChange={setQuery} placeholder="Search tasks" className="sm:w-60" />
          <FilterSelect label="Filter by priority" value={priority} onChange={setPriority} options={[{ value: 'all', label: 'All priorities' }, ...PRIORITIES.map((p) => ({ value: p.value, label: p.label }))]} />
          {tab !== 'completed' && (
            <FilterSelect label="Filter by status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Any status' }, ...TASK_STATUSES.filter((s) => s.value !== 'completed').map((s) => ({ value: s.value, label: s.label }))]} />
          )}
        </div>
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={tab === 'completed' ? 'Nothing completed yet' : tasks.length === 0 ? 'No tasks yet' : 'No tasks here'}
            description={tab === 'overdue' ? 'Great — nothing is overdue.' : 'Try a different tab or clear the filters.'}
            action={manage && tasks.length === 0 ? <Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>New task</Button> : undefined}
          />
        ) : (
          <ul className="divide-y divide-line/70">
            {list.map((t) => {
              const done = t.status === 'completed';
              const overdue = isOverdue(t);
              const pm = priorityMeta(t.priority);
              const sm = taskStatusMeta(t.status);
              const related = relatedLabel(t);
              return (
                <li key={t.id} className="group flex items-start gap-3.5 px-4 py-4 transition-colors duration-150 hover:bg-blue-600/[0.08] sm:px-5">
                  <button
                    type="button"
                    disabled={!manage}
                    onClick={() => complete(t)}
                    aria-label={done ? `Reopen "${t.title}"` : `Mark "${t.title}" complete`}
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 active:scale-90 hover:scale-110 disabled:cursor-not-allowed',
                      done ? 'border-emerald-400 bg-emerald-400 text-bg shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'border-muted hover:border-emerald-400 hover:shadow-[0_0_8px_rgba(52,211,153,0.3)]',
                    )}
                  >
                    {done && <Check className="h-3.5 w-3.5" strokeWidth={3.5} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <p className={cn('text-sm font-medium', done ? 'text-muted line-through' : 'text-slate-100')}>{t.title}</p>
                      <Badge tone={pm.tone}><Flag className="h-3 w-3" aria-hidden /> {pm.label}</Badge>
                      {!done && <Badge tone={sm.tone}>{sm.label}</Badge>}
                    </div>
                    {t.description && <p className="mt-1 line-clamp-1 text-sm text-muted">{t.description}</p>}
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className={cn(overdue && 'font-medium text-rose-300')}>
                        {done ? `Completed ${formatDate(t.completedAt, 'MMM d')}` : `${overdue ? 'Overdue · ' : 'Due '}${friendlyDay(t.dueDate)}, ${formatDate(t.dueDate, 'h:mm a')}`}
                      </span>
                      {related && <span>· {related}</span>}
                      {isManager && <span>· {userName(t.ownerId)}</span>}
                    </p>
                  </div>

                  {manage && (
                    <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      {!done && (
                        <select
                          aria-label={`Set status for ${t.title}`}
                          value={t.status}
                          onChange={(e) => dispatch(setTaskStatus({ id: t.id, status: e.target.value as TaskStatus }))}
                          className="mr-1 hidden rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-slate-200 focus:border-brand-500 focus:outline-none md:block"
                        >
                          {TASK_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      )}
                      <IconButton label={`Edit ${t.title}`} onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></IconButton>
                      <IconButton label={`Delete ${t.title}`} onClick={() => setToDelete(t)} className="hover:text-rose-300"><Trash2 className="h-4 w-4" /></IconButton>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <TaskFormModal open={formOpen} task={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            dispatch(deleteTask(toDelete.id));
            toast('success', 'Task deleted', toDelete.title);
          }
          setToDelete(null);
        }}
        title="Delete this task?"
        message={`“${toDelete?.title}” will be permanently removed.`}
      />
    </>
  );
}
