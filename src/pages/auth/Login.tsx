import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  X,
} from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { login } from '@/features/authSlice';
import AuthLayout from '@/components/layout/AuthLayout';
import { GoogleIcon } from '@/components/ui/Icons';
import { InlineAlert } from '@/components/ui/Feedback';

interface DemoUser {
  roleName: string;
  email: string;
  phone: string;
  password: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    roleName: 'Sales Rep',
    email: 'sales@enterprisecrm.com',
    phone: '+1 512 555 0188',
    password: 'Sales@123',
  },
  {
    roleName: 'Sales Manager',
    email: 'manager@enterprisecrm.com',
    phone: '+1 415 555 0142',
    password: 'Manager@123',
  },
  {
    roleName: 'Employee',
    email: 'employee@enterprisecrm.com',
    phone: '+91 98765 43210',
    password: 'Employee@123',
  },
];

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const flash = (location.state as { flash?: string } | null)?.flash;
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactAdminOpen, setContactAdminOpen] = useState(false);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);

  const handleFillDemo = (demo: DemoUser) => {
    setError(null);
    setSocialNotice(null);
    setEmail(demo.email);
    setPassword(demo.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSocialNotice(null);

    const identifier = email.trim();

    if (!identifier) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const isEmail = identifier.includes('@');
      const result = await dispatch(
        login({
          identifier,
          email: isEmail ? identifier : undefined,
          phone: !isEmail ? identifier : undefined,
          password,
          remember: rememberMe,
          mode: isEmail ? 'email' : 'phone',
        }),
      );

      if (login.rejected.match(result)) {
        setError(result.payload ?? 'Incorrect credentials. Please try again.');
        return;
      }

      const targetPath = (!from || from === '/login' || from.startsWith('/login')) ? '/' : from;
      navigate(targetPath, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    const defaultUser = DEMO_USERS[0];
    setSocialNotice(`Signing you in with Google (${defaultUser.email})…`);
    setEmail(defaultUser.email);
    setPassword(defaultUser.password);
    setTimeout(() => {
      dispatch(
        login({
          email: defaultUser.email,
          password: defaultUser.password,
          remember: true,
          mode: 'email',
        }),
      ).then((res) => {
        if (login.fulfilled.match(res)) {
          const targetPath = (!from || from === '/login' || from.startsWith('/login')) ? '/' : from;
          navigate(targetPath, { replace: true });
        }
      });
    }, 600);
  };

  return (
    <AuthLayout
      title="Sign In"
      subtitle="Enter your credentials to access your account"
      footer={
        <p className="text-gray-400 text-sm">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => setContactAdminOpen(true)}
            className="font-medium text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:underline"
          >
            Contact Admin
          </button>
        </p>
      }
    >
      {/* Alert Messages */}
      {flash && (
        <div className="mb-4">
          <InlineAlert kind="success">{flash}</InlineAlert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <InlineAlert kind="error">{error}</InlineAlert>
        </div>
      )}
      {socialNotice && (
        <div className="mb-4">
          <InlineAlert kind="info">{socialNotice}</InlineAlert>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
        {/* Email Field */}
        <div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />

            <input
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              aria-label="Email address"
              className="w-full rounded-xl border border-white/10 bg-slate-800/70 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition-all duration-200 placeholder:text-gray-500 hover:border-white/20 focus:border-blue-400 focus:bg-slate-800/90 focus:ring-2 focus:ring-blue-500/30 focus:shadow-[0_0_20px_rgba(59,130,246,0.25)]"
            />
          </div>
        </div>

        {/* Password Field with Eye Toggle */}
        <div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />

            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              aria-label="Password"
              className="w-full rounded-xl border border-white/10 bg-slate-800/70 py-3.5 pl-12 pr-12 text-sm text-white outline-none transition-all duration-200 placeholder:text-gray-500 hover:border-white/20 focus:border-blue-400 focus:bg-slate-800/90 focus:ring-2 focus:ring-blue-500/30 focus:shadow-[0_0_20px_rgba(59,130,246,0.25)]"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white hover:scale-110 active:scale-90 transition-all p-1"
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>

        {/* Remember Me and Forgot Password Row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2 select-none text-sm text-gray-400 hover:text-gray-300 transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline transition-all duration-150"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Sign In Button with Arrow & Shimmer */}
        <button
          type="submit"
          disabled={submitting}
          className="group relative overflow-hidden flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 py-3.5 sm:py-4 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full pointer-events-none" />
          {submitting ? (
            <span>Signing In…</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight
                size={20}
                className="transition-transform duration-200 group-hover:translate-x-1.5"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </form>

      {/* OR Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-gray-500 uppercase tracking-wider">OR</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Continue with Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 py-3 font-medium text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.08)] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-white/20"
      >
        <GoogleIcon className="h-5 w-5 transition-transform group-hover:scale-105" />
        <span>Continue with Google</span>
      </button>

      {/* Demo Credentials Quick-Fill Pills */}
      <div className="mt-5 pt-3.5 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Quick Demo Fill
          </span>
          <span className="text-[10px] text-gray-400">Click to fill</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {DEMO_USERS.map((user) => (
            <button
              key={user.roleName}
              type="button"
              onClick={() => handleFillDemo(user)}
              title={`${user.email} / ${user.phone}`}
              className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-900/50 border border-blue-900/30 hover:border-blue-400/60 text-[11px] font-medium text-gray-300 hover:text-white transition-all duration-200 text-center truncate active:scale-95 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] focus:outline-none cursor-pointer"
            >
              {user.roleName}
            </button>
          ))}
        </div>
      </div>

      {/* Contact Admin Modal */}
      {contactAdminOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-blue-500/30 p-6 text-slate-100 shadow-2xl">
            <button
              type="button"
              onClick={() => setContactAdminOpen(false)}
              aria-label="Close dialog"
              className="absolute right-4 top-4 text-gray-400 hover:text-white p-1 rounded-lg focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>

            <h4 className="text-lg font-bold text-white tracking-tight">Need Enterprise Account Access?</h4>
            <p className="mt-2 text-xs sm:text-sm text-gray-300 leading-relaxed">
              New accounts and permission changes are provisioned through your organization’s IT Security Administrator.
            </p>

            <div className="mt-4 space-y-2.5 rounded-xl bg-slate-950 p-3.5 text-xs border border-white/10">
              <div className="flex justify-between">
                <span className="text-gray-400">Admin Support Email:</span>
                <span className="text-blue-400 font-medium select-all">admin@enterprisecrm.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Internal Helpdesk:</span>
                <span className="text-gray-200 font-medium">+1 (800) 555-0199</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Support Hours:</span>
                <span className="text-gray-200">24/7 Enterprise SLA</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setContactAdminOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
