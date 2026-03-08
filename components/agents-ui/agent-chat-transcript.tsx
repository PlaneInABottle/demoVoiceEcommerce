'use client';

import { useLocalParticipant, useMaybeSessionContext, useSessionMessages } from '@livekit/components-react';
import { useEffect, useRef } from 'react';

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat([], {
  hour: 'numeric',
  minute: '2-digit',
});

export function AgentChatTranscript() {
  const session = useMaybeSessionContext();
  const { messages } = useSessionMessages(session);
  const { localParticipant } = useLocalParticipant({ room: session?.room });
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const lastMessage = messages.at(-1);
  const lastMessageText = lastMessage && 'message' in lastMessage ? lastMessage.message : '';
  const lastMessageSignature = `${lastMessage?.id ?? 'none'}:${lastMessage?.timestamp ?? 0}:${lastMessageText}`;

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'end',
    });
  }, [lastMessageSignature, messages.length]);

  return (
    <div className="transcript-list" aria-live="polite" role="log">
      {messages.length === 0 ? (
        <div className="empty-state transcript-empty-state">
          <p className="transcript-empty-state__eyebrow">Waiting for the first turn</p>
          <h3>Shared transcript appears here</h3>
          <p>Connect the session and use voice or the typed chat fallback to populate the history.</p>
        </div>
      ) : (
        messages.map((message) => {
          const body = 'message' in message ? message.message : '';
          const senderIdentity = message.from?.identity;
          const isLocalTypedMessage = Boolean(senderIdentity) && senderIdentity === localParticipant?.identity;
          const tone =
            message.type === 'agentTranscript'
              ? 'agent'
              : message.type === 'userTranscript' || isLocalTypedMessage
                ? 'user'
                : 'chat';
          const label =
            tone === 'agent'
              ? 'Agent'
              : tone === 'user'
                ? 'You'
                : message.from?.name || message.from?.identity || 'Chat';

          return (
            <article
              aria-label={`${label} at ${TIMESTAMP_FORMATTER.format(new Date(message.timestamp))}`}
              className={`transcript-item transcript-item--${tone}`}
              key={message.id}
            >
              <div className="transcript-item__meta">
                <strong className={`transcript-item__speaker transcript-item__speaker--${tone}`}>
                  {label}
                </strong>
                <span>{TIMESTAMP_FORMATTER.format(new Date(message.timestamp))}</span>
              </div>
              <div className="transcript-item__bubble">
                <p>{body}</p>
              </div>
            </article>
          );
        })
      )}
      <div ref={scrollAnchorRef} aria-hidden="true" />
    </div>
  );
}
