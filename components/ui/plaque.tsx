import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export const plaqueClass = 'rounded-md border-4 border-[#4a3826] bg-[#f0e6d2] shadow-xl';

export function Plaque({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(plaqueClass, className)}>{children}</div>;
}
