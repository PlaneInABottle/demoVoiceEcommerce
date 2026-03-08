import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-[0.16em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/20 bg-primary/12 text-primary',
        secondary: 'border-white/10 bg-white/6 text-muted-foreground',
        destructive: 'border-destructive/30 bg-destructive/15 text-destructive-foreground',
        outline: 'border-white/12 bg-transparent text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ className, variant }))} {...props} />;
}

export { Badge, badgeVariants };
