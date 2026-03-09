import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-2 text-sm text-foreground shadow-inner shadow-black/20 outline-none transition-[background-color,border-color,color,box-shadow] placeholder:text-muted-foreground/75 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring/60',
        className,
      )}
      type={type}
      {...props}
    />
  );
}

export { Input };
