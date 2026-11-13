import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { resendOtp, verifyOtp } from '@/features/authSlice';
import AuthLayout from '@/components/layout/AuthLayout';
import Button from '@/components/ui/Button';
import OtpInput from '@/components/ui/OtpInput';
import { InlineAlert } from '@/components/ui/Feedback';
import { DEMO_OTP } from '@/utils/constants';

const RESEND_SECONDS = 30;

const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(2, name.length - 2))}@${domain}`;
};

export default function VerifyOtp() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const email = useAppSelector((s) => s.auth.reset.email);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  if (!email) return <Navigate to="/forgot-password" replace />;

  const submit = async () => {
    if (code.length < 6) {
      setError('Enter the full 6-digit code.');
      return;
    }
    setError(null);
    setVerifying(true);
    const result = await dispatch(verifyOtp(code));
    setVerifying(false);
    if (verifyOtp.rejected.match(result)) {
      setError(result.payload ?? 'Verification failed. Please try again.');
      return;
    }
    navigate('/reset-password');
  };

  const resend = async () => {
    setResending(true);
    await dispatch(resendOtp());
    setResending(false);
    setCode('');
    setError(null);
    setInfo('A new code has been sent.');
    setSeconds(RESEND_SECONDS);
  };

  return (
    <AuthLayout
      title="Verify your identity"
      subtitle={`We sent a 6-digit code to ${maskEmail(email)}. Enter it below to continue.`}
      footer={
        <Link to="/forgot-password" className="inline-flex items-center gap-1.5 font-medium text-blue-400 hover:text-blue-300 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Use a different email
        </Link>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-5"
      >
        {error && <InlineAlert>{error}</InlineAlert>}
        {info && !error && <InlineAlert kind="success">{info}</InlineAlert>}
        <OtpInput value={code} onChange={(v) => { setCode(v); setError(null); }} error={!!error} disabled={verifying} />
        <Button type="submit" size="lg" fullWidth loading={verifying}>
          {verifying ? 'Verifying…' : 'Verify code'}
        </Button>
        <p className="text-center text-sm text-muted">
          Didn't get it?{' '}
          {seconds > 0 ? (
            <span>Resend in {seconds}s</span>
          ) : (
            <button type="button" onClick={resend} disabled={resending} className="font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50">
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </p>
        <p className="rounded-xl border border-dashed border-line px-3 py-2 text-center text-xs text-muted">
          Demo environment — use code <span className="font-semibold text-slate-200">{DEMO_OTP}</span>
        </p>
      </form>
    </AuthLayout>
  );
}
