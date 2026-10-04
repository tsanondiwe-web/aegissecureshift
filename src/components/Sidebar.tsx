import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  ShieldCheck,
  BarChart3,
  Clock4,
  Bell,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertOctagon,
} from 'lucide-react';
import { UserAccount } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  sosCount: number;
  openIncidentsCount: number;
  activeGuardsCount: number;
  tourComplianceAvg: number;
  tenantsCount?: number;
  currentUser?: UserAccount;
  onSwitchUser?: (user: UserAccount) => void;
  onSignOut?: () => void | Promise<unknown>;
  users?: UserAccount[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  sosCount,
  openIncidentsCount,
  activeGuardsCount,
  tourComplianceAvg,
  tenantsCount = 4,
  currentUser,
  onSwitchUser,
  onSignOut,
  users = [],
}) => {
  const navigationItems = [
    {
      id: 'live_map',
      label: 'Live Operations',
      icon: LayoutDashboard,
      badge: sosCount > 0 ? `${sosCount}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'scheduling',
      label: 'Rota',
      icon: CalendarDays,
      badge: activeGuardsCount > 0 ? `${activeGuardsCount}` : null,
      badgeColor: 'bg-slate-100 text-slate-500',
    },
    {
      id: 'tours',
      label: 'Sites & Patrols',
      icon: Building2,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'billing',
      label: 'Clients & Billing',
      icon: Users,
      badge: tenantsCount > 0 ? `${tenantsCount}` : null,
      badgeColor: 'bg-slate-100 text-slate-500',
    },
    {
      id: 'incidents',
      label: 'Calls & Incidents',
      icon: AlertOctagon,
      badge: openIncidentsCount > 0 ? `${openIncidentsCount}` : null,
      badgeColor: 'bg-amber-400 text-slate-950',
    },
    {
      id: 'audit_trail',
      label: 'Audit Trail',
      icon: ShieldCheck,
      badge: tourComplianceAvg > 0 ? `${tourComplianceAvg}%` : null,
      badgeColor: 'bg-slate-100 text-slate-500',
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'timesheets',
      label: 'Timesheet Manager',
      icon: Clock4,
      badge: null,
      badgeColor: '',
      targetTab: 'scheduling',
    },
    {
      id: 'alerts',
      label: 'Alert Center',
      icon: Bell,
      badge: sosCount > 0 ? `${sosCount} SOS` : null,
      badgeColor: 'bg-rose-500 text-white',
      targetTab: 'live_map',
    },
    {
      id: 'superadmin',
      label: 'Staff & Users',
      icon: UserCheck,
      badge: users.length > 0 ? `${users.length}` : null,
      badgeColor: 'bg-slate-100 text-slate-500',
    },
  ];

  const handleNavClick = (itemId: string, targetTab?: string) => {
    setActiveTab(targetTab || itemId);
  };

  // Determine current display info for the bottom profile pill
  const displayName = currentUser?.name?.split(' ')[0]?.toLowerCase() || 'admin';
  const displayEmail = currentUser?.email || 'admin@test.hellomona.co.uk';
  const avatarInitial = displayName.charAt(0).toLowerCase() || 'a';

  return (
    <aside
      id="hellomona-sidebar"
      className={`minimal-sidebar relative z-30 flex flex-col shrink-0 bg-[#FAFAF9] text-slate-700 border-r border-slate-200 select-none transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
    >
      {/* Top App Logo & Branding */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#171717] text-white font-semibold text-sm">
            <span>A</span>
          </div>
          {!collapsed && (
            <div className="sidebar-copy flex flex-col overflow-hidden">
              <span className="font-semibold text-sm tracking-tight text-slate-900 leading-none">AegisOps</span>
              <span className="text-[10px] text-slate-400 font-medium mt-1 truncate">Command centre</span>
            </div>
          )}
        </div>

        <button
          id="collapse-sidebar-btn"
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-collapse flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === (item.targetTab || item.id);
              return (
                <button
                  key={item.id}
                  id={`sidebar-item-${item.id}`}
                  onClick={() => handleNavClick(item.id, item.targetTab)}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex w-full items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#171717] text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                      isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  {!collapsed && (
                    <div className="sidebar-copy ml-3 flex flex-1 items-center justify-between overflow-hidden">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[9px] font-semibold ${
                            item.badgeColor || 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
      </div>

      {/* Bottom Profile Footer Bar (Matching Screenshot) */}
      <div className="sidebar-footer mt-auto border-t border-slate-200 p-3">
        <div className="flex items-center justify-between rounded-lg p-1 hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Dark Circle Profile Avatar with initial */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-semibold text-xs">
              {avatarInitial}
            </div>

            {!collapsed && (
              <div className="sidebar-copy flex flex-col overflow-hidden text-left leading-tight">
                <span className="text-xs font-semibold text-slate-900 truncate">{displayName}</span>
                <span className="text-[10px] text-slate-400 truncate">
                  {displayEmail}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              id="sidebar-logout-btn"
              onClick={() => {
                if (onSignOut) {
                  void onSignOut();
                } else if (users.length > 1 && onSwitchUser && currentUser) {
                  // Rotate to next available user account or superadmin
                  const nextUser = users.find((u) => u.id !== currentUser.id) || users[0];
                  onSwitchUser(nextUser);
                }
              }}
              title="Switch Account / Log Out"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
