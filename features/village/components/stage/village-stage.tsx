import { notFound } from 'next/navigation';
import { getRepoData } from '@/features/repo/repo-queries';
import { NightTint, VillageSky } from '@/features/village/components/stage/ambience';
import { GrassPatches } from '@/features/village/components/stage/background';
import { VillageStageSurface } from '@/features/village/components/stage/stage-surface';

export async function VillageStage({ slug }: { slug: string }) {
  const repo = await getRepoData(slug);
  if (!repo) notFound();

  return (
    <VillageStageSurface
      repo={repo}
      terrain={
        <>
          <GrassPatches />
          <NightTint />
        </>
      }
      sky={<VillageSky />}
    />
  );
}
