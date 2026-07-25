import { RefreshCw } from 'lucide-react';

// Loop's mark: a sync/loop glyph on the brand tile — nods to the poll-and-revalidate core.
export function LoopMark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ height: size, width: size }} className="inline-flex items-center justify-center rounded-md bg-brand">
      <RefreshCw size={Math.round(size * 0.56)} strokeWidth={2.6} className="text-brand-foreground" />
    </span>
  );
}
