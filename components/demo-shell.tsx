'use client';

import { useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import { useMemo } from 'react';

import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { ProductSidebar } from '@/components/product-sidebar';
import { SessionPanel } from '@/components/session-panel';
import { TranscriptPanel } from '@/components/transcript-panel';

type DemoShellProps = {
  appName: string;
  agentName: string;
};

export function DemoShell({ appName, agentName }: DemoShellProps) {
  const tokenSource = useMemo(() => TokenSource.endpoint('/api/token'), []);
  const session = useSession(tokenSource, {
    agentName,
    participantName: 'Demo shopper',
  });

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">MVP demo</p>
          <h1>{appName}</h1>
          <p className="hero-copy">
            Ask the agent for product recommendations, comparisons, and support guidance using
            voice or typed input.
          </p>
        </div>
        <div className="agent-card">
          <span className="agent-card__label">Canonical agent</span>
          <strong>{agentName}</strong>
        </div>
      </section>

      <AgentSessionProvider session={session}>
        <section className="content-grid">
          <TranscriptPanel />

          <article className="panel controls-panel">
            <header className="panel__header">
              <h2>Session controls</h2>
            </header>
            <SessionPanel agentName={agentName} session={session} />
          </article>

          <ProductSidebar />
        </section>
      </AgentSessionProvider>
    </main>
  );
}
