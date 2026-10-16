# Test-site deployment and acceptance

Target: Firebase project `shift-a01ac`, Hosting site `shift-a01ac`, custom domain
`https://test.secureshift.org`. No live Firebase deployment was performed by the
cloud development session: Firebase authentication is unavailable there.

## Prepare your existing checkout

Keep your existing `.env.local` and Firebase configuration. Pull the updated
GitHub main branch or replace source files from the GitHub ZIP. Do not copy a
demo build over the live website. This repository still permits local demo mode
when Firebase variables are missing; the live build needs the real Web app's
Firebase configuration from Project settings. Never use an Admin SDK private
key or service-account credentials as Vite variables.

In PowerShell from the project root:

```powershell
npm.cmd install --package-lock=false
npm.cmd ci --prefix functions
npm.cmd run lint
npm.cmd run test:access
npm.cmd run build
```

The supplied root dependency lockfile has pre-existing incomplete platform
entries, so root installation uses `--package-lock=false`. This change does not
update dependencies. The Cloud Functions deployment runtime remains Node 22.

After checks succeed, use your existing Firebase login:

```powershell
npx.cmd --yes firebase-tools deploy --only "functions,firestore:rules,hosting" --project shift-a01ac
```

Deploy all three components: Hosting alone will not install the provisioning
function changes or updated Firestore rules. These changes do not seed, delete
or migrate existing companies, user accounts or passwords.

## Administrator access requirements

- Enable Firebase Authentication's Email/Password provider.
- The administrator must have an existing Firebase Auth account AND an
  `admin_users/{AUTH_UID}` profile. The document ID must equal the Auth UID, not
  an email or an unrelated record ID. Profiles are never auto-created on login.
- Supported console roles are SUPERADMIN, TENANT_ADMIN, SUPERVISOR and DISPATCHER.
  The profile must have status ACTIVE. Guards continue using the mobile app.
- Tenant accounts must reference an existing tenant. A superadmin can sign in
  with no tenants and provision the first one through the existing tenant UI.
- Confirm the domain is registered under Authentication > Settings > Authorized
  domains. Missing profiles, disabled accounts, provider/configuration failures
  and connectivity problems now produce actionable errors.
- If a legacy profile uses another document ID, have the project owner verify
  its identity and preserve its fields before repairing the UID association in
  Firebase Console. This release does not promote accounts automatically or
  reset existing passwords.

## Acceptance using test accounts

1. Sign in as the test superadmin. Verify the minimalist Overview, full-map
   toggle and preference persistence. Confirm there are no account-switching or
   impersonation controls and no blue/green text on login, pages or dialogs.
2. Open Staff & Users, select the intended tenant and choose Add User to Tenant.
   Create a TEST tenant administrator with an unused test email. The returned
   UID must match both Firebase Auth and the admin_users document ID. Check the
   success view remains visible and never writes the password to Firestore.
3. Sign out and sign in as that test administrator. Verify only its own tenant
   is available. Check ordinary-user creation in that tenant. Creating tenant
   administrators requires SUPERADMIN; guards require a specific tenant site.
4. Confirm a duplicate email reports a clear error. Failure to persist a new
   profile must roll back the newly created Auth login.
5. Verify tenant admins cannot provision users in another company, unknown
   roles are rejected, tenant-bound records cannot be moved to another tenant,
   suspended profiles cannot access tenant data and guards cannot change their
   own accountStatus/site/role fields.
6. Check password reset and enable/disable controls using test users only.
   Sign out and confirm the previous company's records and open dialogs clear.
7. Check mobile navigation, roster access, live map and emergency alerts.

Automated validation includes TypeScript, both builds, isolated policy/server
request tests, and browser tests with an explicitly mocked Firebase backend.
Live Firebase sign-in, deployed callables and Firestore-rule enforcement still
need the above acceptance. The Firestore emulator download was blocked by the
cloud network, so no emulator or live-rules pass is claimed.
