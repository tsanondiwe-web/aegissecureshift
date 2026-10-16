export const tenantUserRoles = new Set(['TENANT_ADMIN', 'DISPATCHER', 'SUPERVISOR', 'GUARD']);
export const ordinaryUserRoles = new Set(['DISPATCHER', 'SUPERVISOR', 'GUARD']);

export function mayCreateTenantUser(caller: { role?: string; status?: string; tenantId?: string }, role: string, tenantId: string) {
  if (caller.status !== 'ACTIVE' || !tenantUserRoles.has(role) || !tenantId) return false;
  return caller.role === 'SUPERADMIN' || caller.role === 'TENANT_ADMIN'
    && ordinaryUserRoles.has(role) && caller.tenantId === tenantId;
}

export function safeIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !value.includes('/');
}
