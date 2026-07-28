import { cn } from '@/lib/utils';
import type { CSSProperties, ReactNode } from 'react';

const ANCHORS = {
  'top-left': undefined,
  center: 'translate(-50%, -50%)',
  bottom: 'translate(-50%, -100%)',
} as const;

type Anchor = keyof typeof ANCHORS | [number, number];

function anchorTransform(anchor: Anchor): string | undefined {
  if (Array.isArray(anchor)) return `translate(${anchor[0]}%, ${anchor[1]}%)`;
  return ANCHORS[anchor];
}

export function Placed({
  x,
  y,
  anchor = 'center',
  className,
  style,
  children,
}: {
  x: number;
  y: number;
  anchor?: Anchor;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden
      className={cn('absolute', className)}
      style={{ left: x, top: y, transform: anchorTransform(anchor), ...style }}
    >
      {children}
    </span>
  );
}
