'use client';

import { ArrowUpRight } from 'lucide-react';
import { useEffect } from 'react';
import { RelativeTime } from '@/components/ui/relative-time';
import { AI_ART_PALETTE, furnitureByName, furnitureFor, PixelSprite } from '@/features/village/components/pixel-sprite';
import { backdropFor, pieceScale, sizeScale, type Build } from '@/features/village/room-geometry';
import type { RoomSpecPayload } from '@/features/village/use-village-data';
import type { Cell } from '@/features/village/village-model';

export function FurnitureCloseup({
  build,
  spec,
  cell,
  onClose,
}: {
  build: Build;
  spec: RoomSpecPayload | null;
  cell: Cell;
  onClose: () => void;
}) {
  const fallback = (build.kind ? furnitureByName(build.kind) : null) ?? furnitureFor(build.commits[0].sha);
  const name = build.name ?? fallback.name;
  const drawn = Boolean(build.pieces?.length);
  const MAG = 2.4;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-60 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[3px]"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <aside className="pixel relative flex max-h-[88dvh] w-160 max-w-[92vw] flex-col overflow-hidden rounded-sm border-4 border-[#2e2418] bg-[#221a12]/95 text-[#f0e6d2] shadow-[8px_10px_0_rgb(0_0_0/0.5)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to the room (Esc)"
          className="font-pixel absolute top-2 right-2 z-10 cursor-pointer text-[18px] font-bold text-[#e0d3b8] transition-colors hover:text-white"
        >
          x
        </button>
        <div
          className="flex shrink-0 flex-col items-center gap-3 px-6 pt-10 pb-5"
          style={{ background: `radial-gradient(ellipse 75% 80% at 50% 45%, ${backdropFor(cell)}, transparent 75%)` }}
        >
          <div className="flex items-end">
            {build.commits.map((commit, i) => {
              const piece = drawn ? (build.pieces![i] ?? build.pieces![build.pieces!.length - 1]) : fallback.art;
              const palette = drawn ? AI_ART_PALETTE : fallback.palette;
              const scale = (drawn ? pieceScale(build) : sizeScale(commit)) * MAG;
              return (
                <span key={commit.sha} style={drawn ? undefined : { marginLeft: i === 0 ? 0 : -10 }}>
                  <PixelSprite art={piece} palette={palette} scale={scale} />
                </span>
              );
            })}
          </div>
          <span aria-hidden className="block h-1.5 w-16 rounded-full bg-black/40 blur-[1px]" />
          <div className="flex flex-col items-center gap-1.5">
            <p className="font-pixel text-center text-[18px] font-bold drop-shadow-[0_2px_0_rgb(0_0_0/0.5)]">{name}</p>
            {spec?.ai ? (
              <span className="font-pixel rounded-sm border-2 border-[#4a3826] bg-[#e4c05a] px-2 py-0.5 text-[11px] font-bold text-[#3a2f22]">
                {spec.theme}
              </span>
            ) : null}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto border-t-2 border-[#f0e6d2]/15 px-6 py-4">
          <p className="font-pixel mb-2.5 text-[11px] tracking-wide text-[#9a8c6d] uppercase">
            {build.commits.length > 1 ? `Built from ${build.commits.length} commits` : 'From this commit'}
          </p>
          <ul className="flex flex-col gap-2">
            {build.commits.map(commit => (
              <li key={commit.sha}>
                <a
                  href={commit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col gap-1 rounded-xs border-2 border-[#f0e6d2]/15 bg-black/20 px-3 py-2.5 transition-colors hover:border-[#f0e6d2]/40"
                >
                  <span className="text-[14px] leading-snug wrap-anywhere whitespace-pre-wrap text-[#e4d7ba]">
                    {commit.message}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-[#9a8c6d]">
                    <span className="font-bold text-[#d8b24a]">{commit.author}</span>
                    <RelativeTime date={commit.at} />
                    <span className="font-pixel ml-auto flex items-center gap-1 text-[#f0b98a] opacity-0 transition-opacity group-hover:opacity-100">
                      view commit <ArrowUpRight size={12} strokeWidth={3} />
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
