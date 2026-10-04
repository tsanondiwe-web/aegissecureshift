import React, { useState, useEffect } from 'react';
import {
  INITIAL_TENANTS,
  INITIAL_SITES,
  INITIAL_CHECKPOINTS,
  INITIAL_GUARDS,
  INITIAL_TOURS,
  INITIAL_INCIDENTS,
  INITIAL_SHIFTS,
  INITIAL_ATTENDANCE,
  INITIAL_INVOICES,
  INITIAL_BROADCASTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS
} from './mockData';
import {
  Tenant,
  Site,
  Guard,
  Checkpoint,
  PatrolTour,
  Incident,
  ShiftSchedule,
  AttendanceRecord,
  Invoice,
  BroadcastMessage,
  SystemNotification,
  UserAccount,
  AuditEvent,
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SOSAlarmHUD } from './components/SOSAlarmHUD';
import { BroadcastModal } from './components/BroadcastModal';
import { NewIncidentModal } from './components/NewIncidentModal';
import { LiveMapCommandCenter } from './components/LiveMapCommandCenter';
import { TourManagement } from './components/TourManagement';
import { IncidentForensics } from './components/IncidentForensics';
import { ShiftScheduler } from './components/ShiftScheduler';
import { ClientBillingPortal } from './components/ClientBillingPortal';
import { ReportsAnalytics } from './components/ReportsAnalytics';
import { SuperadminTenantManager } from './components/SuperadminTenantManager';
import { NewTenantModal } from './components/NewTenantModal';
import { NewTenantAdminModal } from './components/NewTenantAdminModal';
import { AuthGate } from './components/AuthGate';
import { AuditTrail } from './components/AuditTrail';
import { TenantEmptyState } from './components/TenantEmptyState';
import { RegionalSettingsValue } from './components/RegionalSettingsModal';
import { tacticalAudio } from './utils/audio';
import {
  isFirebaseConfigured,
  subscribeToFirebaseGuards,
  subscribeToFirebaseSites,
  subscribeToFirebaseIncidents,
  subscribeToFirebaseCheckpoints,
  subscribeToFirebaseShifts,
  subscribeToFirebaseTours,
  subscribeToFirebaseAttendance,
  subscribeToFirebaseAuditEvents,
  createFirebaseBroadcast,
  logFirebaseQRScan,
  createFirebaseTenant,
  createFirebaseTenantAdmin,
  getAuthenticatedUserAccount,
  getAccessibleTenants,
  getFirebaseUser,
  signOutOfFirebase,
  subscribeToFirebaseAuth,
  approveFirebaseAttendance,
  deleteFirebaseShift,
  persistFirebaseAttendance,
  persistFirebaseCheckpoint,
  persistFirebaseIncident,
  persistFirebaseShift,
  persistFirebaseTour,
  recordFirebaseAuditEvent,
  updateFirebaseTenantRegionalSettings,
} from './lib/firebase';

const EMPTY_TENANT: Tenant = {
  id: '__no_tenant__',
  name: 'No tenant created yet',
  code: 'NEW',
  industry: '',
  plan: 'Standard Security',
  sitesCount: 0,
  guardsCount: 0,
  contactEmail: '',
  contactPhone: '',
  monthlySpend: 0,
  countryCode: 'ZA',
  currencyCode: 'ZAR',
  locale: 'en-ZA',
  logo: '🏢',
  color: '#171717',
  status: 'ONBOARDING',
};

// One compact local example keeps the product explorable without restoring the
// larger demo portfolio. Live Firebase environments still load their own data.
const EXAMPLE_SITE_SOURCE = INITIAL_SITES[0];
const EXAMPLE_SITE_ID = EXAMPLE_SITE_SOURCE.id;
const EXAMPLE_TENANT_ID = INITIAL_TENANTS[0].id;
const EXAMPLE_GUARDS = INITIAL_GUARDS.filter((guard) => guard.siteId === EXAMPLE_SITE_ID);
const EXAMPLE_CHECKPOINTS = INITIAL_CHECKPOINTS.filter(
  (checkpoint) => checkpoint.siteId === EXAMPLE_SITE_ID
);
const EXAMPLE_SITE: Site = {
  ...EXAMPLE_SITE_SOURCE,
  activeGuardsCount: EXAMPLE_GUARDS.length,
  totalCheckpoints: EXAMPLE_CHECKPOINTS.length,
};
const EXAMPLE_TENANT: Tenant = {
  ...INITIAL_TENANTS[0],
  sitesCount: 1,
  guardsCount: EXAMPLE_GUARDS.length,
};
const EXAMPLE_USERS = INITIAL_USERS.filter(
  (user) => user.role === 'SUPERADMIN' || user.tenantId === EXAMPLE_TENANT_ID
);

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<string>('live_map');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Domain Entities State
  const [tenants, setTenants] = useState<Tenant[]>(isFirebaseConfigured ? [] : [EXAMPLE_TENANT]);
  const [currentTenant, setCurrentTenant] = useState<Tenant>(isFirebaseConfigured ? EMPTY_TENANT : EXAMPLE_TENANT);

  // Users & Multi-Tenant RBAC State
  const [users, setUsers] = useState<UserAccount[]>(isFirebaseConfigured ? [] : EXAMPLE_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount>(INITIAL_USERS[0]);

  const [sites, setSites] = useState<Site[]>(isFirebaseConfigured ? [] : [EXAMPLE_SITE]);
  const [currentSite, setCurrentSite] = useState<Site>(EXAMPLE_SITE);

  const [guards, setGuards] = useState<Guard[]>(isFirebaseConfigured ? [] : EXAMPLE_GUARDS);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(
    isFirebaseConfigured ? [] : EXAMPLE_CHECKPOINTS
  );
  const [tours, setTours] = useState<PatrolTour[]>(
    isFirebaseConfigured ? [] : INITIAL_TOURS.filter((tour) => tour.siteId === EXAMPLE_SITE_ID)
  );
  const [incidents, setIncidents] = useState<Incident[]>(
    isFirebaseConfigured ? [] : INITIAL_INCIDENTS.filter((incident) => incident.siteId === EXAMPLE_SITE_ID)
  );
  const [shifts, setShifts] = useState<ShiftSchedule[]>(
    isFirebaseConfigured ? [] : INITIAL_SHIFTS.filter((shift) => shift.siteId === EXAMPLE_SITE_ID)
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    isFirebaseConfigured ? [] : INITIAL_ATTENDANCE.filter((record) => record.siteId === EXAMPLE_SITE_ID)
  );
  const [invoices] = useState<Invoice[]>(
    isFirebaseConfigured ? [] : INITIAL_INVOICES.filter((invoice) => invoice.tenantId === EXAMPLE_TENANT_ID)
  );
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>(
    isFirebaseConfigured ? [] : INITIAL_BROADCASTS.filter((broadcast) => broadcast.tenantId === EXAMPLE_TENANT_ID)
  );
  const [notifications, setNotifications] = useState<SystemNotification[]>(
    isFirebaseConfigured ? [] : INITIAL_NOTIFICATIONS.filter((notification) => notification.tenantId === EXAMPLE_TENANT_ID)
  );
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  // Modals & Real-time Flags
  const [isBroadcastOpen, setIsBroadcastOpen] = useState<boolean>(false);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState<boolean>(false);
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState<boolean>(false);
  const [isNewAdminModalOpen, setIsNewAdminModalOpen] = useState<boolean>(false);
  const [selectedTenantForNewAdmin, setSelectedTenantForNewAdmin] = useState<Tenant | undefined>(undefined);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [firebaseLive, setFirebaseLive] = useState<boolean>(isFirebaseConfigured);
  const [authLoading, setAuthLoading] = useState<boolean>(isFirebaseConfigured);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!isFirebaseConfigured);
  const [authError, setAuthError] = useState<string>('');

  // Firebase Auth is mandatory whenever a live backend is configured. The mock
  // superadmin remains available only in the explicit local/demo fallback.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let disposed = false;

    const applySession = async (session: Awaited<ReturnType<typeof getFirebaseUser>>) => {
      if (disposed) return;
      if (!session) {
        setIsAuthenticated(false);
        setAuthLoading(false);
        return;
      }

      try {
        const account = await getAuthenticatedUserAccount(session);
        if (disposed) return;
        if (!account) {
          setIsAuthenticated(false);
          setAuthError('Your login is valid, but no active AegisOps access profile is assigned.');
          await signOutOfFirebase();
          return;
        }
        if (account.role === 'GUARD') {
          setIsAuthenticated(false);
          setAuthError('Guard accounts must use the AegisOps mobile application; command-centre access is not permitted.');
          await signOutOfFirebase();
          return;
        }

        const accessibleTenants = await getAccessibleTenants();
        if (disposed) return;
        setCurrentUser(account);
        setTenants(accessibleTenants);
        const assignedTenant = account.tenantId
          ? accessibleTenants.find((tenant) => tenant.id === account.tenantId)
          : accessibleTenants[0];
        if (!assignedTenant && account.role === 'SUPERADMIN' && accessibleTenants.length === 0) {
          setCurrentTenant(EMPTY_TENANT);
          setAuthError('');
          setIsAuthenticated(true);
          return;
        }
        if (!assignedTenant) {
          setIsAuthenticated(false);
          setAuthError('Your account has no accessible tenant organization.');
          return;
        }
        setCurrentTenant(assignedTenant);
        setAuthError('');
        setIsAuthenticated(true);
      } catch (error) {
        if (!disposed) {
          setIsAuthenticated(false);
          setAuthError(error instanceof Error ? error.message : 'Unable to load the authenticated access profile.');
        }
      } finally {
        if (!disposed) setAuthLoading(false);
      }
    };

    getFirebaseUser().then(applySession).catch((error) => {
      if (!disposed) {
        setAuthError(error instanceof Error ? error.message : 'Unable to verify the current session.');
        setAuthLoading(false);
      }
    });
    const unsubscribe = subscribeToFirebaseAuth(applySession);
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  // Real-time Firestore subscriptions for mobile synchronization.
  useEffect(() => {
    if (!isFirebaseConfigured || !isAuthenticated) return;

    setFirebaseLive(true);
    const tenantScope = currentUser.role === 'SUPERADMIN' ? undefined : currentUser.tenantId;

    const unsubSites = subscribeToFirebaseSites((liveSites) => {
      setSites(liveSites);
      const selected = liveSites.find((site) => site.tenantId === currentTenant.id);
      if (selected) setCurrentSite(selected);
    }, tenantScope);
    const unsubGuards = subscribeToFirebaseGuards(setGuards, tenantScope);

    const unsubIncidents = subscribeToFirebaseIncidents((liveIncidents) => {
      setIncidents(liveIncidents);
    }, tenantScope);

    const unsubCheckpoints = subscribeToFirebaseCheckpoints((liveCheckpoints) => {
      setCheckpoints(liveCheckpoints);
    }, tenantScope);

    const unsubShifts = subscribeToFirebaseShifts((liveShifts) => {
      setShifts(liveShifts);
    }, tenantScope);

    const unsubTours = subscribeToFirebaseTours((liveTours) => {
      setTours(liveTours);
    }, tenantScope);

    const unsubAttendance = subscribeToFirebaseAttendance((liveAttendance) => {
      setAttendance(liveAttendance);
    }, tenantScope);

    const unsubAuditEvents = subscribeToFirebaseAuditEvents(setAuditEvents, tenantScope);

    return () => {
      unsubSites();
      unsubGuards();
      unsubIncidents();
      unsubCheckpoints();
      unsubShifts();
      unsubTours();
      unsubAttendance();
      unsubAuditEvents();
    };
  }, [currentTenant.id, currentUser.id, currentUser.role, currentUser.tenantId, isAuthenticated]);

  // Active Critical SOS Incident
  const activeSOSIncident =
    incidents.find(
      (incident) =>
        sites.some((site) => site.id === incident.siteId && site.tenantId === currentTenant.id) &&
        incident.severity === 'Critical' &&
        incident.status !== 'Resolved'
    ) || null;

  // Sync current site when switching tenant
  const handleSelectTenant = (tenant: Tenant) => {
    if (isFirebaseConfigured && currentUser.role !== 'SUPERADMIN' && tenant.id !== currentUser.tenantId) {
      return;
    }
    setCurrentTenant(tenant);
    const tenantSites = sites.filter((s) => s.tenantId === tenant.id);
    if (tenantSites.length > 0) {
      setCurrentSite(tenantSites[0]);
    }
  };

  const notifyPersistenceFailure = (operation: string, error?: unknown) => {
    const message = error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String(error.message)
        : 'The live database rejected the operation.';
    setNotifications((prev) => [{
      id: `notif-db-${Date.now()}`,
      tenantId: currentTenant.id,
      timestamp: 'Just now',
      title: `Database action failed: ${operation}`,
      message,
      type: 'system',
      read: false,
    }, ...prev]);
  };

  const writeAudit = (
    action: string,
    entityType: string,
    entityId: string,
    siteId?: string,
    details?: Record<string, unknown>
  ) => {
    setAuditEvents((prev) => [{
      id: `audit-local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      tenantId: currentTenant.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      entityType,
      entityId,
      siteId,
      details: details || {},
      occurredAt: new Date().toISOString(),
    }, ...prev]);
    void recordFirebaseAuditEvent({
      tenantId: currentTenant.id,
      actor: currentUser,
      action,
      entityType,
      entityId,
      siteId,
      details,
    }).then((result) => {
      if (!result.success) notifyPersistenceFailure('write audit event', result.error);
    });
  };

  // SOS Emergency Actions
  const handleDispatchBackup = (incidentId: string, responderGuardId: string) => {
    const responder = guards.find((g) => g.id === responderGuardId);
    const incident = incidents.find((item) => item.id === incidentId);
    if (!responder || !incident) return;

    setGuards((prev) =>
      prev.map((g) =>
        g.id === responderGuardId ? { ...g, status: 'incident_responding' as const } : g
      )
    );

    const updatedIncident: Incident = {
          ...incident,
          assignedResponderId: responder.id,
          assignedResponderName: responder.name,
          timeline: [
            ...incident.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              actor: 'Central Dispatch Command',
              action: 'Backup Unit Dispatched Code-3',
              details: `Assigned ${responder.name} (${responder.tier}) to immediate response.`,
              type: 'dispatch',
            },
          ],
        };
    setIncidents((prev) => prev.map((item) => item.id === incidentId ? updatedIncident : item));
    void persistFirebaseIncident(updatedIncident, currentTenant.id).then((result) => {
      if (!result.success) notifyPersistenceFailure('dispatch backup', result.error);
    });
    writeAudit('BACKUP_DISPATCHED', 'incident', incidentId, incident.siteId, {
      responderGuardId,
      responderName: responder.name,
    });

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        tenantId: currentTenant.id,
        timestamp: 'Just now',
        title: '🚓 Backup Dispatched',
        message: `${responder.name} en route to Code Red distress coordinates.`,
        type: 'sos',
        read: false,
        linkTab: 'live_map',
      },
      ...prev,
    ]);
  };

  const handleTriggerLockdown = (siteId: string) => {
    tacticalAudio.playDispatchAlert();
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        tenantId: currentTenant.id,
        timestamp: 'Just now',
        title: '🔒 Facility Zone Lockdown Initiated',
        message: `Magnetic access barriers and turnstiles locked down at ${currentSite.name}.`,
        type: 'system',
        read: false,
        linkTab: 'live_map',
      },
      ...prev,
    ]);
    writeAudit('SITE_LOCKDOWN_TRIGGERED', 'site', siteId, siteId);
  };

  const handleNotifyPoliceCAD = (incidentId: string) => {
    const incident = incidents.find((item) => item.id === incidentId);
    if (!incident) return;
    const cadNum = `CAD-${Math.floor(10000 + Math.random() * 90000)}-A`;
    const updatedIncident: Incident = {
          ...incident,
          policeNotified: true,
          policeCadNumber: cadNum,
          timeline: [
            ...incident.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              actor: 'AegisOps CAD Relay',
              action: 'Emergency Police CAD Transmission Confirmed',
              details: `Sent high-priority telemetry payload to SFPD Dispatch (${cadNum}).`,
              type: 'escalation',
            },
          ],
        };
    setIncidents((prev) => prev.map((item) => item.id === incidentId ? updatedIncident : item));
    void persistFirebaseIncident(updatedIncident, currentTenant.id).then((result) => {
      if (!result.success) notifyPersistenceFailure('notify police CAD', result.error);
    });
    writeAudit('POLICE_CAD_NOTIFIED', 'incident', incidentId, incident.siteId, { cadNumber: cadNum });
  };

  const handleResolveSOS = (incidentId: string) => {
    const incident = incidents.find((item) => item.id === incidentId);
    if (!incident) return;
    const updatedIncident: Incident = {
          ...incident,
          status: 'Resolved',
          resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeline: [
            ...incident.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              actor: 'Command Dispatcher',
              action: 'SOS Panic Alarm Resolved & All Clear Declared',
              details: 'Distress situation neutralised, guard safety confirmed.',
              type: 'resolution',
            },
          ],
        };
    setIncidents((prev) => prev.map((item) => item.id === incidentId ? updatedIncident : item));
    void persistFirebaseIncident(updatedIncident, currentTenant.id).then((result) => {
      if (!result.success) notifyPersistenceFailure('resolve SOS', result.error);
    });
    writeAudit('SOS_RESOLVED', 'incident', incidentId, incident.siteId);

    setGuards((prev) =>
      prev.map((g) =>
        g.status === 'incident_responding' ? { ...g, status: 'patrolling' as const } : g
      )
    );
  };

  const handleTriggerSOSDrill = () => {
    const tenantSites = sites.filter((site) => site.tenantId === currentTenant.id);
    const tenantSiteIds = new Set(tenantSites.map((site) => site.id));
    const tenantGuard = guards.find((guard) => tenantSiteIds.has(guard.siteId));
    const drillSite = tenantSites.find((site) => site.id === currentSite.id) || tenantSites[0];
    if (!drillSite || !tenantGuard) {
      setActiveTab('live_map');
      return;
    }
    if (activeSOSIncident) {
      handleResolveSOS(activeSOSIncident.id);
    } else {
      const newSOS: Incident = {
        id: `inc-${Date.now()}`,
        incidentNumber: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: '🚨 SIMULATED SOS PANIC: Officer Duress Alarm Triggered at Vault B2',
        type: 'SOS Panic Alarm',
        severity: 'Critical',
        status: 'Open',
        siteId: drillSite.id,
        siteName: drillSite.name,
        zoneName: drillSite.zones[0]?.name || 'Unassigned Zone',
        location: { x: 30, y: 70, lat: drillSite.mapCenter.lat, lng: drillSite.mapCenter.lng },
        reportedByGuardId: tenantGuard.id,
        reportedByGuardName: tenantGuard.name,
        timestamp: 'Just now',
        description: 'Simulated duress test drill triggered from bodycam emergency button.',
        policeNotified: false,
        evidence: [],
        timeline: [
          {
            id: `tl-1`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actor: tenantGuard.name,
            action: 'Triggered Emergency Duress Alarm',
            details: 'SOS button activated on Axon Body 4.',
            type: 'creation',
          },
        ],
      };
      setIncidents((prev) => [newSOS, ...prev]);
      void persistFirebaseIncident(newSOS, currentTenant.id).then((result) => {
        if (!result.success) notifyPersistenceFailure('create SOS drill incident', result.error);
      });
      writeAudit('SOS_DRILL_TRIGGERED', 'incident', newSOS.id, newSOS.siteId);
    }
  };

  // Broadcast Message Dispatcher
  const handleSendBroadcast = async (
    newBc: Omit<BroadcastMessage, 'id' | 'timestamp' | 'deliveredCount' | 'acknowledgedCount'>
  ) => {
    const bc: BroadcastMessage = {
      ...newBc,
      id: `bc-${Date.now()}`,
      tenantId: currentTenant.id,
      timestamp: 'Just now',
      deliveredCount: newBc.targetScope === 'all_sites' ? 28 : 8,
      acknowledgedCount: newBc.targetScope === 'all_sites' ? 26 : 8,
    };

    // Bi-directional write to Firestore.
    const persisted = await createFirebaseBroadcast(bc, currentTenant.id);
    if (!persisted.success) {
      notifyPersistenceFailure('send broadcast', persisted.error);
      return;
    }

    setBroadcasts((prev) => [bc, ...prev]);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        tenantId: currentTenant.id,
        timestamp: 'Just now',
        title: `📢 Push Broadcast Sent (${bc.priority})`,
        message: `"${bc.subject}" transmitted to field radios & mobile apps.`,
        type: 'system',
        read: false,
      },
      ...prev,
    ]);
    writeAudit('BROADCAST_SENT', 'broadcast', bc.id, bc.targetSiteId, {
      priority: bc.priority,
      scope: bc.targetScope,
      subject: bc.subject,
    });
  };

  // Incident creation handler
  const handleCreateIncident = async (
    newInc: Omit<Incident, 'id' | 'incidentNumber' | 'timeline' | 'evidence'>
  ) => {
    const inc: Incident = {
      ...newInc,
      id: `inc-${Date.now()}`,
      incidentNumber: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      evidence: [
        {
          id: `ev-${Date.now()}`,
          type: 'photo',
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=600&auto=format&fit=crop&q=80',
          caption: 'Initial physical evidence photo logged by reporting officer.',
          timestamp: 'Just now',
          recordedBy: newInc.reportedByGuardName,
          fileSize: '3.1 MB',
        },
      ],
      timeline: [
        {
          id: `tl-1`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: newInc.reportedByGuardName,
          action: `Incident Logged (${newInc.type})`,
          details: newInc.description,
          type: 'creation',
        },
      ],
    };

    const persisted = await persistFirebaseIncident(inc, currentTenant.id);
    if (!persisted.success) {
      notifyPersistenceFailure('create incident', persisted.error);
      return;
    }
    setIncidents((prev) => [inc, ...prev]);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        tenantId: currentTenant.id,
        timestamp: 'Just now',
        title: `New Incident: ${inc.title}`,
        message: `${inc.reportedByGuardName} filed ${inc.severity} report at ${inc.siteName}.`,
        type: 'incident',
        read: false,
        linkTab: 'incidents',
      },
      ...prev,
    ]);
    writeAudit('INCIDENT_CREATED', 'incident', inc.id, inc.siteId, {
      severity: inc.severity,
      type: inc.type,
    });
  };

  const handleUpdateIncident = async (incident: Incident) => {
    const persisted = await persistFirebaseIncident(incident, currentTenant.id);
    if (!persisted.success) {
      notifyPersistenceFailure('update incident', persisted.error);
      return;
    }
    setIncidents((prev) => prev.map((item) => item.id === incident.id ? incident : item));
    writeAudit('INCIDENT_UPDATED', 'incident', incident.id, incident.siteId, {
      status: incident.status,
      supervisorSigned: Boolean(incident.supervisorSignOff),
    });
  };

  // Guard Update
  const handleUpdateGuard = (updated: Guard) => {
    setGuards((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  // QR Scan Verification & Optical Tracking Event Handler
  // Enforces that guards only move and establish tracking fixes when a physical QR code is scanned
  const handleVerifyQRScan = (guardId: string, checkpointId: string, customNotes?: string) => {
    const cp = checkpoints.find((c) => c.id === checkpointId);
    const guard = guards.find((g) => g.id === guardId);
    if (!cp || !guard) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const qrCode = cp.qrCodeValue || `QR-${cp.id.toUpperCase()}`;

    // Bi-directional write to Firestore.
    void logFirebaseQRScan(guardId, checkpointId, qrCode, cp.name).then((result) => {
      if (!result.success) notifyPersistenceFailure('verify QR checkpoint', result.error);
    });
    writeAudit('QR_CHECKPOINT_VERIFIED', 'checkpoint', checkpointId, guard.siteId, {
      guardId,
      qrCode,
    });

    const newScanRecord = {
      id: `scan-${Date.now()}`,
      checkpointId: cp.id,
      checkpointName: cp.name,
      qrCode,
      timestamp,
      verified: true,
      notes: customNotes,
    };

    const newBreadcrumb = {
      x: cp.location.x,
      y: cp.location.y,
      time: timestamp,
      qrCode,
      checkpointName: cp.name,
    };

    // Update Guard Position & Optical QR Telemetry
    setGuards((prev) =>
      prev.map((g) => {
        if (g.id !== guardId) return g;
        return {
          ...g,
          location: {
            ...g.location,
            x: cp.location.x,
            y: cp.location.y,
            speedKmh: 0,
          },
          lastPingTime: 'Just now',
          lastScannedQRCode: qrCode,
          lastScannedCheckpointId: cp.id,
          lastScannedCheckpointName: cp.name,
          lastScannedTimestamp: timestamp,
          breadcrumbs: [...(g.breadcrumbs || []).slice(-7), newBreadcrumb],
          scanHistory: [newScanRecord, ...(g.scanHistory || []).slice(0, 15)],
        };
      })
    );

    // Update any Active Tour Checkpoints if applicable
    setTours((prev) =>
      prev.map((tour) => {
        if (tour.guardId !== guardId) return tour;
        const updatedCps = tour.checkpoints.map((tcp) => {
          if (tcp.checkpointId === checkpointId && tcp.status !== 'Completed') {
            return {
              ...tcp,
              status: 'Completed' as const,
              completedTime: timestamp,
              notes: `Verified QR code ${qrCode}`,
            };
          }
          return tcp;
        });

        const completedCount = updatedCps.filter((c) => c.status === 'Completed').length;
        const compRate = Math.round((completedCount / (updatedCps.length || 1)) * 100);

        return {
          ...tour,
          checkpoints: updatedCps,
          complianceRate: compRate,
        };
      })
    );
  };

  // Tour Update & Create
  const handleUpdateTour = async (updated: PatrolTour) => {
    const persisted = await persistFirebaseTour(updated, currentTenant.id);
    if (!persisted.success) {
      notifyPersistenceFailure('update patrol tour', persisted.error);
      return;
    }
    setTours((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    writeAudit('PATROL_TOUR_UPDATED', 'patrol_tour', updated.id, updated.siteId, {
      status: updated.status,
      complianceRate: updated.complianceRate,
    });
  };

  const handleCreateTour = async (tour: Omit<PatrolTour, 'id'>) => {
    const newT: PatrolTour = {
      ...tour,
      id: `tour-${Date.now()}`,
    };
    const persisted = await persistFirebaseTour(newT, currentTenant.id);
    if (!persisted.success) {
      notifyPersistenceFailure('create patrol tour', persisted.error);
      return;
    }
    setTours((prev) => [newT, ...prev]);
    writeAudit('PATROL_TOUR_CREATED', 'patrol_tour', newT.id, newT.siteId);
  };

  // Checkpoint Create
  const handleCreateCheckpoint = async (cp: Omit<Checkpoint, 'id'>) => {
    const newCp: Checkpoint = {
      ...cp,
      id: `cp-${Date.now()}`,
    };
    const persisted = await persistFirebaseCheckpoint(newCp, currentTenant.id);
    if (!persisted.success) {
      notifyPersistenceFailure('create checkpoint', persisted.error);
      return;
    }
    setCheckpoints((prev) => [newCp, ...prev]);
    writeAudit('CHECKPOINT_CREATED', 'checkpoint', newCp.id, newCp.siteId, { type: newCp.type });
  };

  // Shift & Attendance Handlers
  const handleAddShift = async (shift: Omit<ShiftSchedule, 'id'>) => {
    const newSh: ShiftSchedule = {
      ...shift,
      id: `sh-${Date.now()}`,
    };
    const persisted = await persistFirebaseShift(newSh, currentTenant.id);
    if (!persisted.success) {
      notifyPersistenceFailure('create shift', persisted.error);
      return;
    }
    setShifts((prev) => [...prev, newSh]);
    writeAudit('SHIFT_CREATED', 'shift', newSh.id, newSh.siteId, { guardId: newSh.guardId });
  };

  const handleDeleteShift = async (shiftId: string) => {
    const shift = shifts.find((item) => item.id === shiftId);
    const persisted = await deleteFirebaseShift(shiftId);
    if (!persisted.success) {
      notifyPersistenceFailure('delete shift', persisted.error);
      return;
    }
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    writeAudit('SHIFT_DELETED', 'shift', shiftId, shift?.siteId);
  };

  const handleApproveAttendance = async (attId: string) => {
    const existing = attendance.find((record) => record.id === attId);
    if (!existing) return;
    const updated = { ...existing, status: 'Approved' as const };
    const saved = await persistFirebaseAttendance(updated, currentTenant.id);
    if (!saved.success) {
      notifyPersistenceFailure('save attendance record', saved.error);
      return;
    }
    const approved = await approveFirebaseAttendance(attId);
    if (!approved.success) {
      notifyPersistenceFailure('approve attendance', approved.error);
      return;
    }
    setAttendance((prev) => prev.map((record) => record.id === attId ? updated : record));
    writeAudit('ATTENDANCE_APPROVED', 'attendance', attId, existing.siteId, { guardId: existing.guardId });
  };

  // ----------------------------------------------------
  // Superadmin Tenant & Tenant Admin Handlers
  // ----------------------------------------------------
  const handleAddTenant = (
    newTenant: Tenant,
    newAdmin: UserAccount,
    primarySitePartial?: Partial<Site>
  ) => {
    // 1. Add Tenant
    setTenants((prev) => [newTenant, ...prev]);

    // 2. Add Tenant Admin User
    setUsers((prev) => [...prev, newAdmin]);

    // 3. Add Primary Operating Facility / Site if configured
    if (primarySitePartial) {
      const fullSite: Site = {
        id: primarySitePartial.id || `site-${newTenant.id}-1`,
        tenantId: newTenant.id,
        name: primarySitePartial.name || `${newTenant.name} Operating Facility`,
        address: primarySitePartial.address || '100 Sovereign Way',
        city: primarySitePartial.city || 'London',
        state: primarySitePartial.state || 'Greater London',
        country: primarySitePartial.country || 'United Kingdom',
        region: primarySitePartial.region || 'UK South East',
        type: primarySitePartial.type || 'Corporate HQ',
        activeGuardsCount: 0,
        totalCheckpoints: 0,
        timezone: 'Europe/London',
        timezoneOffset: 'UTC+0',
        distanceKmFromHQ: 4.8,
        networkLatencyMs: 12,
        localEmergencyAgency: 'Metropolitan Police Central CAD',
        zones: [],
        emergencyContact: {
          name: newAdmin.name,
          role: 'Primary Tenant Administrator',
          phone: newAdmin.phone || '+44 (0) 20 7946 0000',
        },
        mapCenter: primarySitePartial.mapCenter || { lat: 51.5074, lng: -0.1278 },
        geoMapPos: primarySitePartial.geoMapPos || { x: 50, y: 50 },
      };
      setSites((prev) => [fullSite, ...prev]);
      setCurrentSite(fullSite);
    }

    // 4. Switch context to the newly created tenant
    setCurrentTenant(newTenant);

    // 5. Persist to Firebase if configured.
    createFirebaseTenant(newTenant).catch((err) =>
      console.warn('Firebase tenant insert fallback:', err)
    );
    createFirebaseTenantAdmin(newAdmin).catch((err) =>
      console.warn('Firebase tenant admin insert fallback:', err)
    );

    // 6. Push System Notification
    const notif: SystemNotification = {
      id: `notif-tenant-${Date.now()}`,
      tenantId: newTenant.id,
      title: 'Tenant Organization Provisioned',
      message: `${newTenant.name} (${newTenant.code}) registered with Primary Admin ${newAdmin.name} (${newAdmin.email}).`,
      type: 'system',
      timestamp: 'Just now',
      read: false,
      linkTab: 'superadmin',
    };
    setNotifications((prev) => [notif, ...prev]);
    tacticalAudio.playDispatchAlert();
  };

  const handleAddAdmin = (newAdmin: UserAccount) => {
    // 1. Add User to state
    setUsers((prev) => [...prev, newAdmin]);

    // 2. Update tenant's primaryAdmin fields if not present
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === newAdmin.tenantId && !t.primaryAdminName) {
          return {
            ...t,
            primaryAdminId: newAdmin.id,
            primaryAdminName: newAdmin.name,
            primaryAdminEmail: newAdmin.email,
          };
        }
        return t;
      })
    );

    // 3. Persist to Firebase.
    createFirebaseTenantAdmin(newAdmin).catch((err) =>
      console.warn('Firebase admin insert fallback:', err)
    );

    // 4. Push System Notification
    const notif: SystemNotification = {
      id: `notif-admin-${Date.now()}`,
      tenantId: newAdmin.tenantId || currentTenant.id,
      title: 'Tenant Administrator Provisioned',
      message: `Assigned ${newAdmin.name} (${newAdmin.role}) to ${newAdmin.tenantName || 'Tenant Org'}.`,
      type: 'system',
      timestamp: 'Just now',
      read: false,
      linkTab: 'superadmin',
    };
    setNotifications((prev) => [notif, ...prev]);
    tacticalAudio.playDispatchAlert();
  };

  const handleSwitchUser = (user: UserAccount) => {
    if (isFirebaseConfigured) return;
    setCurrentUser(user);
    if (user.tenantId) {
      const matchTenant = tenants.find((t) => t.id === user.tenantId);
      if (matchTenant) {
        handleSelectTenant(matchTenant);
      }
    }
  };

  const handleUpdateRegionalSettings = async (value: RegionalSettingsValue) => {
    const persisted = await updateFirebaseTenantRegionalSettings(currentTenant.id, value);
    if (!persisted.success) {
      notifyPersistenceFailure('update regional settings', persisted.error);
      return;
    }
    const updatedTenant = { ...currentTenant, ...value };
    setCurrentTenant(updatedTenant);
    setTenants((prev) => prev.map((tenant) => tenant.id === updatedTenant.id ? updatedTenant : tenant));
    writeAudit('REGIONAL_SETTINGS_UPDATED', 'tenant', currentTenant.id, undefined, { ...value });
  };

  const isSuperadmin = currentUser.role === 'SUPERADMIN';
  const visibleTenants = isSuperadmin
    ? tenants
    : tenants.filter((tenant) => tenant.id === currentUser.tenantId);
  const scopedSites = sites.filter((site) => site.tenantId === currentTenant.id);
  const scopedSiteIds = new Set(scopedSites.map((site) => site.id));
  const scopedGuards = guards.filter((guard) => scopedSiteIds.has(guard.siteId));
  const scopedCheckpoints = checkpoints.filter((checkpoint) => scopedSiteIds.has(checkpoint.siteId));
  const scopedTours = tours.filter((tour) => scopedSiteIds.has(tour.siteId));
  const scopedIncidents = incidents.filter((incident) => scopedSiteIds.has(incident.siteId));
  const scopedShifts = shifts.filter((shift) => scopedSiteIds.has(shift.siteId));
  const scopedAttendance = attendance.filter((record) => scopedSiteIds.has(record.siteId));
  const scopedInvoices = invoices.filter((invoice) => invoice.tenantId === currentTenant.id);
  const scopedNotifications = notifications.filter((notification) =>
    notification.tenantId === currentTenant.id
  );
  const siteDependentTabs = ['live_map', 'tours', 'incidents', 'scheduling', 'reports'];

  // Calculate tenant-context summary counters
  const sosCount = scopedIncidents.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved').length;
  const openIncidentsCount = scopedIncidents.filter((i) => i.status !== 'Resolved').length;
  const activeGuardsCount = scopedGuards.filter((g) => g.status !== 'offline').length;
  const tourComplianceAvg = Math.round(
    scopedTours.reduce((acc, t) => acc + t.complianceRate, 0) / (scopedTours.length || 1)
  );

  if (isFirebaseConfigured && (!isAuthenticated || authLoading)) {
    return <AuthGate loading={authLoading} accessError={authError} />;
  }

  return (
    <div className="aegis-shell min-h-screen bg-[#FAFAF9] text-slate-900 flex flex-col font-sans selection:bg-slate-200 selection:text-slate-950">
      {/* Top Tactical Command Header */}
      <Header
        tenants={visibleTenants}
        currentTenant={currentTenant}
        onSelectTenant={handleSelectTenant}
        notifications={scopedNotifications}
        onOpenBroadcast={() => {
          if (scopedSites.length > 0) setIsBroadcastOpen(true);
          else setActiveTab('live_map');
        }}
        onOpenNewIncident={() => {
          if (scopedSites.length > 0 && scopedGuards.length > 0) setIsNewIncidentOpen(true);
          else setActiveTab('live_map');
        }}
        onTriggerSOSDrill={handleTriggerSOSDrill}
        activeSOSIncident={activeSOSIncident}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onMarkNotificationRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        firebaseConnected={firebaseLive}
        currentUser={currentUser}
        users={isFirebaseConfigured ? [] : users}
        onSwitchUser={isFirebaseConfigured ? undefined : handleSwitchUser}
        onSignOut={isFirebaseConfigured ? signOutOfFirebase : undefined}
        onOpenNewTenantModal={isSuperadmin ? () => setIsNewTenantModalOpen(true) : undefined}
        onUpdateRegionalSettings={
          currentUser.role === 'SUPERADMIN' || currentUser.role === 'TENANT_ADMIN'
            ? handleUpdateRegionalSettings
            : undefined
        }
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Tactical Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          sosCount={sosCount}
          openIncidentsCount={openIncidentsCount}
          activeGuardsCount={activeGuardsCount}
          tourComplianceAvg={tourComplianceAvg}
          tenantsCount={visibleTenants.length}
          currentUser={currentUser}
          onSwitchUser={isFirebaseConfigured ? undefined : handleSwitchUser}
          onSignOut={isFirebaseConfigured ? signOutOfFirebase : undefined}
          users={isFirebaseConfigured ? [] : users}
        />

        {/* Center Content Body */}
        <main className="minimal-workspace flex-1 overflow-y-auto bg-[#FAFAF9] p-4 md:p-6">
          {scopedSites.length === 0 && siteDependentTabs.includes(activeTab) && (
            <TenantEmptyState tenant={currentTenant} />
          )}
          {/* Active SOS Emergency Alarm HUD Banner */}
          {activeSOSIncident && (
            <SOSAlarmHUD
              incident={activeSOSIncident}
              guards={scopedGuards}
              onDispatchBackup={handleDispatchBackup}
              onTriggerLockdown={handleTriggerLockdown}
              onNotifyPoliceCAD={handleNotifyPoliceCAD}
              onResolveSOS={handleResolveSOS}
              onCloseBanner={() => {}}
              onFocusIncidentOnMap={() => setActiveTab('live_map')}
            />
          )}

          {/* Tab 1: Live Map & Dispatch Center */}
          {activeTab === 'live_map' && scopedSites.length > 0 && (
            <LiveMapCommandCenter
              sites={scopedSites}
              currentSite={currentSite}
              onSelectSite={setCurrentSite}
              guards={scopedGuards}
              onUpdateGuard={handleUpdateGuard}
              checkpoints={scopedCheckpoints}
              incidents={scopedIncidents}
              activeTours={scopedTours}
              onSelectIncident={(inc) => {
                setActiveTab('incidents');
              }}
              onOpenBroadcastWithGuard={(g) => setIsBroadcastOpen(true)}
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
              onVerifyQRScan={handleVerifyQRScan}
            />
          )}

          {/* Tab 2: Patrol & Checkpoint Tour Management */}
          {activeTab === 'tours' && scopedSites.length > 0 && (
            <TourManagement
              tours={scopedTours}
              onUpdateTour={handleUpdateTour}
              onCreateTour={handleCreateTour}
              checkpoints={scopedCheckpoints}
              onCreateCheckpoint={handleCreateCheckpoint}
              sites={scopedSites}
              guards={scopedGuards}
              onVerifyQRScan={handleVerifyQRScan}
            />
          )}

          {/* Tab 3: Incident Forensics & Dossier */}
          {activeTab === 'incidents' && scopedSites.length > 0 && (
            <IncidentForensics
              incidents={scopedIncidents}
              onUpdateIncident={handleUpdateIncident}
              onOpenNewIncident={() => setIsNewIncidentOpen(true)}
            />
          )}

          {/* Tab 4: Shift Scheduler & Attendance Audit */}
          {activeTab === 'scheduling' && scopedSites.length > 0 && (
            <ShiftScheduler
              shifts={scopedShifts}
              onAddShift={handleAddShift}
              onDeleteShift={handleDeleteShift}
              attendance={scopedAttendance}
              onApproveAttendance={handleApproveAttendance}
              guards={scopedGuards}
              sites={scopedSites}
              currentTenant={currentTenant}
            />
          )}

          {/* Tab 5: Superadmin & Multi-Tenant Hub */}
          {activeTab === 'superadmin' && (
            <SuperadminTenantManager
              tenants={visibleTenants}
              currentTenant={currentTenant}
              onSelectTenant={handleSelectTenant}
              users={isSuperadmin ? users : users.filter((user) => user.tenantId === currentTenant.id)}
              currentUser={currentUser}
              onSwitchUser={handleSwitchUser}
              onOpenNewTenantModal={() => setIsNewTenantModalOpen(true)}
              onOpenNewAdminModal={(tenant) => {
                setSelectedTenantForNewAdmin(tenant);
                setIsNewAdminModalOpen(true);
              }}
              sites={sites}
              guards={guards}
            />
          )}

          {/* Tab 6: Client Portal & Billing */}
          {activeTab === 'billing' && (
            <ClientBillingPortal
              tenants={visibleTenants}
              currentTenant={currentTenant}
              onSelectTenant={handleSelectTenant}
              invoices={scopedInvoices}
              sites={scopedSites}
              guards={scopedGuards}
              incidents={scopedIncidents}
            />
          )}

          {/* Tab 7: Reports & Analytics Centre */}
          {activeTab === 'reports' && scopedSites.length > 0 && (
            <ReportsAnalytics
              tenants={visibleTenants}
              currentTenant={currentTenant}
              sites={scopedSites}
              guards={scopedGuards}
              incidents={scopedIncidents}
              tours={scopedTours}
              shifts={scopedShifts}
              attendance={scopedAttendance}
            />
          )}

          {activeTab === 'audit_trail' && (
            <AuditTrail events={auditEvents.filter((event) => event.tenantId === currentTenant.id)} />
          )}
        </main>
      </div>

      {/* Global Push / Tactical Radio Broadcast Modal */}
      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        sites={scopedSites}
        guards={scopedGuards}
        onSendBroadcast={handleSendBroadcast}
      />

      {/* Field Incident Creation Modal */}
      <NewIncidentModal
        isOpen={isNewIncidentOpen}
        onClose={() => setIsNewIncidentOpen(false)}
        sites={scopedSites}
        guards={scopedGuards}
        onCreateIncident={handleCreateIncident}
      />

      {/* Superadmin Register New Tenant Modal */}
      <NewTenantModal
        isOpen={isNewTenantModalOpen}
        onClose={() => setIsNewTenantModalOpen(false)}
        onAddTenant={handleAddTenant}
      />

      {/* Superadmin & Tenant Admin Provision User Modal */}
      <NewTenantAdminModal
        isOpen={isNewAdminModalOpen}
        onClose={() => setIsNewAdminModalOpen(false)}
        tenants={tenants}
        selectedTenant={selectedTenantForNewAdmin || currentTenant}
        onAddAdmin={handleAddAdmin}
        currentUser={currentUser}
        sites={sites}
      />
    </div>
  );
}
