import { ImageResponse } from 'next/og';

export const size = { height: 32, width: 32 };
export const contentType = 'image/png';

const ART = ['...rr...', '..rrrr..', '.rrrrrr.', 'rrrrrrrr', 'owwwwwwo', 'owywwdwo', 'owwwwdwo', 'oooooooo'];
const PALETTE: Record<string, string> = { r: '#b0532e', w: '#c9a06b', d: '#5a4632', y: '#ffd76a', o: '#4a3826' };

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#4d9153',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {ART.map((row, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {[...row].map((ch, x) => (
              <div key={x} style={{ background: PALETTE[ch] ?? 'transparent', height: 3, width: 3 }} />
            ))}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
