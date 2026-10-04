import React, { useState } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  Download,
  FileText,
  Clock,
  MapPin,
  Shield,
  PhoneCall,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2,
  Image as ImageIcon,
  PenTool,
  Send,
  UserCheck,
  Flame,
  ChevronRight,
  Printer
} from 'lucide-react';
import { Incident, IncidentSeverity, IncidentStatus } from '../types';
import { exportIncidentToPDF, exportIncidentsToCSV } from '../utils/pdfExport';
import { tacticalAudio } from '../utils/audio';

interface IncidentForensicsProps {
  incidents: Incident[];
  onUpdateIncident: (incident: Incident) => void;
  onOpenNewIncident: () => void;
}

export const IncidentForensics: React.FC<IncidentForensicsProps> = ({
  incidents,
  onUpdateIncident,
  onOpenNewIncident,
}) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident>(incidents[0] || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [supervisorNotes, setSupervisorNotes] = useState<string>('');
  const [showSignOffModal, setShowSignOffModal] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Audio memo player simulation
  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      tacticalAudio.playRadioClick();
      let current = 0;
      const interval = setInterval(() => {
        current += 10;
        if (current >= 100) {
          clearInterval(interval);
          setIsPlayingAudio(false);
          setAudioProgress(0);
        } else {
          setAudioProgress(current);
        }
      }, 300);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.incidentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || inc.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleSupervisorSignOff = () => {
    if (!selectedIncident) return;
    tacticalAudio.playCheckpointScan();

    const updated: Incident = {
      ...selectedIncident,
      status: 'Resolved',
      resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      supervisorSignOff: {
        supervisorName: 'Commander Marcus Vance, CSO',
        signedAt: new Date().toLocaleString(),
        notes: supervisorNotes || 'Case reviewed, evidence verified, perimeter secured.',
        signatureDigital: `AUTH-CERT-SHA256-${Math.floor(100000 + Math.random() * 900000)}`,
      },
      timeline: [
        ...selectedIncident.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: 'Commander Marcus Vance (CSO)',
          action: 'Official Forensics Sign-Off & Case Closed',
          details: supervisorNotes || 'Supervisor verified physical security audit.',
          type: 'resolution',
        },
      ],
    };

    onUpdateIncident(updated);
    setSelectedIncident(updated);
    setShowSignOffModal(false);
    setSupervisorNotes('');
  };

  return (
    <div id="incident-forensics-screen" className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-amber-600" />
            <span>Incident Forensics & Evidentiary Dossier</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Digital chain of custody, high-res evidence photos, audio memos, and supervisor sign-off
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportIncidentsToCSV(filteredIncidents)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenNewIncident}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow-md shadow-amber-200 transition-colors"
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>Log Field Incident</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident number, type, site, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
          >
            <option value="all">All Severities</option>
            <option value="Critical">🔴 Critical / SOS</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Incident List on Left, Comprehensive Forensic Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Incident Feed */}
        <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
          {filteredIncidents.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 font-mono shadow-xs">
              No matching security incidents found.
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    tacticalAudio.playRadioClick();
                  }}
                  className={`cursor-pointer rounded-xl p-3.5 transition-all border ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${
                          inc.severity === 'Critical'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : inc.severity === 'High'
                            ? 'bg-orange-50 text-orange-800 border border-orange-200'
                            : inc.severity === 'Medium'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        {inc.incidentNumber}
                      </span>
                    </div>

                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold ${
                        inc.status === 'Resolved'
                          ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                          : 'text-amber-800 bg-amber-50 border border-amber-200'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>

                  <h4 className="mt-2 text-xs font-bold text-slate-900 line-clamp-2">{inc.title}</h4>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>📍 {inc.siteName.split(' (')[0]}</span>
                    <span>{inc.timestamp}</span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Officer: {inc.reportedByGuardName.split(' ')[0]}</span>
                    <span>{inc.evidence.length} Evidence files</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right (2 cols): Selected Incident Forensic Dossier */}
        {selectedIncident ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-amber-700">
                      {selectedIncident.incidentNumber}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                        selectedIncident.severity === 'Critical'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {selectedIncident.severity} SEVERITY
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Category: <strong className="text-slate-800">{selectedIncident.type}</strong>
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-slate-900">{selectedIncident.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => exportIncidentToPDF(selectedIncident)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5 text-blue-600" />
                    <span>Print PDF Dossier</span>
                  </button>

                  {selectedIncident.status !== 'Resolved' && (
                    <button
                      onClick={() => setShowSignOffModal(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-200 transition-colors"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Supervisor Sign-Off</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Location & Personnel Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                    Facility / Site
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedIncident.siteName}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                    Sector / Zone
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedIncident.zoneName}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                    Reporting Officer
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedIncident.reportedByGuardName}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                    Police CAD Alert
                  </div>
                  <div className="font-bold text-emerald-700 mt-0.5 font-mono">
                    {selectedIncident.policeNotified
                      ? `Yes (${selectedIncident.policeCadNumber || 'ACTIVE'})`
                      : 'Internal Only'}
                  </div>
                </div>
              </div>

              {/* Forensic Narrative */}
              <div>
                <div className="text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
                  Detailed Field Occurrence Log
                </div>
                <div className="rounded-lg bg-slate-50 p-3.5 text-xs text-slate-800 leading-relaxed border border-slate-200 font-mono">
                  {selectedIncident.description}
                </div>
              </div>

              {/* Physical Evidence Attachments Gallery (Photos & Voice Memos) */}
              <div>
                <div className="text-xs font-mono font-bold uppercase text-slate-700 mb-2">
                  Digital Evidence Chain of Custody ({selectedIncident.evidence.length} files)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedIncident.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between"
                    >
                      {ev.type === 'photo' ? (
                        <div>
                          <div
                            onClick={() => setPreviewImage(ev.url)}
                            className="relative h-32 rounded-lg overflow-hidden cursor-pointer group shadow-2xs"
                          >
                            <img
                              src={ev.url}
                              alt={ev.caption}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-mono">
                              <Maximize2 className="h-4 w-4 mr-1" /> Click to Enlarge
                            </div>
                          </div>
                          <p className="mt-2 text-xs font-bold text-slate-900">{ev.caption}</p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{ev.recordedBy}</span>
                            <span>{ev.fileSize}</span>
                          </div>
                        </div>
                      ) : (
                        // Audio Voice Memo Player
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono text-blue-700 mb-2 font-bold">
                            <span className="flex items-center gap-1.5">
                              <Volume2 className="h-4 w-4 text-blue-600" />
                              <span>TACTICAL VOICE MEMO</span>
                            </span>
                            <span>{ev.audioDurationSeconds || 14}s</span>
                          </div>

                          {/* Waveform graphic */}
                          <div className="h-10 rounded-lg bg-white flex items-center gap-1 px-2 mb-2 border border-slate-200 shadow-2xs">
                            {[40, 70, 90, 60, 30, 80, 100, 75, 45, 90, 65, 85, 30, 50, 80, 60, 40, 20].map(
                              (h, i) => (
                                <div
                                  key={i}
                                  className={`flex-1 rounded-full transition-all ${
                                    isPlayingAudio && (i / 18) * 100 <= audioProgress
                                      ? 'bg-blue-600'
                                      : 'bg-slate-300'
                                  }`}
                                  style={{ height: `${h}%` }}
                                />
                              )
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <button
                              onClick={togglePlayAudio}
                              className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs font-bold text-white shadow-2xs transition-colors"
                            >
                              {isPlayingAudio ? (
                                <>
                                  <Pause className="h-3 w-3" /> Pause Memo
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3" /> Play Transmission
                                </>
                              )}
                            </button>
                            <span className="text-[10px] text-slate-500 font-mono">{ev.recordedBy}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chronological Audit Timeline */}
              <div>
                <div className="text-xs font-mono font-bold uppercase text-slate-700 mb-2">
                  Chronological Dispatch & Response Timeline
                </div>
                <div className="space-y-2">
                  {selectedIncident.timeline.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs"
                    >
                      <span className="font-mono text-blue-700 font-bold shrink-0">
                        [{item.timestamp}]
                      </span>
                      <div>
                        <span className="font-bold text-slate-900">{item.actor}: </span>
                        <span className="text-slate-800 font-medium">{item.action} — </span>
                        <span className="text-slate-600 italic">{item.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisor Sign-Off Box */}
              {selectedIncident.supervisorSignOff && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="text-xs font-mono font-bold uppercase text-emerald-900">
                        Supervisory Review Certified & Closed
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                      {selectedIncident.supervisorSignOff.signedAt}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-800">
                    <strong>Reviewing Supervisor:</strong> {selectedIncident.supervisorSignOff.supervisorName}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 italic">
                    "{selectedIncident.supervisorSignOff.notes}"
                  </p>
                  <div className="mt-3 pt-2 border-t border-emerald-200 font-mono text-[10px] text-emerald-800 font-bold">
                    DIGITAL SIGNATURE HASH: {selectedIncident.supervisorSignOff.signatureDigital}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 font-mono shadow-xs">
            Select an incident from the left to view complete evidentiary dossier.
          </div>
        )}
      </div>

      {/* Supervisor Sign-Off Modal */}
      {showSignOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              <span>Supervisor Forensic Sign-Off</span>
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Certify review of evidence, mark case resolved, and generate cryptographic audit record.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">
                  Supervisor Directives & Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Physical perimeter secured. Hardware lock replaced with Abloy grade-5 deadbolt. Case closed."
                  value={supervisorNotes}
                  onChange={(e) => setSupervisorNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-mono resize-none"
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-[11px] font-mono text-slate-700">
                <div>
                  Signing Officer: <strong className="text-slate-900">Commander Marcus Vance, CSO</strong>
                </div>
                <div className="text-slate-500">Timestamp: {new Date().toLocaleString()}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setShowSignOffModal(false)}
                  className="rounded-lg px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSupervisorSignOff}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200"
                >
                  Confirm & Certify Sign-Off
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-pointer"
        >
          <img src={previewImage} alt="Forensic Evidence" className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
};
