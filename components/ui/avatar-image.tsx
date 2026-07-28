import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function AvatarImage({
  src,
  name,
  alt = name,
  size = 20,
  className,
  fallbackClassName,
  children,
}: {
  src?: string | null;
  name: string;
  alt?: string;
  size?: number;
  className?: string;
  fallbackClassName?: string;
  children?: ReactNode;
}) {
  if (src) return <Image src={src} alt={alt} width={size} height={size} className={cn('shrink-0', className)} />;

  return (
    <span
      aria-hidden={alt === '' ? true : undefined}
      style={{ height: size, width: size, fontSize: Math.round(size * 0.42) }}
      className={cn(
        'bg-secondary text-foreground inline-flex shrink-0 items-center justify-center rounded-md font-semibold',
        fallbackClassName ?? className,
      )}
    >
      {children === undefined ? name.slice(0, 1).toUpperCase() : children}
    </span>
  );
}
