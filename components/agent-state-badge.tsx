'use client';

import { type UseSessionReturn, useAgent } from '@livekit/components-react';

type AgentStateBadgeProps = {
  session: UseSessionReturn;
};

export const AGENT_STATE_LABELS: Record<string, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting',
  'pre-connect-buffering': 'Preparing audio',
  initializing: 'Initializing',
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  failed: 'Failed',
};

export function AgentStateBadge({ session }: AgentStateBadgeProps) {
  const agent = useAgent(session);
  const label = AGENT_STATE_LABELS[agent.state] ?? agent.state;

  return <span className={`status-pill status-pill--${agent.state.replace(/[^a-z-]/g, '-')}`}>{label}</span>;
}
