import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { requestPasswordReset } from '@/features/authSlice';
import { useForm, validators } from '@/hooks/useForm';
import AuthLayout from '@/components/layout/AuthLayout';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';

export default function ForgotPassword() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { bind, handleSubmit, submitting, submitError } = useForm({ email: '' }, (v) => ({ email: validators.email(v.email) }));

  const onSubmit = handleSubmit(async ({ email }) => {
    const result = await dispatch(requestPasswordReset(email));
    if (requestPasswordReset.rejected.match(result)) throw new Error(result.payload ?? 'Could not send a code. Try again.');
    navigate('/verify-otp');
  });

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your work email and we'll send a 6-digit verification code to reset it."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-blue-400 hover:text-blue-300 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {submitError && <InlineAlert>{submitError}</InlineAlert>}
        <Input label="Work email" type="email" autoComplete="email" placeholder="you@company.com" leftIcon={<Mail className="h-4 w-4" />} {...bind('email')} />
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {submitting ? 'Sending code…' : 'Send verification code'}
        </Button>
      </form>
    </AuthLayout>
  );
}
