import React from 'react';
import {
  Flame,
  ShieldAlert,
  Send,
  Lock,
  PhoneCall,
  Volume2,
  VolumeX,
  XCircle,
  Clock,
  Radio,
  UserCheck,
  Building2
} from 'lucide-react';
import { Incident, Guard } from '../types';
import { tacticalAudio } from '../utils/audio';

interface SOSAlarmHUDProps {
  incident: Incident;
  guards: Guard[];
  onDispatchBackup: (incidentId: string, guardId: string) => void;
  onTriggerLockdown: (siteId: string) => void;
  onNotifyPoliceCAD: (incidentId: string) => void;
  onResolveSOS: (incidentId: string) => void;
  onCloseBanner: () => void;
  onFocusIncidentOnMap: (incident: Incident) => void;
}

export const SOSAlarmHUD: React.FC<SOSAlarmHUDProps> = ({
  incident,
  guards,
  onDispatchBackup,
  onTriggerLockdown,
  onNotifyPoliceCAD,
  onResolveSOS,
  onCloseBanner,
  onFocusIncidentOnMap,
}) => {
  // Nearest available or responding guards
  const availableResponders = guards.filter(
    (g) => g.id !== incident.reportedByGuardId && g.siteId === incident.siteId
  );

  return (
    <div
      id="sos-alarm-hud"
      className="relative z-30 mb-4 overflow-hidden rounded-xl border-2 border-rose-600 bg-white p-4 text-slate-900 shadow-xl shadow-rose-200 backdrop-blur-xl animate-pulse-slow"
    >
      {/* Top Red Beacon Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 animate-pulse" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Alarm Title & Coordinates */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-300 animate-bounce">
            <Flame className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded bg-rose-600 px-2.5 py-0.5 text-xs font-mono font-extrabold uppercase tracking-wider text-white">
                CRITICAL DISTRESS SIGNAL
              </span>
              <span className="text-xs font-mono text-rose-700 font-bold">
                {incident.incidentNumber}
              </span>
              <span className="flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-mono text-rose-800 border border-rose-200 font-semibold">
                <Clock className="h-3 w-3 text-rose-600" /> {incident.timestamp}
              </span>
            </div>

            <h3 className="mt-1 text-base font-extrabold text-slate-900 tracking-tight">
              {incident.title}
            </h3>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>
                <strong className="text-slate-800">Facility:</strong> {incident.siteName}
              </span>
              <span>
                <strong className="text-slate-800">Zone:</strong> {incident.zoneName}
              </span>
              <span>
                <strong className="text-slate-800">Distress Officer:</strong> {incident.reportedByGuardName}
              </span>
              {incident.policeNotified && (
                <span className="text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ✓ SFPD CAD Dispatched ({incident.policeCadNumber || 'ACTIVE'})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Instant Tactical Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Track on Map */}
          <button
            id="btn-focus-map"
            onClick={() => onFocusIncidentOnMap(incident)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:border-slate-400"
          >
            <ShieldAlert className="h-4 w-4 text-slate-700" />
            <span>Center on Radar</span>
          </button>

          {/* Quick Dispatch Backup */}
          {availableResponders.length > 0 && (
            <button
              id="btn-dispatch-backup"
              onClick={() => {
                tacticalAudio.playDispatchAlert();
                onDispatchBackup(incident.id, availableResponders[0].id);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-200 transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>
                Dispatch {availableResponders[0].name.split(' ')[0]} (ETA 90s)
              </span>
            </button>
          )}

          {/* Site Lockdown */}
          <button
            id="btn-lockdown"
            onClick={() => {
              tacticalAudio.playDispatchAlert();
              onTriggerLockdown(incident.siteId);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900 transition-colors shadow-xs"
          >
            <Lock className="h-4 w-4 text-amber-700" />
            <span>Lockdown Zone</span>
          </button>

          {/* 911 / Police CAD Transmission */}
          {!incident.policeNotified ? (
            <button
              id="btn-police-cad"
              onClick={() => {
                tacticalAudio.playRadioClick();
                onNotifyPoliceCAD(incident.id);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-rose-200 transition-colors"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Alert 911 / Police CAD</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-lg font-bold">
              <span>CAD #88491-A ACTIVE</span>
            </div>
          )}

          {/* Resolve SOS */}
          <button
            id="btn-resolve-sos"
            onClick={() => {
              tacticalAudio.stopSOSAlarm();
              tacticalAudio.playCheckpointScan();
              onResolveSOS(incident.id);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 transition-colors shadow-xs"
          >
            <UserCheck className="h-4 w-4 text-emerald-700" />
            <span>Resolve Distress</span>
          </button>
        </div>
      </div>
    </div>
  );
};
