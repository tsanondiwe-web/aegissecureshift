"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTenantAdmin = exports.verifyCheckpointQr = exports.clockInWithQr = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
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
    if (guard.status === 'SUSPENDED')
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
exports.createTenantAdmin = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Sign in first.');
    const caller = await db.collection('admin_users').doc(request.auth.uid).get();
    if (!caller.exists || caller.data()?.role !== 'SUPERADMIN' || caller.data()?.status !== 'ACTIVE') {
        throw new https_1.HttpsError('permission-denied', 'Only an active superadmin can create tenant administrators.');
    }
    const user = request.data.user;
    if (!user.email || !user.temporaryPassword) {
        throw new https_1.HttpsError('invalid-argument', 'Email and temporary password are required.');
    }
    const created = await (0, auth_1.getAuth)().createUser({
        email: user.email,
        password: user.temporaryPassword,
        displayName: user.name,
    });
    const collectionName = user.role === 'GUARD' ? 'guards' : 'admin_users';
    await db.collection(collectionName).doc(created.uid).set({
        ...user,
        id: created.uid,
        status: user.role === 'GUARD' ? 'offline' : user.status,
        accountStatus: user.status,
        createdAt: new Date().toISOString(),
    });
    return { uid: created.uid };
});
