import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  Download,
  Printer,
  CheckCircle2,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  Layers,
  Sparkles,
  Award,
  Users,
  Briefcase
} from 'lucide-react';
import { Tenant, Invoice, Site, Guard, Incident } from '../types';
import { exportInvoiceToPDF } from '../utils/pdfExport';
import { tacticalAudio } from '../utils/audio';
import { formatCurrency, getTenantRegion } from '../utils/regional';

interface ClientBillingPortalProps {
  tenants: Tenant[];
  currentTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  invoices: Invoice[];
  sites: Site[];
  guards: Guard[];
  incidents: Incident[];
}

export const ClientBillingPortal: React.FC<ClientBillingPortalProps> = ({
  tenants,
  currentTenant,
  onSelectTenant,
  invoices,
  sites,
  guards,
  incidents,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(currentTenant.plan);
  const [addonK9, setAddonK9] = useState<boolean>(true);
  const [addonCruiser, setAddonCruiser] = useState<boolean>(true);
  const [addonPoliceSLA, setAddonPoliceSLA] = useState<boolean>(true);
  const [addonDrone, setAddonDrone] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice>(invoices[0] || null);
  const { currencyCode } = getTenantRegion(currentTenant);

  // Values are stored in the tenant's selected billing currency.
  const basePlanPrice =
    selectedPlan === 'Critical Infrastructure SLA'
      ? 285000
      : selectedPlan === 'Enterprise Guard Suite'
      ? 195000
      : 115000;

  const estimatedMonthly =
    basePlanPrice +
    (addonK9 ? 48500 : 0) +
    (addonCruiser ? 38500 : 0) +
    (addonPoliceSLA ? 22000 : 0) +
    (addonDrone ? 35000 : 0);

  return (
    <div id="client-billing-screen" className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span>Client Accounts & SaaS Invoicing Portal</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Manage client organization subscription tiers, tactical fleet add-ons, and verifiable tax invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedInvoice && (
            <button
              onClick={() => exportInvoiceToPDF(selectedInvoice, currentTenant)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-blue-600" />
              <span>Download Invoice PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
            <span>Client Organization</span>
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900 truncate">{currentTenant.name}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{currentTenant.code} • {currentTenant.industry}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
            <span>Active Subscription Tier</span>
            <Shield className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-lg font-bold text-emerald-700 truncate">{currentTenant.plan}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">PSIRA Grade A/B Certified</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
            <span>Covered Facilities</span>
            <Briefcase className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-indigo-700">
            {(sites || []).filter((s) => s.tenantId === currentTenant?.id).length || (sites || []).length} Sites
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">24/7 Security Coverage</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
            <span>Monthly Security Spend</span>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-amber-800">
            {formatCurrency(currentTenant.monthlySpend, currentTenant, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Active Billing Cycle (Aug 2026)</div>
        </div>
      </div>

      {/* Subscription Tier Calculator & Invoicing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left (1 col): Custom SLA & Tier Configurator */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">SaaS Security Tier Configurator</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Customize service levels and tactical add-ons</p>
          </div>

          {/* Plan selection */}
          <div className="space-y-2">
            {[
              {
                id: 'Standard Security',
                title: 'Standard Security',
                price: 115000,
                desc: 'Static guard coverage, QR checkpoint tracking, PSIRA Grade C',
              },
              {
                id: 'Enterprise Guard Suite',
                title: 'Enterprise Guard Suite',
                price: 195000,
                desc: 'Armed security, live bodycam streams, AI forensics, PSIRA Grade B',
              },
              {
                id: 'Critical Infrastructure SLA',
                title: 'Critical Infrastructure SLA',
                price: 285000,
                desc: 'Priority SAPS CAD integration, 24/7 dedicated dispatch, PSIRA Grade A',
              },
            ].map((plan) => (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan.id);
                  tacticalAudio.playRadioClick();
                }}
                className={`cursor-pointer rounded-lg p-3 border transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-blue-50/80 border-blue-400 text-slate-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-900">{plan.title}</span>
                  <span className="font-mono text-xs font-bold text-blue-700">{formatCurrency(plan.price, currentTenant, { maximumFractionDigits: 0 })}/mo</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{plan.desc}</p>
              </div>
            ))}
          </div>

          {/* Tactical Add-Ons */}
          <div>
            <div className="text-xs font-mono font-bold uppercase text-slate-800 mb-2">Tactical Fleet Add-Ons</div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-200 cursor-pointer">
                <span className="flex items-center gap-2 font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={addonK9}
                    onChange={(e) => setAddonK9(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600"
                  />
                  <span>🐕 Certified K9 Explosives / Narcotics Unit</span>
                </span>
                <span className="font-mono text-blue-700 font-bold">+{formatCurrency(48500, currentTenant, { maximumFractionDigits: 0 })}</span>
              </label>

              <label className="flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-200 cursor-pointer">
                <span className="flex items-center gap-2 font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={addonCruiser}
                    onChange={(e) => setAddonCruiser(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600"
                  />
                  <span>🚓 Armed Reaction Cruiser Unit</span>
                </span>
                <span className="font-mono text-blue-700 font-bold">+{formatCurrency(38500, currentTenant, { maximumFractionDigits: 0 })}</span>
              </label>

              <label className="flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-200 cursor-pointer">
                <span className="flex items-center gap-2 font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={addonPoliceSLA}
                    onChange={(e) => setAddonPoliceSLA(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600"
                  />
                  <span>⚡ Priority SAPS 10111 CAD Link</span>
                </span>
                <span className="font-mono text-blue-700 font-bold">+{formatCurrency(22000, currentTenant, { maximumFractionDigits: 0 })}</span>
              </label>

              <label className="flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-200 cursor-pointer">
                <span className="flex items-center gap-2 font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={addonDrone}
                    onChange={(e) => setAddonDrone(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600"
                  />
                  <span>🛸 Autonomous Perimeter Thermal Drone Sweeps</span>
                </span>
                <span className="font-mono text-blue-700 font-bold">+{formatCurrency(35000, currentTenant, { maximumFractionDigits: 0 })}</span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono">
            <span className="text-xs text-slate-600 font-semibold">Estimated Total:</span>
            <span className="text-base font-bold text-emerald-700">{formatCurrency(estimatedMonthly, currentTenant, { maximumFractionDigits: 0 })}/mo</span>
          </div>
        </div>

        {/* Right (2 cols): Itemized Invoice Inspector */}
        {selectedInvoice && (
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-blue-700">
                  {selectedInvoice.invoiceNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedInvoice.tenantName}</h3>
                <p className="text-xs text-slate-500 font-mono">Billing Period: {selectedInvoice.billingPeriod}</p>
              </div>

              <div className="text-right">
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-mono font-bold uppercase ${
                    selectedInvoice.status === 'Paid'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {selectedInvoice.status}
                </span>
                <div className="text-xs text-slate-500 font-mono mt-1">Due: {selectedInvoice.dueDate}</div>
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-mono text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Rate ({currencyCode})</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-900 font-sans font-semibold">{item.description}</td>
                      <td className="p-2.5 text-center text-slate-600">{item.quantity} {item.unit}</td>
                      <td className="p-2.5 text-right text-slate-600">{formatCurrency(item.rate, currentTenant)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(item.amount, currentTenant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Box */}
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <div className="w-64 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(selectedInvoice.subtotal, currentTenant)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SARS VAT (15%):</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(selectedInvoice.tax, currentTenant)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-blue-700 pt-1.5 border-t border-slate-200">
                  <span>Total Amount Due:</span>
                  <span>{formatCurrency(selectedInvoice.total, currentTenant)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
