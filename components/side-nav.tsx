'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Activity, CircleDot, Inbox, Layers, ListTodo, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { projectDot, type Project } from '@/types/project';
import type { Route } from 'next';

const VIEWS: { view: string; label: string; icon: LucideIcon }[] = [
  { view: 'mine', label: 'My issues', icon: Inbox },
  { view: 'active', label: 'Active', icon: CircleDot },
  { view: 'backlog', label: 'Backlog', icon: ListTodo },
  { view: 'all', label: 'All issues', icon: Layers },
];

export function SideNav({ projects }: { projects: Project[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') ?? 'active';
  const onHome = pathname === '/';

  return (
    <nav className="flex flex-col gap-5">
      <div className="space-y-0.5">
        {VIEWS.map(v => {
          const active = onHome && currentView === v.view;
          return <Item key={v.view} href={`/?view=${v.view}`} label={v.label} icon={<v.icon size={15} strokeWidth={1.9} />} active={active} />;
        })}
        <Item href="/activity" label="Activity" icon={<Activity size={15} strokeWidth={1.9} />} active={pathname === '/activity'} />
      </div>

      <div>
        <p className="px-2 pb-1 text-[10px] font-medium tracking-wider text-muted-foreground/70 uppercase">Projects</p>
        <div className="space-y-0.5">
          {projects.map(p => (
            <Item
              key={p.key}
              href={`/?view=${p.key}`}
              label={p.name}
              active={onHome && currentView === p.key}
              icon={<span className={cn('h-2 w-2 rounded-[3px]', projectDot(p.color))} />}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function Item({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href as Route}
      prefetch
      className={cn(
        'flex h-7 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors',
        active ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )}
    >
      <span className="flex w-4 justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
