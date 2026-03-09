'use client';

import { useAgent, type UseSessionReturn } from '@livekit/components-react';
import { Bot, Sparkles, Volume2 } from 'lucide-react';
import { RefactorAgentStateBadge } from '@/components/refactor-ui/refactor-agent-state-badge';
import { RefactorSessionPanel } from '@/components/refactor-ui/refactor-session-panel';
import { cn } from '@/lib/utils';
type RefactorAgentPaneProps = {
  agentName: string;
  session: UseSessionReturn;
};

export function RefactorAgentPane({ agentName: _agentName, session: _session }: RefactorAgentPaneProps) {
  const agent = useAgent(_session);
  const stageSummary =
    agent.state === 'failed'
      ? agent.failureReasons?.[0] ?? 'The session needs attention before the next handoff.'
      : agent.state === 'speaking'
        ? 'The agent is actively responding and feels present in the room.'
        : agent.state === 'thinking'
          ? 'The agent is processing the latest turn and preparing a response.'
          : agent.state === 'listening'
            ? 'The agent is live and ready for the next spoken turn.'
            : agent.state === 'idle'
              ? 'The agent is connected and waiting quietly for the next turn.'
              : agent.state === 'initializing' || agent.state === 'connecting'
                ? 'The agent is joining the room and warming up its live presence.'
                : agent.state === 'pre-connect-buffering'
                  ? 'Audio is being prepared while the session finishes connecting.'
                  : 'Connect to bring the agent into the room.';

  return (
    <aside className="min-w-0">
      <section className="grid gap-5 rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,14,24,0.96),rgba(4,7,14,0.99))] p-5 shadow-[0_30px_100px_-54px_rgba(0,0,0,0.95)] sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-slate-400">
              <Bot aria-hidden="true" className="size-3.5" />
              Agent presence
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white text-balance">
                {agent.name || _agentName}
              </h2>
              <p className="max-w-md text-sm leading-6 text-slate-400">{stageSummary}</p>
            </div>
          </div>

          <RefactorAgentStateBadge session={_session} />
        </header>

        <section className="grid gap-4 rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_32%),linear-gradient(180deg,rgba(7,12,21,0.94),rgba(5,8,16,0.98))] p-4 sm:p-5">
          <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),rgba(15,23,42,0.42)_34%,rgba(2,6,23,0.96)_72%)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2),transparent_44%)]" />
            <div className="pointer-events-none absolute inset-[16%] rounded-full border border-cyan-300/10" />
            <div className="pointer-events-none absolute inset-[28%] rounded-full border border-white/6" />
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div className="flex size-[4.5rem] items-center justify-center rounded-full border border-white/12 bg-white/6 text-white shadow-[0_0_80px_rgba(56,189,248,0.2)]">
                <Sparkles aria-hidden="true" className="size-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Premium presence surface</p>
                <p className="text-sm text-slate-400">Dark-tuned reactive visual fallback</p>
              </div>
            </div>
            <div
              aria-hidden="true"
              className={cn(
                'absolute inset-x-10 bottom-10 grid h-14 grid-cols-5 items-end gap-2 opacity-80',
                agent.microphoneTrack ? 'opacity-100' : 'opacity-45',
              )}
            >
              {[0, 1, 2, 3, 4].map((index) => (
                <span
                  key={index}
                  className={cn(
                    'rounded-full bg-[linear-gradient(180deg,rgba(125,211,252,0.95),rgba(59,130,246,0.2))]',
                    agent.state === 'speaking'
                      ? index % 2 === 0
                        ? 'h-14'
                        : 'h-9'
                      : agent.state === 'thinking'
                        ? index === 2
                          ? 'h-10'
                          : 'h-6'
                        : 'h-4',
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">Voice link</p>
              <p className="mt-2 flex items-center gap-2 text-base font-semibold text-white">
                <Volume2 aria-hidden="true" className="size-4 text-cyan-200" />
                {agent.microphoneTrack ? 'Streaming' : 'Standby'}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">Canonical agent</p>
              <p className="mt-2 text-base font-semibold text-white">{_agentName}</p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">Session lane</p>
              <p className="mt-2 truncate text-base font-semibold text-white">{_session.room.name || 'Awaiting room join'}</p>
            </div>
          </div>
        </section>

        <RefactorSessionPanel agentName={_agentName} session={_session} />
      </section>
    </aside>
  );
}
