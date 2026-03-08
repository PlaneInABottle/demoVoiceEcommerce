'use client';

import { useMaybeSessionContext, useSessionMessages } from '@livekit/components-react';
import { FormEvent, useState } from 'react';

import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';

const PROMPT_CHIPS = [
  'I need noise-cancelling headphones under $200.',
  'Compare the QuietCore 200 and the Commute Mini.',
  'What is the warranty for the Travel GaN 100 Charger?',
];

export function TranscriptPanel() {
  const session = useMaybeSessionContext();
  const { isSending, send } = useSessionMessages(session);
  const [draft, setDraft] = useState('');
  const isConnected = session?.isConnected ?? false;

  const submitText = async (text: string) => {
    if (!text.trim() || !isConnected) {
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
      <header className="panel__header">
        <div>
          <h2>Transcript</h2>
          <p className="helper-copy">Voice and typed messages share the same LiveKit transcript.</p>
        </div>
      </header>

      <AgentChatTranscript />

      <div className="chip-list">
        {PROMPT_CHIPS.map((prompt) => (
          <button
            key={prompt}
            className="chip-button"
            type="button"
            disabled={!isConnected || isSending}
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
            disabled={!isConnected || isSending}
            placeholder={isConnected ? 'Ask about products, comparisons, or support policies' : 'Connect first to send text'}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="primary-button" type="submit" disabled={!isConnected || isSending}>
            Send
          </button>
        </div>
      </form>
    </article>
  );
}
