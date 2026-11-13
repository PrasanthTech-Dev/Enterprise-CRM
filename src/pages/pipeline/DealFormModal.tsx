import { useMemo } from 'react';
import { addDays, format } from 'date-fns';
import { useAppDispatch, useAppSelector, useCurrentUser, useToast } from '@/app/hooks';
import { addDeal, updateDeal } from '@/features/dealsSlice';
import { useForm, validators } from '@/hooks/useForm';
import type { Deal, DealStage } from '@/types';
import { delay } from '@/utils/async';
import { DEAL_STAGES, stageMeta } from '@/utils/constants';
import { fromInput, toDateInput, uid } from '@/utils/format';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';

interface Values {
  title: string;
  customerId: string;
  value: string;
  stage: DealStage;
  probability: string;
  expectedClose: string;
  ownerId: string;
}

const validate = (v: Values) => ({
  title: validators.required(v.title, 'Deal name') ?? validators.minLength(v.title, 3, 'Deal name'),
  customerId: v.customerId ? undefined : 'Select a customer',
  value: validators.positiveNumber(v.value, 'Deal value') ?? (Number(v.value) === 0 ? 'Deal value must be greater than 0' : undefined),
  probability:
    Number(v.probability) < 0 || Number(v.probability) > 100 || v.probability === '' ? 'Enter a probability between 0 and 100' : undefined,
  expectedClose: v.expectedClose ? undefined : 'Pick an expected close date',
});

function DealForm({ deal, defaultStage, onClose }: { deal?: Deal; defaultStage?: DealStage; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const me = useCurrentUser();
  const users = useAppSelector((s) => s.auth.users);
  const allCustomers = useAppSelector((s) => s.customers.items);
  const isManager = me.role === 'manager';

  const customers = useMemo(() => allCustomers.filter((c) => isManager || c.ownerId === me.id || c.id === deal?.customerId), [allCustomers, isManager, me.id, deal]);

  const initial = useMemo<Values>(() => {
    const stage = deal?.stage ?? defaultStage ?? 'prospecting';
    return {
      title: deal?.title ?? '',
      customerId: deal?.customerId ?? '',
      value: deal ? String(deal.value) : '',
      stage,
      probability: String(deal?.probability ?? stageMeta(stage).probability),
      expectedClose: deal ? toDateInput(deal.expectedClose) : format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      ownerId: deal?.ownerId ?? me.id,
    };
  }, [deal, defaultStage, me.id]);

  const { bind, values, setValue, handleSubmit, submitting, submitError } = useForm<Values>(initial, validate);

  const onSubmit = handleSubmit(async (v) => {
    await delay(500);
    const closed = v.stage === 'won' || v.stage === 'lost';
    const payload = {
      title: v.title.trim(),
      customerId: v.customerId,
      value: Number(v.value),
      stage: v.stage,
      probability: Number(v.probability),
      expectedClose: fromInput(v.expectedClose),
      ownerId: isManager ? v.ownerId : deal?.ownerId ?? me.id,
    };
    if (deal) {
      dispatch(updateDeal({ id: deal.id, changes: { ...payload, closedAt: closed ? deal.closedAt ?? new Date().toISOString() : undefined } }));
      toast('success', 'Deal updated', payload.title);
    } else {
      dispatch(addDeal({ ...payload, id: uid('d'), createdAt: new Date().toISOString(), closedAt: closed ? new Date().toISOString() : undefined }));
      toast('success', 'Deal created', `${payload.title} was added to ${stageMeta(payload.stage).label}.`);
    }
    onClose();
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={deal ? 'Edit deal' : 'Create new deal'}
      description="Track an opportunity through your sales stages."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="deal-form" loading={submitting}>
            {deal ? 'Save changes' : 'Create deal'}
          </Button>
        </>
      }
    >
      <form id="deal-form" onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {submitError && <InlineAlert className="sm:col-span-2">{submitError}</InlineAlert>}
        <Input wrapperClassName="sm:col-span-2" label="Deal name" required placeholder="e.g. Platform expansion" {...bind('title')} />
        <Select wrapperClassName="sm:col-span-2" label="Customer" required placeholder="Select a customer" options={customers.map((c) => ({ value: c.id, label: `${c.company} — ${c.name}` }))} {...bind('customerId')} />
        <Input label="Value (USD)" type="number" min={0} step={500} required placeholder="25000" {...bind('value')} />
        <Input label="Expected close" type="date" required {...bind('expectedClose')} />
        <Select
          label="Stage"
          options={DEAL_STAGES.map((s) => ({ value: s.value, label: s.label }))}
          {...bind('stage')}
          onChange={(e) => {
            const stage = e.target.value as DealStage;
            setValue('stage', stage);
            setValue('probability', String(stageMeta(stage).probability));
          }}
        />
        <Input label="Win probability (%)" type="number" min={0} max={100} {...bind('probability')} />
        {isManager && (
          <Select wrapperClassName="sm:col-span-2" label="Owner" options={users.filter((u) => u.role !== 'employee' || u.id === values.ownerId).map((u) => ({ value: u.id, label: u.name }))} {...bind('ownerId')} />
        )}
      </form>
    </Modal>
  );
}

export default function DealFormModal({ open, deal, defaultStage, onClose }: { open: boolean; deal?: Deal; defaultStage?: DealStage; onClose: () => void }) {
  if (!open) return null;
  return <DealForm key={deal?.id ?? `new-${defaultStage ?? ''}`} deal={deal} defaultStage={defaultStage} onClose={onClose} />;
}
