'use client';

import { useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import { useMemo } from 'react';

import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { RefactorDemoShell } from '@/components/refactor-ui/refactor-demo-shell';

type DemoSessionShellProps = {
  appName: string;
  agentName: string;
  roomName: string;
};

export function DemoSessionShell({ appName, agentName, roomName }: DemoSessionShellProps) {
  const tokenSource = useMemo(() => TokenSource.endpoint('/api/token'), []);
  const session = useSession(tokenSource, {
    agentName,
    participantName: 'Demo shopper',
    roomName,
  });

  return (
    <AgentSessionProvider session={session}>
      <RefactorDemoShell appName={appName} agentName={agentName} roomName={roomName} session={session} />
    </AgentSessionProvider>
  );
}
