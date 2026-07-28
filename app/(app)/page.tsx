import { Suspense } from 'react';
import { HomeHeader } from '@/features/home/components/home-header';
import { HomeScenery } from '@/features/home/components/home-scenery';
import { SourceLink } from '@/features/home/components/source-link';
import { PinnedVillages, PinnedVillagesSkeleton } from '@/features/repo/components/pinned-villages';
import { WatchForm } from '@/features/repo/components/watch-form';

export default function HomePage() {
  return (
    <div
      className="grass-field relative min-h-dvh overflow-hidden"
      style={{ backgroundSize: '48px 48px, 68px 68px, 16px 16px' }}
    >
      <div aria-hidden className="village-vignette absolute inset-0" />
      <HomeScenery />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center justify-center gap-8 px-4 py-14">
        <HomeHeader />
        <Suspense fallback={<PinnedVillagesSkeleton />}>
          <PinnedVillages />
        </Suspense>
        <WatchForm />
        <SourceLink />
      </div>
    </div>
  );
}
