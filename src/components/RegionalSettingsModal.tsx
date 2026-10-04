import React, { useState } from 'react';
import { Globe2, Save, X } from 'lucide-react';
import { Tenant } from '../types';
import { getTenantRegion, SOUTHERN_AFRICA_REGIONS } from '../utils/regional';

export interface RegionalSettingsValue {
  countryCode: string;
  currencyCode: string;
  locale: string;
}

interface RegionalSettingsModalProps {
  tenant: Tenant;
  onClose: () => void;
  onSave: (value: RegionalSettingsValue) => void | Promise<void>;
}

export const RegionalSettingsModal: React.FC<RegionalSettingsModalProps> = ({ tenant, onClose, onSave }) => {
  const initial = getTenantRegion(tenant);
  const [countryCode, setCountryCode] = useState(initial.countryCode);
  const [currencyCode, setCurrencyCode] = useState(initial.currencyCode);
  const [locale, setLocale] = useState(initial.locale);
  const [saving, setSaving] = useState(false);
  const region = SOUTHERN_AFRICA_REGIONS.find((item) => item.countryCode === countryCode)!;

  const handleCountryChange = (nextCountryCode: string) => {
    const nextRegion = SOUTHERN_AFRICA_REGIONS.find((item) => item.countryCode === nextCountryCode)!;
    setCountryCode(nextRegion.countryCode);
    setCurrencyCode(nextRegion.currencies[0]);
    setLocale(nextRegion.locale);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await onSave({ countryCode, currencyCode, locale });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50">
              <Globe2 className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Regional and currency settings</h2>
              <p className="text-xs text-slate-500">{tenant.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Southern Africa region</span>
            <select
              value={countryCode}
              onChange={(event) => handleCountryChange(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {SOUTHERN_AFRICA_REGIONS.map((item) => (
                <option key={item.countryCode} value={item.countryCode}>{item.countryName}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Display and billing currency</span>
            <select
              value={currencyCode}
              onChange={(event) => setCurrencyCode(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {region.currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Formatting locale</span>
            <input
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
          Changing currency updates display and future billing values. Existing numbers are not automatically converted using foreign-exchange rates.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-60">
            <Save className="h-4 w-4" />
            Save preferences
          </button>
        </div>
      </form>
    </div>
  );
};
