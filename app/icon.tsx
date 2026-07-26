import { ImageResponse } from 'next/og';

export const size = { height: 32, width: 32 };
export const contentType = 'image/png';

// Hive's mark: a honeycomb cell with a blip.
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#1b50ff',
        borderRadius: 7,
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2.5 20.2 7.25 V16.75 L12 21.5 3.8 16.75 V7.25 Z"
          stroke="#fff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.4" fill="#fff" />
      </svg>
    </div>,
    size,
  );
}
