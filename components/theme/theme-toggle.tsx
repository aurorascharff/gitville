'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
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

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const active = mounted ? theme : undefined;

  return (
    <div className="inline-flex items-center rounded-md border p-0.5">
      <ToggleButton active={active === 'light'} label="Light" onClick={() => setTheme('light')}>
        <Sun className="size-3.5" />
      </ToggleButton>
      <ToggleButton active={active === 'dark'} label="Dark" onClick={() => setTheme('dark')}>
        <Moon className="size-3.5" />
      </ToggleButton>
      <ToggleButton active={active === 'system'} label="System" onClick={() => setTheme('system')}>
        <Monitor className="size-3.5" />
      </ToggleButton>
    </div>
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
        'cursor-pointer rounded-[5px] p-1.5 transition-colors',
        active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
