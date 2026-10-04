import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Mail,
  Phone,
  Lock,
  Building2,
  Key,
  CheckCircle2,
  Copy,
  Shield,
  Radio,
  UserPlus,
  ShieldAlert,
  MapPin
} from 'lucide-react';
import { Tenant, UserAccount, UserRole, Site } from '../types';
import { tacticalAudio } from '../utils/audio';

interface NewTenantAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
  selectedTenant?: Tenant;
  onAddAdmin: (admin: UserAccount) => void;
  currentUser?: UserAccount;
  sites?: Site[];
}

export const NewTenantAdminModal: React.FC<NewTenantAdminModalProps> = ({
  isOpen,
  onClose,
  tenants,
  selectedTenant,
  onAddAdmin,
  currentUser,
  sites = [],
}) => {
  // Determine if the logged-in user is restricted to their own tenant
  const isTenantAdminOnly = currentUser?.role === 'TENANT_ADMIN' || (currentUser?.role && currentUser.role !== 'SUPERADMIN');
  const initialTenantId = isTenantAdminOnly
    ? currentUser?.tenantId || selectedTenant?.id || tenants[0]?.id || ''
    : selectedTenant?.id || tenants[0]?.id || '';

  const [targetTenantId, setTargetTenantId] = useState<string>(initialTenantId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tempPassword, setTempPassword] = useState('MonaGuard2026!#');
  const [role, setRole] = useState<UserRole>('DISPATCHER');
  const [assignedSiteId, setAssignedSiteId] = useState<string>('ALL');

  const [createdUser, setCreatedUser] = useState<UserAccount | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync targetTenantId when modal opens or selectedTenant changes
  useEffect(() => {
    if (isOpen) {
      const defaultId = isTenantAdminOnly
        ? currentUser?.tenantId || selectedTenant?.id || tenants[0]?.id || ''
        : selectedTenant?.id || tenants[0]?.id || '';
      setTargetTenantId(defaultId);
      setName('');
      setEmail('');
      setPhone('');
      setTempPassword(`MonaGuard${Math.floor(1000 + Math.random() * 9000)}!#`);
      setRole(isTenantAdminOnly ? 'DISPATCHER' : 'TENANT_ADMIN');
      setAssignedSiteId('ALL');
      setCreatedUser(null);
      setCopied(false);
    }
  }, [isOpen, selectedTenant, currentUser, isTenantAdminOnly, tenants]);

  if (!isOpen) return null;

  const currentTenant = tenants.find((t) => t.id === targetTenantId) || selectedTenant || tenants[0];
  const tenantSites = sites.filter((s) => s.tenantId === currentTenant?.id);
  const selectedSite = tenantSites.find((s) => s.id === assignedSiteId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !currentTenant) return;

    const roleAvatars: Record<UserRole, string> = {
      SUPERADMIN: '👑',
      TENANT_ADMIN: '🛡️',
      SUPERVISOR: '⭐',
      DISPATCHER: '📻',
      GUARD: '👮',
    };

    const newUser: UserAccount = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '+44 (0) 20 7946 0000',
      role,
      tenantId: currentTenant.id,
      tenantName: currentTenant.name,
      status: 'ACTIVE',
      avatar: roleAvatars[role] || currentTenant.logo || '👤',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never (Invite Generated)',
      temporaryPassword: tempPassword,
      assignedSitesCount: assignedSiteId === 'ALL' ? (tenantSites.length || 1) : 1,
      assignedSiteId: assignedSiteId !== 'ALL' ? assignedSiteId : undefined,
      assignedSiteName: assignedSiteId !== 'ALL' && selectedSite ? selectedSite.name : 'All Tenant Facilities',
    };

    tacticalAudio.playRadioClick();
    onAddAdmin(newUser);
    setCreatedUser(newUser);
  };

  const handleCopy = () => {
    if (!createdUser) return;
    const text = `=== MONA / AEGIS SECURITY USER CREDENTIALS ===\nTenant Organization: ${createdUser.tenantName}\nUser Name: ${createdUser.name}\nAssigned Role: ${createdUser.role}\nOfficial Login Email: ${createdUser.email}\nTemporary Password: ${createdUser.temporaryPassword}\nAssigned Scope: ${createdUser.assignedSiteName || 'All Tenant Sites'}\nOperations Console URL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDone = () => {
    setCreatedUser(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        {createdUser ? (
          <div className="space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xl font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">User Account Provisioned</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Assigned to <span className="font-semibold text-slate-800">{createdUser.tenantName}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs space-y-2 border border-slate-800">
              <div className="flex justify-between border-b border-slate-800 pb-1.5 text-[10px] text-slate-400">
                <span>NEW USER CREDENTIALS</span>
                <span className="text-emerald-400 font-bold">STATUS: ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Organization:</span>
                <span className="font-bold text-white">{createdUser.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-bold text-white">{createdUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Access Role:</span>
                <span className="font-bold text-blue-300 px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800">
                  {createdUser.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Login Email:</span>
                <span className="font-bold text-emerald-400">{createdUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Temporary Password:</span>
                <span className="font-bold text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded">
                  {createdUser.temporaryPassword}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Facility Scope:</span>
                <span className="font-medium text-slate-300 truncate max-w-[220px]">
                  {createdUser.assignedSiteName}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50/80 border border-blue-100 p-3 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span>Immediate Access Active</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The user can now log into the web console or mobile guard app using these credentials. They will be prompted to change their temporary password upon first sign-in.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                id="btn-copy-user-credentials"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>

              <button
                type="button"
                id="btn-done-user-modal"
                onClick={handleDone}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isTenantAdminOnly ? 'Add User to Your Tenant' : 'Add User to Tenant Organization'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {isTenantAdminOnly
                      ? `Create an admin, supervisor, or dispatcher for ${currentTenant?.name}`
                      : 'Provision user accounts and permissions for any tenant'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Organization Assignment Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tenant Organization *
              </label>
              {isTenantAdminOnly ? (
                // Locked Tenant Pill for Tenant Admins
                <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentTenant?.logo || '🏢'}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{currentTenant?.name}</div>
                      <div className="text-[10px] text-blue-700 font-mono">
                        TENANT CODE: {currentTenant?.code} • {currentTenant?.plan}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded">
                    YOUR TENANT
                  </span>
                </div>
              ) : (
                // Superadmin Selects from All Tenants
                <select
                  id="select-tenant-dropdown"
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 bg-white font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.logo} {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Access Role Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">User Role & Permissions *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'TENANT_ADMIN' as UserRole,
                    title: 'Tenant Administrator',
                    desc: 'Full tenant admin, rota, reports & user management',
                    icon: Shield,
                  },
                  {
                    id: 'SUPERVISOR' as UserRole,
                    title: 'Field Supervisor',
                    desc: 'Shift inspection, GPS audit & guard sign-offs',
                    icon: UserCheck,
                  },
                  {
                    id: 'DISPATCHER' as UserRole,
                    title: 'Site Dispatcher',
                    desc: 'Live map monitoring, CAD calls & radio broadcasts',
                    icon: Radio,
                  },
                  {
                    id: 'GUARD' as UserRole,
                    title: 'Security Guard / Officer',
                    desc: 'Mobile App patrol, QR checkpoint & SOS reporting',
                    icon: ShieldAlert,
                  },
                ].map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                        <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                        <span>{r.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">{r.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sipho Ndlovu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white focus:text-slate-900 focus:outline-none shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Login Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sndlovu@aegis-security.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white focus:text-slate-900 focus:outline-none shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* Phone and Facility Scope */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+27 (0) 11 946 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white focus:text-slate-900 focus:outline-none shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Facility / Site Scope</label>
                <select
                  value={assignedSiteId}
                  onChange={(e) => setAssignedSiteId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none shadow-2xs transition-all"
                >
                  <option value="ALL">All Facilities in {currentTenant?.name || 'Tenant'}</option>
                  {tenantSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      📍 {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Temporary Password */}
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
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                A secure invite token will be generated for the user's first login.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-new-user"
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                Provision User Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
