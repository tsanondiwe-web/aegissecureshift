/// <reference types="vite/client" />

import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  User,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  AttendanceRecord,
  AuditEvent,
  BroadcastMessage,
  Checkpoint,
  Guard,
  Incident,
  PatrolTour,
  ShiftSchedule,
  Site,
  Tenant,
  UserAccount,
} from '../types';

const config = {
  apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string) || '',
  authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string) || '',
  projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string) || '',
  storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string) || '',
  messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '',
  appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string) || '',
};

export const isFirebaseConfigured = Boolean(
  config.apiKey &&
  config.projectId &&
  config.appId &&
  !config.apiKey.includes('your-api-key') &&
  !config.projectId.includes('your-project-id')
);

let firebaseApp: FirebaseApp | null = null;
let firestore: Firestore | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!firebaseApp) firebaseApp = getApps().length ? getApp() : initializeApp(config);
  return firebaseApp;
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!firestore) firestore = initializeFirestore(app, { ignoreUndefinedProperties: true });
  return firestore;
}

export function getFirebaseUser(): Promise<User | null> {
  const app = getFirebaseApp();
  if (!app) return Promise.resolve(null);
  const auth = getAuth(app);
  if (auth.authStateReady) return auth.authStateReady().then(() => auth.currentUser);
  return Promise.resolve(auth.currentUser);
}

export function subscribeToFirebaseAuth(onChange: (user: User | null) => void) {
  const app = getFirebaseApp();
  if (!app) return () => {};
  return onAuthStateChanged(getAuth(app), onChange);
}

export async function signInToFirebase(email: string, password: string) {
  const app = getFirebaseApp();
  if (!app) return { success: false, error: new Error('Firebase is not configured.') };
  try {
    await signInWithEmailAndPassword(getAuth(app), email, password);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

export async function signOutOfFirebase() {
  const app = getFirebaseApp();
  if (!app) return { success: true };
  try {
    await signOut(getAuth(app));
    return { success: true };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

function dataWithId<T>(snapshot: { id: string; data(): unknown }): T {
  return { ...(snapshot.data() as object), id: snapshot.id } as T;
}

export async function getAuthenticatedUserAccount(user: User): Promise<UserAccount | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snapshot = await getDoc(doc(db, 'admin_users', user.uid));
  if (!snapshot.exists()) return null;
  const account = dataWithId<UserAccount>(snapshot);
  if (account.status !== 'ACTIVE') return null;
  return { ...account, email: account.email || user.email || '', lastLogin: 'Just now' };
}

export async function getAccessibleTenants(): Promise<Tenant[]> {
  const db = getFirebaseDb();
  const user = await getFirebaseUser();
  if (!db || !user) return [];
  const profile = await getAuthenticatedUserAccount(user);
  if (!profile) return [];
  const tenantsRef = collection(db, 'tenants');
  const snapshot = profile.role === 'SUPERADMIN'
    ? await getDocs(tenantsRef)
    : profile.tenantId
      ? await getDocs(query(tenantsRef, where(documentId(), '==', profile.tenantId)))
      : null;
  if (!snapshot) return [];
  return snapshot.docs.map((item) => dataWithId<Tenant>(item)).sort((a, b) => a.name.localeCompare(b.name));
}

type TenantEntity = Guard | Incident | Checkpoint | ShiftSchedule | PatrolTour | AttendanceRecord | AuditEvent | Site;

function subscribeToTenantCollection<T extends TenantEntity>(
  collectionName: string,
  onUpdate: (items: T[]) => void,
  tenantId?: string,
  sort?: (a: T, b: T) => number,
) {
  const db = getFirebaseDb();
  if (!db) return () => {};
  const ref = collection(db, collectionName);
  const source = tenantId ? query(ref, where('tenantId', '==', tenantId)) : ref;
  return onSnapshot(source, (snapshot) => {
    const items = snapshot.docs.map((item) => dataWithId<T>(item));
    onUpdate(sort ? items.sort(sort) : items);
  }, (error) => console.warn(`Firebase ${collectionName} subscription failed`, error));
}

export const subscribeToFirebaseGuards = (onUpdate: (items: Guard[]) => void, tenantId?: string) =>
  subscribeToTenantCollection('guards', onUpdate, tenantId);

export const subscribeToFirebaseSites = (onUpdate: (items: Site[]) => void, tenantId?: string) =>
  subscribeToTenantCollection('sites', onUpdate, tenantId);

export const subscribeToFirebaseIncidents = (onUpdate: (items: Incident[]) => void, tenantId?: string) =>
  subscribeToTenantCollection('incidents', onUpdate, tenantId, (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

export const subscribeToFirebaseCheckpoints = (onUpdate: (items: Checkpoint[]) => void, tenantId?: string) =>
  subscribeToTenantCollection('checkpoints', onUpdate, tenantId);

export const subscribeToFirebaseShifts = (onUpdate: (items: ShiftSchedule[]) => void, tenantId?: string) =>
  subscribeToTenantCollection('shifts', onUpdate, tenantId);

export const subscribeToFirebaseTours = (onUpdate: (items: PatrolTour[]) => void, tenantId?: string) =>
  subscribeToTenantCollection('patrol_tours', onUpdate, tenantId);

export const subscribeToFirebaseAttendance = (onUpdate: (items: AttendanceRecord[]) => void, tenantId?: string) =>
  subscribeToTenantCollection('attendance_records', onUpdate, tenantId);

export const subscribeToFirebaseAuditEvents = (onUpdate: (items: AuditEvent[]) => void, tenantId?: string) =>
  subscribeToTenantCollection('audit_events', onUpdate, tenantId, (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));

function localOnly() {
  return { success: true as const, localOnly: true as const, error: null };
}

async function upsert<T extends object>(collectionName: string, id: string, value: T) {
  const db = getFirebaseDb();
  if (!db) return localOnly();
  try {
    await setDoc(doc(db, collectionName, id), value, { merge: true });
    return { success: true as const, error: null };
  } catch (error) {
    return { success: false as const, error: error as Error };
  }
}

export async function updateFirebaseIncidentStatus(
  incidentId: string,
  status: Incident['status'],
) {
  const db = getFirebaseDb();
  if (!db) return localOnly();
  try {
    await updateDoc(doc(db, 'incidents', incidentId), { status, updatedAt: new Date().toISOString() });
    return { success: true as const, error: null };
  } catch (error) {
    return { success: false as const, error: error as Error };
  }
}

export async function createFirebaseBroadcast(broadcast: Omit<BroadcastMessage, 'id'>, tenantId: string) {
  const id = `BC-${Date.now()}`;
  const result = await upsert('broadcasts', id, {
    ...broadcast,
    tenantId,
    acknowledgedCount: 0,
    createdAt: new Date().toISOString(),
  });
  return { ...result, id };
}

export async function logFirebaseQRScan(
  guardId: string,
  checkpointId: string,
  qrCode: string,
  checkpointName: string,
) {
  const db = getFirebaseDb();
  if (!db) return localOnly();
  try {
    const now = new Date().toISOString();
    await runTransaction(db, async (transaction) => {
      const checkpointRef = doc(db, 'checkpoints', checkpointId);
      const guardRef = doc(db, 'guards', guardId);
      const checkpoint = await transaction.get(checkpointRef);
      if (!checkpoint.exists() || checkpoint.data().qrCodeValue !== qrCode) {
        throw new Error('The scanned QR code does not match this checkpoint.');
      }
      transaction.update(checkpointRef, { status: 'VERIFIED', lastScannedAt: now, scannedByGuard: guardId });
      transaction.update(guardRef, {
        lastScannedQRCode: qrCode,
        lastScannedCheckpointId: checkpointId,
        lastScannedCheckpointName: checkpointName,
        lastScannedTimestamp: now,
        lastPingTime: now,
        updatedAt: now,
      });
    });
    return { success: true as const, error: null };
  } catch (error) {
    return { success: false as const, error: error as Error };
  }
}

export const createFirebaseTenant = (tenant: Tenant) =>
  upsert('tenants', tenant.id, { ...tenant, createdAt: tenant.createdAt || new Date().toISOString() });

export async function createFirebaseTenantAdmin(user: UserAccount) {
  const app = getFirebaseApp();
  if (!app) return { success: false as const, user, error: new Error('Firebase is not configured.') };
  try {
    const call = httpsCallable<{ user: UserAccount }, { uid: string }>(
      getFunctions(app, (import.meta.env?.VITE_FIREBASE_FUNCTIONS_REGION as string) || 'us-central1'),
      'createTenantAdmin',
    );
    await call({ user });
    return { success: true as const, user, error: null };
  } catch (error) {
    return { success: false as const, user, error: error as Error };
  }
}

export const updateFirebaseTenantRegionalSettings = (
  tenantId: string,
  value: { countryCode: string; currencyCode: string; locale: string },
) => upsert('tenants', tenantId, { ...value, updatedAt: new Date().toISOString() });

export interface AuditEventInput {
  tenantId: string;
  actor: UserAccount;
  action: string;
  entityType: string;
  entityId: string;
  siteId?: string;
  details?: Record<string, unknown>;
}

export function recordFirebaseAuditEvent(event: AuditEventInput) {
  const id = crypto.randomUUID();
  return upsert('audit_events', id, {
    id,
    tenantId: event.tenantId,
    actorUserId: event.actor.id,
    actorName: event.actor.name,
    actorRole: event.actor.role,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    siteId: event.siteId,
    details: event.details || {},
    occurredAt: new Date().toISOString(),
  });
}

export const persistFirebaseIncident = (incident: Incident, tenantId: string) =>
  upsert('incidents', incident.id, { ...incident, tenantId, updatedAt: new Date().toISOString() });

export const persistFirebaseTour = (tour: PatrolTour, tenantId: string) =>
  upsert('patrol_tours', tour.id, { ...tour, tenantId, updatedAt: new Date().toISOString() });

export const persistFirebaseCheckpoint = (checkpoint: Checkpoint, tenantId: string) =>
  upsert('checkpoints', checkpoint.id, {
    ...checkpoint,
    tenantId,
    verificationType: 'QR_CODE',
    status: 'PENDING',
    updatedAt: new Date().toISOString(),
  });

export const persistFirebaseShift = (shift: ShiftSchedule, tenantId: string) =>
  upsert('shifts', shift.id, { ...shift, tenantId, updatedAt: new Date().toISOString() });

export async function deleteFirebaseShift(shiftId: string) {
  const db = getFirebaseDb();
  if (!db) return localOnly();
  try {
    await deleteDoc(doc(db, 'shifts', shiftId));
    return { success: true as const, error: null };
  } catch (error) {
    return { success: false as const, error: error as Error };
  }
}

export async function approveFirebaseAttendance(attendanceId: string) {
  const db = getFirebaseDb();
  const user = await getFirebaseUser();
  if (!db) return localOnly();
  try {
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'attendance_records', attendanceId), {
      status: 'Approved',
      approvedBy: user?.uid,
      approvedAt: now,
      updatedAt: now,
    });
    return { success: true as const, error: null };
  } catch (error) {
    return { success: false as const, error: error as Error };
  }
}

export const persistFirebaseAttendance = (record: AttendanceRecord, tenantId: string) =>
  upsert('attendance_records', record.id, { ...record, tenantId, updatedAt: new Date().toISOString() });
