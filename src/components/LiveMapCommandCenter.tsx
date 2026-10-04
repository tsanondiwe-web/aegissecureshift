import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Shield,
  Radio,
  Video,
  BatteryCharging,
  Wifi,
  Heart,
  Navigation,
  Crosshair,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkles,
  Flame,
  UserCheck,
  Building2,
  Maximize2,
  Volume2,
  VolumeX,
  Compass,
  QrCode,
  Camera,
  CheckCircle2,
  Scan,
  Globe2,
  Clock,
  CloudSun,
  Activity,
  ArrowRight,
  ShieldAlert,
  Server,
  Zap,
  PhoneCall,
  Search,
  ChevronDown,
  RefreshCw,
  Landmark,
  FileCheck
} from 'lucide-react';
import { Site, Guard, Checkpoint, Incident, PatrolTour, GeofenceZone } from '../types';
import { tacticalAudio } from '../utils/audio';
import { QRScannerModal } from './QRScannerModal';

interface LiveMapProps {
  sites: Site[];
  currentSite: Site;
  onSelectSite: (site: Site) => void;
  guards: Guard[];
  onUpdateGuard: (guard: Guard) => void;
  checkpoints: Checkpoint[];
  incidents: Incident[];
  activeTours: PatrolTour[];
  onSelectIncident: (incident: Incident) => void;
  onOpenBroadcastWithGuard?: (guard: Guard) => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  onVerifyQRScan?: (guardId: string, checkpointId: string, customNotes?: string) => void;
}

const SITE_PLAN_ZONE_COLORS = ['#5F7288', '#B89458', '#6D8174'];

export const LiveMapCommandCenter: React.FC<LiveMapProps> = ({
  sites,
  currentSite,
  onSelectSite,
  guards,
  onUpdateGuard,
  checkpoints,
  incidents,
  activeTours,
  onSelectIncident,
  onOpenBroadcastWithGuard,
  isSimulating,
  setIsSimulating,
  onVerifyQRScan,
}) => {
  // View mode: UK National Geographic GIS Network vs Single Facility Blueprint
  const [viewScope, setViewScope] = useState<'facility' | 'geographic'>('facility');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [hoveredSite, setHoveredSite] = useState<Site | null>(null);
  const [hoveredZone, setHoveredZone] = useState<GeofenceZone | null>(null);
  const [mapMode, setMapMode] = useState<'blueprint' | 'satellite' | 'infrared'>('blueprint');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState<boolean>(true);
  const [showGeofences, setShowGeofences] = useState<boolean>(true);
  const [showCheckpoints, setShowCheckpoints] = useState<boolean>(true);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);
  const [activeScanFlashCpId, setActiveScanFlashCpId] = useState<string | null>(null);
  const [siteSearchQuery, setSiteSearchQuery] = useState<string>('');
  const [showOperationalDetails, setShowOperationalDetails] = useState<boolean>(false);

  // Filter guards for current site and selected tier
  const siteGuards = guards.filter((g) => g.siteId === currentSite.id);
  const siteCheckpoints = checkpoints.filter((c) => c.siteId === currentSite.id);
  const siteIncidents = incidents.filter((i) => i.siteId === currentSite.id && i.status !== 'Resolved');

  // Maintain selected guard on site change
  useEffect(() => {
    if (siteGuards.length > 0) {
      if (!selectedGuard || selectedGuard.siteId !== currentSite.id) {
        setSelectedGuard(siteGuards[0]);
      }
    } else {
      setSelectedGuard(null);
    }
  }, [currentSite.id, guards]);

  const filteredGuards = siteGuards.filter((g) => {
    if (filterTier === 'all') return true;
    if (filterTier === 'armed') return g.tier === 'Armed Security';
    if (filterTier === 'k9') return g.tier === 'K9 Unit';
    if (filterTier === 'mobile') return g.tier === 'Mobile Patrol Cruiser';
    if (filterTier === 'static') return g.tier === 'Static Guard' || g.tier === 'Executive Protection';
    return true;
  });

  // Filter sites for the Geographic Network view with UK hierarchy awareness
  const filteredSites = sites.filter((s) => {
    const matchesRegion = selectedRegion === 'all' || s.region === selectedRegion;
    const query = siteSearchQuery.toLowerCase();
    const matchesSearch =
      query === '' ||
      s.name.toLowerCase().includes(query) ||
      s.city.toLowerCase().includes(query) ||
      (s.countyOrAuthority && s.countyOrAuthority.toLowerCase().includes(query)) ||
      (s.district && s.district.toLowerCase().includes(query)) ||
      (s.townOrCity && s.townOrCity.toLowerCase().includes(query)) ||
      (s.postcode && s.postcode.toLowerCase().includes(query)) ||
      s.type.toLowerCase().includes(query);
    return matchesRegion && matchesSearch;
  });

  // Guard tracking simulation engine: STRICTLY QR-CODE SCAN BASED
  // Coordinates update ONLY upon verified physical QR scans
  useEffect(() => {
    if (!isSimulating || siteCheckpoints.length === 0) return;

    const interval = setInterval(() => {
      const patrolGuards = siteGuards.filter(
        (g) => g.status === 'patrolling' || g.status === 'incident_responding'
      );
      if (patrolGuards.length === 0) return;

      const randomGuard = patrolGuards[Math.floor(Math.random() * patrolGuards.length)];
      if (!randomGuard) return;

      // Pick a checkpoint at the site (prefer one different from current)
      const availableCps = siteCheckpoints.filter(
        (c) => c.id !== randomGuard.lastScannedCheckpointId
      );
      const nextCp =
        availableCps.length > 0
          ? availableCps[Math.floor(Math.random() * availableCps.length)]
          : siteCheckpoints[0];

      if (!nextCp) return;

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' SAST';
      const qrTag = nextCp.qrCodeValue || `QR-${nextCp.id.toUpperCase()}`;

      // Solid flash indicator on checkpoint
      setActiveScanFlashCpId(nextCp.id);
      setTimeout(() => setActiveScanFlashCpId(null), 1200);

      const updated: Guard = {
        ...randomGuard,
        location: {
          ...randomGuard.location,
          x: nextCp.location.x,
          y: nextCp.location.y,
          heading: Math.floor(Math.random() * 360),
          speedKmh: 0,
        },
        lastPingTime: 'Just now',
        lastScannedQRCode: qrTag,
        lastScannedCheckpointId: nextCp.id,
        lastScannedCheckpointName: nextCp.name,
        lastScannedTimestamp: timestamp,
        heartRate: Math.max(
          68,
          Math.min(115, (randomGuard.heartRate || 75) + Math.floor((Math.random() - 0.5) * 4))
        ),
        breadcrumbs: [
          ...(randomGuard.breadcrumbs || []).slice(-6),
          {
            x: nextCp.location.x,
            y: nextCp.location.y,
            time: timestamp,
            qrCode: qrTag,
            checkpointName: nextCp.name,
          },
        ],
      };

      if (onVerifyQRScan) {
        onVerifyQRScan(randomGuard.id, nextCp.id, `Simulated scan at ${nextCp.name}`);
      } else {
        onUpdateGuard(updated);
      }

      if (selectedGuard && selectedGuard.id === updated.id) {
        setSelectedGuard(updated);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isSimulating, siteCheckpoints, siteGuards, selectedGuard, onVerifyQRScan, onUpdateGuard]);

  // Handler for direct manual scan from UI
  const handleScanCheckpointDirectly = (checkpoint: Checkpoint, guard: Guard) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' SAST';
    const qrTag = checkpoint.qrCodeValue || `QR-${checkpoint.id.toUpperCase()}`;

    setActiveScanFlashCpId(checkpoint.id);
    tacticalAudio.playCheckpointScan();
    setTimeout(() => setActiveScanFlashCpId(null), 1200);

    if (onVerifyQRScan) {
      onVerifyQRScan(guard.id, checkpoint.id, `Direct Tactical Scan at ${checkpoint.name}`);
    } else {
      const updated: Guard = {
        ...guard,
        location: {
          ...guard.location,
          x: checkpoint.location.x,
          y: checkpoint.location.y,
          heading: 0,
          speedKmh: 0,
        },
        lastPingTime: 'Just now',
        lastScannedQRCode: qrTag,
        lastScannedCheckpointId: checkpoint.id,
        lastScannedCheckpointName: checkpoint.name,
        lastScannedTimestamp: timestamp,
        breadcrumbs: [
          ...(guard.breadcrumbs || []).slice(-6),
          {
            x: checkpoint.location.x,
            y: checkpoint.location.y,
            time: timestamp,
            qrCode: qrTag,
            checkpointName: checkpoint.name,
          },
        ],
      };
      onUpdateGuard(updated);
      if (selectedGuard?.id === guard.id) {
        setSelectedGuard(updated);
      }
    }
  };

  const handleSelectAndDrillSite = (site: Site) => {
    onSelectSite(site);
    setViewScope('facility');
    tacticalAudio.playRadioClick();
  };

  return (
    <div id="live-map-command-center" className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-128px)] min-h-[640px]">
      {/* Center/Left: Interactive Tactical Map Stage */}
      <div className="flex-1 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
        {/* Map Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/95 px-4 py-2.5 z-20 backdrop-blur-md gap-2">
          {/* View Scope Switcher: Geographic Multi-Authority vs Facility Blueprint */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-slate-200/70 p-0.5 border border-slate-200 text-xs font-mono font-bold">
              <button
                onClick={() => {
                  setViewScope('geographic');
                  tacticalAudio.playRadioClick();
                }}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                  viewScope === 'geographic'
                    ? 'bg-[#171717] text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Globe2 className="h-3.5 w-3.5" />
                <span>Regional map</span>
              </button>
              <button
                onClick={() => {
                  setViewScope('facility');
                  tacticalAudio.playRadioClick();
                }}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                  viewScope === 'facility'
                    ? 'bg-[#171717] text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Site plan · {currentSite.townOrCity || currentSite.city}</span>
              </button>
            </div>
          </div>

          {/* Facility pills when in Facility Blueprint Mode */}
          {viewScope === 'facility' && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full lg:max-w-md py-0.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold shrink-0">
                Site
              </span>
              <div className="flex gap-1">
                {sites.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectSite(s);
                      tacticalAudio.playRadioClick();
                    }}
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold font-mono transition-colors shrink-0 flex items-center gap-1 ${
                      currentSite.id === s.id
                        ? 'bg-[#171717] text-white font-semibold'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    title={`${s.name} - ${s.townOrCity || s.city} (${s.countyOrAuthority || s.state})`}
                  >
                    <span>{s.townOrCity || s.city}</span>
                    <span className={`text-[9px] px-1 rounded ${currentSite.id === s.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {s.activeGuardsCount}G
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Region / Province Filters when in Geographic View */}
          {viewScope === 'geographic' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">REGION:</span>
              <div className="flex gap-1 flex-wrap">
                {(['all', 'Gauteng Central', 'Gauteng North', 'Western Cape Coast', 'KZN Coastal Port', 'SADC Cross-Border Hub'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedRegion(r);
                      tacticalAudio.playRadioClick();
                    }}
                    className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold transition-colors ${
                      selectedRegion === r
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {r === 'all' ? 'ALL SADC' : r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons & QR controls */}
          <div className="flex items-center gap-2">
            {/* Scan QR Modal Trigger */}
            <button
              onClick={() => {
                tacticalAudio.playRadioClick();
                setIsQRScannerOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              <QrCode className="h-3.5 w-3.5 text-blue-600" />
              <span>Scan QR</span>
            </button>

            {/* Simulation Engine Toggle (Solid state indicator, no ping) */}
            <button
              onClick={() => {
                setIsSimulating(!isSimulating);
                tacticalAudio.playRadioClick();
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                isSimulating
                  ? 'bg-emerald-600 text-white shadow-emerald-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isSimulating ? 'bg-white' : 'bg-slate-400'
                }`}
              />
              <span>{isSimulating ? 'Auto-scan on' : 'Start auto-scan'}</span>
            </button>

            {/* Blueprint layers when in Facility mode */}
            {viewScope === 'facility' && (
              <div className="hidden xl:flex items-center gap-1">
                <button
                  onClick={() => setShowGeofences(!showGeofences)}
                  className={`h-7 px-2 rounded-lg border text-[10px] font-mono font-bold shadow-2xs ${
                    showGeofences
                      ? 'border-blue-300 text-blue-700 bg-blue-50'
                      : 'border-slate-200 text-slate-400 bg-white'
                  }`}
                >
                  ZONES
                </button>
                <button
                  onClick={() => setShowCheckpoints(!showCheckpoints)}
                  className={`h-7 px-2 rounded-lg border text-[10px] font-mono font-bold shadow-2xs ${
                    showCheckpoints
                      ? 'border-blue-300 text-blue-700 bg-blue-50'
                      : 'border-slate-200 text-slate-400 bg-white'
                  }`}
                >
                  QR TAGS
                </button>
                <button
                  onClick={() => setShowBreadcrumbs(!showBreadcrumbs)}
                  className={`h-7 px-2 rounded-lg border text-[10px] font-mono font-bold shadow-2xs ${
                    showBreadcrumbs
                      ? 'border-blue-300 text-blue-700 bg-blue-50'
                      : 'border-slate-200 text-slate-400 bg-white'
                  }`}
                >
                  TRAILS
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={() => setZoomLevel(Math.min(1.6, zoomLevel + 0.15))}
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.15))}
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-[10px] font-mono font-bold shadow-2xs"
                title="Reset Zoom"
              >
                1x
              </button>
            </div>
          </div>
        </div>

        {/* VIEW 1: UK National Multi-Authority & County GIS Network Map */}
        {viewScope === 'geographic' && (
          <div className="relative flex-1 overflow-hidden select-none bg-slate-900 flex items-center justify-center">
            {/* National Cartographic Grid Background */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#a3a3a3_1px,transparent_1px)] [background-size:32px_32px] opacity-15" />
            
            {/* SVG Geographic Map of United Kingdom with England, Scotland, Wales Boundaries */}
            <div
              className="relative w-full h-full max-w-5xl max-h-full transition-transform duration-300 flex items-center justify-center p-3"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <svg viewBox="0 0 1000 650" className="w-full h-full drop-shadow-2xl overflow-visible">
                <defs>
                  <filter id="geo-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#525252" floodOpacity="0.3" />
                  </filter>
                  <linearGradient id="network-uk-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#525252" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#A3A3A3" stopOpacity="0.25" />
                  </linearGradient>
                </defs>

                {/* British Isles Cartographic Landmass Outline */}
                {/* Scotland & Northern Coast */}
                <path
                  d="M 460 30 Q 520 20 540 60 T 560 120 T 520 180 T 480 200 T 420 180 T 400 120 T 430 50 Z"
                  fill="#0F172A"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {/* Northern Ireland */}
                <path
                  d="M 280 180 Q 340 170 350 210 T 320 250 T 260 240 T 250 190 Z"
                  fill="#0F172A"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                {/* England & Wales Main Landmass */}
                <path
                  d="M 480 200 Q 560 220 580 280 T 640 340 T 760 390 T 800 480 T 740 560 T 640 560 T 480 540 T 340 580 T 220 600 T 260 520 T 340 480 T 400 420 T 440 360 T 460 280 Z"
                  fill="#1E293B"
                  stroke="#475569"
                  strokeWidth="2.5"
                />

                {/* UK National Meridian & Latitude Lines */}
                <g stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.35">
                  <line x1="200" y1="30" x2="200" y2="620" />
                  <line x1="400" y1="30" x2="400" y2="620" />
                  <line x1="600" y1="30" x2="600" y2="620" />
                  <line x1="800" y1="30" x2="800" y2="620" />
                  <line x1="100" y1="180" x2="900" y2="180" />
                  <line x1="100" y1="360" x2="900" y2="360" />
                  <line x1="100" y1="500" x2="900" y2="500" />
                </g>

                {/* Sovereign Telemetry Mesh Vectors (Connecting Sovereign Sites) */}
                {filteredSites.map((targetSite, idx) => {
                  const baseSite = filteredSites[0] || currentSite;
                  if (targetSite.id === baseSite.id) return null;

                  const bX = (baseSite.geoMapPos?.x || 50) * 10;
                  const bY = (baseSite.geoMapPos?.y || 50) * 6;
                  const tX = (targetSite.geoMapPos?.x || 50) * 10;
                  const tY = (targetSite.geoMapPos?.y || 50) * 6;

                  return (
                    <g key={`telemetry-link-${targetSite.id}`}>
                      <line
                        x1={bX}
                        y1={bY}
                        x2={tX}
                        y2={tY}
                        stroke="url(#network-uk-grad)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    </g>
                  );
                })}

                {/* UK Facility Hub Pins (Solid, crisp badges with NO ping) */}
                {filteredSites.map((site) => {
                  const cx = (site.geoMapPos?.x || 50) * 10;
                  const cy = (site.geoMapPos?.y || 50) * 6;
                  const isCurrent = currentSite.id === site.id;
                  const isHovered = hoveredSite?.id === site.id;
                  const hasIncident = incidents.some(
                    (inc) => inc.siteId === site.id && inc.status !== 'Resolved'
                  );

                  let pinColor = '#525252';
                  if (hasIncident) pinColor = '#EF4444'; // Red
                  else if (site.authorityType === 'Unitary Authority') pinColor = '#737373';
                  else if (site.authorityType === 'County') pinColor = '#171717';

                  return (
                    <g
                      key={site.id}
                      className="cursor-pointer group"
                      onClick={() => handleSelectAndDrillSite(site)}
                      onMouseEnter={() => setHoveredSite(site)}
                      onMouseLeave={() => setHoveredSite(null)}
                    >
                      {/* Selection Highlight Ring (Solid crisp, no ping) */}
                      {(isCurrent || isHovered) && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={24}
                          fill="none"
                          stroke={pinColor}
                          strokeWidth="2.5"
                          strokeOpacity="0.9"
                        />
                      )}

                      {/* Base Marker Circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isCurrent ? 14 : 11}
                        fill="#0F172A"
                        stroke={pinColor}
                        strokeWidth={isCurrent ? 3 : 2}
                        filter="url(#geo-glow)"
                      />

                      {/* Center Node Dot */}
                      <circle cx={cx} cy={cy} r={isCurrent ? 6 : 4} fill={pinColor} />

                      {/* Authority & Town Name Tag */}
                      <rect
                        x={cx - 75}
                        y={cy - 34}
                        width="150"
                        height="22"
                        rx="4"
                        fill="#0F172A"
                        stroke={isCurrent ? '#171717' : '#334155'}
                        strokeWidth={isCurrent ? 2 : 1}
                      />
                      <text
                        x={cx}
                        y={cy - 20}
                        textAnchor="middle"
                        fill="#F8FAFC"
                        fontSize="10"
                        fontFamily="sans-serif"
                        fontWeight="800"
                      >
                        {site.townOrCity || site.city} ({site.countyOrAuthority?.split(' ')[0]})
                      </text>

                      {/* Postcode & Guards Count Sub-Tag */}
                      <text
                        x={cx}
                        y={cy + 24}
                        textAnchor="middle"
                        fill="#94A3B8"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="700"
                      >
                        {site.postcode} • {site.activeGuardsCount}G
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Quick SADC / SA Multi-Region HUD Bar at Bottom */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="flex items-center gap-3 rounded-xl bg-slate-900/90 border border-slate-700 p-2.5 backdrop-blur-md text-xs font-mono text-slate-200 shadow-xl pointer-events-auto">
                <span className="flex items-center gap-1.5 font-bold text-blue-400">
                  <Landmark className="h-4 w-4" />
                  <span>SADC & METROPOLITAN REGIONS: {sites.length} SITES ACTIVE</span>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 font-semibold">
                  {guards.length} PSIRA Registered Officers Deployed
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">
                  Cadence: Strict Optical QR / GPS Geo-Fixes
                </span>
              </div>

              {/* Hovered or Selected Site Drill Down Card */}
              {(hoveredSite || currentSite) && (
                <div className="flex items-center gap-3 rounded-xl bg-slate-900 border border-blue-500/50 p-2 text-xs font-mono text-white shadow-2xl pointer-events-auto">
                  <div>
                    <div className="font-bold text-blue-300">
                      {(hoveredSite || currentSite).name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {(hoveredSite || currentSite).townOrCity || (hoveredSite || currentSite).city}, {(hoveredSite || currentSite).district ? `${(hoveredSite || currentSite).district} • ` : ''}{(hoveredSite || currentSite).countyOrAuthority} ({(hoveredSite || currentSite).authorityType || 'Authority'})
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectAndDrillSite(hoveredSite || currentSite)}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition-colors shadow-sm"
                  >
                    <span>ENTER FACILITY BLUEPRINT</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Single Facility Tactical Floorplan Blueprint */}
        {viewScope === 'facility' && (
          <div className="relative flex-1 overflow-hidden select-none bg-slate-100 flex items-center justify-center">
            {/* Tactical Grid Background */}
            <div
              className={`absolute inset-0 pointer-events-none ${
                mapMode === 'satellite'
                  ? 'bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-40'
                  : mapMode === 'infrared'
                  ? 'bg-[radial-gradient(#f87171_1px,transparent_1px)] [background-size:20px_20px] opacity-30'
                  : 'bg-[radial-gradient(#a3a3a3_1px,transparent_1px)] [background-size:24px_24px] opacity-30'
              }`}
            />

            {/* SVG Map Container (Scalable) */}
            <div
              className="relative w-full h-full max-w-5xl max-h-full transition-transform duration-300 flex items-center justify-center p-6"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <svg viewBox="0 0 1000 650" className="w-full h-full drop-shadow-md overflow-visible">
                <defs>
                  <pattern id="grid-pattern-soc" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                  </pattern>
                  <filter id="shadow-node" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                  </filter>
                </defs>

                {/* Site Base Perimeter Outline */}
                <rect
                  x="80"
                  y="50"
                  width="840"
                  height="540"
                  rx="16"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                  strokeWidth="3"
                  filter="url(#shadow-node)"
                />
                <rect x="80" y="50" width="840" height="540" fill="url(#grid-pattern-soc)" />

                {/* Facility Name, Authority & Town Watermark */}
                <text
                  x="100"
                  y="85"
                  fill="#94A3B8"
                  fontSize="13"
                  fontWeight="900"
                  fontFamily="monospace"
                  letterSpacing="1"
                >
                  {currentSite.name.toUpperCase()} [{currentSite.townOrCity || currentSite.city}, {currentSite.countyOrAuthority?.toUpperCase() || currentSite.state}]
                </text>

                {/* Architectural Corridors & Structural Wall Layout */}
                <g stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none">
                  <line x1="80" y1="230" x2="920" y2="230" />
                  <line x1="80" y1="410" x2="920" y2="410" />
                  <line x1="420" y1="50" x2="420" y2="590" />
                  <line x1="680" y1="50" x2="680" y2="590" />
                </g>

                {/* Structural Solid Pillars */}
                <g fill="#94A3B8">
                  <rect x="415" y="225" width="10" height="10" rx="2" />
                  <rect x="675" y="225" width="10" height="10" rx="2" />
                  <rect x="415" y="405" width="10" height="10" rx="2" />
                  <rect x="675" y="405" width="10" height="10" rx="2" />
                </g>

                {/* Geofence Zones */}
                {showGeofences &&
                  currentSite.zones.map((zone, zoneIndex) => {
                    const pointsStr = zone.points
                      .map((p) => `${p.x * 10},${p.y * 6.5}`)
                      .join(' ');
                    const isHovered = hoveredZone?.id === zone.id;
                    const planColor = SITE_PLAN_ZONE_COLORS[zoneIndex % SITE_PLAN_ZONE_COLORS.length];

                    return (
                      <g key={zone.id} className="cursor-pointer">
                        <polygon
                          points={pointsStr}
                          fill={planColor}
                          fillOpacity={isHovered ? 0.72 : 0.58}
                          stroke="#30363A"
                          strokeWidth={isHovered ? 3 : 1.5}
                          strokeDasharray={zone.accessLevel === 'VIP Vault' ? '6 3' : undefined}
                          onMouseEnter={() => setHoveredZone(zone)}
                          onMouseLeave={() => setHoveredZone(null)}
                        />
                        <text
                          x={zone.points[0].x * 10 + 12}
                          y={zone.points[0].y * 6.5 + 24}
                          fill="#171717"
                          fontSize="11"
                          fontWeight="800"
                          fontFamily="monospace"
                          letterSpacing="1"
                        >
                          {zone.name.toUpperCase()} [{zone.accessLevel}]
                        </text>
                      </g>
                    );
                  })}

                {/* Active Patrol Route Polylines */}
                {activeTours.map((tour) => {
                  if (tour.siteId !== currentSite.id) return null;
                  const pathStr = tour.routeCoordinates
                    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x * 10} ${p.y * 6.5}`)
                    .join(' ');
                  return (
                    <path
                      key={tour.id}
                      d={pathStr}
                      fill="none"
                      stroke="#171717"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      strokeOpacity="0.5"
                    />
                  );
                })}

                {/* Guard Scanned QR Checkpoint Breadcrumb Trails */}
                {showBreadcrumbs &&
                  filteredGuards.map((guard) => {
                    if (!guard.breadcrumbs || guard.breadcrumbs.length < 2) return null;
                    const pathStr = guard.breadcrumbs
                      .map((b, idx) => `${idx === 0 ? 'M' : 'L'} ${b.x * 10} ${b.y * 6.5}`)
                      .join(' ');

                    const isSelected = selectedGuard?.id === guard.id;

                    return (
                      <g key={`bc-group-${guard.id}`}>
                        <path
                          d={pathStr}
                          fill="none"
                          stroke={guard.status === 'incident_responding' ? '#E11D48' : isSelected ? '#171717' : '#94A3B8'}
                          strokeWidth={isSelected ? '2.5' : '1.5'}
                          strokeDasharray="4 3"
                          strokeOpacity={isSelected ? 0.9 : 0.6}
                        />
                        {guard.breadcrumbs.map((b, bIdx) => (
                          <g key={bIdx}>
                            <circle
                              cx={b.x * 10}
                              cy={b.y * 6.5}
                              r="4"
                              fill={guard.status === 'incident_responding' ? '#E11D48' : '#525252'}
                              opacity={0.5 + (bIdx / guard.breadcrumbs.length) * 0.5}
                            />
                          </g>
                        ))}
                      </g>
                    );
                  })}

                {/* Physical QR Checkpoint Nodes */}
                {showCheckpoints &&
                  siteCheckpoints.map((cp) => {
                    const isSelected = selectedCheckpoint?.id === cp.id;
                    const isFlashing = activeScanFlashCpId === cp.id;
                    const cx = cp.location.x * 10;
                    const cy = cp.location.y * 6.5;

                    return (
                      <g
                        key={cp.id}
                        className="cursor-pointer group"
                        onClick={() => {
                          setSelectedCheckpoint(cp);
                          tacticalAudio.playCheckpointScan();
                        }}
                      >
                        {/* Solid Flash Beacon Ring on scan (NO ping animation) */}
                        {isFlashing && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r="22"
                            fill="#525252"
                            fillOpacity="0.25"
                            stroke="#525252"
                            strokeWidth="2.5"
                          />
                        )}

                        {/* Checkpoint Base Square Box */}
                        <rect
                          x={cx - 12}
                          y={cy - 12}
                          width="24"
                          height="24"
                          rx="6"
                          fill="#FFFFFF"
                          stroke={isFlashing ? '#171717' : isSelected ? '#171717' : cp.isHighSecurity ? '#737373' : '#475569'}
                          strokeWidth={isSelected || isFlashing ? '3' : '2'}
                          filter="url(#shadow-node)"
                        />

                        {/* Inner QR Icon representation */}
                        <rect
                          x={cx - 7}
                          y={cy - 7}
                          width="6"
                          height="6"
                          fill={isFlashing ? '#171717' : isSelected ? '#171717' : '#475569'}
                        />
                        <rect
                          x={cx + 1}
                          y={cy - 7}
                          width="6"
                          height="6"
                          fill={isFlashing ? '#171717' : isSelected ? '#171717' : '#475569'}
                        />
                        <rect
                          x={cx - 7}
                          y={cy + 1}
                          width="6"
                          height="6"
                          fill={isFlashing ? '#171717' : isSelected ? '#171717' : '#475569'}
                        />

                        {/* Checkpoint Name Tag & QR Tag */}
                        <text
                          x={cx + 16}
                          y={cy - 1}
                          fill="#1E293B"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="800"
                        >
                          {cp.name.split(':')[0]}
                        </text>
                        <text
                          x={cx + 16}
                          y={cy + 11}
                          fill="#64748B"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          [{cp.qrCodeValue || 'QR-TAG'}]
                        </text>
                      </g>
                    );
                  })}

                {/* Active Incident Pins (Solid high-contrast, NO ping) */}
                {siteIncidents.map((inc) => {
                  const cx = inc.location.x * 10;
                  const cy = inc.location.y * 6.5;
                  const isCritical = inc.severity === 'Critical';

                  return (
                    <g
                      key={inc.id}
                      className="cursor-pointer"
                      onClick={() => {
                        onSelectIncident(inc);
                        tacticalAudio.playRadioClick();
                      }}
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r="18"
                        fill={isCritical ? 'rgba(225, 29, 72, 0.2)' : 'rgba(217, 119, 6, 0.2)'}
                        stroke={isCritical ? '#E11D48' : '#737373'}
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r="14"
                        fill={isCritical ? '#E11D48' : '#737373'}
                        filter="url(#shadow-node)"
                      />
                      <text
                        x={cx}
                        y={cy + 4}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="11"
                        fontWeight="900"
                      >
                        !
                      </text>
                      <text
                        x={cx}
                        y={cy - 18}
                        textAnchor="middle"
                        fill={isCritical ? '#BE123C' : '#525252'}
                        fontSize="11"
                        fontWeight="800"
                        fontFamily="monospace"
                      >
                        {inc.severity} INCIDENT
                      </text>
                    </g>
                  );
                })}

                {/* Real-Time Guard Position Markers (Locked strictly at Last Scanned QR Checkpoint, NO ping) */}
                {filteredGuards.map((guard) => {
                  const cx = guard.location.x * 10;
                  const cy = guard.location.y * 6.5;
                  const isSelected = selectedGuard?.id === guard.id;
                  const isSOS = guard.status === 'incident_responding';

                  let ringColor = '#525252';
                  if (guard.status === 'patrolling') ringColor = '#171717';
                  if (guard.status === 'idle') ringColor = '#737373';
                  if (guard.status === 'offline') ringColor = '#64748B'; // Gray
                  if (isSOS) ringColor = '#E11D48'; // Rose/Red

                  return (
                    <g
                      key={guard.id}
                      className="cursor-pointer group"
                      onClick={() => {
                        setSelectedGuard(guard);
                        tacticalAudio.playRadioClick();
                      }}
                    >
                      {/* Crisp selection ring (solid, no ping) */}
                      {(isSelected || isSOS) && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={20}
                          fill="none"
                          stroke={ringColor}
                          strokeWidth="2"
                          strokeOpacity="0.8"
                        />
                      )}

                      {/* Outer circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 16 : 13}
                        fill="#FFFFFF"
                        stroke={ringColor}
                        strokeWidth={isSelected ? 3.5 : 2.5}
                        filter="url(#shadow-node)"
                      />

                      {/* Inner avatar / icon circle */}
                      <circle cx={cx} cy={cy} r={isSelected ? 11 : 9} fill={ringColor} fillOpacity="0.2" />

                      {/* Guard Tier / Badge Label */}
                      <text
                        x={cx}
                        y={cy + 4}
                        textAnchor="middle"
                        fill={ringColor}
                        fontSize="9"
                        fontWeight="900"
                        fontFamily="monospace"
                      >
                        {guard.tier === 'K9 Unit'
                          ? 'K9'
                          : guard.tier === 'Mobile Patrol Cruiser'
                          ? 'CR'
                          : guard.tier === 'Armed Security'
                          ? 'AR'
                          : 'ST'}
                      </text>

                      {/* Name tag & QR fix label */}
                      <text
                        x={cx}
                        y={cy + 26}
                        textAnchor="middle"
                        fill="#0F172A"
                        fontSize="11"
                        fontFamily="sans-serif"
                        fontWeight="700"
                      >
                        {guard.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Quick HUD Overlay at Bottom of Map */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 rounded-xl bg-white/95 border border-slate-200 p-2.5 backdrop-blur-md text-xs font-mono text-slate-700 shadow-md pointer-events-auto">
                <span className="flex items-center gap-1.5 font-bold text-blue-700">
                  <QrCode className="h-3.5 w-3.5 text-blue-600" />
                  <span>QR OPTICAL SCAN POSITIONING ENFORCED</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-semibold">{siteGuards.length} Officers Active</span>
                <span className="text-slate-300">|</span>
                <span className="font-semibold">{siteCheckpoints.length} QR Checkpoint Stations</span>
                <span className="text-slate-300">|</span>
                <span
                  className={
                    siteIncidents.length > 0 ? 'text-rose-700 font-bold' : 'text-slate-600 font-medium'
                  }
                >
                  {siteIncidents.length} Active Events
                </span>
              </div>

              {/* Selected Checkpoint Quick Scan Action Card */}
              {selectedCheckpoint && selectedGuard && (
                <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white border border-blue-300 p-2 text-xs font-mono text-blue-900 shadow-lg pointer-events-auto">
                  <div>
                    <div className="font-bold text-slate-900">{selectedCheckpoint.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Tag: {selectedCheckpoint.qrCodeValue || 'QR-TAG'}</div>
                  </div>
                  <button
                    onClick={() => handleScanCheckpointDirectly(selectedCheckpoint, selectedGuard)}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 px-2.5 py-1 text-[11px] font-bold transition-colors shadow-2xs"
                  >
                    <Camera className="h-3 w-3" />
                    <span>Scan for {selectedGuard.name.split(' ')[0]}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Contextual Panel (UK Authorities Directory OR Officer Inspector) */}
      <div className="w-full lg:w-96 flex flex-col gap-3 shrink-0 overflow-y-auto">
        {/* VIEW A: In Geographic Mode, show the UK Authorities, Counties, and Districts Matrix */}
        {viewScope === 'geographic' && (
          <div className="flex flex-col gap-3">
            {/* Search filter for UK locations */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                <Landmark className="h-4 w-4 text-blue-600" />
                <span>UK LOCATION & AUTHORITY DIRECTORY</span>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search county, authority, district, town..."
                  value={siteSearchQuery}
                  onChange={(e) => setSiteSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white font-mono"
                />
              </div>
            </div>

            {/* Filtered Sites Hierarchy List */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-mono font-bold text-slate-700">
                  UK SITES HIERARCHY ({filteredSites.length})
                </span>
                <span className="text-[10px] font-mono text-slate-400">Select to view</span>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredSites.map((site) => {
                  const isSelected = currentSite.id === site.id;
                  const siteGuardsCount = guards.filter((g) => g.siteId === site.id).length;

                  return (
                    <div
                      key={site.id}
                      onClick={() => handleSelectAndDrillSite(site)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{site.name}</h5>
                          <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                            <span className="font-bold text-blue-700">{site.townOrCity || site.city}</span>
                            {site.district ? ` • ${site.district}` : ''}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {site.countyOrAuthority} ({site.authorityType || 'Authority'})
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                          {site.postcode}
                        </span>
                      </div>

                      {/* Site Metrics Row */}
                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-600 border-t border-slate-200/60 pt-1.5">
                        <span>
                          Officers: <strong>{siteGuardsCount} active</strong>
                        </span>
                        <span className="text-blue-700 font-bold flex items-center gap-0.5">
                          <span>Enter Blueprint</span>
                          <ArrowRight className="h-2.5 w-2.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* UK Sovereign Constabulary Directory */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800">
                <PhoneCall className="h-3.5 w-3.5 text-blue-600" />
                <span>REGIONAL POLICE CAD / DISPATCH LINKS</span>
              </div>
              <div className="text-[10px] font-mono space-y-1.5 text-slate-600">
                <div className="py-1 border-b border-slate-100">
                  <div className="font-bold text-slate-800">Cambridgeshire Constabulary</div>
                  <div className="text-slate-500">Parkside Police Station • CAD 999 Link Active</div>
                </div>
                <div className="py-1 border-b border-slate-100">
                  <div className="font-bold text-slate-800">Thames Valley Police</div>
                  <div className="text-slate-500">High Wycombe & Amersham Divisions • Direct CAD Link</div>
                </div>
                <div className="py-1 border-b border-slate-100">
                  <div className="font-bold text-slate-800">Avon and Somerset Constabulary</div>
                  <div className="text-slate-500">Bristol Harbourside & Bath Police • Direct Relay</div>
                </div>
                <div className="py-1 border-b border-slate-100">
                  <div className="font-bold text-slate-800">Devon & Cornwall Police / Coastguard</div>
                  <div className="text-slate-500">Falmouth Maritime Command • VHF Ch 16 / CAD</div>
                </div>
                <div className="py-1">
                  <div className="font-bold text-slate-800">Cumbria & Cheshire Constabularies</div>
                  <div className="text-slate-500">Keswick, Kendal, Crewe & Chester Sectors</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: In Facility Blueprint Mode, show Guard Inspector & Checkpoint Station Details */}
        {viewScope === 'facility' && (
          <>
            {/* Selected Guard Detailed Card */}
            {selectedGuard ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedGuard.avatar}
                      alt={selectedGuard.name}
                      className="h-12 w-12 rounded-lg object-cover border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900">{selectedGuard.name}</h4>
                        <span className="rounded bg-blue-50 px-1.5 py-0.2 text-[9px] font-mono text-blue-700 border border-blue-200 font-bold">
                          {selectedGuard.badgeNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">{selectedGuard.tier}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${
                      selectedGuard.status === 'patrolling'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : selectedGuard.status === 'incident_responding'
                        ? 'bg-rose-600 text-white'
                        : selectedGuard.status === 'on_duty'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {selectedGuard.status.replace('_', ' ')}
                  </span>
                </div>

                {/* QR Scan Tracking Telemetry Card */}
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-900">
                      <QrCode className="h-4 w-4 text-blue-600" />
                      <span>Last verified QR scan</span>
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
                      {selectedGuard.lastScannedTimestamp || 'Active Fix'}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-900 truncate">
                    {selectedGuard.lastScannedCheckpointName || 'Initial Site Duty Station'}
                  </div>

                  <div className="text-[10px] text-slate-500 border-t border-blue-100 pt-1.5">
                    <span>QR Code: <strong>{selectedGuard.lastScannedQRCode || 'QR-TAG-APEX-01'}</strong></span>
                  </div>

                  {/* Instant Scan Button for this Guard */}
                  <button
                    onClick={() => {
                      tacticalAudio.playRadioClick();
                      setIsQRScannerOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-md bg-[#171717] hover:bg-black py-2 text-xs font-semibold text-white transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Scan New QR Checkpoint</span>
                  </button>
                </div>

                {/* Guard Telemetry Stats Grid */}
                <div className="grid grid-cols-3 divide-x divide-slate-200 py-1 text-center">
                  <div className="px-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5 font-medium">
                      <BatteryCharging className="h-3 w-3 text-emerald-600" />
                      <span>Battery</span>
                    </div>
                    <div className="text-xs font-bold font-mono text-emerald-700">
                      {selectedGuard.batteryLevel}%
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5 font-medium">
                      <Heart className="h-3 w-3 text-rose-600" />
                      <span>Heart</span>
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-800">
                      {selectedGuard.heartRate || 74} BPM
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5 font-medium">
                      <Wifi className="h-3 w-3 text-blue-600" />
                      <span>Signal</span>
                    </div>
                    <div className="text-xs font-bold font-mono text-blue-700">
                      {selectedGuard.signalType}
                    </div>
                  </div>
                </div>

                {/* Secondary telemetry stays available without crowding the default view. */}
                {showOperationalDetails && <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-700 mb-1 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-rose-600" />
                      <span>Body camera</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-200">
                      1080p 60FPS
                    </span>
                  </div>
                  <div className="relative h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center group shadow-2xs">
                    <img
                      src="https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=400&auto=format&fit=crop&q=80"
                      alt="Bodycam stream"
                      className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-mono text-white font-bold shadow-xs">
                      LIVE RTSP
                    </div>
                  </div>
                </div>}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      tacticalAudio.playRadioClick();
                      if (onOpenBroadcastWithGuard) onOpenBroadcastWithGuard(selectedGuard);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
                  >
                    <Radio className="h-3.5 w-3.5 text-blue-600" />
                    <span>Radio Channel</span>
                  </button>

                  <button
                    onClick={() => {
                      tacticalAudio.playDispatchAlert();
                      const updated = {
                        ...selectedGuard,
                        status:
                          selectedGuard.status === 'incident_responding'
                            ? ('patrolling' as const)
                            : ('incident_responding' as const),
                      };
                      onUpdateGuard(updated);
                      setSelectedGuard(updated);
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold shadow-2xs transition-colors ${
                      selectedGuard.status === 'incident_responding'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5 text-rose-600" />
                    <span>{selectedGuard.status === 'incident_responding' ? 'Cancel SOS' : 'Dispatch SOS'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowOperationalDetails((visible) => !visible)}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 hover:text-slate-900"
                >
                  <span>{showOperationalDetails ? 'Hide details' : 'More details'}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showOperationalDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
                No active officer selected at this facility.
              </div>
            )}

            {/* Site Emergency CAD & Dispatch Agency */}
            {showOperationalDetails && <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[11px] font-mono font-bold text-slate-800 flex items-center gap-1">
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Local dispatch</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">{currentSite.postcode}</span>
              </div>
              <div className="text-xs text-slate-800 font-semibold">
                {currentSite.localEmergencyAgency}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Emergency Contact:</span>
                <span className="font-bold text-blue-700">{currentSite.emergencyContact.phone}</span>
              </div>
            </div>}

            {/* Guard Roster for Current Site */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-mono font-bold text-slate-800">
                    Officers ({filteredGuards.length})
                  </span>
                </div>
                <div className="flex gap-1 text-[9px] font-mono">
                  {['all', 'armed', 'k9', 'mobile'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterTier(t)}
                      className={`rounded px-1.5 py-0.5 uppercase transition-colors ${
                        filterTier === t
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 overflow-y-auto max-h-56 pr-1">
                {filteredGuards.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGuard(g);
                      tacticalAudio.playRadioClick();
                    }}
                    className={`w-full flex items-center justify-between rounded-lg p-2 text-left text-xs transition-colors border ${
                      selectedGuard?.id === g.id
                        ? 'border-blue-500 bg-blue-50/70 shadow-2xs'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="relative">
                        <img src={g.avatar} alt={g.name} className="h-7 w-7 rounded-md object-cover" />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${
                            g.status === 'patrolling'
                              ? 'bg-blue-600'
                              : g.status === 'incident_responding'
                              ? 'bg-rose-600'
                              : 'bg-emerald-600'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-800 truncate text-[11px]">{g.name}</div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {g.lastScannedQRCode ? `Fix: ${g.lastScannedQRCode}` : 'Awaiting QR Scan'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">
                      {g.lastPingTime}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* QR Scanner Simulation Modal */}
      {isQRScannerOpen && (
        <QRScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          guards={guards}
          checkpoints={checkpoints}
          currentSite={currentSite}
          selectedGuard={selectedGuard || guards[0]}
          onVerifyScan={(guardId, checkpointId, notes) => {
            if (onVerifyQRScan) {
              onVerifyQRScan(guardId, checkpointId, notes);
            } else {
              const targetGuard = guards.find((g) => g.id === guardId);
              const targetCp = checkpoints.find((c) => c.id === checkpointId);
              if (targetGuard && targetCp) {
                handleScanCheckpointDirectly(targetCp, targetGuard);
              }
            }
          }}
        />
      )}
    </div>
  );
};
