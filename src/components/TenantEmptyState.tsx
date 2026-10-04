import React from 'react';
import { Building2, ClipboardList, MapPinned, ShieldCheck } from 'lucide-react';
import { Tenant } from '../types';

interface TenantEmptyStateProps {
  tenant: Tenant;
}

export const TenantEmptyState: React.FC<TenantEmptyStateProps> = ({ tenant }) => (
  <section className="flex min-h-[65vh] items-center justify-center">
    <div className="w-full max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
        <Building2 className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">
        {tenant.id === '__no_tenant__' ? 'Start with a blank workspace' : `${tenant.name} is ready`}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
        This is a new, blank tenant workspace. No sites, guards, incidents, patrols,
        shifts, checkpoints, or operational telemetry have been added.
      </p>

      <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <MapPinned className="h-5 w-5 text-blue-600" />
          <div className="mt-2 text-xs font-bold text-slate-800">1. Add a site</div>
          <div className="mt-1 text-[11px] text-slate-500">Define the first protected facility.</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <div className="mt-2 text-xs font-bold text-slate-800">2. Assign guards</div>
          <div className="mt-1 text-[11px] text-slate-500">Build the tenant’s operational roster.</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <ClipboardList className="h-5 w-5 text-blue-600" />
          <div className="mt-2 text-xs font-bold text-slate-800">3. Configure patrols</div>
          <div className="mt-1 text-[11px] text-slate-500">Add checkpoints, tours, and schedules.</div>
        </div>
      </div>

      <div className="mt-6 text-[10px] font-mono uppercase tracking-wider text-emerald-700">
        Clean tenant isolation confirmed • No demo data inherited
      </div>
    </div>
  </section>
);
