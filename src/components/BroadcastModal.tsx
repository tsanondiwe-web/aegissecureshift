import React, { useState } from 'react';
import { Radio, Send, X, AlertTriangle, ShieldCheck, Users, Building, BellRing } from 'lucide-react';
import { Site, Guard, BroadcastMessage } from '../types';
import { tacticalAudio } from '../utils/audio';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
  guards: Guard[];
  onSendBroadcast: (broadcast: Omit<BroadcastMessage, 'id' | 'timestamp' | 'deliveredCount' | 'acknowledgedCount'>) => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  sites,
  guards,
  onSendBroadcast,
}) => {
  const [scope, setScope] = useState<'all_sites' | 'single_site' | 'individual_guard'>('all_sites');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.id || '');
  const [selectedGuardId, setSelectedGuardId] = useState<string>(guards[0]?.id || '');
  const [priority, setPriority] = useState<'Routine' | 'Urgent' | 'Emergency Priority'>('Urgent');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !subject.trim()) return;

    const siteObj = sites.find((s) => s.id === selectedSiteId);
    const guardObj = guards.find((g) => g.id === selectedGuardId);

    onSendBroadcast({
      sender: 'Dispatcher Central (AegisOps)',
      senderRole: 'Command Controller',
      targetScope: scope,
      targetSiteId: scope === 'single_site' ? selectedSiteId : undefined,
      targetSiteName: scope === 'single_site' ? siteObj?.name : undefined,
      targetGuardId: scope === 'individual_guard' ? selectedGuardId : undefined,
      targetGuardName: scope === 'individual_guard' ? guardObj?.name : undefined,
      priority,
      subject,
      message,
    });

    tacticalAudio.playDispatchAlert();
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setSubject('');
      setMessage('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Tactical Radio & Push Broadcast</h3>
              <p className="text-xs text-slate-500 font-mono">Instant Dispatch Push Notification to Field Guards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="my-8 flex flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h4 className="mt-3 text-base font-bold text-slate-900">Broadcast Dispatched Successfully</h4>
            <p className="mt-1 text-xs text-slate-500 font-mono">
              Push notification, bodycam alert, and radio chime transmitted to target field radios.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Target Scope */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-700 mb-1.5">
                Target Broadcast Scope
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('all_sites')}
                  className={`flex flex-col items-center justify-center rounded-lg p-2.5 text-center text-xs font-bold transition-all ${
                    scope === 'all_sites'
                      ? 'bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Users className="h-4 w-4 mb-1 text-blue-600" />
                  <span>All Active Sites</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope('single_site')}
                  className={`flex flex-col items-center justify-center rounded-lg p-2.5 text-center text-xs font-bold transition-all ${
                    scope === 'single_site'
                      ? 'bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building className="h-4 w-4 mb-1 text-blue-600" />
                  <span>Specific Site</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope('individual_guard')}
                  className={`flex flex-col items-center justify-center rounded-lg p-2.5 text-center text-xs font-bold transition-all ${
                    scope === 'individual_guard'
                      ? 'bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Radio className="h-4 w-4 mb-1 text-blue-600" />
                  <span>Individual Guard</span>
                </button>
              </div>
            </div>

            {/* Conditional Dropdown for Site or Guard */}
            {scope === 'single_site' && (
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Select Target Facility</label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scope === 'individual_guard' && (
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Select Security Officer</label>
                <select
                  value={selectedGuardId}
                  onChange={(e) => setSelectedGuardId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {guards.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.badgeNumber}) — {g.siteName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority level */}
            <div>
              <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Dispatch Alert Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Routine', 'Urgent', 'Emergency Priority'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all border ${
                      priority === p
                        ? p === 'Emergency Priority'
                          ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-2xs'
                          : p === 'Urgent'
                          ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                          : 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Broadcast Subject / Code</label>
              <input
                type="text"
                required
                placeholder="e.g. BOLO: Blue sedan circling perimeter gate"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Message Instructions</label>
              <textarea
                rows={3}
                required
                placeholder="Direct guards to tighten exterior perimeter patrols..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Transmit Broadcast</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
