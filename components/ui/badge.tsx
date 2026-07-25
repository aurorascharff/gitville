import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wider whitespace-nowrap uppercase',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-muted-foreground',
        success: 'border-transparent bg-success/10 text-success [&_.dot]:bg-success',
        warning: 'border-transparent bg-warning/10 text-warning [&_.dot]:bg-warning',
        destructive: 'border-transparent bg-destructive/10 text-destructive [&_.dot]:bg-destructive',
        muted: 'border-transparent bg-muted text-muted-foreground [&_.dot]:bg-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
