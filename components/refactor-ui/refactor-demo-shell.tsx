'use client';

import type { UseSessionReturn } from '@livekit/components-react';
import { useAgent } from '@livekit/components-react';

import { RefactorShellHeader } from '@/components/refactor-ui/refactor-shell-header';
import { AgentStateBadge } from '@/components/agent-state-badge';
import { AgentPane } from '@/components/agent-pane';
import { TranscriptPanel } from '@/components/transcript-panel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type RefactorDemoShellProps = {
  appName: string;
  agentName: string;
  roomName: string;
  session: UseSessionReturn;
};

function getConnectionCopy(isConnected: boolean, state: string) {
  if (isConnected) {
    return 'Live now';
  }

  if (state === 'connecting' || state === 'initializing' || state === 'pre-connect-buffering') {
    return 'Connecting';
  }

  return 'Ready to connect';
}

export function RefactorDemoShell({ appName, agentName, roomName, session }: RefactorDemoShellProps) {
  const agent = useAgent(session);
  const connectionCopy = getConnectionCopy(session.isConnected, agent.state);
  const transcriptShellClassName =
    '[&_.transcript-panel]:border-0 [&_.transcript-panel]:bg-transparent [&_.transcript-panel]:shadow-none [&_.transcript-panel]:backdrop-blur-none [&_.transcript-panel]:p-0 [&_.panel__header]:gap-4 [&_.panel__header]:px-0 [&_.panel__header]:pt-0 [&_.panel__header]:pb-5 [&_.panel__header]:border-b [&_.panel__header]:border-white/8 [&_.panel__header_h2]:text-xl [&_.panel__header_h2]:font-semibold [&_.panel__header_h2]:text-white [&_.helper-copy]:text-slate-400 [&_.transcript-panel__summary]:text-slate-500 [&_.transcript-panel__body]:mt-0 [&_.transcript-panel__body]:rounded-[24px] [&_.transcript-panel__body]:border [&_.transcript-panel__body]:border-white/8 [&_.transcript-panel__body]:bg-black/20 [&_.transcript-panel__body]:p-3 sm:[&_.transcript-panel__body]:p-4 [&_.transcript-panel__footer]:mt-5 [&_.transcript-panel__footer]:border-t [&_.transcript-panel__footer]:border-white/8 [&_.transcript-panel__footer]:px-0 [&_.transcript-panel__footer]:pt-5 [&_.transcript-panel__footer]:pb-0 [&_.transcript-panel__footer-copy_strong]:text-sm [&_.transcript-panel__footer-copy_strong]:font-medium [&_.transcript-panel__footer-copy_strong]:text-white [&_.chip-list]:gap-2 [&_.chip-button]:rounded-full [&_.chip-button]:border [&_.chip-button]:border-white/8 [&_.chip-button]:bg-white/5 [&_.chip-button]:px-3 [&_.chip-button]:py-2 [&_.chip-button]:text-sm [&_.chip-button]:text-slate-200 [&_.chip-button]:transition [&_.chip-button:hover]:bg-white/8 [&_.typed-chat-form]:gap-3 [&_.typed-chat-form__label]:text-xs [&_.typed-chat-form__label]:uppercase [&_.typed-chat-form__label]:tracking-[0.16em] [&_.typed-chat-form__label]:text-slate-500 [&_.typed-chat-form__row]:rounded-[24px] [&_.typed-chat-form__row]:border [&_.typed-chat-form__row]:border-white/8 [&_.typed-chat-form__row]:bg-white/4 [&_.typed-chat-form__row]:p-2 [&_.typed-chat-input]:min-h-11 [&_.typed-chat-input]:border-0 [&_.typed-chat-input]:bg-transparent [&_.typed-chat-input]:text-slate-100 [&_.typed-chat-input]:shadow-none [&_.typed-chat-input]:outline-none [&_.typed-chat-input]:placeholder:text-slate-500 [&_.primary-button]:rounded-full [&_.primary-button]:bg-white [&_.primary-button]:px-4 [&_.primary-button]:text-slate-950 [&_.primary-button]:shadow-none [&_.primary-button:hover]:bg-slate-200 [&_.typed-chat-form__hint]:text-sm [&_.typed-chat-form__hint]:text-slate-500';
  const agentShellClassName =
    '[&_.agent-pane]:min-h-full [&_.agent-stage]:gap-6 [&_.agent-stage]:rounded-[28px] [&_.agent-stage]:border-white/8 [&_.agent-stage]:bg-[linear-gradient(180deg,rgba(10,14,24,0.96),rgba(5,8,16,0.98))] [&_.agent-stage]:p-6 [&_.agent-stage]:shadow-[0_28px_90px_-48px_rgba(0,0,0,0.95)] [&_.agent-stage__header]:gap-4 [&_.agent-stage__identity_strong]:text-xl [&_.agent-stage__identity_strong]:text-white [&_.agent-stage__presence]:gap-5 [&_.agent-stage__presence]:rounded-[24px] [&_.agent-stage__presence]:border [&_.agent-stage__presence]:border-white/8 [&_.agent-stage__presence]:bg-white/3 [&_.agent-stage__presence]:p-5 [&_.agent-stage__visual]:min-h-[220px] [&_.agent-stage__visual]:rounded-[24px] [&_.agent-stage__visual]:border [&_.agent-stage__visual]:border-white/8 [&_.agent-stage__visual]:bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.18),rgba(2,6,23,0.18)_38%,rgba(2,6,23,0.96)_72%)] [&_.agent-stage__summary]:text-slate-300 [&_.agent-stage__chip]:border-white/8 [&_.agent-stage__chip]:bg-white/4 [&_.agent-stage__chip]:text-slate-200 [&_.agent-control-bar]:gap-4 [&_.agent-control-bar]:rounded-[24px] [&_.agent-control-bar]:border [&_.agent-control-bar]:border-white/8 [&_.agent-control-bar]:bg-black/20 [&_.agent-control-bar]:p-4 [&_.agent-control-pill]:border-white/8 [&_.agent-control-pill]:bg-white/4 [&_.agent-control-pill_strong]:text-white [&_.agent-control-bar__buttons]:gap-2 [&_.primary-button]:rounded-full [&_.primary-button]:bg-white [&_.primary-button]:px-4 [&_.primary-button]:text-slate-950 [&_.secondary-button]:rounded-full [&_.secondary-button]:border [&_.secondary-button]:border-white/10 [&_.secondary-button]:bg-white/6 [&_.secondary-button]:text-slate-100 [&_.toggle-row]:rounded-2xl [&_.toggle-row]:border [&_.toggle-row]:border-white/8 [&_.toggle-row]:bg-white/4 [&_.toggle-row]:px-3 [&_.toggle-row]:py-3 [&_.agent-stage__footer]:border-white/8 [&_.agent-stage__footer]:pt-4 [&_.agent-stage__room-name]:text-slate-200 [&_.status-pill]:border [&_.status-pill]:border-white/10 [&_.status-pill]:bg-white/6 [&_.status-pill]:text-slate-100';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_28%),linear-gradient(180deg,#04070d_0%,#050912_42%,#020409_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <RefactorShellHeader appName={appName} roomName={roomName} />

        <section className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
          <Card className="overflow-hidden border-white/8 bg-[linear-gradient(180deg,rgba(12,16,27,0.92),rgba(6,10,20,0.98))]">
            <CardHeader className="gap-4 border-b border-white/8 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge variant="secondary">Conversation</Badge>
                  <CardTitle className="text-xl text-white">Shared voice lane</CardTitle>
                  <CardDescription className="max-w-2xl text-slate-400">
                    One stream for voice turns and typed fallback, with less chrome and tighter focus.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{connectionCopy}</Badge>
                  <AgentStateBadge session={session} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="min-h-0 p-0">
              <ScrollArea className="h-full max-h-[calc(100vh-22rem)] min-h-[28rem] p-4 sm:p-6">
                <div className={transcriptShellClassName}>
                  <TranscriptPanel />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className={agentShellClassName}>
            <AgentPane agentName={agentName} session={session} />
          </div>
        </section>
      </div>
    </main>
  );
}
