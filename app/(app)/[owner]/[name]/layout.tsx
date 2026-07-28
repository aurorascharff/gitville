import { Crossfade } from '@/components/ui/crossfade';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { VillageErrorFallback } from './village-error-fallback';

export default function RepoVillageLayout({ children }: LayoutProps<'/[owner]/[name]'>) {
  return (
    <ErrorBoundary fallback={<VillageErrorFallback title="This village couldn’t load" />}>
      <Crossfade>{children}</Crossfade>
    </ErrorBoundary>
  );
}
