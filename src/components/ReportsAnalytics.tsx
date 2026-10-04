import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Shield,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileText,
  TrendingUp,
  Award,
  Users,
  MapPin
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Tenant, Site, Guard, Incident, PatrolTour, ShiftSchedule, AttendanceRecord } from '../types';
import { tacticalAudio } from '../utils/audio';

interface ReportsAnalyticsProps {
  tenants: Tenant[];
  currentTenant: Tenant;
  sites: Site[];
  guards: Guard[];
  incidents: Incident[];
  tours: PatrolTour[];
  shifts: ShiftSchedule[];
  attendance: AttendanceRecord[];
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  tenants,
  currentTenant,
  sites,
  guards,
  incidents,
  tours,
  shifts,
  attendance,
}) => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('ALL');

  // Coverage Data by Time of Day
  const coverageData = [
    { hour: '00:00', coverage: 98, patrolHours: 32, officersActive: 14 },
    { hour: '04:00', coverage: 96, patrolHours: 28, officersActive: 12 },
    { hour: '08:00', coverage: 100, patrolHours: 48, officersActive: 22 },
    { hour: '12:00', coverage: 100, patrolHours: 54, officersActive: 24 },
    { hour: '16:00', coverage: 99, patrolHours: 46, officersActive: 20 },
    { hour: '20:00', coverage: 100, patrolHours: 42, officersActive: 18 },
    { hour: '23:59', coverage: 97, patrolHours: 36, officersActive: 16 },
  ];

  // MTTR by Site
  const mttrData = (sites || []).map((s, idx) => ({
    site: s.name ? s.name.split(' (')[0].replace(' Operations Center', '').replace(' Terminal', '') : `Site ${idx + 1}`,
    mttr: +(1.5 + (idx * 0.4)).toFixed(1),
    target: 3.0,
    compliance: +(98 - idx * 1.5).toFixed(1),
  }));

  // Incident categories for Pie Chart
  const incidentCategoryCounts: { [key: string]: number } = {};
  (incidents || []).forEach((inc) => {
    if (inc?.type) {
      incidentCategoryCounts[inc.type] = (incidentCategoryCounts[inc.type] || 0) + 1;
    }
  });

  const incidentPieData = Object.entries(incidentCategoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#171717', '#525252', '#737373', '#A3A3A3', '#D4D4D4', '#E5E5E5'];

  // Tour compliance by site
  const tourComplianceBySite = (sites || []).map((s) => {
    const siteTours = (tours || []).filter((t) => t.siteId === s.id);
    const avgComp = siteTours.length > 0
      ? Math.round(siteTours.reduce((acc, t) => acc + t.complianceRate, 0) / siteTours.length)
      : 96;
    return {
      site: s.name ? s.name.split(' (')[0].replace(' Operations Center', '').replace(' Terminal', '') : s.id,
      compliance: avgComp,
      checkpoints: s.totalCheckpoints || s.zones?.length || 12,
    };
  });

  const handleExportSummary = () => {
    tacticalAudio.playRadioClick();
    window.print();
  };

  return (
    <div id="reports-analytics-screen" className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Reports & Operational Analytics Centre</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            SLA performance audit, 24-hour guard coverage density, MTTR metrics, and patrol compliance
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Selector */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs font-mono">
            <button
              onClick={() => setDateRange('today')}
              className={`rounded px-2.5 py-1 transition-colors ${
                dateRange === 'today' ? 'bg-blue-600 font-bold text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`rounded px-2.5 py-1 transition-colors ${
                dateRange === 'week' ? 'bg-blue-600 font-bold text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`rounded px-2.5 py-1 transition-colors ${
                dateRange === 'month' ? 'bg-blue-600 font-bold text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
          </div>

          <button
            onClick={handleExportSummary}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-blue-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Performance Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
            <span>Guaranteed SLA Coverage</span>
            <Shield className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-700">99.8%</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">24/7 Monitored Posts & Blueprints</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
            <span>Avg SOS Dispatch Time (MTTR)</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-blue-700">2.1 min</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Below 3.0m Mandated SLA Target</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
            <span>Patrol Tour Checkpoint Scans</span>
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-indigo-700">98.4%</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Optical QR & GPS Verified</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-semibold">
            <span>Incident Resolution Rate</span>
            <AlertOctagon className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-800">96.4%</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{incidents.length} Recorded Occurrences</div>
        </div>
      </div>

      {/* Row 1: Coverage & Patrol Density + MTTR Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Coverage % Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase text-slate-800">
                24-Hour Guard Coverage & Patrol Density
              </span>
              <p className="text-[11px] text-slate-500 font-mono">Hourly active post fulfillment across facilities</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              SLA TARGET &gt;95%
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={coverageData}>
                <defs>
                  <linearGradient id="reportsCovGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="hour" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={[80, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', fontSize: '12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="coverage" stroke="#171717" strokeWidth={2.5} fill="url(#reportsCovGrad)" name="Coverage %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MTTR Response Time Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase text-slate-800">
                Mean Time to Respond (MTTR Minutes vs Target)
              </span>
              <p className="text-[11px] text-slate-500 font-mono">Response time from alert trigger to on-scene arrival</p>
            </div>
            <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              LOWER IS BETTER
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mttrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="site" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', fontSize: '12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="mttr" fill="#525252" name="Actual MTTR (min)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="#CBD5E1" name="Max SLA Target (min)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Patrol Compliance by Site + Incident Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Patrol Compliance by Site (2 cols) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase text-slate-800">
                Patrol Tour Checkpoint Compliance by Facility
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">Percentage of optical QR checkpoints scanned on schedule</p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-semibold">{sites.length} Active Sites</span>
          </div>

          <div className="space-y-3 pt-1">
            {tourComplianceBySite.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <span>{item.site}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">{item.compliance}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.compliance >= 98
                        ? 'bg-emerald-600'
                        : item.compliance >= 95
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.compliance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Breakdown Pie Chart (1 col) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-slate-800">
              Incident Category Distribution
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">Breakdown of recorded tactical events</p>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incidentPieData.length > 0 ? incidentPieData : [{ name: 'Patrol Checks', value: 10 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {incidentPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', fontSize: '11px', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1 max-h-24 overflow-y-auto">
            {incidentPieData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate max-w-[140px]">{entry.name}</span>
                </span>
                <span className="font-bold text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: PSIRA Officer Readiness & Compliance Audit Log */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-600" />
            <h3 className="text-xs font-mono font-bold uppercase text-slate-800">
              PSIRA Officer Deployment & Shift Audit
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">{guards.length} Registered Guards</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-mono text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="p-2.5">Officer Name</th>
                <th className="p-2.5">Badge & PSIRA</th>
                <th className="p-2.5">Grade / Tier</th>
                <th className="p-2.5">Assigned Facility</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right">Patrol QR Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(guards || []).slice(0, 5).map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-sans font-bold text-slate-900">{g.name}</td>
                  <td className="p-2.5 text-slate-600 font-mono">{g.badgeNumber}</td>
                  <td className="p-2.5 text-blue-700 font-semibold">{g.tier}</td>
                  <td className="p-2.5 text-slate-600 font-sans">{g.siteName ? g.siteName.split(' (')[0] : 'Assigned Post'}</td>
                  <td className="p-2.5 text-center">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        g.status === 'On Patrol'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : g.status === 'Stationary'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-bold text-emerald-700">99.2%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
