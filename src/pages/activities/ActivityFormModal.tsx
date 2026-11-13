import { useMemo } from 'react';
import { format } from 'date-fns';
import { useAppDispatch, useCurrentUser, useToast } from '@/app/hooks';
import { addActivity, updateActivity } from '@/features/activitiesSlice';
import { useScopedData } from '@/hooks/useScopedData';
import { useForm, validators } from '@/hooks/useForm';
import type { Activity, ActivityOutcome, ActivityType } from '@/types';
import { delay } from '@/utils/async';
import { ACTIVITY_TYPES } from '@/utils/constants';
import { fromInput, toDateTimeInput, uid } from '@/utils/format';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';

interface Values {
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  duration: string;
  outcome: '' | ActivityOutcome;
  customerId: string;
  leadId: string;
}

const validate = (v: Values) => ({
  title: validators.required(v.title, 'Title') ?? validators.minLength(v.title, 3, 'Title'),
  date: v.date ? undefined : 'Pick a date and time',
  duration: v.duration === '' ? undefined : Number(v.duration) <= 0 || Number.isNaN(Number(v.duration)) ? 'Enter minutes greater than 0' : undefined,
});

const NO_DURATION: ActivityType[] = ['email', 'note'];

function ActivityForm({
  activity,
  defaults,
  onClose,
}: {
  activity?: Activity;
  defaults?: { customerId?: string; leadId?: string };
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const me = useCurrentUser();
  const { customers, leads } = useScopedData();

  const initial = useMemo<Values>(
    () => ({
      type: activity?.type ?? 'call',
      title: activity?.title ?? '',
      description: activity?.description ?? '',
      date: activity ? toDateTimeInput(activity.date) : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      duration: activity?.duration ? String(activity.duration) : '',
      outcome: activity?.outcome ?? '',
      customerId: activity?.customerId ?? defaults?.customerId ?? '',
      leadId: activity?.leadId ?? defaults?.leadId ?? '',
    }),
    [activity, defaults],
  );

  const { bind, values, handleSubmit, submitting, submitError } = useForm<Values>(initial, validate);

  const onSubmit = handleSubmit(async (v) => {
    await delay(500);
    const payload = {
      type: v.type,
      title: v.title.trim(),
      description: v.description.trim(),
      date: fromInput(v.date),
      duration: NO_DURATION.includes(v.type) || !v.duration ? undefined : Number(v.duration),
      outcome: v.type === 'note' || !v.outcome ? undefined : v.outcome,
      customerId: v.customerId || undefined,
      leadId: v.leadId || undefined,
    };
    if (activity) {
      dispatch(updateActivity({ id: activity.id, changes: payload }));
      toast('success', 'Activity updated', payload.title);
    } else {
      dispatch(addActivity({ ...payload, id: uid('a'), ownerId: me.id }));
      const future = new Date(payload.date).getTime() > Date.now();
      toast('success', future ? 'Activity scheduled' : 'Activity logged', payload.title);
    }
    onClose();
  });

  const isFuture = values.date && new Date(values.date).getTime() > Date.now();

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={activity ? 'Edit activity' : 'Log activity'}
      description="Record a call, meeting, email, note or follow-up — or schedule one for later."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="activity-form" loading={submitting}>
            {activity ? 'Save changes' : isFuture ? 'Schedule activity' : 'Log activity'}
          </Button>
        </>
      }
    >
      <form id="activity-form" onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {submitError && <InlineAlert className="sm:col-span-2">{submitError}</InlineAlert>}
        <Select label="Type" options={ACTIVITY_TYPES.map((t) => ({ value: t.value, label: t.label }))} {...bind('type')} />
        <Input label="Date & time" type="datetime-local" required {...bind('date')} />
        <Input wrapperClassName="sm:col-span-2" label="Title" required placeholder="e.g. Discovery call with Acme" {...bind('title')} />
        {!NO_DURATION.includes(values.type) && <Input label="Duration (minutes)" type="number" min={1} placeholder="30" {...bind('duration')} />}
        {values.type !== 'note' && !isFuture && (
          <Select
            label="Outcome"
            placeholder="Not set"
            options={[
              { value: 'positive', label: 'Positive' },
              { value: 'neutral', label: 'Neutral' },
              { value: 'negative', label: 'Negative' },
            ]}
            {...bind('outcome')}
          />
        )}
        <Select label="Customer" placeholder="None" options={customers.map((c) => ({ value: c.id, label: c.company }))} {...bind('customerId')} />
        <Select label="Lead" placeholder="None" options={leads.filter((l) => l.status !== 'lost').map((l) => ({ value: l.id, label: `${l.name} — ${l.company}` }))} {...bind('leadId')} />
        <Textarea wrapperClassName="sm:col-span-2" label="Details" rows={3} placeholder="What was discussed? Next steps?" {...bind('description')} />
      </form>
    </Modal>
  );
}

export default function ActivityFormModal(props: {
  open: boolean;
  activity?: Activity;
  defaults?: { customerId?: string; leadId?: string };
  onClose: () => void;
}) {
  if (!props.open) return null;
  return <ActivityForm key={props.activity?.id ?? 'new'} activity={props.activity} defaults={props.defaults} onClose={props.onClose} />;
}
