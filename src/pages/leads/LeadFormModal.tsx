import { useMemo } from 'react';
import { addDays, format } from 'date-fns';
import { useAppDispatch, useAppSelector, useCurrentUser, useToast } from '@/app/hooks';
import { addLead, updateLead } from '@/features/leadsSlice';
import { addNotification } from '@/features/notificationsSlice';
import { useForm, validators } from '@/hooks/useForm';
import type { Lead, LeadSource, LeadStatus } from '@/types';
import { delay } from '@/utils/async';
import { LEAD_SOURCES, LEAD_STATUS } from '@/utils/constants';
import { fromInput, uid } from '@/utils/format';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';

interface Values {
  name: string;
  company: string;
  email: string;
  phone: string;
  value: string;
  source: LeadSource;
  status: LeadStatus;
  ownerId: string;
  notes: string;
  followUpDate: string;
}

const validate = (v: Values) => ({
  name: validators.required(v.name, 'Contact name') ?? validators.minLength(v.name, 2, 'Name'),
  company: validators.required(v.company, 'Company'),
  email: validators.email(v.email),
  phone: validators.phone(v.phone),
  value: validators.positiveNumber(v.value, 'Estimated value'),
});

function LeadForm({ lead, onClose }: { lead?: Lead; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const me = useCurrentUser();
  const users = useAppSelector((s) => s.auth.users);
  const isManager = me.role === 'manager';
  const editing = !!lead;

  const initial = useMemo<Values>(
    () => ({
      name: lead?.name ?? '',
      company: lead?.company ?? '',
      email: lead?.email ?? '',
      phone: lead?.phone ?? '',
      value: lead ? String(lead.value) : '',
      source: lead?.source ?? 'website',
      status: lead?.status ?? 'new',
      ownerId: lead?.ownerId ?? me.id,
      notes: lead?.notes ?? '',
      followUpDate: editing ? '' : format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    }),
    [lead, me.id, editing],
  );

  const { bind, handleSubmit, submitting, submitError } = useForm<Values>(initial, validate);

  const onSubmit = handleSubmit(async (v) => {
    await delay(550);
    const now = new Date().toISOString();
    const base = {
      name: v.name.trim(),
      company: v.company.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      value: Number(v.value || 0),
      source: v.source,
      status: v.status,
      ownerId: isManager ? v.ownerId : lead?.ownerId ?? me.id,
      notes: v.notes.trim(),
    };
    if (lead) {
      dispatch(updateLead({ id: lead.id, changes: base }));
      toast('success', 'Lead updated', `${base.name} was saved.`);
    } else {
      dispatch(
        addLead({
          ...base,
          id: uid('l'),
          followUps: v.followUpDate ? [{ id: uid('f'), date: fromInput(`${v.followUpDate}T10:00`), note: 'Initial follow-up', done: false }] : [],
          createdAt: now,
          updatedAt: now,
        }),
      );
      toast('success', 'Lead created', `${base.name} was added to your leads.`);
    }
    if (base.ownerId !== me.id && base.ownerId !== lead?.ownerId) {
      dispatch(
        addNotification({
          id: uid('n'),
          userId: base.ownerId,
          type: 'lead_assigned',
          title: 'New lead assigned',
          message: `${base.name} (${base.company}) was assigned to you by ${me.name}.`,
          createdAt: now,
          read: false,
          link: '/leads',
        }),
      );
    }
    onClose();
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={editing ? 'Edit lead' : 'Create new lead'}
      description={editing ? 'Update contact details, value and status.' : 'Capture the essentials — you can add follow-ups later.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="lead-form" loading={submitting}>
            {editing ? 'Save changes' : 'Create lead'}
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {submitError && <InlineAlert className="sm:col-span-2">{submitError}</InlineAlert>}
        <Input label="Contact name" required placeholder="Jane Cooper" {...bind('name')} />
        <Input label="Company" required placeholder="Acme Inc." {...bind('company')} />
        <Input label="Email" type="email" required placeholder="jane@acme.com" {...bind('email')} />
        <Input label="Phone" type="tel" placeholder="+1 555 010 0000" {...bind('phone')} />
        <Input label="Estimated value (USD)" type="number" min={0} step={500} placeholder="25000" {...bind('value')} />
        <Select label="Lead source" options={LEAD_SOURCES} {...bind('source')} />
        <Select label="Status" options={LEAD_STATUS.map((s) => ({ value: s.value, label: s.label }))} {...bind('status')} />
        {isManager ? (
          <Select label="Assigned to" options={users.map((u) => ({ value: u.id, label: u.name }))} {...bind('ownerId')} />
        ) : (
          !editing && <Input label="First follow-up" type="date" {...bind('followUpDate')} />
        )}
        {isManager && !editing && <Input label="First follow-up" type="date" {...bind('followUpDate')} />}
        <Textarea wrapperClassName="sm:col-span-2" label="Notes" rows={3} placeholder="Context, needs, objections…" {...bind('notes')} />
      </form>
    </Modal>
  );
}

export default function LeadFormModal({ open, lead, onClose }: { open: boolean; lead?: Lead; onClose: () => void }) {
  if (!open) return null;
  return <LeadForm key={lead?.id ?? 'new'} lead={lead} onClose={onClose} />;
}
