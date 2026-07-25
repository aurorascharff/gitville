'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type MenuOption<T extends string> = { value: T; label: string; icon?: React.ReactNode };

// Lightweight popover menu: a trigger + a list of options. Closes on outside click / Escape.
export function Menu<T extends string>({
  trigger,
  options,
  value,
  onSelect,
  align = 'start',
  label,
}: {
  trigger: React.ReactNode;
  options: MenuOption<T>[];
  value?: T;
  onSelect: (value: T) => void;
  align?: 'start' | 'end';
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(o => !o);
        }}
        className="inline-flex items-center"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border bg-popover p-1 shadow-xl',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              role="menuitemradio"
              aria-checked={value === opt.value}
              onClick={e => {
                e.stopPropagation();
                setOpen(false);
                if (opt.value !== value) onSelect(opt.value);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-accent',
                value === opt.value ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {opt.icon ? <span className="flex w-4 justify-center">{opt.icon}</span> : null}
              <span className="flex-1 truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
