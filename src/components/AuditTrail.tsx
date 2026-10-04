import React, { useState } from 'react';
import { FileClock, Search, ShieldCheck } from 'lucide-react';
import { AuditEvent } from '../types';

interface AuditTrailProps {
  events: AuditEvent[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ events }) => {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = events.filter((event) => !normalizedQuery || [
    event.action,
    event.actorName,
    event.actorRole,
    event.entityType,
    event.entityId,
  ].some((value) => value.toLowerCase().includes(normalizedQuery)));

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Immutable Security Audit Trail
          </h2>
          <p className="text-xs font-mono text-slate-500">Authenticated actions, entity changes, and emergency command events</p>
        </div>
        <label className="relative w-full sm:w-80">
          <span className="sr-only">Search audit events</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search actor, action, entity…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((event) => (
                <tr key={event.id} className="align-top hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-500">
                    {new Date(event.occurredAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{event.actorName}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-blue-700">{event.actorRole}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-mono font-bold text-blue-800">
                      {event.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold capitalize text-slate-800">{event.entityType.replaceAll('_', ' ')}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-500">{event.entityId}</div>
                  </td>
                  <td className="max-w-md px-4 py-3 font-mono text-[10px] leading-relaxed text-slate-600">
                    {Object.keys(event.details).length ? JSON.stringify(event.details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-slate-400">
            <FileClock className="h-7 w-7" />
            <span className="text-sm">No audit events match this view.</span>
          </div>
        )}
      </div>
    </div>
  );
};
