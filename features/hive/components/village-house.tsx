'use client';

import { useHive } from '@/features/hive/hive-context';
import { cn } from '@/lib/utils';
import type { Cell } from '@/features/hive/hive-world-model';

const ROOF: Record<Cell['kind'], string> = {
  main: 'var(--brand)',
  pr: '#3f7fb8',
  branch: '#b06a3b',
  inbox: '#7d8590',
};

// A pixel house on the map. More commits = a bigger house; people inside = lit windows.
export function VillageHouse({ cell }: { cell: Cell }) {
  const { occupied, weights, focusId, setFocusId, setTip } = useHive();
  const people = occupied.get(cell.id) ?? 0;
  const built = weights.get(cell.id) ?? 0;
  const main = cell.kind === 'main';
  const lit = people > 0;
  const w = main ? 168 : built >= 10 ? 156 : built >= 3 ? 132 : 112;
  const wallH = Math.round(w * 0.42);
  const roofH = Math.round(w * 0.34);

  return (
    <button
      type="button"
      onClick={() => setFocusId(focusId === cell.id ? null : cell.id)}
      onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, title: cell.label, body: cell.sub, when: null })}
      onMouseLeave={() => setTip(null)}
      aria-label={`Enter ${cell.label}`}
      className="group absolute block cursor-pointer transition-transform duration-300 hover:-translate-y-1"
      style={{
        left: cell.x,
        top: cell.y,
        transform: 'translate(-50%, -58%)',
        filter: lit ? 'drop-shadow(0 10px 22px rgb(255 214 106 / 0.25))' : 'drop-shadow(0 10px 18px rgb(0 0 0 / 0.45))',
      }}
    >
      <div className="pixel relative flex flex-col items-center">
        {main ? (
          <span aria-hidden className="absolute -top-7 left-1/2 flex -translate-x-1/2 flex-col items-center">
            <span className="h-0 w-0 border-y-[5px] border-l-8 border-y-transparent border-l-brand" style={{ transform: 'translate(9px, 2px)' }} />
            <span className="h-6 w-0.5 bg-[#5a4632]" />
          </span>
        ) : null}

        {/* Roof */}
        <div
          aria-hidden
          style={{
            width: w,
            height: roofH,
            background: ROOF[cell.kind],
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            filter: 'brightness(0.92)',
          }}
        />
        {/* Wall */}
        <div className="relative" style={{ width: Math.round(w * 0.82), height: wallH, background: '#c9a06b', boxShadow: 'inset 0 -6px 0 #a87f4f' }}>
          {/* Windows: lit when someone is inside. */}
          <span
            aria-hidden
            className={cn('absolute top-2 left-2 h-4 w-4 border-2 border-[#8a6a44]', lit ? 'window-glow bg-[#ffd76a]' : 'bg-[#3a3f4a]')}
          />
          <span
            aria-hidden
            className={cn('absolute top-2 right-2 h-4 w-4 border-2 border-[#8a6a44]', lit ? 'window-glow bg-[#ffd76a]' : 'bg-[#3a3f4a]')}
          />
          {/* Door */}
          <span aria-hidden className="absolute bottom-0 left-1/2 h-6 w-4 -translate-x-1/2 bg-[#5a4632]">
            <span className="absolute top-2 right-0.5 h-1 w-1 rounded-full bg-[#e4c05a]" />
          </span>
        </div>

        {/* Sign */}
        <div className="mt-1.5 flex max-w-40 flex-col items-center rounded-sm border border-black/30 bg-[#f0e6d2] px-1.5 py-0.5 text-center shadow">
          <p className="w-full truncate font-mono text-[10px] font-bold text-[#3a2f22]">{cell.label}</p>
          {cell.sub && !main ? <p className="line-clamp-1 w-full text-[8px] leading-tight text-[#6b5b43]">{cell.sub}</p> : null}
        </div>

        {people > 0 ? (
          <span className="absolute -top-2 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 font-mono text-[10px] font-bold text-brand-foreground shadow">
            {people}
          </span>
        ) : null}
        {cell.draft ? (
          <span className="absolute top-[30%] left-1/2 -translate-x-1/2 rounded-sm bg-black/50 px-1 font-mono text-[8px] text-white/80">draft</span>
        ) : null}
      </div>
    </button>
  );
}
