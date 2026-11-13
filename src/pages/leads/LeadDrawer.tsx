import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CalendarClock, Check, Mail, Phone, Plus, Trash2, UserCheck, Wallet } from 'lucide-react';
import { useAppDispatch, useAppSelector, usePermission, useToast } from '@/app/hooks';
import { addCustomer } from '@/features/customersSlice';
import { addDeal } from '@/features/dealsSlice';
import { addFollowUp, removeFollowUp, setLeadStatus, toggleFollowUp, updateLead } from '@/features/leadsSlice';
import { useUserName } from '@/hooks/useScopedData';
import type { Lead, LeadStatus } from '@/types';
import { delay } from '@/utils/async';
import { LEAD_STATUS, leadStatusMeta, sourceLabel } from '@/utils/constants';
import { cn, formatCurrency, formatDate, fromInput, relativeTime, safeParse, uid } from '@/utils/format';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Field';
import { Drawer } from '@/components/ui/Modal';
import { addDays } from 'date-fns';

export default function LeadDrawer({ leadId, onClose, onEdit }: { leadId: string | null; onClose: () => void; onEdit: (l: Lead) => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const can = usePermission();
  const userName = useUserName();
  const lead = useAppSelector((s) => s.leads.items.find((l) => l.id === leadId));
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [fuError, setFuError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  if (!lead) return null;
  const editable = can('leads.edit');
  const meta = leadStatusMeta(lead.status);
  const followUps = [...lead.followUps].sort((a, b) => a.date.localeCompare(b.date));
  const canConvert = can('customers.create') && !lead.convertedCustomerId && lead.status !== 'lost' && lead.status !== 'won';

  const submitFollowUp = () => {
    if (!date) return setFuError('Pick a follow-up date');
    if (note.trim().length < 3) return setFuError('Add a short note (3+ characters)');
    setFuError(null);
    dispatch(addFollowUp({ leadId: lead.id, followUp: { id: uid('f'), date: fromInput(`${date}T10:00`), note: note.trim(), done: false } }));
    setDate('');
    setNote('');
    toast('success', 'Follow-up scheduled', `Reminder set for ${formatDate(fromInput(`${date}T10:00`), 'MMM d')}.`);
  };

  const convert = async () => {
    setConverting(true);
    await delay(700);
    const customerId = uid('c');
    const now = new Date().toISOString();
    dispatch(
      addCustomer({
        id: customerId,
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        industry: 'Software',
        location: '—',
        website: '',
        status: 'active',
        ownerId: lead.ownerId,
        tags: ['New logo'],
        notes: lead.notes,
        since: now,
      }),
    );
    dispatch(
      addDeal({
        id: uid('d'),
        title: `${lead.company} – initial deal`,
        customerId,
        value: lead.value,
        stage: 'prospecting',
        probability: 10,
        ownerId: lead.ownerId,
        expectedClose: addDays(new Date(), 30).toISOString(),
        createdAt: now,
      }),
    );
    dispatch(updateLead({ id: lead.id, changes: { status: 'won', convertedCustomerId: customerId } }));
    setConverting(false);
    toast('success', 'Lead converted', `${lead.company} is now a customer and a deal was added to your pipeline.`);
    onClose();
    navigate(`/customers/${customerId}`);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={lead.name}
      description={lead.company}
      footer={
        <>
          {editable && (
            <Button variant="secondary" onClick={() => onEdit(lead)} className="flex-1">
              Edit lead
            </Button>
          )}
          {canConvert && (
            <Button onClick={convert} loading={converting} icon={<UserCheck className="h-4 w-4" />} className="flex-1">
              Convert to customer
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone} dot>{meta.label}</Badge>
          <Badge tone="slate">{sourceLabel(lead.source)}</Badge>
          {lead.convertedCustomerId && <Badge tone="emerald">Converted</Badge>}
        </div>

        {editable && (
          <Select
            label="Update status"
            value={lead.status}
            options={LEAD_STATUS.map((s) => ({ value: s.value, label: s.label }))}
            onChange={(e) => {
              dispatch(setLeadStatus({ id: lead.id, status: e.target.value as LeadStatus }));
              toast('info', 'Status updated', `${lead.name} is now ${leadStatusMeta(e.target.value as LeadStatus).label.toLowerCase()}.`);
            }}
          />
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[
            { icon: Mail, label: 'Email', value: lead.email, href: `mailto:${lead.email}` },
            { icon: Phone, label: 'Phone', value: lead.phone || '—', href: lead.phone ? `tel:${lead.phone}` : undefined },
            { icon: Wallet, label: 'Est. value', value: formatCurrency(lead.value) },
            { icon: Building2, label: 'Owner', value: userName(lead.ownerId) },
          ].map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="min-w-0 rounded-xl border border-line bg-elevated/40 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
              </dt>
              <dd className="mt-1 truncate text-slate-100">
                {href ? <a href={href} className="hover:text-brand-300">{value}</a> : value}
              </dd>
            </div>
          ))}
        </dl>

        {lead.notes && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Notes</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{lead.notes}</p>
          </div>
        )}

        <div>
          <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
            <CalendarClock className="h-4 w-4" aria-hidden /> Follow-ups
          </h3>
          <ul className="mt-3 space-y-2">
            {followUps.map((f) => {
              const overdue = !f.done && (safeParse(f.date)?.getTime() ?? Infinity) < Date.now();
              return (
                <li key={f.id} className="flex items-start gap-3 rounded-xl border border-line bg-elevated/40 p-3">
                  <button
                    type="button"
                    disabled={!editable}
                    onClick={() => dispatch(toggleFollowUp({ leadId: lead.id, followUpId: f.id }))}
                    aria-label={f.done ? 'Mark follow-up as not done' : 'Mark follow-up as done'}
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition',
                      f.done ? 'border-emerald-400 bg-emerald-400 text-bg' : 'border-muted hover:border-brand-400',
                    )}
                  >
                    {f.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', f.done ? 'text-muted line-through' : 'text-slate-100')}>{f.note}</p>
                    <p className={cn('mt-0.5 text-xs', overdue ? 'text-rose-300' : 'text-muted')}>
                      {overdue ? 'Overdue · ' : ''}
                      {formatDate(f.date, 'EEE, MMM d')} · {relativeTime(f.date)}
                    </p>
                  </div>
                  {editable && (
                    <button type="button" aria-label="Remove follow-up" onClick={() => dispatch(removeFollowUp({ leadId: lead.id, followUpId: f.id }))} className="rounded-md p-1 text-muted transition hover:text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
            {followUps.length === 0 && <li className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">No follow-ups scheduled yet.</li>}
          </ul>

          {editable && (
            <div className="mt-4 space-y-3 rounded-xl border border-line p-4">
              <p className="text-sm font-medium text-white">Schedule a follow-up</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_1fr]">
                <Input aria-label="Follow-up date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Input aria-label="Follow-up note" placeholder="e.g. Send pricing proposal" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              {fuError && <p role="alert" className="text-xs text-rose-400">{fuError}</p>}
              <Button size="sm" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={submitFollowUp}>
                Add follow-up
              </Button>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
