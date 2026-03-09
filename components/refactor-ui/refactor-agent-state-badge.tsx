'use client';

import { type UseSessionReturn, useAgent } from '@livekit/components-react';

import { AGENT_STATE_LABELS } from '@/lib/agent-state-labels';
import { cn } from '@/lib/utils';

type RefactorAgentStateBadgeProps = {
  session: UseSessionReturn;
};

export function RefactorAgentStateBadge({ session: _session }: RefactorAgentStateBadgeProps) {
  const agent = useAgent(_session);
  const label = AGENT_STATE_LABELS[agent.state] ?? agent.state;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium tracking-[0.14em] text-white uppercase',
        'border-white/10 bg-white/6',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-2 rounded-full',
          agent.state === 'failed'
            ? 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.7)]'
            : agent.state === 'speaking'
              ? 'bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.85)]'
              : agent.state === 'thinking'
                ? 'bg-violet-300 shadow-[0_0_14px_rgba(196,181,253,0.75)]'
                : agent.state === 'listening'
                  ? 'bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.75)]'
                  : 'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.45)]',
        )}
      />
      <span>{label}</span>
    </span>
  );
}
