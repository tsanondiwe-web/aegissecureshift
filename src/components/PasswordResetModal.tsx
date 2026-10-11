import React, { useMemo, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, KeyRound, Loader2, X } from 'lucide-react';
import { UserAccount } from '../types';

interface PasswordResetModalProps {
  user: UserAccount;
  onClose: () => void;
  onReset: (user: UserAccount, newPassword: string) => Promise<void>;
}

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ user, onClose, onReset }) => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isValid = useMemo(
    () => passwordRule.test(password) && password === confirmation,
    [confirmation, password],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordRule.test(password)) {
      setError('Use at least 12 characters with upper-case, lower-case, number, and symbol characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The password confirmation does not match.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onReset(user, password);
      onClose();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to change this password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-slate-950">Change user password</h2>
              <p className="text-xs text-slate-500">{user.name} · {user.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>This immediately replaces the user’s Firebase login password. It is not saved in the SecureShift database.</span>
          </div>
        </div>

        <label className="mt-4 block text-xs font-bold text-slate-700" htmlFor="new-user-password">New password</label>
        <div className="relative mt-1.5">
          <input
            id="new-user-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <label className="mt-3 block text-xs font-bold text-slate-700" htmlFor="confirm-user-password">Confirm password</label>
        <input
          id="confirm-user-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          required
        />
        <p className="mt-2 text-[11px] text-slate-500">At least 12 characters, including upper-case, lower-case, a number, and a symbol.</p>

        {error && <div role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Change password
          </button>
        </div>
      </form>
    </div>
  );
};
