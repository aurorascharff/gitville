'use client';

import { ArrowUpRight, X } from 'lucide-react';
import { useEffect } from 'react';
import useSWR from 'swr';
import { RelativeTime } from '@/components/ui/relative-time';
import { furnitureFor, PixelSprite } from '@/features/hive/components/pixel-sprite';
import { KindBadge } from '@/features/hive/components/pixel-sprite';
import { useHiveUi } from '@/features/hive/hive-ui-context';
import { roomFor } from '@/features/hive/hive-world-model';
import { useHiveData, useTimeWindow, useWorldModel } from '@/features/hive/use-hive-data';
import type { WireEvent } from '@/types/github';

const ROOM_W: Record<'S' | 'M' | 'L', number> = { S: 560, M: 720, L: 880 };

type RoomSpecPayload = { ok: boolean; theme: string; flavor: string | null; items: string[] };
const specFetcher = (url: string): Promise<RoomSpecPayload> => fetch(url).then(r => r.json());

// Inside a branch/PR/issue: every commit in the window built a piece of furniture (hover
// to read the commit, click to open it), and every review/comment left a sticky note on
// the wall you can read and follow. AI names the room after what the crew is building.
export function RoomView() {
  const { slug, repo, scrub, focusId, setFocusId, setTip } = useHiveUi();
  const { payload } = useHiveData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { cells, actors } = useWorldModel(payload, slug, asOf);
  const cell = focusId ? cells.find(c => c.id === focusId) : null;

  // Lazy: only generate/fetch the room spec while a room is open.
  const { data: spec } = useSWR<RoomSpecPayload>(
    cell ? `/api/room?slug=${encodeURIComponent(repo.slug)}&cell=${encodeURIComponent(cell.id)}` : null,
    specFetcher,
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    if (!cell) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFocusId(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cell, setFocusId]);

  if (!cell) return null;

  const room = roomFor(payload, cells, cell.id);
  const here = actors.filter(a => a.cellId === cell.id);
  const width = ROOM_W[room.size];
  const theme = spec?.ok ? spec.theme : room.theme;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onClick={e => e.target === e.currentTarget && setFocusId(null)}
    >
      <div
        className="room-pop pixel relative w-full overflow-hidden rounded-lg border-4 border-[#4a3826] shadow-2xl"
        style={{ maxWidth: width }}
      >
        {/* Header plaque */}
        <div className="absolute top-3 left-1/2 z-20 flex max-w-[80%] -translate-x-1/2 flex-col items-center gap-0.5 rounded-sm border border-black/40 bg-[#f0e6d2] px-3 py-1 text-center shadow-lg">
          <p className="truncate font-pixel text-[15px] font-bold whitespace-nowrap text-[#3a2f22]">
            {cell.label} · {theme}
          </p>
          {spec?.flavor ? <p className="line-clamp-1 text-[11px] text-[#6b5b43] italic">{spec.flavor}</p> : null}
        </div>
        <button
          onClick={() => setFocusId(null)}
          aria-label="Leave the room (Esc)"
          title="Leave the room (Esc)"
          className="absolute top-3 right-3 z-20 rounded-sm border border-black/40 bg-[#f0e6d2] p-1 text-[#3a2f22] shadow-lg transition-transform hover:scale-105"
        >
          <X size={13} strokeWidth={3} />
        </button>

        {/* Wall — wallpaper + readable sticky notes */}
        <div className="room-wall relative h-44 w-full">
          <div className="absolute inset-x-0 bottom-0 h-2 bg-black/25" />
          <div className="absolute inset-x-6 top-12 flex flex-wrap gap-2">
            {room.notes.length === 0 ? (
              <p className="rounded bg-black/25 px-2 py-1 font-mono text-[10px] text-white/70">
                no review notes on the wall yet
              </p>
            ) : (
              room.notes
                .slice(0, 10)
                .map((note, i) => <StickyNote key={note.id} note={note} tilt={((i * 47) % 9) - 4} />)
            )}
          </div>
        </div>

        {/* Floor — furniture built by commits (click → the commit) + the crew */}
        <div className="room-floor relative w-full px-6 pt-4 pb-6" style={{ minHeight: 200 }}>
          {room.commits.length === 0 ? (
            <p className="rounded bg-black/25 px-2 py-1 text-center font-mono text-[10px] text-white/70">
              nothing built here yet — no pushes in the visible window
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
              {room.commits.slice(0, 14).map((commit, i) => (
                <Furniture key={commit.id} commit={commit} aiName={spec?.ok ? spec.items[i] : undefined} />
              ))}
            </div>
          )}

          {here.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-end gap-4">
              {here.map(a => (
                <a
                  key={a.login}
                  href={`https://github.com/${a.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center transition-transform hover:-translate-y-0.5"
                  onMouseMove={e =>
                    setTip({
                      x: e.clientX,
                      y: e.clientY,
                      title: a.login,
                      body: `${a.event.line}${a.event.detail ? ` — ${a.event.detail}` : ''}`,
                      when: a.event.at,
                    })
                  }
                  onMouseLeave={() => setTip(null)}
                >
                  <div className="sprite-bob relative">
                    {a.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${a.avatar}?size=64`}
                        alt={a.login}
                        width={30}
                        height={30}
                        className="rounded-full border-2 border-black/40 shadow"
                      />
                    ) : (
                      <span className="bg-secondary block h-[30px] w-[30px] rounded-full" />
                    )}
                    <span className="absolute -top-2 -right-2"><KindBadge kind={a.event.kind} /></span>
                  </div>
                  <span className="mt-0.5 rounded bg-black/40 px-1 font-mono text-[9px] text-white/85">{a.login}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {/* Doorway out */}
        <div className="flex items-stretch border-t-4 border-[#4a3826] bg-[#2e2417] font-mono text-[11px] font-bold">
          <a
            href={cell.url}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[#e4c05a] transition-colors hover:bg-[#3a2e1e]"
          >
            open on github <ArrowUpRight size={12} strokeWidth={3} />
          </a>
          <button
            onClick={() => setFocusId(null)}
            className="border-l-2 border-[#4a3826] px-4 text-[#a8946a] transition-colors hover:bg-[#3a2e1e]"
          >
            esc · leave
          </button>
        </div>
      </div>
    </div>
  );
}

function Furniture({ commit, aiName }: { commit: WireEvent; aiName?: string }) {
  const { setTip } = useHiveUi();
  const item = furnitureFor(commit.id);
  const name = aiName ?? item.name;
  const inner = (
    <>
      <PixelSprite art={item.art} palette={item.palette} scale={4} />
      <span aria-hidden className="mx-auto mt-0.5 block h-1 w-6 rounded-full bg-black/30 blur-[1px]" />
    </>
  );
  const tip = (e: React.MouseEvent) =>
    setTip({
      x: e.clientX,
      y: e.clientY,
      title: `${name} · built by ${commit.actor}`,
      body: commit.detail ?? commit.line,
      when: commit.at,
    });

  if (commit.url) {
    return (
      <a
        href={commit.url}
        target="_blank"
        rel="noreferrer"
        className="transition-transform hover:-translate-y-0.5"
        onMouseMove={tip}
        onMouseLeave={() => setTip(null)}
      >
        {inner}
      </a>
    );
  }
  return (
    <div
      className="cursor-help transition-transform hover:-translate-y-0.5"
      onMouseMove={tip}
      onMouseLeave={() => setTip(null)}
    >
      {inner}
    </div>
  );
}

// A readable review/comment, pinned to the wall. Click to open the thread on GitHub.
function StickyNote({ note, tilt }: { note: WireEvent; tilt: number }) {
  const { setTip } = useHiveUi();
  return (
    <a
      href={note.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="sticky-note relative h-14 w-14 p-1 text-left transition-transform hover:scale-110 hover:rotate-0"
      style={{ transform: `rotate(${tilt}deg)` }}
      onMouseMove={e =>
        setTip({ x: e.clientX, y: e.clientY, title: `${note.actor} · ${note.line}`, body: note.body, when: note.at })
      }
      onMouseLeave={() => setTip(null)}
      aria-label={`Note from ${note.actor}`}
    >
      <span className="line-clamp-3 block font-mono text-[8.5px] leading-[1.4] break-words text-[#5a4a1e]">
        {note.body}
      </span>
      <span className="absolute right-0.5 bottom-0.5 font-mono text-[7px] font-bold text-[#8a6d2a]">
        <RelativeTime date={note.at} />
      </span>
    </a>
  );
}
