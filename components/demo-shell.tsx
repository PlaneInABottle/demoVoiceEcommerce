'use client';

import type { UseSessionReturn } from '@livekit/components-react';
import { useAgent } from '@livekit/components-react';

import { AgentPane } from '@/components/demo-ui/agent-pane';
import { AgentStateBadge } from '@/components/demo-ui/agent-state-badge';
import { LiveKitRoomAudio } from '@/components/demo-ui/livekit-room-audio';
import { ShellHeader } from '@/components/demo-ui/shell-header';
import { TranscriptPanel } from '@/components/demo-ui/transcript-panel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type DemoShellProps = {
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

export function DemoShell({ appName, agentName, roomName, session }: DemoShellProps) {
  const agent = useAgent(session);
  const connectionCopy = getConnectionCopy(session.isConnected, agent.state);

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_28%),linear-gradient(180deg,#04070d_0%,#050912_42%,#020409_100%)] text-foreground"
      id="main-content"
      tabIndex={-1}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <ShellHeader appName={appName} roomName={roomName} />

        <section className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
          <Card className="flex min-h-0 flex-col overflow-hidden border-white/8 bg-[linear-gradient(180deg,rgba(12,16,27,0.92),rgba(6,10,20,0.98))]">
            <CardHeader className="gap-4 border-b border-white/8 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge variant="secondary">Conversation</Badge>
                  <CardTitle className="text-xl text-white">Shared voice lane</CardTitle>
                  <CardDescription className="max-w-2xl text-slate-400">
                    One stream for voice turns and typed fallback, with less chrome and tighter focus.
                  </CardDescription>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <Badge variant="outline">{connectionCopy}</Badge>
                  <AgentStateBadge session={session} />
                </div>
              </div>
              <LiveKitRoomAudio room={session.room} isConnected={session.isConnected} />
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 p-0">
              <ScrollArea className="flex-1 min-h-0 p-4 sm:p-6">
                <TranscriptPanel />
              </ScrollArea>
            </CardContent>
          </Card>

          <AgentPane agentName={agentName} session={session} />
        </section>
      </div>
    </main>
  );
}
