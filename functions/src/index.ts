import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

const db = getFirestore();

interface ClockInRequest {
  qrCode: string;
  latitude: number;
  longitude: number;
}

function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const earthRadius = 6_371_000;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const clockInWithQr = onCall<ClockInRequest>(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in before attempting to clock in.');
  const qrCode = request.data.qrCode?.trim();
  if (!qrCode) throw new HttpsError('invalid-argument', 'A QR code is required.');

  const guardRef = db.collection('guards').doc(request.auth.uid);
  const guardSnapshot = await guardRef.get();
  if (!guardSnapshot.exists) throw new HttpsError('permission-denied', 'No active guard profile is assigned.');
  const guard = guardSnapshot.data()!;
  if (guard.accountStatus === 'SUSPENDED') throw new HttpsError('permission-denied', 'This guard account is suspended.');
  const tenantId = guard.tenantId as string;

  const checkpoints = await db.collection('checkpoints')
    .where('tenantId', '==', tenantId)
    .where('qrCodeValue', '==', qrCode)
    .limit(1)
    .get();
  if (checkpoints.empty) throw new HttpsError('not-found', 'This QR code is not a valid checkpoint for your organisation.');
  const checkpointSnapshot = checkpoints.docs[0];
  const checkpoint = checkpointSnapshot.data();
  if (guard.siteId && checkpoint.siteId !== guard.siteId) {
    throw new HttpsError('permission-denied', 'This checkpoint is not assigned to your site.');
  }

  if (typeof checkpoint.latitude === 'number' && typeof checkpoint.longitude === 'number') {
    const distance = distanceMetres(
      request.data.latitude,
      request.data.longitude,
      checkpoint.latitude,
      checkpoint.longitude,
    );
    if (distance > Number(checkpoint.geofenceRadiusMeters || 150)) {
      throw new HttpsError('failed-precondition', `Move within ${checkpoint.geofenceRadiusMeters || 150} metres of the checkpoint.`);
    }
  }

  const shifts = await db.collection('shifts')
    .where('tenantId', '==', tenantId)
    .where('guardId', '==', request.auth.uid)
    .where('status', 'in', ['Scheduled', 'Clocked In'])
    .limit(5)
    .get();
  if (shifts.empty) throw new HttpsError('failed-precondition', 'No scheduled shift is available for clock-in.');
  const shiftSnapshot = shifts.docs.find((item) => item.data().siteId === checkpoint.siteId) || shifts.docs[0];
  const now = new Date().toISOString();
  const eventRef = db.collection('clock_in_events').doc();

  await db.runTransaction(async (transaction) => {
    transaction.update(shiftSnapshot.ref, { status: 'Clocked In', clockedInAt: now, updatedAt: now });
    transaction.update(guardRef, {
      status: 'on_duty',
      lastScannedQRCode: qrCode,
      lastScannedCheckpointId: checkpointSnapshot.id,
      lastScannedCheckpointName: checkpoint.name,
      lastScannedTimestamp: now,
      lastPingTime: now,
      updatedAt: now,
    });
    transaction.update(checkpointSnapshot.ref, {
      status: 'VERIFIED',
      lastScannedAt: now,
      scannedByGuard: request.auth!.uid,
    });
    transaction.create(eventRef, {
      tenantId,
      guardId: request.auth!.uid,
      shiftId: shiftSnapshot.id,
      checkpointId: checkpointSnapshot.id,
      checkpointName: checkpoint.name,
      qrCode,
      latitude: request.data.latitude,
      longitude: request.data.longitude,
      clockedInAt: now,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return {
    approved: true,
    message: `Clocked in at ${checkpoint.name}.`,
    shiftId: shiftSnapshot.id,
    checkpointId: checkpointSnapshot.id,
    checkpointName: checkpoint.name,
    clockedInAt: now,
  };
});

interface VerifyCheckpointRequest extends ClockInRequest {
  checkpointId: string;
}

export const verifyCheckpointQr = onCall<VerifyCheckpointRequest>(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in before scanning a checkpoint.');
  const guardRef = db.collection('guards').doc(request.auth.uid);
  const checkpointRef = db.collection('checkpoints').doc(request.data.checkpointId);
  const [guardSnapshot, checkpointSnapshot] = await Promise.all([guardRef.get(), checkpointRef.get()]);
  if (!guardSnapshot.exists) throw new HttpsError('permission-denied', 'No guard profile is assigned.');
  if (!checkpointSnapshot.exists) throw new HttpsError('not-found', 'Checkpoint not found.');
  const guard = guardSnapshot.data()!;
  const checkpoint = checkpointSnapshot.data()!;
  if (guard.accountStatus === 'SUSPENDED') {
    throw new HttpsError('permission-denied', 'This guard account is suspended.');
  }
  if (guard.tenantId !== checkpoint.tenantId || guard.siteId && guard.siteId !== checkpoint.siteId) {
    throw new HttpsError('permission-denied', 'This checkpoint is outside your assignment.');
  }
  if (checkpoint.qrCodeValue !== request.data.qrCode?.trim()) {
    throw new HttpsError('invalid-argument', 'The QR code does not match this checkpoint.');
  }
  const now = new Date().toISOString();
  const scanRef = db.collection('checkpoint_scans').doc();
  await db.runTransaction(async (transaction) => {
    transaction.update(checkpointRef, { status: 'VERIFIED', lastScannedAt: now, scannedByGuard: request.auth!.uid });
    transaction.update(guardRef, {
      lastScannedQRCode: request.data.qrCode.trim(),
      lastScannedCheckpointId: checkpointSnapshot.id,
      lastScannedCheckpointName: checkpoint.name,
      lastScannedTimestamp: now,
      latitude: request.data.latitude,
      longitude: request.data.longitude,
      lastPingTime: now,
      updatedAt: now,
    });
    transaction.create(scanRef, {
      tenantId: guard.tenantId,
      guardId: request.auth!.uid,
      checkpointId: checkpointSnapshot.id,
      checkpointName: checkpoint.name,
      qrCode: request.data.qrCode.trim(),
      latitude: request.data.latitude,
      longitude: request.data.longitude,
      scannedAt: now,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { approved: true, checkpointId: checkpointSnapshot.id, checkpointName: checkpoint.name, scannedAt: now };
});

interface AdminUserRequest {
  user: {
    email: string;
    temporaryPassword?: string;
    name: string;
    phone?: string;
    role: string;
    tenantId?: string;
    tenantName?: string;
    status: string;
    avatar?: string;
    assignedSiteId?: string;
    assignedSiteName?: string;
  };
}

interface ProvisionTenantRequest {
  tenant: Record<string, unknown> & {
    id: string;
    name: string;
    code: string;
  };
  admin: AdminUserRequest['user'];
  primarySite?: Record<string, unknown> & {
    id?: string;
    name?: string;
  };
}

export const provisionTenant = onCall<ProvisionTenantRequest>(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  const callerSnapshot = await db.collection('admin_users').doc(request.auth.uid).get();
  const caller = callerSnapshot.data();
  if (!callerSnapshot.exists || caller?.role !== 'SUPERADMIN' || caller?.status !== 'ACTIVE') {
    throw new HttpsError('permission-denied', 'Only an active superadmin can provision tenants.');
  }

  const tenant = request.data?.tenant;
  const admin = request.data?.admin;
  const primarySite = request.data?.primarySite;
  if (!tenant?.id || !tenant.name || !tenant.code || !admin?.email || !admin.temporaryPassword || !admin.name) {
    throw new HttpsError('invalid-argument', 'Tenant, administrator, email, and temporary password are required.');
  }
  validatePassword(admin.temporaryPassword);

  const tenantRef = db.collection('tenants').doc(tenant.id);
  if ((await tenantRef.get()).exists) {
    throw new HttpsError('already-exists', 'A tenant with this identifier already exists.');
  }

  let createdUserId: string | null = null;
  try {
    const created = await getAuth().createUser({
      email: admin.email.trim().toLowerCase(),
      password: admin.temporaryPassword,
      displayName: admin.name.trim(),
    });
    createdUserId = created.uid;

    const { temporaryPassword: _temporaryPassword, ...safeAdmin } = admin;
    const now = new Date().toISOString();
    const tenantRecord = {
      ...tenant,
      id: tenant.id,
      primaryAdminId: created.uid,
      primaryAdminName: admin.name,
      primaryAdminEmail: admin.email.trim().toLowerCase(),
      createdAt: tenant.createdAt || now,
      updatedAt: now,
    };
    const adminRecord = {
      ...safeAdmin,
      id: created.uid,
      email: admin.email.trim().toLowerCase(),
      role: 'TENANT_ADMIN',
      tenantId: tenant.id,
      tenantName: tenant.name,
      status: 'ACTIVE',
      accountStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    const batch = db.batch();
    batch.create(tenantRef, tenantRecord);
    batch.create(db.collection('admin_users').doc(created.uid), adminRecord);

    let primarySiteId: string | null = null;
    if (primarySite) {
      primarySiteId = primarySite.id || `site-${tenant.id}-1`;
      batch.create(db.collection('sites').doc(primarySiteId), {
        ...primarySite,
        id: primarySiteId,
        tenantId: tenant.id,
        createdAt: now,
        updatedAt: now,
      });
    }

    const auditRef = db.collection('audit_events').doc();
    batch.create(auditRef, {
      tenantId: tenant.id,
      actorUserId: request.auth.uid,
      actorName: caller.name || request.auth.token.email || 'Superadmin',
      actorRole: 'SUPERADMIN',
      action: 'TENANT_PROVISIONED',
      entityType: 'tenant',
      entityId: tenant.id,
      details: {
        tenantCode: tenant.code,
        primaryAdminId: created.uid,
        primaryAdminEmail: adminRecord.email,
        primarySiteId,
      },
      occurredAt: now,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    return {
      tenant: tenantRecord,
      admin: adminRecord,
      primarySiteId,
    };
  } catch (error) {
    if (createdUserId) {
      await getAuth().deleteUser(createdUserId).catch((rollbackError) => {
        console.error('Unable to roll back provisioned Firebase Auth user', rollbackError);
      });
    }
    if (error instanceof HttpsError) throw error;
    console.error('Tenant provisioning failed', error);
    throw new HttpsError('internal', 'Tenant provisioning failed. No tenant was created.');
  }
});

export const createTenantAdmin = onCall<AdminUserRequest>(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  const caller = await db.collection('admin_users').doc(request.auth.uid).get();
  if (!caller.exists || caller.data()?.role !== 'SUPERADMIN' || caller.data()?.status !== 'ACTIVE') {
    throw new HttpsError('permission-denied', 'Only an active superadmin can create tenant administrators.');
  }
  const user = request.data.user;
  if (!user.email || !user.temporaryPassword) {
    throw new HttpsError('invalid-argument', 'Email and temporary password are required.');
  }
  const created = await getAuth().createUser({
    email: user.email,
    password: user.temporaryPassword,
    displayName: user.name,
  });
  const collectionName = user.role === 'GUARD' ? 'guards' : 'admin_users';
  const { temporaryPassword: _temporaryPassword, ...safeProfile } = user;
  await db.collection(collectionName).doc(created.uid).set({
    ...safeProfile,
    id: created.uid,
    status: user.role === 'GUARD' ? 'offline' : user.status,
    accountStatus: user.status,
    createdAt: new Date().toISOString(),
  });
  return { uid: created.uid };
});

interface ResetUserPasswordRequest {
  targetUserId: string;
  newPassword: string;
}

interface SetUserEnabledRequest {
  targetUserId: string;
  enabled: boolean;
}

const ordinaryUserRoles = new Set(['DISPATCHER', 'SUPERVISOR', 'GUARD']);

function validatePassword(password: string) {
  if (password.length < 12
    || !/[a-z]/.test(password)
    || !/[A-Z]/.test(password)
    || !/\d/.test(password)
    || !/[^A-Za-z0-9]/.test(password)) {
    throw new HttpsError(
      'invalid-argument',
      'Password must be at least 12 characters and include upper-case, lower-case, number, and symbol characters.',
    );
  }
}

export const listManagedUsers = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  const callerSnapshot = await db.collection('admin_users').doc(request.auth.uid).get();
  const caller = callerSnapshot.data();
  if (!callerSnapshot.exists || caller?.status !== 'ACTIVE') {
    throw new HttpsError('permission-denied', 'Only an active administrator can view managed users.');
  }

  const callerRole = caller.role as string;
  let usersSnapshot;
  if (callerRole === 'SUPERADMIN') {
    usersSnapshot = await db.collection('admin_users').get();
  } else if (callerRole === 'TENANT_ADMIN' && caller.tenantId) {
    usersSnapshot = await db.collection('admin_users').where('tenantId', '==', caller.tenantId).get();
  } else {
    throw new HttpsError('permission-denied', 'This account cannot manage user passwords.');
  }

  const users = usersSnapshot.docs.map((snapshot) => {
    const { temporaryPassword: _temporaryPassword, ...profile } = snapshot.data();
    return { ...profile, id: snapshot.id };
  });
  return { users };
});

export const resetUserPassword = onCall<ResetUserPasswordRequest>(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');

  const callerSnapshot = await db.collection('admin_users').doc(request.auth.uid).get();
  const caller = callerSnapshot.data();
  if (!callerSnapshot.exists || caller?.status !== 'ACTIVE') {
    throw new HttpsError('permission-denied', 'Only an active administrator can reset passwords.');
  }

  const targetUserId = request.data.targetUserId?.trim();
  const newPassword = request.data.newPassword || '';
  if (!targetUserId) throw new HttpsError('invalid-argument', 'A target user is required.');
  validatePassword(newPassword);

  const adminRef = db.collection('admin_users').doc(targetUserId);
  const guardRef = db.collection('guards').doc(targetUserId);
  const [adminSnapshot, guardSnapshot] = await Promise.all([adminRef.get(), guardRef.get()]);
  const targetSnapshot = adminSnapshot.exists ? adminSnapshot : guardSnapshot;
  const targetRef = adminSnapshot.exists ? adminRef : guardRef;
  const target = targetSnapshot.data();
  if (!targetSnapshot.exists || !target) {
    throw new HttpsError('not-found', 'The selected user account was not found.');
  }

  const callerRole = caller.role as string;
  const targetRole = (target.role || (guardSnapshot.exists ? 'GUARD' : '')) as string;
  const targetTenantId = target.tenantId as string | undefined;
  const callerTenantId = caller.tenantId as string | undefined;

  if (targetRole === 'SUPERADMIN') {
    throw new HttpsError('permission-denied', 'Superadmin passwords cannot be reset from the tenant directory.');
  }

  const superadminMayReset = callerRole === 'SUPERADMIN';
  const tenantAdminMayReset = callerRole === 'TENANT_ADMIN'
    && ordinaryUserRoles.has(targetRole)
    && Boolean(callerTenantId)
    && callerTenantId === targetTenantId;

  if (!superadminMayReset && !tenantAdminMayReset) {
    throw new HttpsError(
      'permission-denied',
      targetRole === 'TENANT_ADMIN'
        ? 'Only a superadmin can reset an administrator password.'
        : 'Tenant administrators may reset only ordinary users in their own tenant.',
    );
  }

  await getAuth().updateUser(targetUserId, { password: newPassword });
  const changedAt = new Date().toISOString();
  await targetRef.set({
    temporaryPassword: FieldValue.delete(),
    passwordChangedAt: changedAt,
    passwordChangedBy: request.auth.uid,
  }, { merge: true });

  await db.collection('audit_events').add({
    tenantId: targetTenantId || callerTenantId || 'GLOBAL',
    actorUserId: request.auth.uid,
    actorName: caller.name || request.auth.token.email || 'Administrator',
    actorRole: callerRole,
    action: 'USER_PASSWORD_RESET',
    entityType: 'user',
    entityId: targetUserId,
    details: { targetRole, targetEmail: target.email || null },
    occurredAt: changedAt,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});

export const setUserEnabled = onCall<SetUserEnabledRequest>(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');

  const callerSnapshot = await db.collection('admin_users').doc(request.auth.uid).get();
  const caller = callerSnapshot.data();
  if (!callerSnapshot.exists || caller?.status !== 'ACTIVE') {
    throw new HttpsError('permission-denied', 'Only an active administrator can manage user access.');
  }

  const targetUserId = request.data.targetUserId?.trim();
  const enabled = request.data.enabled;
  if (!targetUserId || typeof enabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'A target user and access state are required.');
  }
  if (targetUserId === request.auth.uid) {
    throw new HttpsError('failed-precondition', 'You cannot disable your own account.');
  }

  const adminRef = db.collection('admin_users').doc(targetUserId);
  const guardRef = db.collection('guards').doc(targetUserId);
  const [adminSnapshot, guardSnapshot] = await Promise.all([adminRef.get(), guardRef.get()]);
  const targetSnapshot = adminSnapshot.exists ? adminSnapshot : guardSnapshot;
  const targetRef = adminSnapshot.exists ? adminRef : guardRef;
  const target = targetSnapshot.data();
  if (!targetSnapshot.exists || !target) {
    throw new HttpsError('not-found', 'The selected user account was not found.');
  }

  const callerRole = caller.role as string;
  const targetRole = (target.role || (guardSnapshot.exists ? 'GUARD' : '')) as string;
  const targetTenantId = target.tenantId as string | undefined;
  const callerTenantId = caller.tenantId as string | undefined;

  if (targetRole === 'SUPERADMIN') {
    throw new HttpsError('permission-denied', 'Superadmin access cannot be changed from the tenant directory.');
  }

  const superadminMayManage = callerRole === 'SUPERADMIN';
  const tenantAdminMayManage = callerRole === 'TENANT_ADMIN'
    && ordinaryUserRoles.has(targetRole)
    && Boolean(callerTenantId)
    && callerTenantId === targetTenantId;

  if (!superadminMayManage && !tenantAdminMayManage) {
    throw new HttpsError(
      'permission-denied',
      targetRole === 'TENANT_ADMIN'
        ? 'Only a superadmin can change an administrator account.'
        : 'Tenant administrators may manage only ordinary users in their own tenant.',
    );
  }

  await getAuth().updateUser(targetUserId, { disabled: !enabled });
  if (!enabled) await getAuth().revokeRefreshTokens(targetUserId);

  const changedAt = new Date().toISOString();
  await targetRef.set({
    ...(guardSnapshot.exists
      ? { accountStatus: enabled ? 'ACTIVE' : 'SUSPENDED' }
      : { status: enabled ? 'ACTIVE' : 'SUSPENDED' }),
    accessChangedAt: changedAt,
    accessChangedBy: request.auth.uid,
  }, { merge: true });

  await db.collection('audit_events').add({
    tenantId: targetTenantId || callerTenantId || 'GLOBAL',
    actorUserId: request.auth.uid,
    actorName: caller.name || request.auth.token.email || 'Administrator',
    actorRole: callerRole,
    action: enabled ? 'USER_ENABLED' : 'USER_DISABLED',
    entityType: 'user',
    entityId: targetUserId,
    details: { targetRole, targetEmail: target.email || null },
    occurredAt: changedAt,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { success: true, status: enabled ? 'ACTIVE' : 'SUSPENDED' };
});
