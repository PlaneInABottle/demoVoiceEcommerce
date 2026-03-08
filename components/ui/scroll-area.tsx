import * as React from 'react';

import { cn } from '@/lib/utils';

function ScrollArea({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('min-h-0 overflow-y-auto overflow-x-hidden', className)} {...props} />;
}

export { ScrollArea };
