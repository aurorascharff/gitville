import { Suspense } from 'react';
import { VillagePanels, VillageHud } from '@/features/village/components/overlay/village-overlays';
import { VillageStage } from '@/features/village/components/stage/village-stage';
import { VillageDataProvider } from '@/features/village/components/village-data-provider';
import { VillageViewport, VillageViewportSkeleton } from '@/features/village/components/village-viewport';

export async function generateMetadata({ params }: PageProps<'/[owner]/[name]'>) {
  const { owner, name } = await params;
  return { title: `${owner}/${name}` };
}

export default function RepoVillagePage({ params }: PageProps<'/[owner]/[name]'>) {
  return (
    <Suspense fallback={<VillageViewportSkeleton />}>
      {params.then(({ owner, name }) => {
        const slug = `${owner}/${name}`;
        return (
          <VillageDataProvider slug={slug}>
            <VillageViewport>
              <VillageStage slug={slug} />
              <VillageHud slug={slug} />
              <VillagePanels />
            </VillageViewport>
          </VillageDataProvider>
        );
      })}
    </Suspense>
  );
}
