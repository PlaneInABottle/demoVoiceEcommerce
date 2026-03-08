'use client';

import { SessionProvider, type UseSessionReturn } from '@livekit/components-react';
import type { ReactNode } from 'react';

type AgentSessionProviderProps = {
  session: UseSessionReturn;
  children: ReactNode;
};

export function AgentSessionProvider({ session, children }: AgentSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
