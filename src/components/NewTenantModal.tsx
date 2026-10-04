import React, { useState } from 'react';
import {
  Building2,
  UserCheck,
  Shield,
  Key,
  Mail,
  Phone,
  CheckCircle2,
  Copy,
  Sparkles,
  MapPin,
  Lock,
  Globe,
  DollarSign
} from 'lucide-react';
import { Tenant, UserAccount, Site } from '../types';
import { tacticalAudio } from '../utils/audio';

interface NewTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTenant: (tenant: Tenant, admin: UserAccount, primarySite?: Partial<Site>) => void;
}

export const NewTenantModal: React.FC<NewTenantModalProps> = ({
  isOpen,
  onClose,
  onAddTenant,
}) => {
  // Step 1: Tenant Details
  const [tenantName, setTenantName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [industry, setIndustry] = useState('Critical Infrastructure & High-Value Assets');
  const [plan, setPlan] = useState<'Standard Security' | 'Enterprise Guard Suite' | 'Critical Infrastructure SLA'>('Enterprise Guard Suite');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [monthlySpend, setMonthlySpend] = useState<number>(35000);
  const [logo, setLogo] = useState('🛡️');
  const [color, setColor] = useState('#171717');

  // Step 2: Primary Site Details
  // New organizations start with an empty operational workspace. A site is
  // created only when the provisioning administrator explicitly opts in.
  const [createInitialSite, setCreateInitialSite] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteCity, setSiteCity] = useState('');

  // Step 3: Tenant Admin Account
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [tempPassword, setTempPassword] = useState('AegisGuard2026!#');

  // Completion State
  const [createdCredentials, setCreatedCredentials] = useState<{
    tenant: Tenant;
    admin: UserAccount;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setTenantName(name);
    if (!tenantCode || tenantCode === tenantName.slice(0, 4).toUpperCase()) {
      const generated = name
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 6)
        .toUpperCase();
      setTenantCode(generated || 'NEW-ORG');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim() || !adminName.trim() || !adminEmail.trim()) return;

    const tenantId = `tenant-${tenantCode.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const adminId = `usr-admin-${Date.now().toString().slice(-4)}`;

    const newAdmin: UserAccount = {
      id: adminId,
      name: adminName.trim(),
      email: adminEmail.trim(),
      phone: adminPhone.trim() || contactPhone.trim() || '+44 (0) 20 7946 0000',
      role: 'TENANT_ADMIN',
      tenantId,
      tenantName: tenantName.trim(),
      status: 'ACTIVE',
      avatar: logo,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never (Invite Generated)',
      temporaryPassword: tempPassword,
      assignedSitesCount: createInitialSite ? 1 : 0,
    };

    const newTenant: Tenant = {
      id: tenantId,
      name: tenantName.trim(),
      code: tenantCode.trim().toUpperCase() || 'NEW-ORG',
      industry,
      plan,
      sitesCount: createInitialSite ? 1 : 0,
      guardsCount: 0,
      contactEmail: contactEmail.trim() || adminEmail.trim(),
      contactPhone: contactPhone.trim() || adminPhone.trim() || '+44 (0) 20 7946 0000',
      monthlySpend: Number(monthlySpend) || 25000,
      countryCode: 'ZA',
      currencyCode: 'ZAR',
      locale: 'en-ZA',
      logo,
      color,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      primaryAdminId: adminId,
      primaryAdminName: adminName.trim(),
      primaryAdminEmail: adminEmail.trim(),
    };

    const initialSite: Partial<Site> | undefined = createInitialSite
      ? {
          id: `site-${tenantId}-1`,
          tenantId,
          name: siteName.trim() || `${tenantName.trim()} Headquarters`,
          address: siteAddress.trim() || '100 Sovereign Way',
          city: siteCity.trim() || 'London',
          state: 'Greater London',
          country: 'United Kingdom',
          region: 'UK South East',
          type: 'Corporate HQ',
          activeGuardsCount: 0,
          totalCheckpoints: 0,
          mapCenter: { lat: 51.5074, lng: -0.1278 },
          geoMapPos: { x: 50, y: 50 },
        }
      : undefined;

    tacticalAudio.playRadioClick();
    onAddTenant(newTenant, newAdmin, initialSite);
    setCreatedCredentials({ tenant: newTenant, admin: newAdmin });
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `=== AEGIS OPS TENANT ADMIN CREDENTIALS ===\nOrganization: ${createdCredentials.tenant.name} (${createdCredentials.tenant.code})\nAdmin Name: ${createdCredentials.admin.name}\nLogin Email: ${createdCredentials.admin.email}\nTemporary Password: ${createdCredentials.admin.temporaryPassword}\nRole: Tenant Administrator (Full Organization Access)\nPortal URL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClose = () => {
    setCreateInitialSite(false);
    setSiteName('');
    setSiteAddress('');
    setSiteCity('');
    setCreatedCredentials(null);
    onClose();
  };

  const handleDone = () => handleClose();

  const emojiOptions = ['🛡️', '⚡', '🚢', '🏰', '🏢', '🔬', '✈️', '🏦', '💎', '🚀', '🔒', '🌐'];
  const colorOptions = ['#171717', '#404040', '#525252', '#737373', '#A3A3A3', '#D4D4D4', '#E5E5E5'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        {createdCredentials ? (
          /* Success Screen with Copyable Credentials */
          <div className="space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-2xl">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Tenant Organization & Admin Account Created!
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Provisioned in database with active access credentials
                </p>
              </div>
            </div>

            {/* Organization Summary Pill */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{createdCredentials.tenant.logo}</span>
                <div>
                  <div className="font-bold text-slate-900 text-base">
                    {createdCredentials.tenant.name}
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    Code: <strong className="text-blue-700">{createdCredentials.tenant.code}</strong> • Tier:{' '}
                    <span className="text-slate-800">{createdCredentials.tenant.plan}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Credentials Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 font-mono text-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400 font-sans font-bold">
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                  <UserCheck className="h-3.5 w-3.5" />
                  TENANT ADMINISTRATOR CREDENTIALS
                </span>
                <span className="text-amber-400 font-mono">STATUS: ACTIVE</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1">
                <div className="text-slate-400">Admin Name:</div>
                <div className="col-span-2 text-white font-bold">{createdCredentials.admin.name}</div>

                <div className="text-slate-400">Login Email:</div>
                <div className="col-span-2 text-emerald-400 font-bold">{createdCredentials.admin.email}</div>

                <div className="text-slate-400">Temp Password:</div>
                <div className="col-span-2 text-amber-300 font-bold bg-slate-800/80 px-2 py-0.5 rounded inline-block">
                  {createdCredentials.admin.temporaryPassword}
                </div>

                <div className="text-slate-400">Role Assigned:</div>
                <div className="col-span-2 text-blue-300 font-bold">TENANT_ADMIN (Full Org Control)</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all w-full sm:w-auto justify-center ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Credentials Copied to Clipboard!' : 'Copy Credentials for Admin'}</span>
              </button>

              <button
                type="button"
                onClick={handleDone}
                className="w-full sm:w-auto rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                Done & View Tenant Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Input Form for New Tenant & Admin */
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Register New Tenant & Provision Admin Account
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Superadmin Multi-Tenant Organization Setup
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Section 1: Organization Details */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                <span>1. Organization Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Organization / Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Sovereign Protection"
                    value={tenantName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white focus:text-slate-900 focus:outline-none shadow-2xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tenant Code / ID Prefix *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. APEX-DEF"
                    value={tenantCode}
                    onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono font-bold uppercase text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white focus:text-slate-900 focus:outline-none shadow-2xs transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Industry Sector</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none shadow-2xs transition-all"
                  >
                    <option value="Critical Infrastructure & High-Value Assets">
                      Critical Infrastructure & Defense
                    </option>
                    <option value="Semiconductor, Cloud & Aerospace">Mining, Energy & Heavy Industry</option>
                    <option value="Supply Chain, Maritime & Rail Logistics">Maritime & Logistics Fleet</option>
                    <option value="Heritage Palaces & High-Security Private Estates">
                      Commercial Towers & Gated Estates
                    </option>
                    <option value="Banking, Vaults & Financial Towers">Banking, Vaults & Financial</option>
                    <option value="Pharmaceutical & BioTech Campuses">Pharma & Healthcare Campuses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">SLA Subscription Tier</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none shadow-2xs transition-all"
                  >
                    <option value="Standard Security">Standard Security (R95,000/mo)</option>
                    <option value="Enterprise Guard Suite">Enterprise Guard Suite (R185,000/mo)</option>
                    <option value="Critical Infrastructure SLA">Critical Infrastructure SLA (R285,000/mo)</option>
                  </select>
                </div>
              </div>

              {/* Logo Emoji & Color Picker */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Brand Icon Emoji</label>
                  <div className="flex flex-wrap gap-1.5">
                    {emojiOptions.map((em) => (
                      <button
                        type="button"
                        key={em}
                        onClick={() => setLogo(em)}
                        className={`h-8 w-8 rounded-lg text-sm flex items-center justify-center transition-all ${
                          logo === em
                            ? 'bg-blue-100 border-2 border-blue-600 scale-110 shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Brand Theme Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    {colorOptions.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`h-7 w-7 rounded-full transition-transform ${
                          color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Primary Tenant Administrator Account */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>2. Tenant Administrator Account (Provisioned Instantly)</span>
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                  ROLE: TENANT_ADMIN
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Admin Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Commander Marcus Sterling"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white focus:text-slate-900 focus:outline-none shadow-2xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Admin Official Email (Login) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@vanguard-sec.co.za"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white focus:text-slate-900 focus:outline-none shadow-2xs transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Admin Direct Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +27 (0) 11 946 0192"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white focus:text-slate-900 focus:outline-none shadow-2xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Temporary Initial Password
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono font-bold bg-slate-50 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white focus:text-slate-900 focus:outline-none shadow-2xs transition-all"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Initial Site Deployment */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createInitialSite}
                    onChange={(e) => setCreateInitialSite(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Deploy primary facility / site for this tenant immediately
                  </span>
                </label>
              </div>

              {createInitialSite && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-6 border-l-2 border-blue-200">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Site Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sandton Financial Operations Center"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City / Region</label>
                    <input
                      type="text"
                      placeholder="Johannesburg"
                      value={siteCity}
                      onChange={(e) => setSiteCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Submit */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                <span>Create Tenant & Provision Admin</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
