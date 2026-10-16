/** Public sign-in messages: no raw SDK details or account enumeration. */
export function firebaseAuthMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-credential': case 'auth/invalid-login-credentials':
    case 'auth/wrong-password': case 'auth/user-not-found':
      return 'The email or password is incorrect.';
    case 'auth/user-disabled': return 'This account is disabled. Contact your administrator.';
    case 'auth/too-many-requests': return 'Too many attempts. Wait a few minutes before trying again.';
    case 'auth/network-request-failed': return 'Unable to connect. Check your internet connection and try again.';
    case 'auth/operation-not-allowed': return 'Email/password sign-in is not enabled in Firebase Authentication. Contact your administrator.';
    case 'auth/unauthorized-domain': return 'This website is not authorized for Firebase sign-in. Contact your administrator.';
    case 'auth/invalid-api-key': return 'Firebase configuration is invalid. Contact your administrator.';
    default: return 'Unable to sign in. Try again or contact your administrator.';
  }
}

export function createTemporaryPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return 'Aa1!' + Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}
