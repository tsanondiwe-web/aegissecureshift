"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserEnabled = exports.resetUserPassword = exports.listManagedUsers = exports.createTenantAdmin = exports.provisionTenant = exports.verifyCheckpointQr = exports.clockInWithQr = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const userPolicy_js_1 = require("./userPolicy.js");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
function distanceMetres(lat1, lon1, lat2, lon2) {
    const radians = (value) => value * Math.PI / 180;
    const earthRadius = 6_371_000;
    const dLat = radians(lat2 - lat1);
    const dLon = radians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
exports.clockInWithQr = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Sign in before attempting to clock in.');
    const qrCode = request.data.qrCode?.trim();
    if (!qrCode)
        throw new https_1.HttpsError('invalid-argument', 'A QR code is required.');
    const guardRef = db.collection('guards').doc(request.auth.uid);
    const guardSnapshot = await guardRef.get();
    if (!guardSnapshot.exists)
        throw new https_1.HttpsError('permission-denied', 'No active guard profile is assigned.');
    const guard = guardSnapshot.data();
    if (guard.accountStatus === 'SUSPENDED')
        throw new https_1.HttpsError('permission-denied', 'This guard account is suspended.');
    const tenantId = guard.tenantId;
    const checkpoints = await db.collection('checkpoints')
        .where('tenantId', '==', tenantId)
        .where('qrCodeValue', '==', qrCode)
        .limit(1)
        .get();
    if (checkpoints.empty)
        throw new https_1.HttpsError('not-found', 'This QR code is not a valid checkpoint for your organisation.');
    const checkpointSnapshot = checkpoints.docs[0];
    const checkpoint = checkpointSnapshot.data();
    if (guard.siteId && checkpoint.siteId !== guard.siteId) {
        throw new https_1.HttpsError('permission-denied', 'This checkpoint is not assigned to your site.');
    }
    if (typeof checkpoint.latitude === 'number' && typeof checkpoint.longitude === 'number') {
        const distance = distanceMetres(request.data.latitude, request.data.longitude, checkpoint.latitude, checkpoint.longitude);
        if (distance > Number(checkpoint.geofenceRadiusMeters || 150)) {
            throw new https_1.HttpsError('failed-precondition', `Move within ${checkpoint.geofenceRadiusMeters || 150} metres of the checkpoint.`);
        }
    }
    const shifts = await db.collection('shifts')
        .where('tenantId', '==', tenantId)
        .where('guardId', '==', request.auth.uid)
        .where('status', 'in', ['Scheduled', 'Clocked In'])
        .limit(5)
        .get();
    if (shifts.empty)
        throw new https_1.HttpsError('failed-precondition', 'No scheduled shift is available for clock-in.');
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
            scannedByGuard: request.auth.uid,
        });
        transaction.create(eventRef, {
            tenantId,
            guardId: request.auth.uid,
            shiftId: shiftSnapshot.id,
            checkpointId: checkpointSnapshot.id,
            checkpointName: checkpoint.name,
            qrCode,
            latitude: request.data.latitude,
            longitude: request.data.longitude,
            clockedInAt: now,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
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
exports.verifyCheckpointQr = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Sign in before scanning a checkpoint.');
    const guardRef = db.collection('guards').doc(request.auth.uid);
    const checkpointRef = db.collection('checkpoints').doc(request.data.checkpointId);
    const [guardSnapshot, checkpointSnapshot] = await Promise.all([guardRef.get(), checkpointRef.get()]);
    if (!guardSnapshot.exists)
        throw new https_1.HttpsError('permission-denied', 'No guard profile is assigned.');
    if (!checkpointSnapshot.exists)
        throw new https_1.HttpsError('not-found', 'Checkpoint not found.');
    const guard = guardSnapshot.data();
    const checkpoint = checkpointSnapshot.data();
    if (guard.accountStatus === 'SUSPENDED') {
        throw new https_1.HttpsError('permission-denied', 'This guard account is suspended.');
    }
    if (guard.tenantId !== checkpoint.tenantId || guard.siteId && guard.siteId !== checkpoint.siteId) {
        throw new https_1.HttpsError('permission-denied', 'This checkpoint is outside your assignment.');
    }
    if (checkpoint.qrCodeValue !== request.data.qrCode?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'The QR code does not match this checkpoint.');
    }
    const now = new Date().toISOString();
    const scanRef = db.collection('checkpoint_scans').doc();
    await db.runTransaction(async (transaction) => {
        transaction.update(checkpointRef, { status: 'VERIFIED', lastScannedAt: now, scannedByGuard: request.auth.uid });
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
            guardId: request.auth.uid,
            checkpointId: checkpointSnapshot.id,
            checkpointName: checkpoint.name,
            qrCode: request.data.qrCode.trim(),
            latitude: request.data.latitude,
            longitude: request.data.longitude,
            scannedAt: now,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
    });
    return { approved: true, checkpointId: checkpointSnapshot.id, checkpointName: checkpoint.name, scannedAt: now };
});
exports.provisionTenant = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Sign in first.');
    const callerSnapshot = await db.collection('admin_users').doc(request.auth.uid).get();
    const caller = callerSnapshot.data();
    if (!callerSnapshot.exists || caller?.role !== 'SUPERADMIN' || caller?.status !== 'ACTIVE') {
        throw new https_1.HttpsError('permission-denied', 'Only an active superadmin can provision tenants.');
    }
    const tenant = request.data?.tenant;
    const admin = request.data?.admin;
    const primarySite = request.data?.primarySite;
    if (!tenant?.id || !tenant.name || !tenant.code || !admin?.email || !admin.temporaryPassword || !admin.name) {
        throw new https_1.HttpsError('invalid-argument', 'Tenant, administrator, email, and temporary password are required.');
    }
    validatePassword(admin.temporaryPassword);
    const tenantRef = db.collection('tenants').doc(tenant.id);
    if ((await tenantRef.get()).exists) {
        throw new https_1.HttpsError('already-exists', 'A tenant with this identifier already exists.');
    }
    let createdUserId = null;
    try {
        const created = await (0, auth_1.getAuth)().createUser({
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
        let primarySiteId = null;
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
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
        await batch.commit();
        return {
            tenant: tenantRecord,
            admin: adminRecord,
            primarySiteId,
        };
    }
    catch (error) {
        if (createdUserId) {
            await (0, auth_1.getAuth)().deleteUser(createdUserId).catch((rollbackError) => {
                console.error('Unable to roll back provisioned Firebase Auth user', rollbackError);
            });
        }
        if (error instanceof https_1.HttpsError)
            throw error;
        console.error('Tenant provisioning failed', error);
        throw new https_1.HttpsError('internal', 'Tenant provisioning failed. No tenant was created.');
    }
});
exports.createTenantAdmin = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Sign in first.');
    const callerSnapshot = await db.collection('admin_users').doc(request.auth.uid).get();
    const caller = callerSnapshot.data();
    if (!callerSnapshot.exists || caller?.status !== 'ACTIVE') {
        throw new https_1.HttpsError('permission-denied', 'Only an active administrator can create users.');
    }
    const user = request.data?.user;
    if (!user || typeof user.email !== 'string' || !user.email.trim()
        || typeof user.temporaryPassword !== 'string' || typeof user.name !== 'string' || !user.name.trim()
        || !(0, userPolicy_js_1.safeIdentifier)(user.tenantId)) {
        throw new https_1.HttpsError('invalid-argument', 'Name, tenant, email, and temporary password are required.');
    }
    validatePassword(user.temporaryPassword);
    const callerRole = caller.role;
    const callerTenantId = caller.tenantId;
    if (!userPolicy_js_1.tenantUserRoles.has(user.role)) {
        throw new https_1.HttpsError('invalid-argument', 'Choose a tenant administrator, dispatcher, supervisor, or guard role.');
    }
    if (!(0, userPolicy_js_1.mayCreateTenantUser)({ role: callerRole, status: caller.status, tenantId: callerTenantId }, user.role, user.tenantId)) {
        throw new https_1.HttpsError('permission-denied', 'Only a superadmin may create tenant administrators. Tenant admins may create ordinary users in their own tenant only.');
    }
    const tenantSnapshot = await db.collection('tenants').doc(user.tenantId).get();
    if (!tenantSnapshot.exists)
        throw new https_1.HttpsError('not-found', 'The selected tenant no longer exists.');
    const tenantName = tenantSnapshot.data().name;
    let assignedSite;
    if (user.assignedSiteId) {
        if (!(0, userPolicy_js_1.safeIdentifier)(user.assignedSiteId))
            throw new https_1.HttpsError('invalid-argument', 'Select a valid site.');
        const site = await db.collection('sites').doc(user.assignedSiteId).get();
        if (!site.exists || site.data().tenantId !== user.tenantId) {
            throw new https_1.HttpsError('permission-denied', 'The selected site does not belong to this tenant.');
        }
        assignedSite = { id: site.id, name: site.data().name };
    }
    if (user.role === 'GUARD' && !assignedSite) {
        throw new https_1.HttpsError('invalid-argument', 'Assign this guard to a specific site.');
    }
    let createdUserId = null;
    try {
        const normalizedEmail = user.email.trim().toLowerCase();
        const created = await (0, auth_1.getAuth)().createUser({
            email: normalizedEmail,
            password: user.temporaryPassword,
            displayName: user.name.trim(),
        });
        createdUserId = created.uid;
        const collectionName = user.role === 'GUARD' ? 'guards' : 'admin_users';
        // Persist only supported profile fields, never arbitrary caller-supplied data.
        const safeProfile = {
            name: user.name.trim(), email: normalizedEmail, phone: user.phone || '',
            role: user.role, tenantId: user.tenantId, tenantName,
            ...(user.avatar ? { avatar: user.avatar } : {}),
            ...(assignedSite ? { assignedSiteId: assignedSite.id, assignedSiteName: assignedSite.name } : {}),
        };
        const createdAt = new Date().toISOString();
        const storedProfile = {
            ...safeProfile,
            id: created.uid,
            name: user.name.trim(),
            email: normalizedEmail,
            status: user.role === 'GUARD' ? 'offline' : 'ACTIVE',
            ...(user.role === 'GUARD' && assignedSite ? { siteId: assignedSite.id, siteName: assignedSite.name } : {}),
            accountStatus: 'ACTIVE',
            createdAt,
            updatedAt: createdAt,
        };
        const profileRef = db.collection(collectionName).doc(created.uid);
        const auditRef = db.collection('audit_events').doc();
        const batch = db.batch();
        batch.create(profileRef, storedProfile);
        batch.create(auditRef, {
            tenantId: user.tenantId,
            actorUserId: request.auth.uid,
            actorName: caller.name || request.auth.token.email || 'Administrator',
            actorRole: callerRole,
            action: 'USER_PROVISIONED',
            entityType: 'user',
            entityId: created.uid,
            details: { targetRole: user.role, targetEmail: normalizedEmail },
            occurredAt: createdAt,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
        await batch.commit();
        return {
            uid: created.uid,
            user: { ...safeProfile, id: created.uid, name: user.name.trim(), email: normalizedEmail, status: 'ACTIVE', createdAt },
        };
    }
    catch (error) {
        if (createdUserId) {
            await (0, auth_1.getAuth)().deleteUser(createdUserId).catch((rollbackError) => {
                console.error('Unable to roll back provisioned user', rollbackError);
            });
        }
        if (error instanceof https_1.HttpsError)
            throw error;
        const code = error.code;
        if (code === 'auth/email-already-exists')
            throw new https_1.HttpsError('already-exists', 'This email already has a login. Use the existing account or another email.');
        if (code === 'auth/invalid-email')
            throw new https_1.HttpsError('invalid-argument', 'Enter a valid email address.');
        console.error('User provisioning failed', error);
        throw new https_1.HttpsError('internal', 'User provisioning failed. Ask your superadmin to verify the account before retrying.');
    }
});
function validatePassword(password) {
    if (typeof password !== 'string' || password.length < 12
        || !/[a-z]/.test(password)
        || !/[A-Z]/.test(password)
        || !/\d/.test(password)
        || !/[^A-Za-z0-9]/.test(password)) {
        throw new https_1.HttpsError('invalid-argument', 'Password must be at least 12 characters and include upper-case, lower-case, number, and symbol characters.');
    }
}
exports.listManagedUsers = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Sign in first.');
    const callerSnapshot = await db.collection('admin_users').doc(request.auth.uid).get();
    const caller = callerSnapshot.data();
    if (!callerSnapshot.exists || caller?.status !== 'ACTIVE') {
        throw new https_1.HttpsError('permission-denied', 'Only an active administrator can view managed users.');
    }
    const callerRole = caller.role;
    let usersSnapshot;
    if (callerRole === 'SUPERADMIN') {
        usersSnapshot = await db.collection('admin_users').get();
    }
    else if (callerRole === 'TENANT_ADMIN' && caller.tenantId) {
        usersSnapshot = await db.collection('admin_users').where('tenantId', '==', caller.tenantId).get();
    }
    else {
        throw new https_1.HttpsError('permission-denied', 'This account cannot manage user passwords.');
    }
    const users = usersSnapshot.docs.map((snapshot) => {
        const { temporaryPassword: _temporaryPassword, ...profile } = snapshot.data();
        return { ...profile, id: snapshot.id };
    });
    return { users };
});
exports.resetUserPassword = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Sign in first.');
    const callerSnapshot = await db.collection('admin_users').doc(request.auth.uid).get();
    const caller = callerSnapshot.data();
    if (!callerSnapshot.exists || caller?.status !== 'ACTIVE') {
        throw new https_1.HttpsError('permission-denied', 'Only an active administrator can reset passwords.');
    }
    const targetUserId = request.data.targetUserId?.trim();
    const newPassword = request.data.newPassword || '';
    if (!targetUserId)
        throw new https_1.HttpsError('invalid-argument', 'A target user is required.');
    validatePassword(newPassword);
    const adminRef = db.collection('admin_users').doc(targetUserId);
    const guardRef = db.collection('guards').doc(targetUserId);
    const [adminSnapshot, guardSnapshot] = await Promise.all([adminRef.get(), guardRef.get()]);
    const targetSnapshot = adminSnapshot.exists ? adminSnapshot : guardSnapshot;
    const targetRef = adminSnapshot.exists ? adminRef : guardRef;
    const target = targetSnapshot.data();
    if (!targetSnapshot.exists || !target) {
        throw new https_1.HttpsError('not-found', 'The selected user account was not found.');
    }
    const callerRole = caller.role;
    const targetRole = (target.role || (guardSnapshot.exists ? 'GUARD' : ''));
    const targetTenantId = target.tenantId;
    const callerTenantId = caller.tenantId;
    if (targetRole === 'SUPERADMIN') {
        throw new https_1.HttpsError('permission-denied', 'Superadmin passwords cannot be reset from the tenant directory.');
    }
    const superadminMayReset = callerRole === 'SUPERADMIN';
    const tenantAdminMayReset = callerRole === 'TENANT_ADMIN'
        && userPolicy_js_1.ordinaryUserRoles.has(targetRole)
        && Boolean(callerTenantId)
        && callerTenantId === targetTenantId;
    if (!superadminMayReset && !tenantAdminMayReset) {
        throw new https_1.HttpsError('permission-denied', targetRole === 'TENANT_ADMIN'
            ? 'Only a superadmin can reset an administrator password.'
            : 'Tenant administrators may reset only ordinary users in their own tenant.');
    }
    await (0, auth_1.getAuth)().updateUser(targetUserId, { password: newPassword });
    const changedAt = new Date().toISOString();
    await targetRef.set({
        temporaryPassword: firestore_1.FieldValue.delete(),
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
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return { success: true };
});
exports.setUserEnabled = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Sign in first.');
    const callerSnapshot = await db.collection('admin_users').doc(request.auth.uid).get();
    const caller = callerSnapshot.data();
    if (!callerSnapshot.exists || caller?.status !== 'ACTIVE') {
        throw new https_1.HttpsError('permission-denied', 'Only an active administrator can manage user access.');
    }
    const targetUserId = request.data.targetUserId?.trim();
    const enabled = request.data.enabled;
    if (!targetUserId || typeof enabled !== 'boolean') {
        throw new https_1.HttpsError('invalid-argument', 'A target user and access state are required.');
    }
    if (targetUserId === request.auth.uid) {
        throw new https_1.HttpsError('failed-precondition', 'You cannot disable your own account.');
    }
    const adminRef = db.collection('admin_users').doc(targetUserId);
    const guardRef = db.collection('guards').doc(targetUserId);
    const [adminSnapshot, guardSnapshot] = await Promise.all([adminRef.get(), guardRef.get()]);
    const targetSnapshot = adminSnapshot.exists ? adminSnapshot : guardSnapshot;
    const targetRef = adminSnapshot.exists ? adminRef : guardRef;
    const target = targetSnapshot.data();
    if (!targetSnapshot.exists || !target) {
        throw new https_1.HttpsError('not-found', 'The selected user account was not found.');
    }
    const callerRole = caller.role;
    const targetRole = (target.role || (guardSnapshot.exists ? 'GUARD' : ''));
    const targetTenantId = target.tenantId;
    const callerTenantId = caller.tenantId;
    if (targetRole === 'SUPERADMIN') {
        throw new https_1.HttpsError('permission-denied', 'Superadmin access cannot be changed from the tenant directory.');
    }
    const superadminMayManage = callerRole === 'SUPERADMIN';
    const tenantAdminMayManage = callerRole === 'TENANT_ADMIN'
        && userPolicy_js_1.ordinaryUserRoles.has(targetRole)
        && Boolean(callerTenantId)
        && callerTenantId === targetTenantId;
    if (!superadminMayManage && !tenantAdminMayManage) {
        throw new https_1.HttpsError('permission-denied', targetRole === 'TENANT_ADMIN'
            ? 'Only a superadmin can change an administrator account.'
            : 'Tenant administrators may manage only ordinary users in their own tenant.');
    }
    await (0, auth_1.getAuth)().updateUser(targetUserId, { disabled: !enabled });
    if (!enabled)
        await (0, auth_1.getAuth)().revokeRefreshTokens(targetUserId);
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
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return { success: true, status: enabled ? 'ACTIVE' : 'SUSPENDED' };
});
