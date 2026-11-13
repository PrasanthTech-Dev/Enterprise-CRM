import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BadgeCheck, Lock, ShieldCheck } from 'lucide-react';
import { useAppDispatch, useCurrentUser, usePermission, useToast } from '@/app/hooks';
import { changePassword, updatePreferences, updateProfile } from '@/features/authSlice';
import { useForm, validators } from '@/hooks/useForm';
import type { Permission, Preferences } from '@/types';
import { delay } from '@/utils/async';
import { ROLE_LABEL, ROLE_PERMISSIONS, TIMEZONES } from '@/utils/constants';
import { formatDate } from '@/utils/format';
import Avatar from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { InlineAlert } from '@/components/ui/Feedback';
import { Input, Select, Textarea, Toggle } from '@/components/ui/Field';
import PageHeader from '@/components/ui/PageHeader';
import PasswordStrength from '@/components/ui/PasswordStrength';
import { Tabs } from '@/components/ui/Tabs';

type Tab = 'profile' | 'notifications' | 'security';

const PERMISSION_LABEL: Record<Permission, string> = {
  'leads.create': 'Create leads',
  'leads.edit': 'Edit leads & statuses',
  'leads.delete': 'Delete leads',
  'pipeline.manage': 'Manage pipeline deals',
  'customers.create': 'Add customers',
  'customers.edit': 'Edit customers',
  'tasks.manage': 'Manage tasks',
  'activities.log': 'Log activities',
  'team.view': 'View team data',
};

function ProfileTab() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useCurrentUser();

  const initial = useMemo(() => ({ name: user.name, email: user.email, phone: user.phone, title: user.title, department: user.department, timezone: user.timezone, bio: user.bio }), [user]);
  const { bind, handleSubmit, submitting, submitError } = useForm(initial, (v) => ({
    name: validators.required(v.name, 'Full name') ?? validators.minLength(v.name, 2, 'Name'),
    email: validators.email(v.email),
    phone: validators.phone(v.phone),
    title: validators.required(v.title, 'Job title'),
    bio: v.bio.length > 240 ? 'Bio must be 240 characters or fewer' : undefined,
  }));

  const onSubmit = handleSubmit(async (v) => {
    await delay(600);
    dispatch(updateProfile({ name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim(), title: v.title.trim(), department: v.department.trim(), timezone: v.timezone, bio: v.bio.trim() }));
    toast('success', 'Profile updated', 'Your changes have been saved.');
  });

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="h-fit p-6 text-center">
        <Avatar name={user.name} size={96} className="mx-auto" />
        <h2 className="mt-4 text-lg font-semibold text-white">{user.name}</h2>
        <p className="text-sm text-muted">{user.title}</p>
        <Badge tone="brand" className="mt-3"><BadgeCheck className="h-3.5 w-3.5" aria-hidden /> {ROLE_LABEL[user.role]}</Badge>
        <dl className="mt-6 space-y-3 border-t border-line pt-5 text-left text-sm">
          <div className="flex justify-between gap-3"><dt className="text-muted">Department</dt><dd className="text-slate-200">{user.department}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Member since</dt><dd className="text-slate-200">{formatDate(user.joinedAt, 'MMM yyyy')}</dd></div>
          {user.monthlyTarget > 0 && <div className="flex justify-between gap-3"><dt className="text-muted">Monthly target</dt><dd className="text-slate-200">${user.monthlyTarget.toLocaleString()}</dd></div>}
        </dl>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader title="Personal information" subtitle="Update how you appear to your team" />
        <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {submitError && <InlineAlert className="sm:col-span-2">{submitError}</InlineAlert>}
          <Input label="Full name" required {...bind('name')} />
          <Input label="Work email" type="email" required {...bind('email')} />
          <Input label="Phone" type="tel" {...bind('phone')} />
          <Input label="Job title" required {...bind('title')} />
          <Input label="Department" {...bind('department')} />
          <Select label="Time zone" options={TIMEZONES.map((t) => ({ value: t, label: t.replace('_', ' ') }))} {...bind('timezone')} />
          <Textarea wrapperClassName="sm:col-span-2" label="Bio" rows={3} hint="Max 240 characters" {...bind('bio')} />
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" loading={submitting}>Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function NotificationsTab() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useCurrentUser();
  const items: { key: keyof Preferences; label: string; description: string }[] = [
    { key: 'leadAssignments', label: 'Lead assignments', description: 'Notify me when a lead is assigned or reassigned to me.' },
    { key: 'taskReminders', label: 'Task reminders', description: 'Remind me about tasks that are due or overdue.' },
    { key: 'meetingReminders', label: 'Meeting reminders', description: 'Get a heads-up before scheduled meetings and calls.' },
    { key: 'emailAlerts', label: 'Email notifications', description: 'Also send important notifications to my inbox.' },
    { key: 'weeklyDigest', label: 'Weekly performance digest', description: 'A summary of your pipeline and tasks every Monday.' },
  ];
  return (
    <Card className="max-w-3xl">
      <CardHeader title="Notification preferences" subtitle="Choose what you want to be notified about" />
      <div className="divide-y divide-line/70 px-5 pb-3 pt-2">
        {items.map((i) => (
          <Toggle
            key={i.key}
            label={i.label}
            description={i.description}
            checked={user.preferences[i.key]}
            onChange={(v) => {
              dispatch(updatePreferences({ [i.key]: v }));
              toast('info', 'Preference saved', `${i.label} ${v ? 'enabled' : 'disabled'}.`);
            }}
          />
        ))}
      </div>
    </Card>
  );
}

function SecurityTab() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useCurrentUser();
  const can = usePermission();
  const { bind, values, handleSubmit, submitting, submitError, reset } = useForm({ current: '', next: '', confirm: '' }, (v) => ({
    current: v.current ? undefined : 'Enter your current password',
    next: validators.password(v.next),
    confirm: !v.confirm ? 'Please confirm your new password' : v.confirm !== v.next ? 'Passwords do not match' : undefined,
  }));
  const [done, setDone] = useState(false);

  const onSubmit = handleSubmit(async (v) => {
    setDone(false);
    const result = await dispatch(changePassword({ current: v.current, next: v.next }));
    if (changePassword.rejected.match(result)) throw new Error(result.payload ?? 'Could not change your password.');
    reset({ current: '', next: '', confirm: '' });
    setDone(true);
    toast('success', 'Password changed', 'Use your new password next time you sign in.');
  });

  const perms = ROLE_PERMISSIONS[user.role];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="Change password" subtitle="Use a strong, unique password" />
        <form onSubmit={onSubmit} noValidate className="space-y-4 p-5">
          {submitError && <InlineAlert>{submitError}</InlineAlert>}
          {done && !submitError && <InlineAlert kind="success">Your password has been updated.</InlineAlert>}
          <Input label="Current password" type="password" autoComplete="current-password" {...bind('current')} />
          <div className="space-y-3">
            <Input label="New password" type="password" autoComplete="new-password" {...bind('next')} />
            <PasswordStrength value={values.next} />
          </div>
          <Input label="Confirm new password" type="password" autoComplete="new-password" {...bind('confirm')} />
          <div className="flex justify-end">
            <Button type="submit" loading={submitting} icon={<Lock className="h-4 w-4" />}>Update password</Button>
          </div>
        </form>
      </Card>

      <Card className="h-fit">
        <CardHeader title="Role & permissions" subtitle={`You're signed in as ${ROLE_LABEL[user.role]}`} />
        <ul className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-2">
          {(Object.keys(PERMISSION_LABEL) as Permission[]).map((p) => {
            const allowed = perms.includes(p) || can(p);
            return (
              <li key={p} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${allowed ? 'border-emerald-500/25 bg-emerald-500/5 text-slate-100' : 'border-line text-muted'}`}>
                <ShieldCheck className={`h-4 w-4 shrink-0 ${allowed ? 'text-emerald-400' : 'text-muted/50'}`} aria-hidden />
                <span>{PERMISSION_LABEL[p]}</span>
                <span className="sr-only">{allowed ? 'allowed' : 'not allowed'}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

export default function Profile() {
  const [params, setParams] = useSearchParams();
  const initial = (params.get('tab') as Tab) || 'profile';
  const tab: Tab = ['profile', 'notifications', 'security'].includes(initial) ? initial : 'profile';

  return (
    <>
      <PageHeader title="Profile & Settings" subtitle="Manage your personal information, preferences and account security" />
      <div className="mb-5 flex">
        <Tabs<Tab>
          value={tab}
          onChange={(t) => setParams(t === 'profile' ? {} : { tab: t }, { replace: true })}
          items={[
            { value: 'profile', label: 'Profile' },
            { value: 'notifications', label: 'Notifications' },
            { value: 'security', label: 'Security' },
          ]}
        />
      </div>
      {tab === 'profile' && <ProfileTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'security' && <SecurityTab />}
    </>
  );
}
