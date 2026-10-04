# AegisOps Security Command Center

A multi-tenant React, Firebase Auth, Firestore, and Cloud Functions security
operations console for guard telemetry, incident response, QR checkpoint
verification, scheduling, reporting, and billing.

## Firebase setup

1. Create a Firebase project and enable **Authentication > Email/Password**.
2. Create a Firestore database in production mode.
3. Register a Web app and an Android app. The Android package name is
   `com.aistudio.guardmonitor.vxpqtr`.
4. Copy `.env.example` to `.env.local` and paste the Web app configuration.
5. Download the Android `google-services.json` into
   `../aegis-guard-system/app/google-services.json`.
6. Install the Firebase CLI, sign in, and select the project:

   ```powershell
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```

7. Deploy the tenant security rules, indexes, and server-authoritative QR
   functions:

   ```powershell
   firebase deploy --only firestore:rules,firestore:indexes,functions
   ```

The callable functions require the Firebase Blaze plan because Cloud Functions
deployment uses billable Google Cloud infrastructure.

## Launch the admin console

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

Without valid Firebase variables, the admin console runs in local demo mode.
With Firebase configured, Email/Password authentication and an active
`admin_users/{firebaseUid}` profile are required.

## Build the Android app

From `../aegis-guard-system`, run the Gradle `assembleDebug` task in Android
Studio or from a configured Gradle installation. The APK is written to
`app/build/outputs/apk/debug/app-debug.apk`.

The mobile app is a client only. QR clock-in and checkpoint verification are
validated by deployed Firebase callable functions before operational state is
changed.

## Publish on a custom domain

Firebase Hosting is configured to serve the production `dist` build and route
all application URLs back to `index.html`.

1. Add the production Firebase values to `.env.local`.
2. Authenticate with `firebase login` and link the project using
   `firebase use --add`.
3. Run `npm run deploy`.
4. In Firebase Console, open **Hosting > Add custom domain**, enter the domain,
   and copy the supplied DNS records to your domain registrar.

The selected production address is `https://secureshift.site`. Add both
`secureshift.site` and `www.secureshift.site` in Firebase Hosting, redirect the
`www` hostname to the root domain, and add `secureshift.site` under
**Firebase Authentication > Settings > Authorized domains** so every supported
sign-in can complete on the production hostname. Firebase provisions HTTPS
after the DNS changes propagate.
