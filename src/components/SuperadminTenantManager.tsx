import React, { useState } from 'react';
import {
  Building2,
  Users,
  Shield,
  Plus,
  Key,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  CreditCard,
  Layers,
  MapPin,
  Lock,
  Copy,
  Sparkles,
  ChevronRight,
  UserPlus,
  Crown,
  ShieldCheck,
  Radio,
  RadioTower,
  ShieldAlert
} from 'lucide-react';
import { Tenant, UserAccount, Site, Guard, UserRole } from '../types';
import { tacticalAudio } from '../utils/audio';
import { formatCurrency, getTenantRegion } from '../utils/regional';

interface SuperadminTenantManagerProps {
  tenants: Tenant[];
  currentTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  users: UserAccount[];
  currentUser: UserAccount;
  onSwitchUser: (user: UserAccount) => void;
  onOpenNewTenantModal: () => void;
  onOpenNewAdminModal: (tenant?: Tenant) => void;
  sites: Site[];
  guards: Guard[];
}

export const SuperadminTenantManager: React.FC<SuperadminTenantManagerProps> = ({
  tenants,
  currentTenant,
  onSelectTenant,
  users,
  currentUser,
  onSwitchUser,
  onOpenNewTenantModal,
  onOpenNewAdminModal,
  sites,
  guards,
}) => {
  const isSuperadmin = currentUser.role === 'SUPERADMIN';
  const isTenantAdmin = currentUser.role === 'TENANT_ADMIN' || !isSuperadmin;

  const [activeSubTab, setActiveSubTab] = useState<'tenants' | 'admins' | 'simulation'>(
    isSuperadmin ? 'tenants' : 'admins'
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tenant-scoped entities
  const tenantSites = sites.filter((s) => s.tenantId === currentTenant.id);
  const tenantUsers = users.filter((u) => u.tenantId === currentTenant.id || (!u.tenantId && isSuperadmin));
  const tenantGuards = guards.filter((g) => g.siteId && tenantSites.some((s) => s.id === g.siteId));

  // Global Multi-Tenant Aggregates
  const spendGroupMap = new Map<string, { tenant: Tenant; amount: number }>();
  tenants.forEach((tenant) => {
    const currency = getTenantRegion(tenant).currencyCode;
    const existing = spendGroupMap.get(currency);
    spendGroupMap.set(currency, {
      tenant: existing?.tenant || tenant,
      amount: (existing?.amount || 0) + (tenant.monthlySpend || 0),
    });
  });
  const spendGroups = Array.from(spendGroupMap.values());
  const portfolioMonthlySpend = spendGroups.map((group) =>
    formatCurrency(group.amount, group.tenant, { maximumFractionDigits: 0 })
  ).join(' + ') || '—';
  const portfolioAnnualSpend = spendGroups.map((group) =>
    formatCurrency(group.amount * 12, group.tenant, { maximumFractionDigits: 0 })
  ).join(' + ') || '—';
  const totalSitesCount = sites.length;
  const totalGuardsCount = guards.length;
  const totalAdminsCount = users.filter((u) => u.role === 'TENANT_ADMIN' || u.role === 'SUPERADMIN').length;

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.industry.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (t.primaryAdminName && t.primaryAdminName.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesPlan = planFilter === 'ALL' || t.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  // Filter users based on role scope (if tenant admin, show only their tenant's users)
  const baseUsersList = isTenantAdmin
    ? users.filter((u) => u.tenantId === currentTenant.id)
    : users;

  const filteredUsers = baseUsersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (u.tenantName && u.tenantName.toLowerCase().includes(searchFilter.toLowerCase())) ||
      u.role.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCopyCredentials = (user: UserAccount) => {
    const text = `=== MONA / AEGIS OPS LOGIN CREDENTIALS ===\nUser: ${user.name}\nEmail: ${user.email}\nTemp Password: ${user.temporaryPassword || 'MonaGuard2026!#'}\nRole: ${user.role}\nOrganization: ${user.tenantName || 'Global Headquarters'}\nURL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div id="superadmin-tenant-manager" className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold border ${
                isSuperadmin
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300'
              }`}
            >
              {isSuperadmin ? <Crown className="h-4 w-4 text-amber-700" /> : <Shield className="h-4 w-4 text-blue-700" />}
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {isSuperadmin
                ? 'Superadmin & Multi-Tenant Organization Hub'
                : `${currentTenant.name} — Staff & User Accounts`}
            </h2>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold border ${
                isSuperadmin
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-blue-100 text-blue-800 border-blue-200'
              }`}
            >
              {isSuperadmin ? 'GLOBAL SOC SUPERADMIN' : `TENANT CODE: ${currentTenant.code}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {isSuperadmin
              ? 'Provision client organizations, allocate guard fleets, and assign dedicated Tenant Administrator accounts'
              : `Manage administrators, supervisors, dispatchers, and security officers assigned to ${currentTenant.name}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-add-tenant-user"
            onClick={() => {
              tacticalAudio.playRadioClick();
              onOpenNewAdminModal(currentTenant);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isSuperadmin ? 'Add User to Tenant' : `Add User to ${currentTenant.name}`}</span>
          </button>

          {isSuperadmin && (
            <button
              id="btn-register-new-tenant"
              onClick={() => {
                tacticalAudio.playRadioClick();
                onOpenNewTenantModal();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4 text-blue-600" />
              <span>Register New Tenant Org</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Highlights (Scoped to Tenant or Global) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isSuperadmin ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
                <span>Client Tenants</span>
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900">{tenants.length}</div>
              <div className="text-[10px] text-emerald-600 font-mono mt-0.5 font-bold">● 100% Active SLA</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
                <span>Tenant Admins & Users</span>
                <Users className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-blue-800">{users.length}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{totalAdminsCount} Administrators</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
                <span>Global Guard Force</span>
                <Shield className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-emerald-700">{totalGuardsCount} Officers</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{totalSitesCount} Facilities Monitored</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
                <span>Combined Monthly Spend</span>
                <CreditCard className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
                {portfolioMonthlySpend}/mo
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Annualized: {portfolioAnnualSpend}</div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
                <span>Organization Users</span>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900">{tenantUsers.length} Users</div>
              <div className="text-[10px] text-emerald-600 font-mono mt-0.5 font-bold">Active in {currentTenant.code}</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
                <span>Operating Facilities</span>
                <Building2 className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-blue-800">{tenantSites.length} Sites</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Under Security Coverage</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
                <span>Guard Roster</span>
                <Shield className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-emerald-700">{tenantGuards.length} Officers</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Active on Shift / Patrol</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
                <span>SLA Subscription</span>
                <ShieldCheck className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-1 text-sm font-bold font-mono text-slate-900 truncate">
                {currentTenant.plan}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{formatCurrency(currentTenant.monthlySpend || 25000, currentTenant, { maximumFractionDigits: 0 })}/mo</div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {isSuperadmin && (
            <button
              onClick={() => setActiveSubTab('tenants')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
                activeSubTab === 'tenants'
                  ? 'border-blue-600 text-blue-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Tenant Organizations ({tenants.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('admins')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
              activeSubTab === 'admins'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>
              {isSuperadmin ? `All Users & Admins Directory (${users.length})` : `Staff & Users (${tenantUsers.length})`}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('simulation')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
              activeSubTab === 'simulation'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Crown className="h-4 w-4 text-amber-600" />
            <span>Role & Account Switcher</span>
          </button>
        </div>

        {/* Search & Role Filter Controls */}
        <div className="flex items-center gap-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={isSuperadmin ? "Search tenant, user, email..." : "Search user, email, role..."}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="ALL">All Roles</option>
            <option value="TENANT_ADMIN">Tenant Admin</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="DISPATCHER">Dispatcher</option>
            <option value="GUARD">Guard Officer</option>
            {isSuperadmin && <option value="SUPERADMIN">Superadmin</option>}
          </select>
        </div>
      </div>

      {/* Sub-Tab 1: Tenants List & Cards (Superadmin Only) */}
      {activeSubTab === 'tenants' && isSuperadmin && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTenants.map((t) => {
              const sitesList = sites.filter((s) => s.tenantId === t.id);
              const guardsList = guards.filter((g) => g.siteId && sitesList.some((s) => s.id === g.siteId));
              const isCurrent = t.id === currentTenant.id;
              const adminUser = users.find(
                (u) => u.id === t.primaryAdminId || (u.tenantId === t.id && u.role === 'TENANT_ADMIN')
              );
              const tenantUsersCount = users.filter((u) => u.tenantId === t.id).length;

              return (
                <div
                  key={t.id}
                  className={`rounded-2xl border bg-white p-5 shadow-xs transition-all relative overflow-hidden ${
                    isCurrent ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Color Accent */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: '#171717' }}
                  />

                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-xl bg-slate-50 border border-slate-100">
                        {t.logo}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                          {isCurrent && (
                            <span className="rounded bg-blue-100 text-blue-800 text-[9px] font-mono px-1.5 py-0.2 font-bold">
                              ACTIVE CONTEXT
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          Code: <strong className="text-blue-700">{t.code}</strong> • {t.industry}
                        </div>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5">
                      {t.status || 'ACTIVE'}
                    </span>
                  </div>

                  {/* Key Stats Bar */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500">FACILITIES</div>
                      <div className="text-sm font-bold text-slate-800">{sitesList.length || t.sitesCount} Sites</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">STAFF & GUARDS</div>
                      <div className="text-sm font-bold text-slate-800">{tenantUsersCount || 1} Users</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">MONTHLY BILL</div>
                      <div className="text-sm font-bold text-emerald-700">{formatCurrency(t.monthlySpend || 25000, t, { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>

                  {/* Primary Admin Details */}
                  <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                      <span className="flex items-center gap-1.5 text-blue-800 font-mono">
                        <Users className="h-3.5 w-3.5" />
                        PRIMARY TENANT ADMINISTRATOR
                      </span>
                      {adminUser && (
                        <button
                          onClick={() => handleCopyCredentials(adminUser)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-mono font-bold flex items-center gap-1"
                        >
                          {copiedId === adminUser.id ? (
                            <span className="text-emerald-600">✓ Copied</span>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy Credentials</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Name:</span>
                        <span className="font-semibold text-slate-900">
                          {t.primaryAdminName || adminUser?.name || 'Assigned Officer'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-mono text-slate-700">
                          {t.primaryAdminEmail || adminUser?.email || t.contactEmail}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onOpenNewAdminModal(t)}
                      className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Add User to Tenant</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectTenant(t);
                        tacticalAudio.playRadioClick();
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>{isCurrent ? 'Current SOC Active' : 'Switch SOC View'}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Tenant Users Directory Table */}
      {activeSubTab === 'admins' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div>
              <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
                {isTenantAdmin
                  ? `${currentTenant.name} User Directory (${filteredUsers.length})`
                  : `Tenant Users & Administrator Directory (${filteredUsers.length})`}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isTenantAdmin
                  ? `Authorized staff with access to ${currentTenant.name} operations`
                  : 'All authorized accounts with role-based access across tenant organizations'}
              </p>
            </div>

            <button
              onClick={() => onOpenNewAdminModal(currentTenant)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isTenantAdmin ? `Add User to ${currentTenant.name}` : 'Provision New User'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                <tr>
                  <th className="px-4 py-3">Staff / User</th>
                  {isSuperadmin && <th className="px-4 py-3">Assigned Tenant</th>}
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Facility Scope</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{u.avatar || '👤'}</span>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isCurrent && (
                                <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {isSuperadmin && (
                        <td className="px-4 py-3">
                          {u.tenantName ? (
                            <div className="font-medium text-slate-800">{u.tenantName}</div>
                          ) : (
                            <span className="text-slate-400 font-mono">Global Headquarters</span>
                          )}
                        </td>
                      )}

                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                            u.role === 'SUPERADMIN'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : u.role === 'TENANT_ADMIN'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : u.role === 'SUPERVISOR'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : u.role === 'DISPATCHER'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                        {u.assignedSiteName || 'All Facilities'}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          {u.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {u.createdAt || '2026-01-15'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyCredentials(u)}
                            className="rounded border border-slate-200 bg-white hover:bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700"
                            title="Copy login email & temporary password"
                          >
                            {copiedId === u.id ? '✓ Copied' : 'Copy Logins'}
                          </button>

                          <button
                            onClick={() => {
                              onSwitchUser(u);
                              tacticalAudio.playRadioClick();
                            }}
                            className={`rounded px-2.5 py-1 text-[11px] font-bold ${
                              isCurrent
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            {isCurrent ? 'Active' : 'Log in as'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Role & Scope Simulation */}
      {activeSubTab === 'simulation' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Role-Based Access & Tenant Scoping Simulator</h3>
              <p className="text-xs text-slate-500 font-mono">
                Switch between Superadmin and Tenant Administrator accounts to inspect view restrictions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Superadmin Card */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-amber-700" />
                  👑 Global Superadmin
                </span>
                <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                  UNRESTRICTED
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full authority across all client organizations. Can register new tenants, create admin accounts, inspect global telemetry, and access multi-tenant billing.
              </p>
              <button
                onClick={() => {
                  const superAdmin = users.find((u) => u.role === 'SUPERADMIN') || users[0];
                  onSwitchUser(superAdmin);
                }}
                className="w-full rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 text-xs transition-colors"
              >
                Switch to Global Superadmin Profile
              </button>
            </div>

            {/* Tenant Admin Card */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-blue-700" />
                  🏢 Tenant Administrator
                </span>
                <span className="text-[10px] font-mono bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold">
                  SCOPED TO TENANT
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manages guard rosters, checkpoints, schedules, and adds staff & user accounts strictly for their assigned organization: <strong className="text-slate-900">{currentTenant.name}</strong>.
              </p>
              <button
                onClick={() => {
                  const tenantAdmin = users.find(
                    (u) => u.tenantId === currentTenant.id && u.role === 'TENANT_ADMIN'
                  ) || users[1];
                  if (tenantAdmin) onSwitchUser(tenantAdmin);
                }}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 text-xs transition-colors"
              >
                Switch to {currentTenant.code} Tenant Admin Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
