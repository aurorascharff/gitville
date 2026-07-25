// pg treats `sslmode=require` as `verify-full` today but warns about a future semantics
// change. Make it explicit (matching the intended strong-TLS behavior against Neon).
export function normalizeDatabaseUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.searchParams.get('sslmode') !== 'disable') {
      u.searchParams.set('sslmode', 'verify-full');
    }
    return u.toString();
  } catch {
    return url;
  }
}
