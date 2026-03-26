import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import PageMotion from '../components/common/PageMotion';
import { useAuthContext } from '../contexts/AuthContext';

const initialForm = {
  name: '',
  email: '',
  password: '',
  remember: true,
};

const hasStrongPassword = (value) => value.length >= 8;

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, register, loading, verifyEmail, resendVerification } = useAuthContext();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [resending, setResending] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const passwordChecks = useMemo(
    () => [
      { label: 'At least 8 characters', valid: hasStrongPassword(form.password) },
      { label: 'Use a real email address', valid: /\S+@\S+\.\S+/.test(form.email) },
    ],
    [form.email, form.password]
  );

  useEffect(() => {
    const token = searchParams.get('verify');
    if (!token) return;

    const runVerification = async () => {
      try {
        const result = await verifyEmail(token);
        setInfo(result?.message || 'Email verified successfully. You can sign in now.');
        setError('');
        setMode('login');
        setForgotMode(false);
      } catch (verifyError) {
        setError(verifyError?.response?.data?.message || 'Could not verify your email');
      } finally {
        setSearchParams({}, { replace: true });
      }
    };

    runVerification();
  }, [searchParams, setSearchParams, verifyEmail]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetMessages = () => {
    setError('');
    setInfo('');
    setVerificationUrl('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetMessages();

    if (forgotMode) {
      setInfo('Forgot password UI is ready. Connect a reset-password backend endpoint to send recovery links.');
      return;
    }

    if (mode === 'register' && !hasStrongPassword(form.password)) {
      setError('Use a password with at least 8 characters.');
      return;
    }

    if (mode === 'login') {
      const result = await login(form.email, form.password, { remember: form.remember });
      if (!result.ok) {
        setError(result.message);
        if (result.verificationRequired) {
          setPendingEmail(result.email);
          setInfo('Your account exists but email verification is still pending.');
        }
        return;
      }

      navigate(redirectTo, { replace: true });
      return;
    }

    const result = await register({
      name: form.name,
      email: form.email,
      password: form.password,
    });

    if (!result.ok) {
      setError(result.message);
      if (result.verificationRequired) {
        setPendingEmail(form.email);
      }
      return;
    }

    setPendingEmail(form.email);
    setMode('login');
    setInfo(
      result?.data?.emailDelivered
        ? (result?.message || 'Account created. Check your email to verify your account.')
        : (result?.message || 'Account created. Email delivery is not configured here, so use the verification link below.')
    );
    setVerificationUrl(result?.data?.verificationUrl || '');
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setResending(true);
    setError('');

    try {
      const result = await resendVerification({ email: pendingEmail });
      setInfo(result?.message || 'Verification email sent.');
      setVerificationUrl(result?.data?.verificationUrl || '');
    } catch (resendError) {
      setError(resendError?.response?.data?.message || 'Could not resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <PageMotion>
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hero-card grid-accent rounded-[36px] p-8 sm:p-10">
          <p className="eyebrow">Account Access</p>
          <h1 className="section-title mt-4">
            A cleaner login and checkout experience for verified riders.
          </h1>
          <p className="section-subtitle mt-5 max-w-xl">
            Sign in with a verified email, keep your session on trusted devices, and manage ticket purchases with less friction.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <FeatureCard
              title="Verified bookings"
              description="Only verified email accounts can buy tickets, reducing abuse and fake reservations."
            />
            <FeatureCard
              title="Session control"
              description="Choose whether to keep your session on this device with the remember-me option."
            />
            <FeatureCard
              title="Clear validation"
              description="Passwords, email format, and submission states are handled before the request is sent."
            />
            <FeatureCard
              title="Production-ready UI"
              description="Modern SaaS styling, friendly feedback, and protected routes across the app."
            />
          </div>
        </div>

        <div className="shell-card rounded-[36px] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{forgotMode ? 'Recovery' : mode === 'login' ? 'Sign In' : 'Create Account'}</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-slate-100">
                {forgotMode ? 'Forgot your password?' : mode === 'login' ? 'Welcome back' : 'Create your rider account'}
              </h2>
            </div>
            {!forgotMode ? (
              <div className="rounded-full bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-cyan-400 text-slate-950 shadow-sm' : 'text-slate-400'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-cyan-400 text-slate-950 shadow-sm' : 'text-slate-400'}`}
                >
                  Sign Up
                </button>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === 'register' && !forgotMode ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Full name</label>
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Your full name"
                  className="field"
                />
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Email address</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="you@example.com"
                className="field"
              />
            </div>

            {!forgotMode ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    placeholder="Enter your password"
                    className="field pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-3 my-auto h-10 rounded-full px-3 text-sm font-semibold text-slate-400 hover:bg-white/8 hover:text-white"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            ) : null}

            {mode === 'register' && !forgotMode ? (
              <div className="grid gap-2 rounded-[24px] bg-white/5 p-4 text-sm text-slate-300">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${check.valid ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>{check.label}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {!forgotMode ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(event) => updateField('remember', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 text-cyan-400 focus:ring-cyan-400"
                  />
                  Remember me on this device
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    resetMessages();
                  }}
                  className="text-sm font-semibold text-cyan-300"
                >
                  Forgot password?
                </button>
              </div>
            ) : (
              <div className="rounded-[24px] bg-amber-400/12 p-4 text-sm leading-6 text-amber-200">
                This screen is ready for a reset-password backend. Once you add a reset endpoint, this form can dispatch real recovery emails.
              </div>
            )}

            {info ? <div className="rounded-[24px] bg-emerald-500/12 px-4 py-3 text-sm text-emerald-200">{info}</div> : null}
            {error ? <div className="rounded-[24px] bg-rose-500/12 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

            <button type="submit" disabled={loading || resending} className="btn-primary w-full">
              {loading
                ? forgotMode
                  ? 'Preparing...'
                  : mode === 'login'
                    ? 'Signing in...'
                    : 'Creating account...'
                : forgotMode
                  ? 'Request password help'
                  : mode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            {forgotMode ? (
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="btn-secondary"
              >
                Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={!pendingEmail || resending}
                className="btn-secondary"
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>

          {pendingEmail ? (
            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-slate-100">Verification is pending for {pendingEmail}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Real email delivery is not configured in this local setup. No inbox email will arrive until SMTP is added, so use the verification link below.
              </p>
              {verificationUrl ? (
                <a
                  href={verificationUrl}
                  className="mt-4 block break-all rounded-[20px] bg-slate-950 px-4 py-3 text-sm font-medium text-cyan-300 shadow-sm"
                >
                  {verificationUrl}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </PageMotion>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
      <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}
