import { VillageHelpShell } from '@/features/village/components/overlay/help-shell';
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
} from '@/features/village/components/shared/pixel-sprite';
import { cn } from '@/lib/utils';

const PR_ROOF = housePalette(...ROOF.pr, true);
const MAIN_ROOF = housePalette(...ROOF.main, true);
const BRANCH_ROOF = housePalette(...ROOF.branch, false);
const ISSUE_ROOF = housePalette(...ROOF.issue, false);

export function VillageHelp() {
  return (
    <VillageHelpShell>
      <div className="grid min-h-0 flex-1 gap-x-8 overflow-y-auto px-5 py-3 sm:grid-cols-2">
        <div>
          <p className="pb-1 text-[12px] font-bold text-[#8a6d2a] uppercase">Places</p>
          <ul>
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
              text="A draft PR, still tarp and scaffolding."
            />
            <LegendRow
              art={cottageArt(3, false)}
              palette={PR_ROOF}
              scale={2.5}
              title="Multi-storey house"
              text="A stack of PRs. Every floor is built on the one below, and the attic is the top."
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
              text="A busy issue where people talk instead of building."
            />
            <LegendRow
              art={WELL.art}
              palette={WELL.palette}
              scale={3}
              title="The well"
              text="The town square. GitHub comments and reviews collect here when they do not map to a visible building."
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
                <p className="text-[15px] font-bold text-[#3a2f22]">Wall notes</p>
                <p className="text-[13px] leading-snug text-[#6b5b43]">Reviews and comments pinned inside.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="flex flex-col">
          <p className="pt-4 pb-1 text-[12px] font-bold text-[#8a6d2a] uppercase sm:pt-0">Getting around</p>
          <div className="flex flex-col gap-3 py-2 text-[13px] text-[#6b5b43]">
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
              <KeyCombo keys={['⌘', '+']} />
              <KeyCombo keys={['⌘', '-']} />
              <span>Zoom the village while walking</span>
            </div>
            <div className="flex items-center gap-3">
              <Key wide>Enter</Key>
              <span>Walk into a door to step inside</span>
            </div>
            <div className="flex items-center gap-3">
              <Key>G</Key>
              <span>Ask the carpenter to fix the furniture</span>
            </div>
            <div className="flex items-center gap-3">
              <Key>I</Key>
              <span>Open the info sign</span>
            </div>
            <div className="flex items-center gap-3">
              <Key wide>Esc</Key>
              <span>Close panels or leave a room</span>
            </div>
            <div className="flex items-center gap-3">
              <Key>←</Key>
              <span>Town edge returns home</span>
            </div>
          </div>

          <div className="mt-3 border-t-2 border-[#4a3826]/30 py-3 text-[13px] leading-snug text-[#6b5b43]">
            Inside a stacked house the sign lists every floor. Click one to visit that PR.
          </div>
          <div className="border-t-2 border-[#4a3826]/30 py-3 text-[13px] leading-snug text-[#6b5b43]">
            <span className="font-bold text-[#3a2f22]">Fix furniture</span> gives the carpenter the real commits as
            furniture plans.
          </div>
          <div className="border-t-2 border-[#4a3826]/30 py-3 text-[13px] leading-snug text-[#6b5b43]">
            Blank signs outside houses fill in when the carpenter finishes the furniture.
          </div>
          <div className="mt-auto border-t-2 border-[#4a3826]/30 py-3 text-[13px] leading-snug text-[#6b5b43]">
            Made by{' '}
            <a
              href="https://github.com/aurorascharff"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[#8a4a2b] hover:underline"
            >
              aurorascharff
            </a>
            .{' '}
            <a
              href="https://github.com/aurorascharff/gitville"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[#8a4a2b] hover:underline"
            >
              View the source
            </a>
          </div>
        </div>
      </div>
    </VillageHelpShell>
  );
}

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

function KeyCombo({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map(key => (
        <Key key={key}>{key}</Key>
      ))}
    </span>
  );
}

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
        <p className="text-[15px] font-bold text-[#3a2f22]">{title}</p>
        <p className="text-[13px] leading-snug text-[#6b5b43]">{text}</p>
      </div>
    </li>
  );
}
