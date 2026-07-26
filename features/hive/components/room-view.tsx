'use client';

import { ArrowUpRight, X } from 'lucide-react';
import { useEffect } from 'react';
import { useHive } from '@/features/hive/hive-context';
import { RelativeTime } from '@/components/ui/relative-time';
import { furnitureFor, PixelSprite } from '@/features/hive/components/pixel-sprite';
import { roomFor, KIND_EMOJI } from '@/features/hive/hive-world-model';
import type { WireEvent } from '@/types/github';

const ROOM_W: Record<'S' | 'M' | 'L', number> = { S: 560, M: 720, L: 880 };

// Inside a branch/PR: every commit in the window built a piece of furniture (hover it
// to read the commit), and every review/comment left a sticky note on the wall (hover
// to read the actual text). Stardew rules: the more they build, the bigger the room.
export function RoomView() {
  const { payload, cells, actors, focusId, setFocusId, setTip } = useHive();
  const cell = focusId ? cells.find(c => c.id === focusId) : null;

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

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]" onClick={e => e.target === e.currentTarget && setFocusId(null)}>
      <div className="room-pop pixel relative w-full overflow-hidden rounded-lg border-4 border-[#4a3826] shadow-2xl" style={{ maxWidth: width }}>
        {/* Header plaque */}
        <div className="absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-sm border border-black/40 bg-[#f0e6d2] px-3 py-1 shadow-lg">
          <p className="font-mono text-[11px] font-bold whitespace-nowrap text-[#3a2f22]">
            {cell.label} · {room.theme}
          </p>
        </div>
        <button
          onClick={() => setFocusId(null)}
          aria-label="Leave the room"
          className="absolute top-3 right-3 z-20 rounded-sm border border-black/40 bg-[#f0e6d2] p-1 text-[#3a2f22] shadow-lg transition-transform hover:scale-105"
        >
          <X size={13} strokeWidth={3} />
        </button>

        {/* Wall — wallpaper + sticky notes */}
        <div className="room-wall relative h-44 w-full">
          <div className="absolute inset-x-0 bottom-0 h-2 bg-black/25" />
          <div className="absolute inset-x-6 top-12 flex flex-wrap gap-2">
            {room.notes.length === 0 ? (
              <p className="rounded bg-black/25 px-2 py-1 font-mono text-[10px] text-white/70">no review notes on the wall yet</p>
            ) : (
              room.notes.slice(0, 10).map((note, i) => <StickyNote key={note.id} note={note} tilt={((i * 47) % 9) - 4} />)
            )}
          </div>
        </div>

        {/* Floor — furniture built by commits + the crew standing around */}
        <div className="room-floor relative w-full px-6 pt-4 pb-6" style={{ minHeight: 200 }}>
          {room.commits.length === 0 ? (
            <p className="rounded bg-black/25 px-2 py-1 text-center font-mono text-[10px] text-white/70">nothing built here yet — no pushes in the visible window</p>
          ) : (
            <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
              {room.commits.slice(0, 24).map(commit => (
                <Furniture key={commit.id} commit={commit} />
              ))}
            </div>
          )}

          {here.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-end gap-4">
              {here.map(a => (
                <div
                  key={a.login}
                  className="flex flex-col items-center"
                  onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, title: a.login, body: `${a.event.line}${a.event.detail ? ` — ${a.event.detail}` : ''}`, when: a.event.at })}
                  onMouseLeave={() => setTip(null)}
                >
                  <div className="sprite-bob relative">
                    {a.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`${a.avatar}?size=64`} alt={a.login} width={30} height={30} className="rounded-full border-2 border-black/40 shadow" />
                    ) : (
                      <span className="block h-[30px] w-[30px] rounded-full bg-secondary" />
                    )}
                    <span className="absolute -top-2 -right-2 text-[12px]">{KIND_EMOJI[a.event.kind]}</span>
                  </div>
                  <span className="mt-0.5 rounded bg-black/40 px-1 font-mono text-[9px] text-white/85">{a.login}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Doorway out */}
        <a
          href={cell.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 border-t-4 border-[#4a3826] bg-[#2e2417] py-2.5 font-mono text-[11px] font-bold text-[#e4c05a] transition-colors hover:bg-[#3a2e1e]"
        >
          open on github <ArrowUpRight size={12} strokeWidth={3} />
        </a>
      </div>
    </div>
  );
}

function Furniture({ commit }: { commit: WireEvent }) {
  const { setTip } = useHive();
  const item = furnitureFor(commit.id);
  return (
    <div
      className="cursor-help transition-transform hover:-translate-y-0.5"
      onMouseMove={e =>
        setTip({
          x: e.clientX,
          y: e.clientY,
          title: `${item.name} · built by ${commit.actor}`,
          body: commit.detail ?? commit.line,
          when: commit.at,
        })
      }
      onMouseLeave={() => setTip(null)}
    >
      <PixelSprite art={item.art} palette={item.palette} scale={4} />
      <span aria-hidden className="mx-auto mt-0.5 block h-1 w-6 rounded-full bg-black/30 blur-[1px]" />
    </div>
  );
}

// A readable review/comment, pinned to the wall.
function StickyNote({ note, tilt }: { note: WireEvent; tilt: number }) {
  const { setTip } = useHive();
  return (
    <button
      type="button"
      className="sticky-note relative h-14 w-14 cursor-help p-1 text-left transition-transform hover:scale-110 hover:rotate-0"
      style={{ transform: `rotate(${tilt}deg)` }}
      onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, title: `📝 ${note.actor} · ${note.line}`, body: note.body, when: note.at })}
      onMouseLeave={() => setTip(null)}
      aria-label={`Note from ${note.actor}`}
    >
      <span className="line-clamp-3 block font-mono text-[7.5px] leading-[1.35] break-words text-[#5a4a1e]">{note.body}</span>
      <span className="absolute right-0.5 bottom-0.5 font-mono text-[7px] font-bold text-[#8a6d2a]">
        <RelativeTime date={note.at} />
      </span>
    </button>
  );
}
