import { AvatarImage } from '@/components/ui/avatar-image';

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
  return <AvatarImage src={src} name={name} size={size} className={className} />;
}
