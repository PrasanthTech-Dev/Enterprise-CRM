import { useMemo } from 'react';
import { addDays, format } from 'date-fns';
import { useAppDispatch, useAppSelector, useCurrentUser, useToast } from '@/app/hooks';
import { addNotification } from '@/features/notificationsSlice';
import { addTask, updateTask } from '@/features/tasksSlice';
import { useScopedData } from '@/hooks/useScopedData';
import { useForm, validators } from '@/hooks/useForm';
import type { Task, TaskPriority, TaskStatus } from '@/types';
import { delay } from '@/utils/async';
import { PRIORITIES, TASK_STATUSES } from '@/utils/constants';
import { fromInput, toDateTimeInput, uid } from '@/utils/format';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';

interface Values {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  customerId: string;
  leadId: string;
  ownerId: string;
}

const validate = (v: Values) => ({
  title: validators.required(v.title, 'Title') ?? validators.minLength(v.title, 3, 'Title'),
  dueDate: v.dueDate ? undefined : 'Pick a deadline',
});

function TaskForm({ task, onClose }: { task?: Task; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const me = useCurrentUser();
  const users = useAppSelector((s) => s.auth.users);
  const { customers, leads } = useScopedData();
  const isManager = me.role === 'manager';

  const initial = useMemo<Values>(
    () => ({
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'medium',
      status: task?.status ?? 'pending',
      dueDate: task ? toDateTimeInput(task.dueDate) : format(addDays(new Date(), 1), "yyyy-MM-dd'T'17:00"),
      customerId: task?.customerId ?? '',
      leadId: task?.leadId ?? '',
      ownerId: task?.ownerId ?? me.id,
    }),
    [task, me.id],
  );

  const { bind, handleSubmit, submitting, submitError } = useForm<Values>(initial, validate);

  const onSubmit = handleSubmit(async (v) => {
    await delay(450);
    const ownerId = isManager ? v.ownerId : task?.ownerId ?? me.id;
    const payload = {
      title: v.title.trim(),
      description: v.description.trim(),
      priority: v.priority,
      status: v.status,
      dueDate: fromInput(v.dueDate),
      customerId: v.customerId || undefined,
      leadId: v.leadId || undefined,
      ownerId,
    };
    if (task) {
      const completedAt = v.status === 'completed' ? task.completedAt ?? new Date().toISOString() : undefined;
      dispatch(updateTask({ id: task.id, changes: { ...payload, completedAt } }));
      toast('success', 'Task updated', payload.title);
    } else {
      const now = new Date().toISOString();
      dispatch(addTask({ ...payload, id: uid('t'), createdAt: now, completedAt: v.status === 'completed' ? now : undefined }));
      toast('success', 'Task created', payload.title);
      if (ownerId !== me.id) {
        dispatch(addNotification({ id: uid('n'), userId: ownerId, type: 'task_reminder', title: 'New task assigned', message: `${me.name} assigned you “${payload.title}”.`, createdAt: now, read: false, link: '/tasks' }));
      }
    }
    onClose();
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={task ? 'Edit task' : 'Create task'}
      description="Set a priority and a deadline so nothing slips."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={submitting}>
            {task ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {submitError && <InlineAlert className="sm:col-span-2">{submitError}</InlineAlert>}
        <Input wrapperClassName="sm:col-span-2" label="Title" required placeholder="e.g. Send proposal to Acme" {...bind('title')} />
        <Textarea wrapperClassName="sm:col-span-2" label="Description" rows={3} placeholder="Add any context or checklist items…" {...bind('description')} />
        <Select label="Priority" options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} {...bind('priority')} />
        <Select label="Status" options={TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))} {...bind('status')} />
        <Input wrapperClassName="sm:col-span-2" label="Deadline" type="datetime-local" required {...bind('dueDate')} />
        <Select label="Related customer" placeholder="None" options={customers.map((c) => ({ value: c.id, label: c.company }))} {...bind('customerId')} />
        <Select label="Related lead" placeholder="None" options={leads.filter((l) => l.status !== 'lost').map((l) => ({ value: l.id, label: `${l.name} — ${l.company}` }))} {...bind('leadId')} />
        {isManager && <Select wrapperClassName="sm:col-span-2" label="Assign to" options={users.map((u) => ({ value: u.id, label: u.name }))} {...bind('ownerId')} />}
      </form>
    </Modal>
  );
}

export default function TaskFormModal({ open, task, onClose }: { open: boolean; task?: Task; onClose: () => void }) {
  if (!open) return null;
  return <TaskForm key={task?.id ?? 'new'} task={task} onClose={onClose} />;
}
