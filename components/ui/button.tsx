'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-brand text-brand-foreground hover:bg-brand/90',
        secondary: 'border border-border bg-transparent hover:bg-accent',
        outline: 'border border-border bg-transparent hover:bg-accent',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
      },
      size: {
        default: 'h-9 px-4 text-sm',
        sm: 'h-7 px-3 text-xs',
        lg: 'h-10 px-5 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
