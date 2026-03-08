'use client';

import { useAgent, type UseSessionReturn } from '@livekit/components-react';

import { AGENT_STATE_LABELS, AgentStateBadge } from '@/components/agent-state-badge';
import { SessionPanel } from '@/components/session-panel';

type AgentPaneProps = {
  agentName: string;
  session: UseSessionReturn;
};

function getStageSummary(state: string, failureReasons?: string[] | null) {
  switch (state) {
    case 'failed':
      return failureReasons?.[0] ?? 'The session needs attention before the next handoff.';
    case 'speaking':
      return 'The agent is actively responding and should feel present on this side of the shell.';
    case 'thinking':
      return 'The agent is processing the latest turn and preparing the next response.';
    case 'listening':
      return 'The agent is live in the room and listening for the next customer turn.';
    case 'idle':
      return 'The agent is connected and idle, waiting for the next customer turn.';
    case 'initializing':
      return 'The agent is connecting and setting up before the next turn opens up.';
    case 'pre-connect-buffering':
      return 'Audio is primed while the session finishes connecting the agent to the room.';
    case 'connecting':
      return 'The agent is joining the room and preparing its presence surface.';
    case 'disconnected':
      return 'The last session ended cleanly. Connect again to bring the agent back into the room.';
    default:
      return 'Connect to bring the agent into the room and keep the transcript flow intact.';
  }
}

export function AgentPane({ agentName, session }: AgentPaneProps) {
  const agent = useAgent(session);
  const stageSummary = getStageSummary(agent.state, agent.failureReasons);
  const agentStateLabel = AGENT_STATE_LABELS[agent.state] ?? agent.state;
  const sessionOutcomeLabel =
    agent.state === 'failed' ? 'Error' : agent.state === 'disconnected' ? 'Ended' : 'In progress';

  return (
    <aside className="agent-pane">
      <article className="panel agent-stage" data-state={agent.state}>
        <header className="agent-stage__header">
          <div className="agent-stage__identity">
            <span className="agent-card__label">Agent presence</span>
            <strong>{agent.name || agentName}</strong>
            <p className="helper-copy">
              Keep the agent visibly anchored here while the shared transcript and typed fallback
              remain isolated on the left.
            </p>
          </div>
          <AgentStateBadge session={session} />
        </header>

        <section className="agent-stage__presence" aria-label="Agent presence surface">
          <div
            aria-hidden="true"
            className="agent-stage__visual"
            data-audio={agent.microphoneTrack ? 'live' : 'idle'}
            data-state={agent.state}
          >
            <div className="agent-stage__halo" />
            <div className="agent-stage__core">
              <span>AI</span>
            </div>
            <div className="agent-stage__bars">
              <span className="agent-stage__bar" />
              <span className="agent-stage__bar" />
              <span className="agent-stage__bar" />
              <span className="agent-stage__bar" />
              <span className="agent-stage__bar" />
            </div>
          </div>

          <div className="agent-stage__details">
            <p className="agent-stage__summary">{stageSummary}</p>
            <div className="agent-stage__chips">
              <span className="agent-stage__chip">
                <span className="agent-card__label">Voice link</span>
                <strong>{agent.microphoneTrack ? 'Streaming' : 'Standby'}</strong>
              </span>
              <span className="agent-stage__chip">
                <span className="agent-card__label">Agent state</span>
                <strong>{agentStateLabel}</strong>
              </span>
              <span className="agent-stage__chip">
                <span className="agent-card__label">Session outcome</span>
                <strong>{sessionOutcomeLabel}</strong>
              </span>
            </div>
          </div>
        </section>

        <SessionPanel agentName={agentName} session={session} />

        <footer className="agent-stage__footer">
          <div className="agent-stage__fact">
            <span className="agent-card__label">Canonical agent</span>
            <strong>{agentName}</strong>
          </div>
          <div className="agent-stage__fact">
            <span className="agent-card__label">Session lane</span>
            <strong>{session.room.name || 'Awaiting room join'}</strong>
          </div>
        </footer>
      </article>
    </aside>
  );
}
