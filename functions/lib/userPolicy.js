"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordinaryUserRoles = exports.tenantUserRoles = void 0;
exports.mayCreateTenantUser = mayCreateTenantUser;
exports.safeIdentifier = safeIdentifier;
exports.tenantUserRoles = new Set(['TENANT_ADMIN', 'DISPATCHER', 'SUPERVISOR', 'GUARD']);
exports.ordinaryUserRoles = new Set(['DISPATCHER', 'SUPERVISOR', 'GUARD']);
function mayCreateTenantUser(caller, role, tenantId) {
    if (caller.status !== 'ACTIVE' || !exports.tenantUserRoles.has(role) || !tenantId)
        return false;
    return caller.role === 'SUPERADMIN' || caller.role === 'TENANT_ADMIN'
        && exports.ordinaryUserRoles.has(role) && caller.tenantId === tenantId;
}
function safeIdentifier(value) {
    return typeof value === 'string' && value.trim().length > 0 && !value.includes('/');
}
