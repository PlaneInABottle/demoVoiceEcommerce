'use client';

import { FormEvent, useState } from 'react';

import { useMaybeSessionContext, useSessionMessages } from '@livekit/components-react';

import { RefactorAgentChatTranscript } from '@/components/refactor-ui/refactor-agent-chat-transcript';
import { RefactorAgentStateBadge } from '@/components/refactor-ui/refactor-agent-state-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const PROMPT_CHIPS = [
  'I need noise-cancelling headphones under $200.',
  'Compare the QuietCore 200 and the Commute Mini.',
  'How fast is shipping and what is the return window for the QuietCore 200?',
];

export function RefactorTranscriptPanel() {
  const session = useMaybeSessionContext();
  const { isSending, messages, send } = useSessionMessages(session);
  const [draft, setDraft] = useState('');
  const isConnected = session?.isConnected ?? false;
  const hasTranscriptReadySignal = messages.some((message) => message.type === 'agentTranscript');
  const isTypedInputReady = isConnected && hasTranscriptReadySignal;
  const transcriptSummary =
    messages.length === 0 ? 'No turns yet' : `${messages.length} turn${messages.length === 1 ? '' : 's'} in view`;

  const submitText = async (text: string) => {
    if (!text.trim() || !isTypedInputReady) {
      return;
    }

    await send(text.trim(), { topic: 'lk.chat' });
    setDraft('');
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
            {session ? <RefactorAgentStateBadge session={session} /> : null}
            <p className="text-sm text-slate-500" aria-live="polite">
              {transcriptSummary}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-6 p-4 sm:p-6">
        <RefactorAgentChatTranscript />

        <div className="flex flex-wrap gap-2">
          {PROMPT_CHIPS.map((prompt) => (
            <Button
              key={prompt}
              className="h-auto min-h-10 rounded-full border border-white/8 bg-white/4 px-4 py-2 text-left text-sm font-medium text-slate-200 hover:bg-white/7"
              disabled={!isTypedInputReady || isSending}
              type="button"
              variant="ghost"
              onClick={() => void submitText(prompt)}
            >
              <span className="break-words">{prompt}</span>
            </Button>
          ))}
        </div>

        <form className="grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
          <label
            className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-slate-500"
            htmlFor="refactor-typed-chat-input"
          >
            Typed fallback (`lk.chat`)
          </label>
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-2 focus-within:border-cyan-300/35 focus-within:ring-1 focus-within:ring-cyan-300/25">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                aria-describedby="refactor-typed-chat-hint"
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 text-slate-100 shadow-none focus-visible:ring-0"
                disabled={!isTypedInputReady || isSending}
                id="refactor-typed-chat-input"
                name="typedChatPrompt"
                placeholder={
                  isTypedInputReady
                    ? 'Ask about products, shipping, returns, or warranty details…'
                    : 'Connect and wait for the first agent transcript before sending text…'
                }
                spellCheck={false}
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <Button className="h-11 px-5" disabled={!isTypedInputReady || isSending} type="submit">
                {isSending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-400" id="refactor-typed-chat-hint">
            {isTypedInputReady
              ? 'Ready. Messages flow through the existing typed chat topic.'
              : 'Typed chat unlocks after the session connects and the first agent transcript arrives.'}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
