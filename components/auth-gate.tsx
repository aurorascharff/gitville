import { verifyAuth } from '@/features/user/user-queries';

// Reads the session cookie and redirects to /login when absent. Rendered inside a
// Suspense boundary in the app layout so the shell stays static under Cache Components.
export async function AuthGate() {
  await verifyAuth();
  return null;
}
