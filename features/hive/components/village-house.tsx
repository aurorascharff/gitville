'use client';

import { travelTo } from '@/features/hive/components/player';
import { useHiveUi } from '@/features/hive/hive-ui-context';
import type { Cell } from '@/features/hive/hive-world-model';
import { cn } from '@/lib/utils';

const ROOF: Record<Cell['kind'], string> = {
  main: 'var(--brand)',
  pr: '#3f7fb8',
  branch: '#b06a3b',
  issue: '#8a6a9d',
  inbox: '#7d8590',
};

export function VillageHouse({ cell, people, built }: { cell: Cell; people: number; built: number }) {
  const { focusId, setFocusId, setTip } = useHiveUi();
  const lit = people > 0;

  return (
    <button
      type="button"
      onClick={() => {
        if (focusId === cell.id) setFocusId(null);
        else travelTo({ x: cell.x, y: cell.y + 44, cellId: cell.id });
      }}
      onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, title: cell.label, body: cell.sub, when: null })}
      onMouseLeave={() => setTip(null)}
      aria-label={`Enter ${cell.label}`}
      className="group absolute block cursor-pointer transition-transform duration-300 hover:-translate-y-1"
      style={{
        left: cell.x,
        top: cell.y,
        transform: 'translate(-50%, -58%)',
        filter: lit ? 'drop-shadow(0 10px 22px rgb(255 214 106 / 0.25))' : 'drop-shadow(0 10px 18px rgb(0 0 0 / 0.35))',
      }}
    >
      <div className="pixel relative flex flex-col items-center">
        {cell.kind === 'inbox' ? <Well lit={lit} /> : <House cell={cell} built={built} lit={lit} />}

        <div className="mt-1.5 flex max-w-48 flex-col items-center rounded-sm border border-black/30 bg-[#f0e6d2] px-1.5 py-0.5 text-center shadow">
          <p className="w-full truncate font-pixel text-[13px] leading-4 font-bold text-[#3a2f22]">{cell.label}</p>
          {cell.sub && cell.kind !== 'main' ? (
            <p className="line-clamp-1 w-full text-[10px] leading-tight text-[#6b5b43]">{cell.sub}</p>
          ) : null}
        </div>

        {people > 0 ? (
          <span className="bg-brand text-brand-foreground absolute -top-2 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold shadow">
            {people}
          </span>
        ) : null}
        {cell.draft ? (
          <span className="absolute top-[30%] left-1/2 -translate-x-1/2 rounded-sm bg-black/50 px-1 font-mono text-[8px] text-white/80">
            draft
          </span>
        ) : null}
      </div>
    </button>
  );
}

function House({ cell, built, lit }: { cell: Cell; built: number; lit: boolean }) {
  const main = cell.kind === 'main';
  const w = main ? 168 : built >= 10 ? 156 : built >= 3 ? 132 : 112;
  const wallH = Math.round(w * 0.42);
  const roofH = Math.round(w * 0.34);

  return (
    <>
      {main ? (
        <span aria-hidden className="absolute -top-7 left-1/2 flex -translate-x-1/2 flex-col items-center">
          <span
            className="border-l-brand h-0 w-0 border-y-[5px] border-l-8 border-y-transparent"
            style={{ transform: 'translate(9px, 2px)' }}
          />
          <span className="h-6 w-0.5 bg-[#5a4632]" />
        </span>
      ) : null}
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
      <div
        className="relative"
        style={{
          width: Math.round(w * 0.82),
          height: wallH,
          background: '#c9a06b',
          boxShadow: 'inset 0 -6px 0 #a87f4f',
        }}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-2 left-2 h-4 w-4 border-2 border-[#8a6a44]',
            lit ? 'window-glow bg-[#ffd76a]' : 'bg-[#3a3f4a]',
          )}
        />
        <span
          aria-hidden
          className={cn(
            'absolute top-2 right-2 h-4 w-4 border-2 border-[#8a6a44]',
            lit ? 'window-glow bg-[#ffd76a]' : 'bg-[#3a3f4a]',
          )}
        />
        <span aria-hidden className="absolute bottom-0 left-1/2 h-6 w-4 -translate-x-1/2 bg-[#5a4632]">
          <span className="absolute top-2 right-0.5 h-1 w-1 rounded-full bg-[#e4c05a]" />
        </span>
      </div>
    </>
  );
}

// The town square is a stone well, not another house.
function Well({ lit }: { lit: boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        aria-hidden
        style={{ width: 96, height: 26, background: '#8a5a33', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
      />
      <div className="flex h-5 items-end justify-between" style={{ width: 74 }}>
        <span className="h-full w-1.5 bg-[#6b4223]" />
        <span
          aria-hidden
          className={cn('mb-0.5 h-2.5 w-3 border border-[#5a4632]', lit ? 'window-glow bg-[#ffd76a]' : 'bg-[#8a6a44]')}
        />
        <span className="h-full w-1.5 bg-[#6b4223]" />
      </div>
      <div
        className="h-8 rounded-sm"
        style={{ width: 86, background: '#9aa0a8', boxShadow: 'inset 0 3px 0 #b6bcc4, inset 0 -4px 0 #70767e' }}
      >
        <span
          aria-hidden
          className="mx-auto mt-2 block h-3.5 w-10 rounded-sm bg-[#2b3d55] shadow-[inset_0_2px_0_#3d5career]"
          style={{ boxShadow: 'inset 0 2px 0 #3d5578' }}
        />
      </div>
    </div>
  );
}
