import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  User,
  Building,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Camera,
  Calendar as CalendarIcon,
  Shield,
  Trash2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { ShiftSchedule, AttendanceRecord, Guard, Site, GuardTier, Tenant } from '../types';
import { tacticalAudio } from '../utils/audio';
import { formatCurrency } from '../utils/regional';

interface ShiftSchedulerProps {
  shifts: ShiftSchedule[];
  onAddShift: (shift: Omit<ShiftSchedule, 'id'>) => void;
  onDeleteShift: (shiftId: string) => void;
  attendance: AttendanceRecord[];
  onApproveAttendance: (attId: string) => void;
  guards: Guard[];
  sites: Site[];
  currentTenant: Tenant;
}

export const ShiftScheduler: React.FC<ShiftSchedulerProps> = ({
  shifts,
  onAddShift,
  onDeleteShift,
  attendance,
  onApproveAttendance,
  guards,
  sites,
  currentTenant,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'attendance'>('roster');
  const [selectedDay, setSelectedDay] = useState<string>('Mon');
  const [showAddShiftModal, setShowAddShiftModal] = useState<boolean>(false);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');

  // New Shift State
  const [newGuardId, setNewGuardId] = useState(guards[0]?.id || '');
  const [newSiteId, setNewSiteId] = useState(sites[0]?.id || '');
  const [newDay, setNewDay] = useState<ShiftSchedule['dayOfWeek']>('Mon');
  const [newStartTime, setNewStartTime] = useState('08:00');
  const [newEndTime, setNewEndTime] = useState('16:00');
  const [newShiftType, setNewShiftType] = useState<ShiftSchedule['shiftType']>('Day Shift');

  const daysOfWeek: ShiftSchedule['dayOfWeek'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const filteredShifts = shifts.filter((s) => {
    const matchesDay = s.dayOfWeek === selectedDay;
    const matchesSite = selectedSiteFilter === 'all' || s.siteId === selectedSiteFilter;
    return matchesDay && matchesSite;
  });

  const handleCreateShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guardObj = guards.find((g) => g.id === newGuardId);
    const siteObj = sites.find((s) => s.id === newSiteId);
    if (!guardObj || !siteObj) return;

    onAddShift({
      guardId: guardObj.id,
      guardName: guardObj.name,
      guardBadge: guardObj.badgeNumber,
      guardTier: guardObj.tier,
      siteId: siteObj.id,
      siteName: siteObj.name,
      dayOfWeek: newDay,
      date: '2026-08-17',
      startTime: newStartTime,
      endTime: newEndTime,
      shiftType: newShiftType,
      status: 'Scheduled',
      hourlyRate: guardObj.tier === 'Mobile Patrol Cruiser' ? 54 : guardObj.tier === 'K9 Unit' ? 46 : 38.5,
    });

    tacticalAudio.playCheckpointScan();
    setShowAddShiftModal(false);
  };

  return (
    <div id="shift-scheduler-screen" className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-600" />
            <span>Scheduling, Shift Roster & Geofenced Time Clock</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Weekly multi-site roster, guard tier deployment, and GPS geofence clock-in validation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab switch */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveSubTab('roster')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                activeSubTab === 'roster'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Shift Roster
            </button>
            <button
              onClick={() => setActiveSubTab('attendance')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                activeSubTab === 'attendance'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GPS Attendance Audit ({attendance.filter((a) => a.status === 'Pending Review').length} Review)
            </button>
          </div>

          {activeSubTab === 'roster' && (
            <button
              onClick={() => {
                tacticalAudio.playRadioClick();
                setShowAddShiftModal(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Assign Shift</span>
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'roster' ? (
        <div className="space-y-4">
          {/* Day of week bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xs">
            <div className="flex items-center gap-1">
              {daysOfWeek.map((day) => {
                const count = shifts.filter((s) => s.dayOfWeek === day).length;
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      tacticalAudio.playRadioClick();
                    }}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-mono font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{day}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] ${
                        isSelected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Site filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-slate-500 font-semibold">Site:</span>
              <select
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Protected Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name.split(' (')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Shift Schedule Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredShifts.map((shift) => (
              <div
                key={shift.id}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-900">{shift.guardName}</span>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {shift.guardBadge} • {shift.guardTier}
                    </div>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                      shift.status === 'Clocked In'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {shift.status}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500 font-medium">Post Location:</span>
                    <span className="font-bold text-slate-900">{shift.siteName.split(' (')[0]}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-mono">
                    <span className="text-slate-500">Shift Window:</span>
                    <span className="font-bold text-blue-700">
                      {shift.startTime} – {shift.endTime} ({shift.shiftType})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-mono">
                    <span className="text-slate-500">Billing Rate:</span>
                    <span className="text-emerald-700 font-bold">{formatCurrency(shift.hourlyRate, currentTenant)}/hr</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-slate-500">8.0 hrs allocated</span>
                  <button
                    onClick={() => onDeleteShift(shift.id)}
                    className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-mono font-semibold"
                  >
                    <Trash2 className="h-3 w-3" /> Remove Shift
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Attendance Geofence Audit Table */
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Geofenced Time Clock Audit Records</h3>
              <p className="text-xs text-slate-500 font-mono">
                GPS hardware verification distance, scheduled vs. actual timestamps, and biometric selfie preview
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-600">
                <tr>
                  <th className="p-3">Officer & Badge</th>
                  <th className="p-3">Protected Site</th>
                  <th className="p-3">Clock-In / Out</th>
                  <th className="p-3">Geofence Distance</th>
                  <th className="p-3">Total / Overtime</th>
                  <th className="p-3">Verification Selfie</th>
                  <th className="p-3 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-sans font-bold text-slate-900">
                      <div>{att.guardName}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-normal">{att.badgeNumber}</div>
                    </td>
                    <td className="p-3 text-slate-800 font-sans font-medium">{att.siteName.split(' (')[0]}</td>
                    <td className="p-3 text-slate-700">
                      <div>
                        In: <strong className="text-emerald-700">{att.actualIn}</strong> (Sched {att.scheduledIn})
                      </div>
                      <div className="text-slate-500">Out: {att.actualOut || 'Active On Duty'}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          att.geofenceStatus === 'Verified Inside'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <MapPin className="h-3 w-3" />
                        <span>{att.geofenceDistanceMeters}m ({att.geofenceStatus})</span>
                      </span>
                    </td>
                    <td className="p-3 text-slate-800">
                      <div>{att.totalHours} hrs</div>
                      {att.overtimeHours > 0 && (
                        <div className="text-amber-700 font-bold">+{att.overtimeHours}h Overtime</div>
                      )}
                    </td>
                    <td className="p-3">
                      <img
                        src={att.selfieVerificationUrl}
                        alt="Clock-in selfie"
                        className="h-9 w-9 rounded-lg object-cover border border-slate-200 shadow-2xs"
                      />
                    </td>
                    <td className="p-3 text-right">
                      {att.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            tacticalAudio.playCheckpointScan();
                            onApproveAttendance(att.id);
                          }}
                          className="rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1 text-[11px] font-bold text-white shadow-2xs transition-colors"
                        >
                          Approve Override
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Shift Modal */}
      {showAddShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Assign Guard Shift Schedule</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Select officer, target facility post, and shift window
            </p>

            <form onSubmit={handleCreateShiftSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">
                  Select Security Officer
                </label>
                <select
                  value={newGuardId}
                  onChange={(e) => setNewGuardId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {guards.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.badgeNumber}) — {g.tier}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">
                  Select Facility Post
                </label>
                <select
                  value={newSiteId}
                  onChange={(e) => setNewSiteId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Day of Week</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as ShiftSchedule['dayOfWeek'])}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    {daysOfWeek.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Shift Category</label>
                  <select
                    value={newShiftType}
                    onChange={(e) => setNewShiftType(e.target.value as ShiftSchedule['shiftType'])}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Day Shift">Day Shift (06:00-14:00)</option>
                    <option value="Evening Shift">Evening Shift (14:00-22:00)</option>
                    <option value="Graveyard / Night">Graveyard (22:00-06:00)</option>
                    <option value="On-Call Patrol">On-Call Patrol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddShiftModal(false)}
                  className="rounded-lg px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-2xs"
                >
                  Confirm Roster Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
