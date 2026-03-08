'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type SwitchProps = Omit<React.ComponentProps<'button'>, 'onChange'> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch({
  checked = false,
  className,
  disabled,
  onCheckedChange,
  type = 'button',
  ...props
}: SwitchProps) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-white/10 bg-white/8 p-0.5 text-foreground shadow-inner shadow-black/30 transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary/85 data-[state=unchecked]:bg-white/8',
        className,
      )}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={disabled}
      role="switch"
      type={type}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block size-5 rounded-full bg-white shadow-[0_4px_16px_rgba(2,6,23,0.45)] transition-transform duration-200 ease-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}
