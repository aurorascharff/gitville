import type { Cell } from '@/features/village/village-model';

export function NightTint() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden bg-[#141f4a] opacity-60 mix-blend-multiply dark:block"
    />
  );
}

export function NightGlow({ lamps, litCells }: { lamps: { x: number; y: number }[]; litCells: Cell[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden dark:block">
      {lamps.map((l, i) => (
        <span
          key={i}
          className="absolute mix-blend-screen"
          style={{
            left: l.x - 65,
            top: l.y - 70,
            width: 130,
            height: 120,
            background: 'radial-gradient(circle, rgb(255 205 96 / 0.34), rgb(255 190 80 / 0.1) 45%, transparent 68%)',
          }}
        />
      ))}
      {litCells.map(c => (
        <span
          key={c.id}
          className="absolute mix-blend-screen"
          style={{
            left: c.x - 60,
            top: c.y - 40,
            width: 120,
            height: 90,
            background: 'radial-gradient(circle, rgb(255 200 110 / 0.22), transparent 65%)',
          }}
        />
      ))}
    </div>
  );
}

export function VillageSky() {
  return (
    <>
      <NightSky />
      <Fireflies />
      <Butterflies />
    </>
  );
}

function NightSky() {
  return (
    <>
      <div aria-hidden className="stars pointer-events-none absolute inset-0 hidden dark:block" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 hidden h-40 bg-linear-to-b from-[#0a1030]/70 to-transparent dark:block"
      />
      <span
        aria-hidden
        className="pixel absolute top-10 right-28 hidden h-10 w-10 rounded-full bg-[#e8e4d2] shadow-[inset_-7px_-5px_0_#c9c4ae,0_0_28px_8px_rgb(226_233_255/0.28)] dark:block"
      />
    </>
  );
}

function Fireflies() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden dark:block">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="firefly absolute h-1 w-1 rounded-full bg-[#ffd76a]/70"
          style={{
            left: `${(i * 137 + 61) % 100}%`,
            top: `${(i * 89 + 23) % 100}%`,
            animationDelay: `${(i * 733) % 6000}ms`,
            animationDuration: `${5200 + ((i * 997) % 4200)}ms`,
          }}
        />
      ))}
    </div>
  );
}

function Butterflies() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="firefly absolute h-1.5 w-1.5 rounded-[1px]"
          style={{
            left: `${(i * 149 + 43) % 100}%`,
            top: `${(i * 97 + 31) % 100}%`,
            background: i % 2 === 0 ? '#f2ead8' : '#9db9e8',
            boxShadow: 'none',
            animationDelay: `${(i * 811) % 6000}ms`,
            animationDuration: `${6200 + ((i * 887) % 3800)}ms`,
          }}
        />
      ))}
    </div>
  );
}
