'use client';

import type { UseSessionReturn } from '@livekit/components-react';

import { AgentStateBadge } from '@/components/agent-state-badge';
import { SessionPanel } from '@/components/session-panel';

type AgentPaneProps = {
  agentName: string;
  session: UseSessionReturn;
};

export function AgentPane({ agentName, session }: AgentPaneProps) {
  return (
    <aside className="agent-pane">
      <article className="agent-card agent-pane__identity">
        <span className="agent-card__label">Canonical agent</span>
        <strong>{agentName}</strong>
        <p className="helper-copy">
          This pane keeps the active agent identity, session state, and control surface together
          while the conversation stays isolated on the left.
        </p>
      </article>

      <article className="panel agent-pane__state">
        <header className="panel__header">
          <div>
            <h2>Agent state</h2>
            <p className="helper-copy">Live state stays visible while you connect, speak, or type.</p>
          </div>
        </header>
        <div className="badge-row">
          <AgentStateBadge session={session} />
        </div>
      </article>

      <article className="panel controls-panel agent-pane__controls">
        <header className="panel__header">
          <div>
            <h2>Session controls</h2>
            <p className="helper-copy">Use the existing session flow without changing token or room wiring.</p>
          </div>
        </header>
        <SessionPanel agentName={agentName} session={session} />
      </article>
    </aside>
  );
}
