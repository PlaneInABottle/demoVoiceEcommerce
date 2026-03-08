'use client';

import { useMaybeSessionContext, useSessionMessages } from '@livekit/components-react';
import { FormEvent, useState } from 'react';

import { AgentStateBadge } from '@/components/agent-state-badge';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';

const PROMPT_CHIPS = [
  'I need noise-cancelling headphones under $200.',
  'Compare the QuietCore 200 and the Commute Mini.',
  'How fast is shipping and what is the return window for the QuietCore 200?',
];

export function TranscriptPanel() {
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
    <article className="panel transcript-panel">
      <header className="panel__header transcript-panel__header">
        <div className="transcript-panel__heading">
          <p className="eyebrow">Shared conversation</p>
          <h2>Conversation</h2>
          <p className="helper-copy">
            Voice transcripts and typed <code>lk.chat</code> messages stay in one shared history.
          </p>
        </div>
        <div className="transcript-panel__status" aria-live="polite">
          {session ? <AgentStateBadge session={session} /> : null}
          <p className="transcript-panel__summary">{transcriptSummary}</p>
        </div>
      </header>

      <div className="transcript-panel__body">
        <AgentChatTranscript />
      </div>

      <footer className="transcript-panel__footer">
        <div className="transcript-panel__footer-copy">
          <strong>Keep the conversation moving</strong>
          <p className="helper-copy">
            Prompt chips are shortcuts, and the composer stays anchored to the shared transcript.
          </p>
        </div>

        <div className="chip-list transcript-panel__chips">
          {PROMPT_CHIPS.map((prompt) => (
            <button
              key={prompt}
              className="chip-button"
              type="button"
              disabled={!isTypedInputReady || isSending}
              onClick={() => void submitText(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form className="typed-chat-form" onSubmit={(event) => void handleSubmit(event)}>
          <label className="typed-chat-form__label" htmlFor="typed-chat-input">
            Typed fallback (`lk.chat`)
          </label>
          <div className="typed-chat-form__row">
            <input
              id="typed-chat-input"
              className="typed-chat-input"
              type="text"
              value={draft}
              disabled={!isTypedInputReady || isSending}
              placeholder={
                isTypedInputReady
                  ? 'Ask about products, shipping, returns, or warranty details'
                  : 'Connect and wait for the first agent transcript before sending text'
              }
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              className="primary-button typed-chat-form__submit"
              type="submit"
              disabled={!isTypedInputReady || isSending}
            >
              Send
            </button>
          </div>
          <p className="typed-chat-form__hint">
            {isTypedInputReady
              ? 'Ready — messages send through the existing typed chat topic.'
              : 'Typed chat unlocks after the session connects and the first agent transcript arrives.'}
          </p>
        </form>
      </footer>
    </article>
  );
}
