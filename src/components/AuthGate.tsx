import React, { useState } from 'react';
import { AlertTriangle, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { signInToFirebase } from '../lib/firebase';

interface AuthGateProps {
  loading: boolean;
  accessError?: string;
}

export const AuthGate: React.FC<AuthGateProps> = ({ loading, accessError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await signInToFirebase(email.trim(), password);
    if (!result.success) {
      setError(result.error?.message || 'Unable to authenticate this account.');
    }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#071321] text-slate-100 flex items-center justify-center p-5">
      <section className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-[#0B1E33] p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10">
            <ShieldCheck className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AegisOps Secure Access</h1>
            <p className="text-xs font-mono text-slate-400">AUTHENTICATED SECURITY OPERATIONS CONSOLE</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying secure session…
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-xs font-semibold text-slate-300">Email address</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-950/40 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-xs font-semibold text-slate-300">Password</label>
              <input
                id="auth-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-950/40 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {(error || accessError) && (
              <div role="alert" className="flex gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error || accessError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
              Sign in to command centre
            </button>
          </form>
        )}
      </section>
    </main>
  );
};
