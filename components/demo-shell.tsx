'use client';

import { useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import { useMemo } from 'react';

import { AgentPane } from '@/components/agent-pane';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { LiveKitRoomAudio } from '@/components/livekit-room-audio';
import { RefactorDemoShell } from '@/components/refactor-ui/refactor-demo-shell';
import { TranscriptPanel } from '@/components/transcript-panel';

type DemoShellProps = {
  appName: string;
  agentName: string;
  isRefactorEnabled?: boolean;
  roomName: string;
};

export function DemoShell({ appName, agentName, isRefactorEnabled = false, roomName }: DemoShellProps) {
  const tokenSource = useMemo(() => TokenSource.endpoint('/api/token'), []);
  const session = useSession(tokenSource, {
    agentName,
    participantName: 'Demo shopper',
    roomName,
  });

  return (
    <AgentSessionProvider session={session}>
      {isRefactorEnabled ? (
        <>
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8 [&_.audio-status]:rounded-[24px] [&_.audio-status]:border [&_.audio-status]:border-white/8 [&_.audio-status]:bg-white/4 [&_.audio-status]:px-4 [&_.audio-status]:py-3 [&_.audio-status]:text-sm [&_.audio-status]:text-slate-300 [&_.audio-status__blocked]:flex [&_.audio-status__blocked]:items-center [&_.audio-status__blocked]:justify-between [&_.audio-status__blocked]:gap-3 [&_.secondary-button]:rounded-full [&_.secondary-button]:border [&_.secondary-button]:border-white/10 [&_.secondary-button]:bg-white/6 [&_.secondary-button]:px-3 [&_.secondary-button]:py-2 [&_.secondary-button]:text-sm [&_.secondary-button]:text-white">
            <LiveKitRoomAudio room={session.room} isConnected={session.isConnected} />
          </div>
          <RefactorDemoShell
            appName={appName}
            agentName={agentName}
            roomName={roomName}
            session={session}
          />
        </>
      ) : (
        <main className="page-shell">
          <LiveKitRoomAudio room={session.room} isConnected={session.isConnected} />
          <section className="split-shell">
            <section className="conversation-pane">
              <article className="panel conversation-pane__intro">
                <p className="eyebrow">MVP demo</p>
                <h1>{appName}</h1>
                <p className="hero-copy">
                  Ask the agent for product recommendations, comparisons, and grounded shipping,
                  return, and warranty guidance using voice or typed input.
                </p>
              </article>

              <TranscriptPanel />
            </section>

            <AgentPane agentName={agentName} session={session} />
          </section>
        </main>
      )}
    </AgentSessionProvider>
  );
}
