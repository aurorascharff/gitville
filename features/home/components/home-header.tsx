import { GitvilleMark } from '@/components/gitville-mark';
import { Plaque } from '@/components/ui/plaque';

export function HomeHeader() {
  return (
    <header className="pixel flex flex-col items-center gap-3 text-center">
      <Plaque className="flex items-center gap-2.5 px-5 py-2.5">
        <GitvilleMark size={30} />
        <h1 className="font-pixel text-2xl font-bold tracking-tight text-[#3a2f22]">Gitville</h1>
      </Plaque>
      <p className="font-pixel max-w-md rounded-sm bg-black/40 px-3 py-1 text-[14px] text-white/95">
        Explore any GitHub repo as a living pixel village.
      </p>
    </header>
  );
}
