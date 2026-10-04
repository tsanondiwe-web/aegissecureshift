import React, { useState } from 'react';
import {
  ShieldAlert,
  Radio,
  PlusCircle,
  Volume2,
  VolumeX,
  Bell,
  Search,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Database,
  Cpu,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  Crown,
  Plus,
  Users,
  Globe2,
} from 'lucide-react';
import { Tenant, SystemNotification, Incident, UserAccount } from '../types';
import { tacticalAudio } from '../utils/audio';
import { isFirebaseConfigured } from '../lib/firebase';
import { RegionalSettingsModal, RegionalSettingsValue } from './RegionalSettingsModal';
import { getTenantRegion } from '../utils/regional';

interface HeaderProps {
  tenants: Tenant[];
  currentTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  notifications: SystemNotification[];
  onOpenBroadcast: () => void;
  onOpenNewIncident: () => void;
  onTriggerSOSDrill: () => void;
  activeSOSIncident: Incident | null;
  onNavigateTab: (tabId: string) => void;
  onMarkNotificationRead: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  firebaseConnected?: boolean;
  currentUser?: UserAccount;
  users?: UserAccount[];
  onSwitchUser?: (user: UserAccount) => void;
  onSignOut?: () => void | Promise<unknown>;
  onOpenNewTenantModal?: () => void;
  onUpdateRegionalSettings?: (value: RegionalSettingsValue) => void | Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  tenants,
  currentTenant,
  onSelectTenant,
  notifications,
  onOpenBroadcast,
  onOpenNewIncident,
  onTriggerSOSDrill,
  activeSOSIncident,
  onNavigateTab,
  onMarkNotificationRead,
  searchQuery,
  setSearchQuery,
  firebaseConnected = false,
  currentUser,
  users = [],
  onSwitchUser,
  onSignOut,
  onOpenNewTenantModal,
  onUpdateRegionalSettings,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [showDbSyncModal, setShowDbSyncModal] = useState<boolean>(false);
  const [showRegionalSettings, setShowRegionalSettings] = useState<boolean>(false);
  const regionalSettings = getTenantRegion(currentTenant);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    tacticalAudio.setMuted(nextMuted);
    if (!nextMuted) {
      tacticalAudio.playRadioClick();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      id="aegis-top-header"
      className="minimal-header sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 py-2 backdrop-blur-md"
    >
      {/* Left: Branding & Tenant Switcher */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-[#171717] text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                AegisOps
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              Southern Africa
            </p>
          </div>
        </div>

        {/* Multi-Tenant Switcher */}
        <div className="relative">
          <button
            id="tenant-switcher-btn"
            onClick={() => setShowTenantDropdown(!showTenantDropdown)}
            className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300"
          >
            <span className="text-base">{currentTenant.logo}</span>
            <div className="text-left max-w-[140px] md:max-w-[200px] truncate">
              <span className="font-bold block truncate text-slate-900">{currentTenant.name}</span>
              <span className="text-[10px] text-slate-400 font-medium">{currentTenant.code}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showTenantDropdown && (
            <div className="absolute left-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Client Organizations ({tenants.length})
                </span>
                {onOpenNewTenantModal && (
                  <button
                    onClick={() => {
                      setShowTenantDropdown(false);
                      onOpenNewTenantModal();
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 font-mono"
                  >
                    <Plus className="h-3 w-3" />
                    <span>+ New Tenant</span>
                  </button>
                )}
              </div>
              <div className="mt-1 max-h-64 overflow-y-auto space-y-1">
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTenant(t);
                      setShowTenantDropdown(false);
                      tacticalAudio.playRadioClick();
                    }}
                    className={`flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors ${
                      t.id === currentTenant.id
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 font-medium'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-lg">{t.logo}</span>
                      <div className="truncate">
                        <div className="font-semibold truncate text-slate-900">{t.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {t.sitesCount} Sites • {t.guardsCount} Guards • {t.code}
                        </div>
                      </div>
                    </div>
                    {t.id === currentTenant.id && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {onOpenNewTenantModal && (
                <div className="mt-1 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowTenantDropdown(false);
                      onOpenNewTenantModal();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1.5 text-xs transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Register New Tenant & Admin</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {onUpdateRegionalSettings && (
          <button
            onClick={() => setShowRegionalSettings(true)}
            title="Change Southern Africa region and currency"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-mono font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50"
          >
            <Globe2 className="h-3.5 w-3.5 text-blue-600" />
            {regionalSettings.countryCode} • {regionalSettings.currencyCode}
          </button>
        )}
      </div>

      {/* Center: Search & Global Telemetry */}
      <div className="hidden lg:flex items-center flex-1 max-w-sm mx-5">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            id="global-command-search"
            type="text"
            placeholder="Search operations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
            >
              ESC
            </button>
          )}
        </div>

      </div>

      {/* Right: Live Clocks, Action Triggers, Notifications */}
      <div className="flex items-center gap-2">
        <button
          id="btn-firebase-sync-status"
          onClick={() => setShowDbSyncModal(true)}
          className="hidden xl:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          title={firebaseConnected || isFirebaseConfigured ? 'Firebase connected' : 'Firebase setup'}
        >
          <Database className="h-4 w-4" />
        </button>

        <button
          id="toggle-audio-btn"
          onClick={toggleSound}
          title={isMuted ? 'Unmute tactical audio sirens & pings' : 'Mute tactical audio alerts'}
          className={`hidden xl:flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            isMuted
              ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        {/* Quick Broadcast Push */}
        <button
          id="btn-quick-broadcast"
          onClick={() => {
            tacticalAudio.playRadioClick();
            onOpenBroadcast();
          }}
          className="hidden 2xl:flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Radio className="h-3.5 w-3.5 text-blue-600" />
          <span>Broadcast</span>
        </button>

        {/* New Incident Log */}
        <button
          id="btn-new-incident"
          onClick={() => {
            tacticalAudio.playRadioClick();
            onOpenNewIncident();
          }}
          className="hidden xl:flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <PlusCircle className="h-3.5 w-3.5 text-amber-600" />
          <span>New incident</span>
        </button>

        {/* SOS Emergency Drill Trigger */}
        <button
          id="btn-sos-drill"
          onClick={() => {
            tacticalAudio.playDispatchAlert();
            onTriggerSOSDrill();
          }}
          title="Simulate or toggle SOS Emergency Panic Alarm"
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold font-mono transition-all shadow-xs ${
            activeSOSIncident
              ? 'bg-rose-600 text-white animate-pulse border border-rose-500 shadow-md shadow-rose-200'
              : 'border border-slate-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50'
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-rose-600" />
          <span>{activeSOSIncident ? 'SOS active' : 'SOS'}</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 px-2 py-1.5">
                <span className="text-xs font-mono font-bold uppercase text-slate-800">
                  Live Dispatch Feed ({notifications.length})
                </span>
                <span className="text-[10px] text-blue-600 font-mono font-bold">REAL-TIME</span>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1.5 py-1.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      onMarkNotificationRead(n.id);
                      if (n.linkTab) onNavigateTab(n.linkTab);
                      setShowNotifications(false);
                    }}
                    className={`cursor-pointer rounded-lg p-2.5 text-xs transition-colors ${
                      n.read
                        ? 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        : 'bg-blue-50/70 text-slate-800 border border-blue-100 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-slate-900">{n.title}</span>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0 font-medium">
                        {n.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current User & Role Profile Pill */}
        {currentUser && (
          <div className="relative">
            <button
              id="user-profile-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                currentUser.role === 'SUPERADMIN'
                  ? 'border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-950'
                  : 'border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-950'
              }`}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-2xs text-sm">
                {currentUser.role === 'SUPERADMIN' ? '👑' : currentUser.avatar || '👤'}
              </div>
              <div className="text-left hidden xl:block leading-tight">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  {currentUser.name}
                </div>
                <div className="text-[9px] font-mono font-bold text-blue-700">
                  {currentUser.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'TENANT ADMIN'}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl z-50">
                <div className="px-2 py-1.5 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{currentUser.email}</div>
                  <div className="mt-1 inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                    ROLE: {currentUser.role}
                  </div>
                </div>

                {users.length > 0 && onSwitchUser && (
                  <div className="mt-2">
                    <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Switch User Account
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 mt-1">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u);
                            setShowUserDropdown(false);
                            tacticalAudio.playRadioClick();
                          }}
                          className={`flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors ${
                            u.id === currentUser.id
                              ? 'bg-blue-50 text-blue-900 border border-blue-200 font-medium'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{u.role === 'SUPERADMIN' ? '👑' : u.avatar || '👤'}</span>
                            <div>
                              <div className="font-semibold text-slate-900">{u.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {u.role === 'SUPERADMIN' ? 'Global Superadmin' : u.tenantName || 'Tenant Admin'}
                              </div>
                            </div>
                          </div>
                          {u.id === currentUser.id && (
                            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {onSignOut && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      void onSignOut();
                    }}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Sign out securely
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Firebase and Android mobile app sync information */}
      {showDbSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Firebase & Android Guard App Real-Time Sync</h3>
                  <p className="text-xs text-slate-500 font-mono">Bi-directional PostgreSQL & Realtime replication</p>
                </div>
              </div>
              <button
                onClick={() => setShowDbSyncModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-slate-600">Database Connection Status:</span>
                  <span className={`px-2 py-0.5 rounded ${firebaseConnected || isFirebaseConfigured ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>
                    {firebaseConnected || isFirebaseConfigured ? 'CONNECTED TO FIREBASE' : 'READY (ACTIVE LOCAL FALLBACK)'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Real-time listeners are configured for all AegisOps Android Mobile App collections: <strong className="text-slate-900">guards</strong> (live telemetry & GPS), <strong className="text-slate-900">incidents</strong> (SOS panic alerts & evidence), <strong className="text-slate-900">checkpoints</strong> (physical QR scans), <strong className="text-slate-900">shifts</strong>, and <strong className="text-slate-900">broadcasts</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Synchronized Collections & Tables:</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
                    <div className="font-bold text-emerald-700">1. /guards</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">GPS Lat/Lng, Status, Battery %, Last QR Scan</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
                    <div className="font-bold text-rose-700">2. /incidents</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Critical SOS alerts, Photos, Audio notes, Status</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
                    <div className="font-bold text-blue-700">3. /checkpoints</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Physical QR codes and dwell times</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
                    <div className="font-bold text-blue-800">4. /shifts & broadcasts</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Rosters, Dispatch alerts, Radio orders</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-200 p-3 text-[11px] font-mono">
                <div className="text-slate-400 text-[10px] mb-1 font-sans">Configuration Keys in <code className="text-emerald-400">.env</code>:</div>
                <div className="text-emerald-400">VITE_FIREBASE_PROJECT_ID="your-project-id"</div>
                <div className="text-emerald-400">VITE_FIREBASE_API_KEY="your-web-api-key"</div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowDbSyncModal(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
      {showRegionalSettings && onUpdateRegionalSettings && (
        <RegionalSettingsModal
          tenant={currentTenant}
          onClose={() => setShowRegionalSettings(false)}
          onSave={onUpdateRegionalSettings}
        />
      )}
    </header>
  );
};
