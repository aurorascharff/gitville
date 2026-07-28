import { AvatarImage } from '@/components/ui/avatar-image';
import { cn } from '@/lib/utils';

function px(value: number): string {
  return `${value}px`;
}

export function PixelPerson({
  name,
  avatar,
  shirt = '#3b6bff',
  pants = '#2a2d36',
  hair = '#6b4223',
  skin = '#e8b98a',
  tool = false,
  scale = 2,
  className,
}: {
  name: string;
  avatar?: string | null;
  shirt?: string;
  pants?: string;
  hair?: string;
  skin?: string;
  tool?: boolean;
  scale?: number;
  className?: string;
}) {
  const size = Math.round(13 * scale);
  const headHeight = avatar ? size : Math.round(9 * scale);
  const bodyTop = avatar ? headHeight : Math.round(8 * scale);
  const bodyHeight = Math.round(10 * scale);

  return (
    <span
      className={cn('pixel relative inline-block', className)}
      style={{ width: px(size), height: px(bodyTop + bodyHeight) }}
    >
      <span
        aria-hidden
        className="absolute block [image-rendering:pixelated]"
        style={{ left: '0px', top: '0px', width: px(size), height: px(headHeight) }}
      >
        {avatar ? (
          <AvatarImage
            src={`${avatar}${avatar.includes('?') ? '&' : '?'}size=64`}
            name={name}
            size={size}
            className="rounded-sm border-2 border-[#2e2418] bg-[#f0e6d2]"
          />
        ) : (
          <svg width={size} height={Math.round(9 * scale)} viewBox="0 0 13 9" shapeRendering="crispEdges">
            <rect x="3" y="0" width="7" height="2" fill={hair} />
            <rect x="2" y="1" width="9" height="2" fill={hair} />
            <rect x="3" y="3" width="7" height="5" fill={skin} />
            <rect x="4" y="5" width="1" height="1" fill="#1c1c1c" />
            <rect x="8" y="5" width="1" height="1" fill="#1c1c1c" />
            <rect x="5" y="7" width="3" height="1" fill="#8a4a2b" />
          </svg>
        )}
      </span>
      <svg
        aria-label={name}
        width={size}
        height={bodyHeight}
        viewBox="0 0 13 10"
        shapeRendering="crispEdges"
        className="pixel-person-body absolute left-0 [image-rendering:pixelated]"
        style={{ top: px(bodyTop) }}
      >
        <rect x="3" y="0" width="7" height="4" fill={shirt} />
        <rect x="2" y="1" width="1" height="3" fill={shirt} />
        <rect x="10" y="1" width="1" height="3" fill={shirt} />
        <rect className="pixel-person-left-leg" x="4" y="4" width="2" height="5" fill={pants} />
        <rect className="pixel-person-right-leg" x="7" y="4" width="2" height="5" fill={pants} />
        <rect className="pixel-person-left-foot" x="3" y="9" width="3" height="1" fill="#0f1115" />
        <rect className="pixel-person-right-foot" x="7" y="9" width="3" height="1" fill="#0f1115" />
        {tool ? (
          <>
            <rect x="10" y="0" width="2" height="1" fill="#9aa0a8" />
            <rect x="11" y="1" width="1" height="5" fill="#8a5a33" />
          </>
        ) : null}
      </svg>
    </span>
  );
}
