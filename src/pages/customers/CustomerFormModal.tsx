import { useMemo } from 'react';
import { useAppDispatch, useAppSelector, useCurrentUser, useToast } from '@/app/hooks';
import { addCustomer, updateCustomer } from '@/features/customersSlice';
import { useForm, validators } from '@/hooks/useForm';
import type { Customer, CustomerStatus } from '@/types';
import { delay } from '@/utils/async';
import { CUSTOMER_STATUSES, INDUSTRIES } from '@/utils/constants';
import { uid } from '@/utils/format';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';

interface Values {
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  location: string;
  website: string;
  status: CustomerStatus;
  tags: string;
  notes: string;
  ownerId: string;
}

const validate = (v: Values) => ({
  name: validators.required(v.name, 'Contact name') ?? validators.minLength(v.name, 2, 'Name'),
  company: validators.required(v.company, 'Company'),
  email: validators.email(v.email),
  phone: validators.phone(v.phone),
  website: v.website && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i.test(v.website.trim()) ? 'Enter a valid website' : undefined,
});

function CustomerForm({ customer, onClose, onSaved }: { customer?: Customer; onClose: () => void; onSaved?: (id: string) => void }) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const me = useCurrentUser();
  const users = useAppSelector((s) => s.auth.users);
  const isManager = me.role === 'manager';

  const initial = useMemo<Values>(
    () => ({
      name: customer?.name ?? '',
      company: customer?.company ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      industry: customer?.industry ?? INDUSTRIES[0],
      location: customer?.location ?? '',
      website: customer?.website ?? '',
      status: customer?.status ?? 'active',
      tags: customer?.tags.join(', ') ?? '',
      notes: customer?.notes ?? '',
      ownerId: customer?.ownerId ?? me.id,
    }),
    [customer, me.id],
  );

  const { bind, handleSubmit, submitting, submitError } = useForm<Values>(initial, validate);

  const onSubmit = handleSubmit(async (v) => {
    await delay(550);
    const payload = {
      name: v.name.trim(),
      company: v.company.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      industry: v.industry,
      location: v.location.trim() || '—',
      website: v.website.trim().replace(/^https?:\/\//, ''),
      status: v.status,
      tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 6),
      notes: v.notes.trim(),
      ownerId: isManager ? v.ownerId : customer?.ownerId ?? me.id,
    };
    if (customer) {
      dispatch(updateCustomer({ id: customer.id, changes: payload }));
      toast('success', 'Customer updated', payload.company);
      onSaved?.(customer.id);
    } else {
      const id = uid('c');
      dispatch(addCustomer({ ...payload, id, since: new Date().toISOString() }));
      toast('success', 'Customer added', `${payload.company} is now in your accounts.`);
      onSaved?.(id);
    }
    onClose();
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={customer ? 'Edit customer' : 'Add customer'}
      description="Keep contact details and account context up to date."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" loading={submitting}>
            {customer ? 'Save changes' : 'Add customer'}
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {submitError && <InlineAlert className="sm:col-span-2">{submitError}</InlineAlert>}
        <Input label="Primary contact" required placeholder="Jane Cooper" {...bind('name')} />
        <Input label="Company" required placeholder="Acme Inc." {...bind('company')} />
        <Input label="Email" type="email" required placeholder="jane@acme.com" {...bind('email')} />
        <Input label="Phone" type="tel" placeholder="+1 555 010 0000" {...bind('phone')} />
        <Select label="Industry" options={INDUSTRIES.map((i) => ({ value: i, label: i }))} {...bind('industry')} />
        <Input label="Location" placeholder="City, Country" {...bind('location')} />
        <Input label="Website" placeholder="acme.com" {...bind('website')} />
        <Select label="Status" options={CUSTOMER_STATUSES.map((s) => ({ value: s.value, label: s.label }))} {...bind('status')} />
        {isManager && <Select label="Account owner" options={users.map((u) => ({ value: u.id, label: u.name }))} {...bind('ownerId')} />}
        <Input wrapperClassName={isManager ? '' : ''} label="Tags" hint="Comma separated, e.g. Enterprise, Renewal" placeholder="Enterprise, Upsell" {...bind('tags')} />
        <Textarea wrapperClassName="sm:col-span-2" label="Notes" rows={3} placeholder="Preferences, stakeholders, risks…" {...bind('notes')} />
      </form>
    </Modal>
  );
}

export default function CustomerFormModal(props: { open: boolean; customer?: Customer; onClose: () => void; onSaved?: (id: string) => void }) {
  if (!props.open) return null;
  return <CustomerForm key={props.customer?.id ?? 'new'} customer={props.customer} onClose={props.onClose} onSaved={props.onSaved} />;
}
