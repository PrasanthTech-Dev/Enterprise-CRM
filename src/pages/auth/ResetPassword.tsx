import { Navigate, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { resetPassword } from '@/features/authSlice';
import { useForm, validators } from '@/hooks/useForm';
import AuthLayout from '@/components/layout/AuthLayout';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';
import PasswordStrength from '@/components/ui/PasswordStrength';

export default function ResetPassword() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const reset = useAppSelector((s) => s.auth.reset);
  const { bind, values, handleSubmit, submitting, submitError } = useForm({ password: '', confirm: '' }, (v) => ({
    password: validators.password(v.password),
    confirm: !v.confirm ? 'Please confirm your password' : v.confirm !== v.password ? 'Passwords do not match' : undefined,
  }));

  if (!reset.email) return <Navigate to="/forgot-password" replace />;
  if (!reset.otpVerified) return <Navigate to="/verify-otp" replace />;

  const onSubmit = handleSubmit(async ({ password }) => {
    const result = await dispatch(resetPassword(password));
    if (resetPassword.rejected.match(result)) throw new Error(result.payload ?? 'Could not reset your password.');
    navigate('/login', { replace: true, state: { flash: 'Password updated. Sign in with your new password.' } });
  });

  return (
    <AuthLayout title="Create a new password" subtitle="Choose a strong password you haven't used before.">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {submitError && <InlineAlert>{submitError}</InlineAlert>}
        <div className="space-y-3">
          <Input label="New password" type="password" autoComplete="new-password" placeholder="At least 8 characters" leftIcon={<Lock className="h-4 w-4" />} {...bind('password')} />
          <PasswordStrength value={values.password} />
        </div>
        <Input label="Confirm password" type="password" autoComplete="new-password" placeholder="Re-enter your password" leftIcon={<Lock className="h-4 w-4" />} {...bind('confirm')} />
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
          <li>• 8+ characters</li>
          <li>• Upper & lower case</li>
          <li>• At least one number</li>
        </ul>
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {submitting ? 'Updating…' : 'Reset password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
