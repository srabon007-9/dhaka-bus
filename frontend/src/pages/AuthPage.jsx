import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMotion from '../components/common/PageMotion';
import { useAuthContext } from '../contexts/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, loading } = useAuthContext();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'login') {
      const result = await login(form.email, form.password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      navigate('/');
      return;
    }

    const result = await register({ name: form.name, email: form.email, password: form.password });
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setMode('login');
    setError('Account created successfully. You can sign in now.');
  };

  return (
    <PageMotion>
      <section className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-bold text-white">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-2 text-sm text-slate-300">Demo admin: admin@dhakabus.com / admin123</p>

        <div className="mt-5 inline-flex rounded-xl bg-white/10 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-cyan-500 text-slate-900' : 'text-slate-200'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-cyan-500 text-slate-900' : 'text-slate-200'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === 'register' ? (
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Full name"
              className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-2.5 text-white outline-none"
            />
          ) : null}

          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
            className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-2.5 text-white outline-none"
          />

          <input
            required
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Password"
            className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-2.5 text-white outline-none"
          />

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 font-semibold text-slate-900 hover:bg-cyan-400 disabled:opacity-60"
          >
            {loading ? 'Signing you in...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </section>
    </PageMotion>
  );
}
