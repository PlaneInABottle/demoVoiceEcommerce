'use client';

import { useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import { useMemo } from 'react';

import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { RefactorDemoShell } from '@/components/refactor-ui/refactor-demo-shell';
import { RefactorLiveKitRoomAudio } from '@/components/refactor-ui/refactor-livekit-room-audio';

type DemoShellProps = {
  appName: string;
  agentName: string;
  roomName: string;
};

export function DemoShell({ appName, agentName, roomName }: DemoShellProps) {
  const tokenSource = useMemo(() => TokenSource.endpoint('/api/token'), []);
  const session = useSession(tokenSource, {
    agentName,
    participantName: 'Demo shopper',
    roomName,
  });

  return (
    <AgentSessionProvider session={session}>
      <RefactorLiveKitRoomAudio room={session.room} isConnected={session.isConnected} />
      <RefactorDemoShell appName={appName} agentName={agentName} roomName={roomName} session={session} />
    </AgentSessionProvider>
  );
}
