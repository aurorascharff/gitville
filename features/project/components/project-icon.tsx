import { Compass, Feather, Flame, Network, Orbit, Sparkles, Triangle, Waves, type LucideIcon } from 'lucide-react';
import type { ProjectIconName } from '@/types/project';

const PROJECT_ICONS: Record<ProjectIconName, LucideIcon> = {
  compass: Compass,
  feather: Feather,
  flame: Flame,
  orbit: Orbit,
  prism: Triangle,
  waves: Waves,
  mesh: Network,
  aurora: Sparkles,
};

export function ProjectIcon({ name, size = 20, className }: { name: ProjectIconName; size?: number; className?: string }) {
  const Icon = PROJECT_ICONS[name];
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" className={className} />;
}
