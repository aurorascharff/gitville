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

const PR_ROOF = housePalette(...ROOF.pr, true);
const MAIN_ROOF = housePalette(...ROOF.main, true);
const BRANCH_ROOF = housePalette(...ROOF.branch, false);
const ISSUE_ROOF = housePalette(...ROOF.issue, false);

export function VillageHelp() {
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
        className="panel font-pixel absolute bottom-5 left-4 z-50 flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm text-[16px] font-bold transition-transform hover:-translate-y-0.5"
      >
        ?
      </button>
      {open ? (
        <div
          className="absolute inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
          onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
          <aside className="panel flex max-h-[80dvh] w-96 flex-col overflow-hidden rounded-sm">
            <header className="panel-wood flex shrink-0 items-center justify-between border-x-0 border-t-0 px-4 py-1.5">
              <p className="font-pixel text-[14px] font-bold">how to read the village</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close (Esc)"
                className="font-pixel cursor-pointer text-[14px] font-bold text-[#e0d3b8] transition-colors hover:text-white"
              >
                ✕
              </button>
            </header>
            <ul className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              <LegendRow
                art={hallArt()}
                palette={MAIN_ROOF}
                scale={2}
                title="town hall"
                text="the default branch. releases and merges land here"
              />
              <LegendRow
                art={cottageArt(1, false)}
                palette={PR_ROOF}
                scale={2}
                title="finished cottage"
                text="an open PR that is ready for review"
              />
              <LegendRow
                art={cottageArt(1, true)}
                palette={PR_ROOF}
                scale={2}
                title="under construction"
                text="a draft PR. still tarp and scaffolding"
              />
              <LegendRow
                art={cottageArt(3, false)}
                palette={PR_ROOF}
                scale={2}
                title="multi-storey house"
                text="a stack of PRs. every floor is a PR built on the one below and the attic is the top of the stack"
              />
              <LegendRow
                art={cabinArt()}
                palette={BRANCH_ROOF}
                scale={2.5}
                title="cabin"
                text="an active branch that has no PR yet"
              />
              <LegendRow
                art={tentArt()}
                palette={ISSUE_ROOF}
                scale={2}
                title="tent"
                text="a busy issue. people talk here instead of building"
              />
              <LegendRow
                art={WELL.art}
                palette={WELL.palette}
                scale={2.5}
                title="the well"
                text="the town square. people end up here when their latest work points somewhere else"
              />
              <LegendRow
                art={FURNITURE[1].art}
                palette={FURNITURE[1].palette}
                scale={3}
                title="furniture"
                text="real commits build the room inside each house. bigger work becomes a bigger piece"
              />
              <li className="flex items-center gap-3 py-2">
                <span className="flex w-16 shrink-0 justify-center">
                  <span className="sticky-note block h-8 w-8" />
                </span>
                <div className="min-w-0">
                  <p className="font-pixel text-[12px] font-bold text-[#3a2f22]">wall notes</p>
                  <p className="text-[11px] leading-snug text-[#6b5b43]">reviews and comments pinned inside</p>
                </div>
              </li>
              <li className="border-t-2 border-[#4a3826]/30 py-2 text-[11px] leading-snug text-[#6b5b43]">
                villagers stand where they last worked. walk with WASD or click the grass. walk into a door or press
                Enter to step inside. walk onto the mat or press Esc to leave.
              </li>
              <li className="border-t-2 border-[#4a3826]/30 py-2 text-[11px] leading-snug text-[#6b5b43]">
                inside a stacked house the sign lists every floor. click one to visit that PR.
              </li>
              <li className="border-t-2 border-[#4a3826]/30 py-2 text-[11px] leading-snug text-[#6b5b43]">
                the draw with AI button rebuilds a room from its real commits, one invented machine per piece of work.
                drawn rooms are cached and shared.
              </li>
              <li className="border-t-2 border-[#4a3826]/30 py-2 text-[11px] leading-snug text-[#6b5b43]">
                made by{' '}
                <a
                  href="https://github.com/aurorascharff"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#8a4a2b] hover:underline"
                >
                  aurorascharff
                </a>
                . the village itself is a repo too:{' '}
                <a
                  href="https://github.com/aurorascharff/gitville"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#8a4a2b] hover:underline"
                >
                  view the source
                </a>
              </li>
            </ul>
          </aside>
        </div>
      ) : null}
    </>
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
    <li className="flex items-center gap-3 py-2">
      <span className="pixel flex w-16 shrink-0 justify-center">
        <PixelSprite art={art} palette={palette} scale={scale} />
      </span>
      <div className="min-w-0">
        <p className="font-pixel text-[12px] font-bold text-[#3a2f22]">{title}</p>
        <p className="text-[11px] leading-snug text-[#6b5b43]">{text}</p>
      </div>
    </li>
  );
}
