import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { HomeScenery } from '@/features/home/components/home-scenery';
import { WatchForm } from '@/features/repo/components/watch-form';
import {
  cottageArt,
  housePalette,
  PixelSprite,
  ROOF,
  Sprite,
  WELL,
} from '@/features/village/components/shared/pixel-sprite';

export default function RepoNotFound() {
  return (
    <div
      className="grass-field fixed inset-0 h-[100dvh] w-full overflow-hidden overscroll-none"
      style={{ backgroundSize: '48px 48px, 68px 68px, 16px 16px' }}
    >
      <div aria-hidden className="village-vignette absolute inset-0" />
      <HomeScenery />

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-10">
        <div className="panel pixel relative flex w-[min(34rem,calc(100vw-2rem))] flex-col items-center gap-5 rounded-sm p-5 text-center shadow-[8px_10px_0_rgb(0_0_0/0.35)] sm:p-7">
          <div className="relative h-34 w-56">
            <span className="absolute bottom-0 left-1/2 h-4 w-44 -translate-x-1/2 rounded-sm bg-black/20 blur-sm" />
            <span className="absolute bottom-4 left-6 opacity-70">
              <Sprite of={WELL} scale={5} />
            </span>
            <span className="absolute right-6 bottom-2" style={{ filter: 'drop-shadow(4px 6px 0 rgb(0 0 0 / 0.25))' }}>
              <PixelSprite art={cottageArt(1, true)} palette={housePalette(...ROOF.pr, false)} scale={5} />
            </span>
          </div>

          <div className="max-w-md space-y-2">
            <h1 className="text-[24px] leading-tight font-black text-[#3a2f22] sm:text-[30px]">No village here</h1>
            <p className="text-[14px] leading-snug text-[#6b5b43] sm:text-[15px]">
              That repo could not be found on GitHub, or it is private.
            </p>
          </div>

          <WatchForm />

          <Link
            href="/"
            className="flex h-9 items-center gap-1.5 rounded-sm border-2 border-[#4a3826] bg-[#f0e6d2] px-3 text-[14px] font-bold text-[#3a2f22] shadow-[2px_2px_0_rgb(0_0_0/0.2)] transition-transform hover:-translate-y-0.5"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            back to map
          </Link>
        </div>
      </div>
    </div>
  );
}
