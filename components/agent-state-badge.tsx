'use client';

import { type UseSessionReturn, useAgent } from '@livekit/components-react';

import { AGENT_STATE_LABELS } from '@/lib/agent-state-labels';

type AgentStateBadgeProps = {
  session: UseSessionReturn;
};

export function AgentStateBadge({ session }: AgentStateBadgeProps) {
  const agent = useAgent(session);
  const label = AGENT_STATE_LABELS[agent.state] ?? agent.state;

  return <span className={`status-pill status-pill--${agent.state.replace(/[^a-z-]/g, '-')}`}>{label}</span>;
}
