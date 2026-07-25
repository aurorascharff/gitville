'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export type MenuOption<T extends string> = { value: T; label: string; icon?: React.ReactNode };

type Pos = { top: number; left?: number; right?: number };

// Popover menu rendered in a portal with fixed positioning, so it is never clipped by a
// scroll container (e.g. the issue side panel). Closes on outside click / Escape / scroll.
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
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos(align === 'end' ? { top: r.bottom + 4, right: window.innerWidth - r.right } : { top: r.bottom + 4, left: r.left });
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
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
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ position: 'fixed', top: pos.top, left: pos.left, right: pos.right }}
              className="z-[60] max-h-[280px] min-w-[190px] overflow-y-auto rounded-lg border bg-popover p-1 shadow-xl"
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
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
