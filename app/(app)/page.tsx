import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { HiveViewSkeleton } from '@/features/hive/components/hive-view';
import { getPinnedRepos } from '@/features/repo/repo-cookie';
import type { Route } from 'next';

// Lands on the first watched repo. The cookie read is dynamic, so it suspends behind
// the same skeleton the destination shows — the handoff is seamless.
export default function HomePage() {
  return (
    <Suspense fallback={<HiveViewSkeleton />}>
      <RedirectToFirstRepo />
    </Suspense>
  );
}

async function RedirectToFirstRepo() {
  const repos = await getPinnedRepos();
  redirect(`/${repos[0]}` as Route);
  return null;
}
