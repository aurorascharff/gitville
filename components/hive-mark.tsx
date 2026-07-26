// Hive's mark: a honeycomb cell with a blip inside, on the brand tile.
export function HiveMark({ size = 24 }: { size?: number }) {
  const s = Math.round(size * 0.66);
  return (
    <span style={{ height: size, width: size }} className="bg-brand inline-flex items-center justify-center rounded-md">
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          d="M12 2.5 20.2 7.25 V16.75 L12 21.5 3.8 16.75 V7.25 Z"
          stroke="#fff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.4" fill="#fff" />
      </svg>
    </span>
  );
}
