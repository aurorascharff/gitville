'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

const subscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

// Day / night for the village — two suns-worth of options, nothing more.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const active = mounted ? resolvedTheme : undefined;

  return (
    <div className="inline-flex h-full items-center gap-0.5 px-1">
      <ToggleButton active={active === 'light'} label="Day" onClick={() => setTheme('light')}>
        <PixelSun />
      </ToggleButton>
      <ToggleButton active={active === 'dark'} label="Night" onClick={() => setTheme('dark')}>
        <PixelMoon />
      </ToggleButton>
    </div>
  );
}

// Hand-set pixel icons — lucide's smooth curves don't belong in the village.
function PixelSun() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="3" width="3" height="3" fill="currentColor" />
      <rect x="4" y="0" width="1" height="2" fill="currentColor" />
      <rect x="4" y="7" width="1" height="2" fill="currentColor" />
      <rect x="0" y="4" width="2" height="1" fill="currentColor" />
      <rect x="7" y="4" width="2" height="1" fill="currentColor" />
      <rect x="1" y="1" width="1" height="1" fill="currentColor" />
      <rect x="7" y="1" width="1" height="1" fill="currentColor" />
      <rect x="1" y="7" width="1" height="1" fill="currentColor" />
      <rect x="7" y="7" width="1" height="1" fill="currentColor" />
    </svg>
  );
}

function PixelMoon() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="0" width="3" height="1" fill="currentColor" />
      <rect x="2" y="1" width="2" height="1" fill="currentColor" />
      <rect x="1" y="2" width="2" height="2" fill="currentColor" />
      <rect x="1" y="4" width="3" height="2" fill="currentColor" />
      <rect x="2" y="6" width="3" height="1" fill="currentColor" />
      <rect x="3" y="7" width="4" height="1" fill="currentColor" />
      <rect x="6" y="6" width="2" height="1" fill="currentColor" />
    </svg>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} theme`}
      aria-pressed={active}
      className={cn(
        'cursor-pointer rounded-xs p-1 transition-colors',
        active ? 'bg-[#4a3826] text-[#f0e6d2]' : 'text-[#8a6d2a] hover:text-[#3a2f22]',
      )}
    >
      {children}
    </button>
  );
}
