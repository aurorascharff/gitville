import { cn } from '@/lib/utils';

// Plain <img> to skip next/image remote-domain config.
export function RepoAvatar({
  src,
  name,
  size = 20,
  className,
}: {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    return (
      <span
        style={{ height: size, width: size, fontSize: Math.round(size * 0.42) }}
        className={cn(
          'bg-secondary text-foreground inline-flex shrink-0 items-center justify-center rounded-md font-semibold',
          className,
        )}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} width={size} height={size} className={cn('shrink-0 rounded-md', className)} />;
}
