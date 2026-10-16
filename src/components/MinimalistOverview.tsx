import React from 'react';
import { ArrowRight, Map, Plus } from 'lucide-react';
import { Incident } from '../types';

interface MinimalistOverviewProps {
  companyName: string;
  siteCount: number;
  activeGuardCount: number;
  scheduledShiftCount: number;
  incidents: Incident[];
  canLogIncident: boolean;
  onLogIncident: () => void;
  onViewRoster: () => void;
  onViewIncidents: () => void;
  onOpenLiveMap: () => void;
}

export function MinimalistOverview({ companyName, siteCount, activeGuardCount,
  scheduledShiftCount, incidents, canLogIncident, onLogIncident, onViewRoster,
  onViewIncidents, onOpenLiveMap }: MinimalistOverviewProps) {
  const openIncidents = incidents.filter((incident) => incident.status !== 'Resolved');
  const recentIncidents = [...incidents]
    .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))
    .slice(0, 5);
  const metrics = [
    { label: 'Active guards', value: activeGuardCount },
    { label: 'Open incidents', value: openIncidents.length },
    { label: 'Scheduled shifts', value: scheduledShiftCount },
    { label: 'Sites', value: siteCount },
  ];

  return (
    <section aria-labelledby="minimal-overview-heading" className="mx-auto w-full max-w-5xl space-y-8 py-2 md:py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-slate-500">{companyName}</p>
          <h1 id="minimal-overview-heading" className="text-2xl font-semibold tracking-tight text-slate-900">Overview</h1>
          <p className="mt-2 text-sm text-slate-500">Your operations at a glance.</p>
        </div>
        <button type="button" onClick={onOpenLiveMap} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <Map className="h-4 w-4" /> Open live map
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onLogIncident} disabled={!canLogIncident}
          title={!canLogIncident ? 'Add a guard before logging an incident' : undefined}
          className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus className="h-4 w-4" /> Log incident
        </button>
        <button type="button" onClick={onViewRoster} className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">View roster</button>
      </div>

      <section aria-labelledby="recent-incidents-heading" className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <h2 id="recent-incidents-heading" className="font-semibold text-slate-900">Recent incidents</h2>
          <button type="button" onClick={onViewIncidents} className="flex items-center gap-2 rounded text-sm text-slate-600 hover:text-slate-900">View all <ArrowRight className="h-4 w-4" /></button>
        </header>
        {recentIncidents.length === 0 ? (
          <p className="px-5 py-10 text-sm text-slate-500">No incidents recorded for this company.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentIncidents.map((incident) => (
              <li key={incident.id}>
                <button type="button" onClick={onViewIncidents} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900">{incident.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{incident.incidentNumber} · {incident.siteName}</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${incident.status !== 'Resolved' && incident.severity === 'Critical' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                    {incident.severity} · {incident.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-slate-500">All modules remain available in the navigation. Turn off Minimalist view to return to the full workspace.</p>
    </section>
  );
}
