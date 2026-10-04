import React, { useState } from 'react';
import {
  QrCode,
  Camera,
  X,
  CheckCircle2,
  Flashlight,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  RefreshCw,
  Printer,
  Radio,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Guard, Checkpoint, Site, PatrolTour } from '../types';
import { tacticalAudio } from '../utils/audio';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  guards: Guard[];
  selectedGuard: Guard | null;
  checkpoints: Checkpoint[];
  currentSite: Site;
  tours: PatrolTour[];
  onVerifyQRScan: (guardId: string, checkpointId: string, customNotes?: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  guards,
  selectedGuard,
  checkpoints,
  currentSite,
  tours,
  onVerifyQRScan,
}) => {
  const siteGuards = guards.filter((g) => g.siteId === currentSite.id);
  const siteCheckpoints = checkpoints.filter((c) => c.siteId === currentSite.id);

  const [activeGuardId, setActiveGuardId] = useState<string>(
    selectedGuard ? selectedGuard.id : siteGuards[0]?.id || guards[0]?.id || ''
  );
  const [selectedCpId, setSelectedCpId] = useState<string>(siteCheckpoints[0]?.id || '');
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [showPrintSheet, setShowPrintSheet] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentGuard = guards.find((g) => g.id === activeGuardId) || guards[0];
  const targetCheckpoint = checkpoints.find((c) => c.id === selectedCpId) || siteCheckpoints[0];

  const handleExecuteScan = (cpIdToScan?: string) => {
    const cp = checkpoints.find((c) => c.id === (cpIdToScan || selectedCpId)) || targetCheckpoint;
    if (!cp || !currentGuard) return;

    setIsScanning(true);
    tacticalAudio.playRadioClick();

    setTimeout(() => {
      tacticalAudio.playCheckpointScan();
      onVerifyQRScan(currentGuard.id, cp.id, `Verified at ${cp.name} via QR Code ${cp.qrCodeValue || 'QR-TAG-GENERIC'}`);
      setIsScanning(false);
      setScanSuccess(true);

      setTimeout(() => {
        setScanSuccess(false);
        onClose();
      }, 1400);
    }, 750);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Mobile QR Checkpoint Scanner</span>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-mono text-emerald-800 border border-emerald-200 font-bold">
                  TRACKING ENFORCED
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Position updates strictly upon scanning designated physical QR tags
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrintSheet(!showPrintSheet)}
              className="flex items-center gap-1 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{showPrintSheet ? 'Back to Scanner' : 'Printable QR Badges'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Badges Mode */}
        {showPrintSheet ? (
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 font-mono">
              <strong>🖨️ Facility Physical Checkpoint Labels:</strong> Print these QR codes and mount them at each security checkpoint door, safe, and gate.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {siteCheckpoints.map((cp) => (
                <div
                  key={cp.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center gap-3"
                >
                  <div className="h-20 w-20 shrink-0 rounded-lg bg-slate-900 p-2 flex items-center justify-center text-white">
                    <QrCode className="h-16 w-16 text-white" />
                  </div>
                  <div className="space-y-1 truncate">
                    <div className="text-xs font-bold text-slate-900 truncate">{cp.name}</div>
                    <div className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-block">
                      {cp.qrCodeValue || `QR-${cp.id.toUpperCase()}`}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{cp.requiredAction}</p>
                    <div className="text-[9px] font-mono text-slate-400">Dwell: {cp.minDwellSeconds}s | Window: ±{cp.targetWindowMinutes}m</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Live Scanner Mode */
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Guard selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentGuard.avatar}
                  alt={currentGuard.name}
                  className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{currentGuard.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Badge: {currentGuard.badgeNumber} • {currentGuard.tier}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-[11px] font-mono font-semibold text-slate-600 shrink-0">Switch Officer:</label>
                <select
                  value={activeGuardId}
                  onChange={(e) => setActiveGuardId(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                >
                  {siteGuards.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.badgeNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Viewfinder Simulator Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Camera Screen */}
              <div className="relative h-64 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 select-none group shadow-inner">
                {/* Simulated Lens Feed Background */}
                <div
                  className={`absolute inset-0 bg-slate-900 transition-opacity ${
                    torchActive ? 'opacity-80' : 'opacity-95'
                  }`}
                />

                {/* Reticle Target Box */}
                <div className="relative z-10 h-44 w-44 rounded-xl border-2 border-emerald-500/80 p-3 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xs">
                  {/* Corner notches */}
                  <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-emerald-400" />

                  {/* Laser Scan Beam */}
                  {isScanning && (
                    <div className="absolute left-0 right-0 h-1 bg-neutral-700 shadow-[0_0_12px_#737373] animate-bounce top-1/2" />
                  )}

                  {/* QR Pattern Display */}
                  <div className="h-28 w-28 rounded-lg bg-white p-2 flex items-center justify-center shadow-lg">
                    <QrCode className="h-full w-full text-slate-900" />
                  </div>

                  <div className="mt-1.5 text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                    {isScanning ? 'DECODING QR...' : scanSuccess ? 'VERIFIED' : 'ALIGN RETICLE'}
                  </div>
                </div>

                {/* Viewfinder Overlay Controls */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white/80 z-20">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>AEGIS-LENS v4.2</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setTorchActive(!torchActive)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] transition-colors ${
                      torchActive
                        ? 'bg-amber-400 text-slate-900 border-amber-300 font-bold'
                        : 'bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Flashlight className="h-3 w-3" />
                    <span>{torchActive ? 'TORCH ON' : 'TORCH'}</span>
                  </button>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-slate-400 z-20">
                  <span>GPS: Passive (Tracking Off)</span>
                  <span className="text-emerald-400 font-bold">QR Optical Fix: Active</span>
                </div>
              </div>

              {/* Checkpoint Target Selector & Info */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-800 mb-1">
                    Select Target Checkpoint QR Code
                  </label>
                  <select
                    value={selectedCpId}
                    onChange={(e) => setSelectedCpId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none shadow-2xs"
                  >
                    {siteCheckpoints.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.name} [{cp.qrCodeValue || 'QR-TAG'}]
                      </option>
                    ))}
                  </select>
                </div>

                {targetCheckpoint && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-500 text-[10px] font-bold uppercase">Decoded Payload:</span>
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {targetCheckpoint.qrCodeValue || `QR-${targetCheckpoint.id.toUpperCase()}`}
                      </span>
                    </div>

                    <div className="text-slate-800 font-medium">
                      <strong>Required Action:</strong> {targetCheckpoint.requiredAction}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-200">
                      <span>Min Dwell: {targetCheckpoint.minDwellSeconds}s</span>
                      <span>Target SLA: ±{targetCheckpoint.targetWindowMinutes}m</span>
                    </div>
                  </div>
                )}

                {/* Scan Button */}
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleExecuteScan()}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-sm transition-all ${
                    scanSuccess
                      ? 'bg-emerald-600 shadow-emerald-200'
                      : isScanning
                      ? 'bg-blue-400 cursor-wait'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  }`}
                >
                  {scanSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>QR Scan Verified • Guard Position Updated!</span>
                    </>
                  ) : isScanning ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying Optical QR Payload...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      <span>Scan QR Code & Update Guard Location</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Current Guard's Last Known QR Fix */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 font-bold uppercase text-[10px]">
                  {currentGuard.name}'s Current Tracking Fix:
                </span>
                <span className="text-blue-700 font-bold">
                  {currentGuard.lastScannedCheckpointName || 'Initial Duty Station'}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>QR Tag: {currentGuard.lastScannedQRCode || 'QR-STATION-INITIAL'}</span>
                <span>Verified: {currentGuard.lastScannedTimestamp || 'On Shift Start'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
