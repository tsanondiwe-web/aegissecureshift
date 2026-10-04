import React, { useState } from 'react';
import {
  Route,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PlusCircle,
  Play,
  ShieldAlert,
  ChevronRight,
  Camera,
  Layers,
  Sparkles,
  Check,
  FileCheck2,
  Trash2
} from 'lucide-react';
import { PatrolTour, Checkpoint, Site, Guard } from '../types';
import { tacticalAudio } from '../utils/audio';

interface TourManagementProps {
  tours: PatrolTour[];
  onUpdateTour: (tour: PatrolTour) => void;
  onCreateTour: (tour: Omit<PatrolTour, 'id'>) => void;
  checkpoints: Checkpoint[];
  onCreateCheckpoint: (cp: Omit<Checkpoint, 'id'>) => void;
  sites: Site[];
  guards: Guard[];
  onVerifyQRScan?: (guardId: string, checkpointId: string, notes?: string) => void;
}

export const TourManagement: React.FC<TourManagementProps> = ({
  tours,
  onUpdateTour,
  onCreateTour,
  checkpoints,
  onCreateCheckpoint,
  sites,
  guards,
  onVerifyQRScan,
}) => {
  const [selectedTour, setSelectedTour] = useState<PatrolTour>(tours[0] || null);
  const [showNewCheckpointModal, setShowNewCheckpointModal] = useState<boolean>(false);

  // New Checkpoint Form State
  const [newCpName, setNewCpName] = useState('');
  const [newCpSiteId, setNewCpSiteId] = useState(sites[0]?.id || '');
  const [newCpAction, setNewCpAction] = useState('Scan physical QR barcode tag and inspect perimeter seal');
  const [newCpDwell, setNewCpDwell] = useState(45);
  const [newCpWindow, setNewCpWindow] = useState(20);
  const [newCpHighSec, setNewCpHighSec] = useState(false);

  // Simulate scanning a pending checkpoint in the selected tour
  const handleSimulateScan = (tourId: string, checkpointIndex: number) => {
    tacticalAudio.playCheckpointScan();
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    const updatedCheckpoints = [...tour.checkpoints];
    const targetCp = updatedCheckpoints[checkpointIndex];
    if (!targetCp) return;

    targetCp.status = 'Completed';
    targetCp.completedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    targetCp.verificationType = 'QR Code';
    targetCp.dwellSecondsSpent = Math.floor(30 + Math.random() * 45);
    targetCp.notes = 'Checkpoint verified via physical QR Optical scan. Location fixed.';

    // Recalculate compliance
    const completedCount = updatedCheckpoints.filter((c) => c.status === 'Completed').length;
    const rate = Math.round((completedCount / updatedCheckpoints.length) * 100);

    const updatedTour: PatrolTour = {
      ...tour,
      checkpoints: updatedCheckpoints,
      complianceRate: rate,
      status: completedCount === updatedCheckpoints.length ? 'Completed' : 'In Progress',
    };

    onUpdateTour(updatedTour);
    setSelectedTour(updatedTour);

    if (onVerifyQRScan && tour.guardId) {
      onVerifyQRScan(tour.guardId, targetCp.checkpointId, `Tour Checkpoint Scan: ${targetCp.checkpointName}`);
    }
  };

  // Simulate skipping a checkpoint (triggers SLA warning)
  const handleSimulateMiss = (tourId: string, checkpointIndex: number) => {
    tacticalAudio.playDispatchAlert();
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    const updatedCheckpoints = [...tour.checkpoints];
    const targetCp = updatedCheckpoints[checkpointIndex];
    if (!targetCp) return;

    targetCp.status = 'Missed';
    targetCp.notes = 'Guard failed to arrive within target SLA arrival window.';

    const completedCount = updatedCheckpoints.filter((c) => c.status === 'Completed').length;
    const rate = Math.round((completedCount / updatedCheckpoints.length) * 100);

    const updatedTour: PatrolTour = {
      ...tour,
      checkpoints: updatedCheckpoints,
      complianceRate: rate,
      status: 'Violated',
    };

    onUpdateTour(updatedTour);
    setSelectedTour(updatedTour);
  };

  const handleCreateCheckpointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCpName.trim()) return;

    onCreateCheckpoint({
      name: newCpName,
      siteId: newCpSiteId,
      type: 'QR Code Scan',
      requiredAction: newCpAction,
      minDwellSeconds: Number(newCpDwell),
      targetWindowMinutes: Number(newCpWindow),
      isHighSecurity: newCpHighSec,
      location: { x: Math.floor(20 + Math.random() * 60), y: Math.floor(20 + Math.random() * 60) },
      qrCodeValue: `QR-CODE-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    tacticalAudio.playCheckpointScan();
    setNewCpName('');
    setShowNewCheckpointModal(false);
  };

  return (
    <div id="tour-management-screen" className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Route className="h-5 w-5 text-blue-600" />
            <span>Guard Patrol & Checkpoint Tour Management</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            QR checkpoint compliance verification, arrival SLAs, and route timelines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-create-checkpoint"
            onClick={() => {
              tacticalAudio.playRadioClick();
              setShowNewCheckpointModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>Configure Checkpoint</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Active Tours List on Left, Tour Timeline & Compliance on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Tour Roster Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-700">
              Active Patrol Tours ({tours.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {tours.map((tour) => {
              const isSelected = selectedTour?.id === tour.id;
              return (
                <div
                  key={tour.id}
                  onClick={() => {
                    setSelectedTour(tour);
                    tacticalAudio.playRadioClick();
                  }}
                  className={`cursor-pointer rounded-xl p-3.5 transition-all border ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{tour.name}</span>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {tour.siteName}
                      </div>
                    </div>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                        tour.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : tour.status === 'Violated'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {tour.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-700">
                    <span className="font-semibold text-slate-800">👮 {tour.guardName}</span>
                    <span className="font-mono text-blue-700 font-bold">
                      {tour.complianceRate}% Compliance
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-500 ${
                        tour.complianceRate >= 90
                          ? 'bg-emerald-500'
                          : tour.complianceRate >= 70
                          ? 'bg-blue-600'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${tour.complianceRate}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>
                      Window: {tour.startTime} – {tour.estimatedEndTime}
                    </span>
                    <span className="font-semibold">
                      {tour.checkpoints.filter((c) => c.status === 'Completed').length} /{' '}
                      {tour.checkpoints.length} Checkpoints
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Configured Checkpoints Catalog Overview */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <span className="text-xs font-mono font-bold uppercase text-slate-800">
                Registered Physical Checkpoints ({checkpoints.length})
              </span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {checkpoints.map((cp) => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-xs border border-slate-200"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white border border-slate-200 text-blue-600 shadow-2xs">
                      <QrCode className="h-3.5 w-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate">{cp.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {cp.type} • {cp.minDwellSeconds}s dwell
                      </div>
                    </div>
                  </div>
                  {cp.isHighSecurity && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-mono text-amber-800 font-bold shrink-0 border border-amber-200">
                      HIGH-SEC
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): Selected Tour Live Compliance Timeline & Simulator */}
        {selectedTour && (
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {/* Tour Header Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedTour.name}</h3>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-mono text-blue-700 font-bold border border-blue-200">
                      {selectedTour.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Assigned Guard: <strong className="text-slate-800">{selectedTour.guardName}</strong> • {selectedTour.siteName}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-slate-500">Patrol SLA Compliance</div>
                  <div className="text-xl font-mono font-bold text-blue-700">
                    {selectedTour.complianceRate}%
                  </div>
                </div>
              </div>

              {/* Compliance Timeline / Gantt List */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-800">
                    Checkpoint Sequence & Verification Audit
                  </span>
                  <span className="text-[10px] font-mono text-blue-600 font-bold">
                    REAL-TIME TELEMETRY FEED
                  </span>
                </div>

                <div className="space-y-3 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {selectedTour.checkpoints.map((cp, idx) => {
                    const isDone = cp.status === 'Completed';
                    const isMissed = cp.status === 'Missed';
                    const isPending = cp.status === 'Pending';

                    return (
                      <div
                        key={cp.checkpointId}
                        className="relative flex items-start gap-4 pl-9"
                      >
                        {/* Node circle */}
                        <div
                          className={`absolute left-2.5 top-2 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center rounded-full border-2 ${
                            isDone
                              ? 'border-emerald-500 bg-emerald-600'
                              : isMissed
                              ? 'border-rose-500 bg-rose-600'
                              : 'border-slate-300 bg-white'
                          }`}
                        />

                        {/* Card */}
                        <div
                          className={`flex-1 rounded-xl border p-3 transition-colors ${
                            isDone
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : isMissed
                              ? 'bg-rose-50/50 border-rose-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 font-mono">
                                #{idx + 1} {cp.checkpointName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isMissed
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {cp.status}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                Sched: {cp.scheduledTime}
                              </span>
                            </div>
                          </div>

                          {/* Completed Details */}
                          {isDone && (
                            <div className="mt-2 text-xs text-slate-700 space-y-1">
                              <div className="flex items-center gap-3 text-[11px] font-mono text-emerald-800 font-semibold">
                                <span>✓ Scanned at {cp.completedTime}</span>
                                <span>• Verification: {cp.verificationType}</span>
                                <span>• Dwell: {cp.dwellSecondsSpent}s</span>
                              </div>
                              {cp.notes && (
                                <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                                  "{cp.notes}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Missed Details */}
                          {isMissed && (
                            <div className="mt-2 text-xs text-rose-800 text-[11px] font-mono font-semibold">
                              ⚠️ Checkpoint skipped or exceeded target window. SLA breach logged.
                            </div>
                          )}

                          {/* Actions if Pending (Simulation) */}
                          {isPending && (
                            <div className="mt-2 flex items-center gap-2 pt-2 border-t border-slate-200">
                              <button
                                onClick={() => handleSimulateScan(selectedTour.id, idx)}
                                className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1 text-[10px] font-bold font-mono text-white transition-colors shadow-2xs"
                              >
                                <Play className="h-3 w-3" />
                                <span>Simulate Guard QR Scan</span>
                              </button>
                              <button
                                onClick={() => handleSimulateMiss(selectedTour.id, idx)}
                                className="flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 px-3 py-1 text-[10px] font-bold font-mono text-rose-800 transition-colors shadow-2xs"
                              >
                                <span>Simulate Missed Window</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Checkpoint Configuration Modal */}
      {showNewCheckpointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Configure New Field Checkpoint</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Set the QR checkpoint task and dwell SLA
            </p>

            <form onSubmit={handleCreateCheckpointSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">
                  Checkpoint Name / Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CP-07: West Emergency Generator Fuel Valve"
                  value={newCpName}
                  onChange={(e) => setNewCpName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">
                  Verification method
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900">
                  <QrCode className="h-4 w-4" />
                  QR Code Scan
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">
                  Required Guard Inspection Task
                </label>
                <input
                  type="text"
                  value={newCpAction}
                  onChange={(e) => setNewCpAction(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">
                    Min Dwell Time (sec)
                  </label>
                  <input
                    type="number"
                    value={newCpDwell}
                    onChange={(e) => setNewCpDwell(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">
                    Window SLA (min)
                  </label>
                  <input
                    type="number"
                    value={newCpWindow}
                    onChange={(e) => setNewCpWindow(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-high-sec"
                  checked={newCpHighSec}
                  onChange={(e) => setNewCpHighSec(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600"
                />
                <label htmlFor="chk-high-sec" className="text-xs text-slate-700 font-medium">
                  Mark as High-Security Critical Asset (Audio alarm if missed)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewCheckpointModal(false)}
                  className="rounded-lg px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-2xs"
                >
                  Save Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
