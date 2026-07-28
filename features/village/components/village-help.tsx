'use client';

import { useEffect, useState } from 'react';
import {
  cabinArt,
  cottageArt,
  FURNITURE,
  hallArt,
  housePalette,
  PixelSprite,
  ROOF,
  tentArt,
  WELL,
} from '@/features/village/components/pixel-sprite';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';

const PR_ROOF = housePalette(...ROOF.pr, true);
const MAIN_ROOF = housePalette(...ROOF.main, true);
const BRANCH_ROOF = housePalette(...ROOF.branch, false);
const ISSUE_ROOF = housePalette(...ROOF.issue, false);

export function VillageHelp() {
  const { focusId } = useVillageUi();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="What does everything mean?"
        className={cn(
          'panel font-pixel absolute bottom-5 z-50 flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm text-[16px] font-bold transition-transform hover:-translate-y-0.5',
          // Indoors the PR sidebar owns the left column; sit just right of it.
          focusId ? 'left-[calc(min(360px,40vw)+1rem)]' : 'left-4',
        )}
      >
        ?
      </button>
      {open ? (
        <div
          className="absolute inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
          onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
          <aside className="panel flex max-h-[86dvh] w-140 max-w-[92vw] flex-col overflow-hidden rounded-sm">
            <header className="panel-wood flex shrink-0 items-center justify-between border-x-0 border-t-0 px-5 py-2.5">
              <p className="font-pixel text-[18px] font-bold">How to read the village</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close (Esc)"
                className="font-pixel cursor-pointer text-[18px] font-bold text-[#e0d3b8] transition-colors hover:text-white"
              >
                ✕
              </button>
            </header>
            <ul className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
              <LegendRow
                art={hallArt()}
                palette={MAIN_ROOF}
                scale={2.5}
                title="Town hall"
                text="The default branch. Releases and merges land here."
              />
              <LegendRow
                art={cottageArt(1, false)}
                palette={PR_ROOF}
                scale={2.5}
                title="Finished cottage"
                text="An open PR that's ready for review."
              />
              <LegendRow
                art={cottageArt(1, true)}
                palette={PR_ROOF}
                scale={2.5}
                title="Under construction"
                text="A draft PR — still tarp and scaffolding."
              />
              <LegendRow
                art={cottageArt(3, false)}
                palette={PR_ROOF}
                scale={2.5}
                title="Multi-storey house"
                text="A stack of PRs. Every floor is a PR built on the one below, and the attic is the top of the stack."
              />
              <LegendRow
                art={cabinArt()}
                palette={BRANCH_ROOF}
                scale={3}
                title="Cabin"
                text="An active branch that has no PR yet."
              />
              <LegendRow
                art={tentArt()}
                palette={ISSUE_ROOF}
                scale={2.5}
                title="Tent"
                text="A busy issue — people talk here instead of building."
              />
              <LegendRow
                art={WELL.art}
                palette={WELL.palette}
                scale={3}
                title="The well"
                text="The town square. People end up here when their latest work points somewhere else."
              />
              <LegendRow
                art={FURNITURE[1].art}
                palette={FURNITURE[1].palette}
                scale={3.5}
                title="Furniture"
                text="Real commits build the room inside each house. Bigger work becomes a bigger piece."
              />
              <li className="flex items-center gap-4 py-2.5">
                <span className="flex w-20 shrink-0 justify-center">
                  <span className="sticky-note block h-10 w-10" />
                </span>
                <div className="min-w-0">
                  <p className="font-pixel text-[15px] font-bold text-[#3a2f22]">Wall notes</p>
                  <p className="text-[13px] leading-snug text-[#6b5b43]">Reviews and comments pinned inside.</p>
                </div>
              </li>

              <li className="border-t-2 border-[#4a3826]/30 py-3">
                <p className="font-pixel mb-3 text-[15px] font-bold text-[#3a2f22]">Controls</p>
                <div className="flex flex-col gap-3 text-[13px] text-[#6b5b43]">
                  <div className="flex items-center gap-3">
                    <span className="flex gap-1">
                      <Key>W</Key>
                      <Key>A</Key>
                      <Key>S</Key>
                      <Key>D</Key>
                    </span>
                    <span>Move around</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MouseKey />
                    <span>Click the ground to walk there</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Key wide>Enter</Key>
                    <span>…or walk into a door to step inside</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Key wide>Esc</Key>
                    <span>…or walk onto the mat to leave</span>
                  </div>
                </div>
              </li>

              <li className="border-t-2 border-[#4a3826]/30 py-3 text-[13px] leading-snug text-[#6b5b43]">
                Inside a stacked house the sign lists every floor — click one to visit that PR.
              </li>
              <li className="border-t-2 border-[#4a3826]/30 py-3 text-[13px] leading-snug text-[#6b5b43]">
                <span className="font-bold text-[#3a2f22]">Draw with AI</span> rebuilds a room from its real commits —
                one invented machine per piece of work. Drawn rooms are cached and shared.
              </li>
              <li className="border-t-2 border-[#4a3826]/30 py-3 text-[13px] leading-snug text-[#6b5b43]">
                Made by{' '}
                <a
                  href="https://github.com/aurorascharff"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#8a4a2b] hover:underline"
                >
                  aurorascharff
                </a>{' '}
                ·{' '}
                <a
                  href="https://github.com/aurorascharff/gitville"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#8a4a2b] hover:underline"
                >
                  View the source
                </a>
              </li>
            </ul>
          </aside>
        </div>
      ) : null}
    </>
  );
}

// A little pixel keycap with a raised 3D edge, matching the wooden UI.
function Key({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <kbd
      className={cn(
        'font-pixel inline-flex h-8 items-center justify-center rounded-sm border-2 border-b-[3px] border-[#4a3826] bg-[#f7efdc] px-2 text-[13px] font-bold text-[#3a2f22] shadow-[0_2px_0_rgb(74_56_38/0.35)]',
        wide ? 'min-w-14' : 'w-8',
      )}
    >
      {children}
    </kbd>
  );
}

// A tiny pixel mouse; the little bar hints at the left button you click.
function MouseKey() {
  return (
    <span
      aria-hidden
      className="relative inline-block h-8 w-6 shrink-0 rounded-t-[10px] rounded-b-sm border-2 border-[#4a3826] bg-[#f7efdc] shadow-[0_2px_0_rgb(74_56_38/0.35)]"
    >
      <span className="absolute top-1 left-1/2 h-2.5 w-0.75 -translate-x-1/2 rounded-full bg-[#8a4a2b]" />
    </span>
  );
}

function LegendRow({
  art,
  palette,
  scale,
  title,
  text,
}: {
  art: string[];
  palette: Record<string, string>;
  scale: number;
  title: string;
  text: string;
}) {
  return (
    <li className="flex items-center gap-4 py-2.5">
      <span className="pixel flex w-20 shrink-0 justify-center">
        <PixelSprite art={art} palette={palette} scale={scale} />
      </span>
      <div className="min-w-0">
        <p className="font-pixel text-[15px] font-bold text-[#3a2f22]">{title}</p>
        <p className="text-[13px] leading-snug text-[#6b5b43]">{text}</p>
      </div>
    </li>
  );
}
