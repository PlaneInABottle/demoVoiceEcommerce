'use client';

import { FormEvent, useState } from 'react';

import { useAgent, useMaybeSessionContext, useSessionMessages } from '@livekit/components-react';

import { AgentChatTranscript } from '@/components/demo-ui/agent-chat-transcript';
import { AgentStateBadge } from '@/components/demo-ui/agent-state-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function isTypedChatReady({
  canListen,
  isFinished,
  send,
}: {
  canListen: boolean;
  isFinished: boolean;
  send: unknown;
}) {
  return canListen && !isFinished && typeof send === 'function';
}

function getTypedChatHint({
  canListen,
  isFinished,
}: {
  canListen: boolean;
  isFinished: boolean;
}) {
  if (canListen) {
    return 'Ready. Messages flow through the existing typed chat topic.';
  }

  return isFinished
    ? 'Reconnect the session to send another typed message.'
    : 'Typed chat unlocks as soon as the agent can listen.';
}

function getTypedChatPlaceholder({
  canListen,
  isFinished,
}: {
  canListen: boolean;
  isFinished: boolean;
}) {
  if (canListen) {
    return 'Ask about products, shipping, returns, or warranty details…';
  }

  return isFinished
    ? 'Reconnect the session to send a typed message…'
    : 'Wait for the agent to be ready before sending a typed message…';
}

export function TranscriptPanel() {
  const session = useMaybeSessionContext();
  const agent = useAgent(session);
  const { isSending, messages, send } = useSessionMessages(session);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const typedChatStatus = {
    canListen: agent.canListen,
    isFinished: agent.isFinished,
  };
  const isTypedInputReady = isTypedChatReady({
    ...typedChatStatus,
    send,
  });
  const transcriptSummary =
    messages.length === 0 ? 'No turns yet' : `${messages.length} turn${messages.length === 1 ? '' : 's'} in view`;

  const submitText = async (text: string) => {
    if (!text.trim() || !isTypedInputReady) {
      return;
    }

    setSendError(null);

    try {
      await send(text.trim(), { topic: 'lk.chat' });
      setDraft('');
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Unable to send the typed message. Try again.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitText(draft);
  };

  return (
    <Card className="flex min-h-full flex-col border-white/8 bg-[linear-gradient(180deg,rgba(10,14,24,0.94),rgba(4,7,14,0.98))]">
      <CardHeader className="gap-5 border-b border-white/8 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-slate-500">Conversation</p>
            <CardTitle className="text-2xl font-semibold tracking-[-0.04em] text-white text-balance">
              Shared transcript
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-slate-400">
              Voice turns and typed <code>lk.chat</code> messages stay in one cleaner, easier-to-scan lane.
            </CardDescription>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            {session ? <AgentStateBadge session={session} /> : null}
            <p className="text-sm text-slate-500" aria-live="polite">
              {transcriptSummary}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-6 p-4 sm:p-6">
        <AgentChatTranscript />

        <form className="grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
          <label
            className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-slate-500"
            htmlFor="typed-chat-input"
          >
            Typed Chat (`lk.chat`)
          </label>
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-2 focus-within:border-cyan-300/35 focus-within:ring-1 focus-within:ring-cyan-300/25">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                aria-describedby={sendError ? 'typed-chat-hint typed-chat-error' : 'typed-chat-hint'}
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 text-slate-100 shadow-none focus-visible:ring-0"
                disabled={!isTypedInputReady || isSending}
                id="typed-chat-input"
                name="typedChatPrompt"
                placeholder={getTypedChatPlaceholder(typedChatStatus)}
                spellCheck={false}
                type="text"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (sendError) {
                    setSendError(null);
                  }
                }}
              />
              <Button className="h-11 px-5" disabled={!isTypedInputReady || isSending} type="submit">
                {isSending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-400" id="typed-chat-hint">
            {getTypedChatHint(typedChatStatus)}
          </p>
          {sendError ? (
            <p className="text-sm leading-6 text-red-300" id="typed-chat-error" role="alert" aria-live="polite">
              {sendError}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
