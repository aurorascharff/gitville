import {
  BUSH,
  cottageArt,
  FLOWER,
  hallArt,
  housePalette,
  ROOF,
  Sprite,
  TREE,
} from '@/features/village/components/shared/pixel-sprite';

export function HomeScenery() {
  const cottage = housePalette(...ROOF.pr, true);
  const hall = housePalette(...ROOF.main, true);
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
      <span className="absolute bottom-24 left-[8%] hidden md:block">
        <Sprite of={{ art: cottageArt(1, false), palette: cottage }} scale={4} />
      </span>
      <span className="absolute right-[7%] bottom-28 hidden md:block">
        <Sprite of={{ art: hallArt(), palette: hall }} scale={4} />
      </span>
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
