export type GuardStatus = 'on_duty' | 'patrolling' | 'idle' | 'offline' | 'incident_responding';

export type GuardTier = 'Armed Security' | 'K9 Unit' | 'Static Guard' | 'Mobile Patrol Cruiser' | 'Executive Protection';

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved' | 'Escalated';

export type CheckpointType = 'QR Code Scan';

export type CheckpointStatus = 'Completed' | 'Pending' | 'Delayed' | 'Missed';

export interface GuardLocation {
  lat: number;
  lng: number;
  x: number; // percentage in tactical map (0-100)
  y: number; // percentage in tactical map (0-100)
  heading?: number;
  speedKmh?: number;
}

export interface QRScanRecord {
  id: string;
  checkpointId: string;
  checkpointName: string;
  qrCode: string;
  timestamp: string;
  zoneName?: string;
  dwellSecondsSpent?: number;
  photoVerified?: boolean;
}

export interface Guard {
  id: string;
  name: string;
  badgeNumber: string;
  avatar: string;
  phone: string;
  email: string;
  tier: GuardTier;
  status: GuardStatus;
  siteId: string;
  siteName: string;
  batteryLevel: number;
  signalStrength: number; // 0 - 100%
  signalType: '5G' | '4G LTE' | 'Radio Mesh' | 'Weak';
  bodycamActive: boolean;
  bodycamStreamUrl?: string;
  location: GuardLocation;
  lastPingTime: string;
  lastScannedQRCode?: string;
  lastScannedCheckpointId?: string;
  lastScannedCheckpointName?: string;
  lastScannedTimestamp?: string;
  scanHistory?: QRScanRecord[];
  currentTourId?: string;
  currentCheckpointIndex?: number;
  heartRate?: number;
  assignedWeapon?: string;
  partnerK9?: string;
  breadcrumbs: { x: number; y: number; time: string; qrCode?: string; checkpointName?: string }[];
}

export interface GeofenceZone {
  id: string;
  name: string;
  siteId: string;
  color: string;
  points: { x: number; y: number }[]; // SVG polygon percentage coordinates
  accessLevel: 'Public' | 'Restricted' | 'High Security' | 'VIP Vault';
  description: string;
}

export interface SiteWeather {
  condition: string;
  tempC: number;
  tempF: number;
  icon: string;
  threatAlert?: string;
}

export interface Site {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country?: string;
  region: string;
  countyOrAuthority?: string;
  authorityType?: 'Metropolitan Municipality' | 'District Municipality' | 'Local Municipality' | 'Unitary Authority' | 'County' | 'District' | 'City' | 'Metropolitan Borough';
  district?: string;
  townOrCity?: string;
  locationCategory?: 'City' | 'Town' | 'Village' | 'Urban Area' | 'Unitary Authority' | 'Industrial Zone' | 'Port Terminal';
  postcode?: string;
  timezone: string;
  timezoneOffset: string;
  distanceKmFromHQ: number;
  networkLatencyMs: number;
  localEmergencyAgency: string;
  type: 'Corporate HQ' | 'Data Center' | 'Logistics Hub' | 'Luxury Residential' | 'Financial Tower' | 'Biotech Campus' | 'Port Facility' | 'Research Park' | 'Heritage Estate' | 'Industrial Estate';
  activeGuardsCount: number;
  totalCheckpoints: number;
  zones: GeofenceZone[];
  mapCenter: { lat: number; lng: number };
  geoMapPos?: { x: number; y: number }; // Relative coordinates on national/global GIS map (0-100%)
  weather?: SiteWeather;
  emergencyContact: {
    name: string;
    role: string;
    phone: string;
  };
}

export interface Checkpoint {
  id: string;
  name: string;
  siteId: string;
  location: { x: number; y: number };
  type: CheckpointType;
  requiredAction: string;
  minDwellSeconds: number;
  targetWindowMinutes: number;
  isHighSecurity: boolean;
  qrCodeValue?: string;
}

export interface TourCheckpointProgress {
  checkpointId: string;
  checkpointName: string;
  scheduledTime: string;
  completedTime?: string;
  status: CheckpointStatus;
  verificationType?: CheckpointType;
  notes?: string;
  photoUrl?: string;
  dwellSecondsSpent?: number;
}

export interface PatrolTour {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  guardId: string;
  guardName: string;
  tier: GuardTier;
  startTime: string;
  estimatedEndTime: string;
  actualEndTime?: string;
  status: 'In Progress' | 'Completed' | 'Violated' | 'Scheduled';
  complianceRate: number; // 0-100%
  checkpoints: TourCheckpointProgress[];
  routeCoordinates: { x: number; y: number }[];
}

export interface IncidentEvidence {
  id: string;
  type: 'photo' | 'audio' | 'video' | 'sensor_log';
  url: string;
  caption: string;
  timestamp: string;
  recordedBy: string;
  fileSize?: string;
  audioDurationSeconds?: number;
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  type: 'creation' | 'dispatch' | 'escalation' | 'update' | 'resolution';
}

export interface Incident {
  id: string;
  incidentNumber: string;
  title: string;
  type: 'Trespassing' | 'Unauthorized Access' | 'Perimeter Breach' | 'Tampering / Vandalism' | 'Unlocked Fire Door' | 'Medical Emergency' | 'SOS Panic Alarm' | 'Equipment Failure';
  severity: IncidentSeverity;
  status: IncidentStatus;
  siteId: string;
  siteName: string;
  zoneName: string;
  location: { x: number; y: number; lat?: number; lng?: number };
  reportedByGuardId: string;
  reportedByGuardName: string;
  assignedResponderId?: string;
  assignedResponderName?: string;
  timestamp: string;
  resolvedAt?: string;
  description: string;
  evidence: IncidentEvidence[];
  timeline: IncidentTimelineEvent[];
  supervisorSignOff?: {
    supervisorName: string;
    signedAt: string;
    notes: string;
    signatureDigital: string;
  };
  policeNotified: boolean;
  policeCadNumber?: string;
}

export interface ShiftSchedule {
  id: string;
  guardId: string;
  guardName: string;
  guardBadge: string;
  guardTier: GuardTier;
  siteId: string;
  siteName: string;
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "06:00"
  endTime: string; // e.g. "14:00"
  shiftType: 'Day Shift' | 'Evening Shift' | 'Graveyard / Night' | 'On-Call Patrol';
  status: 'Scheduled' | 'Clocked In' | 'Completed' | 'Missed' | 'Replaced';
  hourlyRate: number;
}

export interface AttendanceRecord {
  id: string;
  guardId: string;
  guardName: string;
  badgeNumber: string;
  siteId: string;
  siteName: string;
  date: string;
  scheduledIn: string;
  actualIn: string;
  scheduledOut: string;
  actualOut?: string;
  geofenceStatus: 'Verified Inside' | 'Out of Bounds Warning' | 'Manual Override';
  geofenceDistanceMeters: number;
  totalHours: number;
  overtimeHours: number;
  selfieVerificationUrl: string;
  status: 'Approved' | 'Flagged' | 'Pending Review';
}

export type UserRole = 'SUPERADMIN' | 'TENANT_ADMIN' | 'DISPATCHER' | 'GUARD' | 'SUPERVISOR';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  tenantId?: string;
  tenantName?: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  temporaryPassword?: string;
  assignedSitesCount?: number;
  assignedSiteId?: string;
  assignedSiteName?: string;
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  industry: string;
  plan: 'Standard Security' | 'Enterprise Guard Suite' | 'Critical Infrastructure SLA';
  sitesCount: number;
  guardsCount: number;
  contactEmail: string;
  contactPhone: string;
  monthlySpend: number;
  countryCode?: string;
  currencyCode?: string;
  locale?: string;
  logo: string;
  color: string;
  status?: 'ACTIVE' | 'ONBOARDING' | 'SUSPENDED';
  createdAt?: string;
  primaryAdminId?: string;
  primaryAdminName?: string;
  primaryAdminEmail?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface BroadcastMessage {
  id: string;
  tenantId?: string;
  sender: string;
  senderRole: string;
  timestamp: string;
  targetScope: 'all_sites' | 'single_site' | 'individual_guard';
  targetSiteId?: string;
  targetSiteName?: string;
  targetGuardId?: string;
  targetGuardName?: string;
  priority: 'Routine' | 'Urgent' | 'Emergency Priority';
  subject: string;
  message: string;
  deliveredCount: number;
  acknowledgedCount: number;
}

export interface SystemNotification {
  id: string;
  tenantId?: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'sos' | 'incident' | 'compliance' | 'system' | 'shift';
  read: boolean;
  linkTab?: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  actorUserId?: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  siteId?: string;
  details: Record<string, unknown>;
  occurredAt: string;
}
