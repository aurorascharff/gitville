import { ViewTransition } from 'react';

// Cross-fades streamed Suspense content in as it resolves instead of hard-swapping.
export function Crossfade({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="auto" default="none">
      {children}
    </ViewTransition>
  );
}
