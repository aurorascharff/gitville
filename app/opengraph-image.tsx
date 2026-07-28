import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Gitville — your repo as a tiny pixel village';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const HOUSE = {
  art: ['...rr...', '..rrrr..', '.rrrrrr.', 'rrrrrrrr', 'owwwwwwo', 'owywwdwo', 'owwwwdwo', 'oooooooo'],
  palette: { r: '#b0532e', w: '#c9a06b', d: '#5a4632', y: '#ffd76a', o: '#4a3826' } as Record<string, string>,
};
const TREE = {
  art: ['...e...', '..eee..', '.eelee.', '..eee..', '.elele.', 'eeleele', '...t...', '...t...'],
  palette: { l: '#2f7a3c', e: '#3c8a48', t: '#6b4223' } as Record<string, string>,
};

function Pixels({ art, palette, px }: { art: string[]; palette: Record<string, string>; px: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {art.map((row, y) => (
        <div key={y} style={{ display: 'flex' }}>
          {[...row].map((ch, x) => (
            <div key={x} style={{ width: px, height: px, background: palette[ch] ?? 'transparent' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default async function OpengraphImage() {
  const pixel = await readFile(join(process.cwd(), 'app/pixelify-sans.ttf'));

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#4d9153',
        fontFamily: 'Pixelify Sans',
        boxShadow: 'inset 0 0 220px rgba(0,0,0,0.38)',
      }}
    >
      <Pixels art={HOUSE.art} palette={HOUSE.palette} px={13} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: 30,
          padding: '14px 34px',
          background: '#efe4cb',
          border: '5px solid #4a3826',
          borderRadius: 8,
          boxShadow: '6px 8px 0 rgba(0,0,0,0.35)',
        }}
      >
        <span style={{ fontSize: 92, fontWeight: 700, color: '#3a2f22', letterSpacing: -2 }}>Gitville</span>
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 26,
          padding: '10px 22px',
          background: 'rgba(0,0,0,0.42)',
          borderRadius: 6,
        }}
      >
        <span style={{ fontSize: 30, color: '#ffffff' }}>
          Explore any GitHub repo as a living pixel village.
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 150,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          paddingBottom: 26,
          background: 'linear-gradient(to top, rgba(0,0,0,0.28), transparent)',
        }}
      >
        <Pixels art={TREE.art} palette={TREE.palette} px={9} />
        <Pixels art={HOUSE.art} palette={HOUSE.palette} px={8} />
        <Pixels art={TREE.art} palette={TREE.palette} px={11} />
        <Pixels art={HOUSE.art} palette={HOUSE.palette} px={10} />
        <Pixels art={TREE.art} palette={TREE.palette} px={9} />
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Pixelify Sans', data: pixel, style: 'normal', weight: 700 }],
    },
  );
}
