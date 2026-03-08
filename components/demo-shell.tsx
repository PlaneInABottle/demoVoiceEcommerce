'use client';

import { useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import { useMemo } from 'react';

import { AgentPane } from '@/components/agent-pane';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { TranscriptPanel } from '@/components/transcript-panel';

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
    <main className="page-shell">
      <AgentSessionProvider session={session}>
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
      </AgentSessionProvider>
    </main>
  );
}
