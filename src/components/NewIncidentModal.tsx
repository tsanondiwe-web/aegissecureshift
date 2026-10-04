import React, { useState } from 'react';
import { X, PlusCircle, AlertOctagon, ShieldAlert, Camera, MapPin, User, Building } from 'lucide-react';
import { Site, Guard, Incident, IncidentSeverity } from '../types';
import { tacticalAudio } from '../utils/audio';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
  guards: Guard[];
  onCreateIncident: (incident: Omit<Incident, 'id' | 'incidentNumber' | 'timeline' | 'evidence'>) => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  sites,
  guards,
  onCreateIncident,
}) => {
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<Incident['type']>('Unauthorized Access');
  const [severity, setSeverity] = useState<IncidentSeverity>('Medium');
  const [siteId, setSiteId] = useState<string>(sites[0]?.id || '');
  const [zoneName, setZoneName] = useState<string>('Main Lobby / Atrium');
  const [guardId, setGuardId] = useState<string>(guards[0]?.id || '');
  const [description, setDescription] = useState<string>('');
  const [policeNotified, setPoliceNotified] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentSite = sites.find((s) => s.id === siteId) || sites[0];
  const currentGuard = guards.find((g) => g.id === guardId) || guards[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onCreateIncident({
      title,
      type,
      severity,
      status: severity === 'Critical' ? 'Open' : 'Investigating',
      siteId: currentSite.id,
      siteName: currentSite.name,
      zoneName,
      location: { x: 50, y: 50, lat: currentSite.mapCenter.lat, lng: currentSite.mapCenter.lng },
      reportedByGuardId: currentGuard.id,
      reportedByGuardName: currentGuard.name,
      timestamp: 'Just now',
      description,
      policeNotified,
      policeCadNumber: policeNotified ? `CAD-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
    });

    tacticalAudio.playDispatchAlert();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Log Field Security Incident</h3>
              <p className="text-xs text-slate-500 font-mono">Create official tactical occurrence report & assign units</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Incident Category & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Incident Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Incident['type'])}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                <option value="Unauthorized Access">Unauthorized Access</option>
                <option value="Trespassing">Trespassing</option>
                <option value="Perimeter Breach">Perimeter Breach</option>
                <option value="Tampering / Vandalism">Tampering / Vandalism</option>
                <option value="Unlocked Fire Door">Unlocked Fire Door</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="SOS Panic Alarm">SOS Panic Alarm</option>
                <option value="Equipment Failure">Equipment Failure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-semibold"
              >
                <option value="Low">🟢 Low (Routine / Non-Threat)</option>
                <option value="Medium">🟡 Medium (Warning / Minor Breach)</option>
                <option value="High">🟠 High (Serious Threat / Unlocked Exit)</option>
                <option value="Critical">🔴 Critical (Code Red SOS / Active Hostile)</option>
              </select>
            </div>
          </div>

          {/* Incident Title */}
          <div>
            <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Incident Title / Headline</label>
            <input
              type="text"
              required
              placeholder="e.g. Forced Entry Attempt at Sub-Level 2 Cash Vault"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Site & Zone Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Target Facility</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Zone / Sector Name</label>
              <input
                type="text"
                required
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Reporting Guard */}
          <div>
            <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Reporting Officer</label>
            <select
              value={guardId}
              onChange={(e) => setGuardId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              {guards.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.badgeNumber}) — {g.tier}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Forensic Description & Observations</label>
            <textarea
              rows={3}
              required
              placeholder="Provide chronological details, observable evidence, suspect descriptions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none resize-none font-mono"
            />
          </div>

          {/* Police 911 dispatch notification checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="chk-police"
              checked={policeNotified}
              onChange={(e) => setPoliceNotified(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600"
            />
            <label htmlFor="chk-police" className="text-xs text-slate-800 font-medium">
              Simulate Instant SAPS 10111 Police CAD & Armed Reaction Transmission
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
            >
              Confirm Incident Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
