import { PixelSprite } from '@/features/hive/components/pixel-sprite';

const HOUSE = {
  palette: { r: '#b0532e', w: '#c9a06b', d: '#5a4632', y: '#ffd76a', o: '#4a3826' },
  art: ['...rr...', '..rrrr..', '.rrrrrr.', 'rrrrrrrr', 'owwwwwwo', 'owywwdwo', 'owwwwdwo', 'oooooooo'],
};

export function GitvilleMark({ size = 26 }: { size?: number }) {
  return (
    <span className="pixel inline-flex" style={{ height: size, width: size }}>
      <PixelSprite art={HOUSE.art} palette={HOUSE.palette} scale={Math.max(2, Math.round(size / 8))} />
    </span>
  );
}
