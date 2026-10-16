import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firebaseAuthMessage, createTemporaryPassword } from '../src/lib/access';
import { mayCreateTenantUser, safeIdentifier } from '../functions/src/userPolicy';

test('superadmin may create supported tenant roles but cannot mint a superadmin or unknown role', () => {
  const owner = { role: 'SUPERADMIN', status: 'ACTIVE' };
  for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'DISPATCHER', 'GUARD']) assert.equal(mayCreateTenantUser(owner, role, 'company-a'), true);
  for (const role of ['SUPERADMIN', 'OWNER', '', 'superadmin']) assert.equal(mayCreateTenantUser(owner, role, 'company-a'), false);
});
test('tenant administrators cannot cross tenant boundaries or create administrators', () => {
  const admin = { role: 'TENANT_ADMIN', status: 'ACTIVE', tenantId: 'company-a' };
  assert.equal(mayCreateTenantUser(admin, 'DISPATCHER', 'company-a'), true);
  assert.equal(mayCreateTenantUser(admin, 'GUARD', 'company-b'), false);
  assert.equal(mayCreateTenantUser(admin, 'TENANT_ADMIN', 'company-a'), false);
});
test('inactive accounts and ordinary operators cannot provision users', () => {
  for (const role of ['SUPERADMIN', 'TENANT_ADMIN', 'DISPATCHER', 'GUARD']) {
    assert.equal(mayCreateTenantUser({ role, status: 'SUSPENDED', tenantId: 'a' }, 'GUARD', 'a'), false);
  }
  assert.equal(mayCreateTenantUser({role:'DISPATCHER',status:'ACTIVE',tenantId:'a'}, 'GUARD', 'a'),false);
});
test('invalid identifiers cannot select other Firestore paths', () => {
  for (const id of ['', '  ', '../tenants/a', 123, null]) assert.equal(safeIdentifier(id), false);
  assert.equal(safeIdentifier('tenant-123'), true);
});
test('sign-in failures do not disclose whether the email exists', () => {
  assert.equal(firebaseAuthMessage({code:'auth/user-not-found'}), firebaseAuthMessage({code:'auth/wrong-password'}));
  assert.match(firebaseAuthMessage({code:'auth/operation-not-allowed'}), /not enabled/);
  assert.match(firebaseAuthMessage({code:'auth/network-request-failed'}), /connection/);
  assert.doesNotMatch(firebaseAuthMessage(new Error('private details')), /private details/);
});
test('temporary credentials are random and satisfy the server password policy', () => {
  const passwords = new Set(Array.from({length: 30}, createTemporaryPassword));
  assert.equal(passwords.size,30);
  for (const p of passwords) {
    assert.ok(p.length >= 12);assert.match(p,/[A-Z]/);assert.match(p,/[a-z]/);assert.match(p,/\d/);assert.match(p,/[^a-zA-Z0-9]/);
  }
});
