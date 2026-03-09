'use client';

import { useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import { useMemo } from 'react';

import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { DemoShell } from '@/components/demo-shell';

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
      <DemoShell appName={appName} agentName={agentName} roomName={roomName} session={session} />
    </AgentSessionProvider>
  );
}
