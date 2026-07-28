import { BUSH, FLOWER, Sprite, TREE } from '@/features/village/components/shared/pixel-sprite';

export function HomeScenery() {
  return (
    <div aria-hidden className="pixel pointer-events-none absolute inset-0">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="absolute"
          style={{ left: `${i * 7.5 + ((i * 37) % 4)}%`, bottom: -14 - ((i * 23) % 18) }}
        >
          <Sprite of={TREE} scale={i % 3 === 0 ? 6 : 5} />
        </span>
      ))}
      <span className="absolute top-[18%] left-[14%]">
        <Sprite of={BUSH} scale={4} />
      </span>
      <span className="absolute top-[24%] right-[16%]">
        <Sprite of={FLOWER} scale={4} />
      </span>
      <span className="absolute top-[64%] left-[6%]">
        <Sprite of={FLOWER} scale={3} />
      </span>
    </div>
  );
}
