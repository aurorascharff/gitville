'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { RelativeTime } from '@/components/ui/relative-time';
import {
  AI_ART_PALETTE,
  furnitureByName,
  furnitureFor,
  sizedFurnitureArt,
  type Palette,
} from '@/features/village/components/shared/pixel-sprite';
import { backdropFor, buildSize, type Build } from '@/features/village/utils/room-geometry';
import type { Cell } from '@/features/village/utils/village-model';
import type { RoomSpecPayload } from '@/types/github';
import type { Group } from 'three';

type VoxelPieceData = {
  id: string;
  art: string[];
  palette: Palette;
  offset: number;
  scale: number;
};

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
  const level = buildSize(build);
  const pieces = [
    {
      id: build.commits.map(commit => commit.sha).join('-'),
      art: drawn ? build.pieces![0] : sizedFurnitureArt(fallback, level),
      palette: drawn ? AI_ART_PALETTE : fallback.palette,
      offset: 0,
      scale: 0.9 + (level - 1) * 0.1,
    },
  ];
  const sizeLabel = level === 1 ? 'modest' : level === 2 ? 'roomy' : level === 3 ? 'grand' : 'showpiece';

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
          className="absolute top-2 right-2 z-10 cursor-pointer text-[18px] font-bold text-[#e0d3b8] transition-colors hover:text-white"
        >
          x
        </button>
        <div
          className="flex shrink-0 flex-col items-center gap-3 px-6 pt-10 pb-5"
          style={{ background: `radial-gradient(ellipse 75% 80% at 50% 45%, ${backdropFor(cell)}, transparent 75%)` }}
        >
          <div className="h-58 w-full max-w-xl">
            <Canvas
              orthographic
              dpr={[1, 2]}
              camera={{ position: [8, 6, 9], zoom: 46, near: 0.1, far: 100 }}
              style={{ background: 'transparent' }}
              gl={{ antialias: false, alpha: true }}
              onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
            >
              <ambientLight intensity={1.7} />
              <directionalLight position={[5, 8, 6]} intensity={2.4} />
              <directionalLight position={[-5, 3, -4]} intensity={0.6} color="#d8bb7a" />
              <VoxelTurntable pieces={pieces} />
            </Canvas>
          </div>
          <span aria-hidden className="block h-1.5 w-16 rounded-full bg-black/40 blur-[1px]" />
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-center text-[18px] leading-tight font-bold drop-shadow-[0_2px_0_rgb(0_0_0/0.5)]">
              {name}
            </p>
            {spec?.ai ? (
              <span className="rounded-sm border-2 border-[#4a3826] bg-[#e4c05a] px-2 py-0.5 text-[12px] font-bold text-[#3a2f22]">
                {sizeLabel} furniture
              </span>
            ) : null}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto border-t-2 border-[#f0e6d2]/15 px-6 py-4">
          <p className="mb-2.5 text-[12px] font-bold text-[#9a8c6d] uppercase">
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
                  <span className="flex items-center gap-1.5 text-[12px] text-[#9a8c6d]">
                    <span className="font-bold text-[#d8b24a]">{commit.author}</span>
                    <RelativeTime date={commit.at} />
                    <span className="ml-auto flex items-center gap-1 text-[#f0b98a] opacity-0 transition-opacity group-hover:opacity-100">
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

function VoxelTurntable({ pieces }: { pieces: VoxelPieceData[] }) {
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.55;
  });

  return (
    <group rotation={[-0.28, -0.35, 0]}>
      <mesh position={[0, -1.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[7, 4.5, 0.08]} />
        <meshStandardMaterial color="#5a3b24" roughness={1} />
      </mesh>
      <group ref={ref}>
        {pieces.map(piece => (
          <VoxelPiece key={piece.id} piece={piece} />
        ))}
      </group>
      <mesh position={[0, -1.56, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.2, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function VoxelPiece({ piece }: { piece: VoxelPieceData }) {
  const block = 0.34 * piece.scale;
  const width = Math.max(...piece.art.map(row => row.length));
  const height = piece.art.length;
  const voxels = piece.art.flatMap((row, y) =>
    [...row].map((ch, x) => {
      const color = piece.palette[ch];
      if (!color) return null;
      return {
        key: `${piece.id}-${x}-${y}`,
        color,
        position: [(x - width / 2) * block + piece.offset, (height / 2 - y) * block, 0] as [number, number, number],
      };
    }),
  );

  return (
    <>
      {voxels.map(voxel =>
        voxel ? (
          <mesh key={voxel.key} position={voxel.position}>
            <boxGeometry args={[block * 0.92, block * 0.92, block * 0.92]} />
            <meshStandardMaterial color={voxel.color} roughness={0.85} metalness={0.03} flatShading />
          </mesh>
        ) : null,
      )}
    </>
  );
}
