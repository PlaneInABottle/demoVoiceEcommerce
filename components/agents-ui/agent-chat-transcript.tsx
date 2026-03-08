'use client';

import {
  useAgent,
  useLocalParticipant,
  useMaybeSessionContext,
  useSessionMessages,
} from '@livekit/components-react';
import { useEffect, useRef } from 'react';

type TranscriptTone = 'agent' | 'user' | 'chat';

const SCROLL_BOTTOM_THRESHOLD_PX = 16;

export function isScrolledNearBottom(element: Pick<HTMLDivElement, 'scrollHeight' | 'clientHeight' | 'scrollTop'>) {
  return Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) <= SCROLL_BOTTOM_THRESHOLD_PX;
}

export function scrollElementToBottom(element: Pick<HTMLDivElement, 'scrollHeight' | 'scrollTop'>) {
  element.scrollTop = element.scrollHeight;
}

function getDisplayableBody(message: { message?: string }) {
  return message.message?.trim() ?? '';
}

function getTranscriptTone({
  messageType,
  isAgentAuthoredChat,
  isLocalTypedMessage,
}: {
  messageType?: string;
  isAgentAuthoredChat: boolean;
  isLocalTypedMessage: boolean;
}): TranscriptTone {
  if (messageType === 'agentTranscript' || isAgentAuthoredChat) {
    return 'agent';
  }

  if (messageType === 'userTranscript' || isLocalTypedMessage) {
    return 'user';
  }

  return 'chat';
}

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat([], {
  hour: 'numeric',
  minute: '2-digit',
});

export function AgentChatTranscript() {
  const session = useMaybeSessionContext();
  const agent = useAgent(session);
  const { messages } = useSessionMessages(session);
  const { localParticipant } = useLocalParticipant({ room: session?.room });
  const displayableMessages = messages.filter((message) => getDisplayableBody(message).length > 0);
  const transcriptListRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastMessage = displayableMessages.at(-1);
  const lastMessageText = lastMessage ? getDisplayableBody(lastMessage) : '';
  const lastMessageSignature = `${lastMessage?.id ?? 'none'}:${lastMessage?.timestamp ?? 0}:${lastMessageText}`;

  function handleTranscriptScroll() {
    const transcriptList = transcriptListRef.current;

    if (!transcriptList) {
      return;
    }

    shouldAutoScrollRef.current = isScrolledNearBottom(transcriptList);
  }

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    const transcriptList = transcriptListRef.current;

    if (!transcriptList) {
      return;
    }

    scrollElementToBottom(transcriptList);
  }, [lastMessageSignature, displayableMessages.length]);

  return (
    <div
      ref={transcriptListRef}
      className="transcript-list"
      aria-live="polite"
      role="log"
      onScroll={handleTranscriptScroll}
    >
      {displayableMessages.length === 0 ? (
        <div className="empty-state transcript-empty-state">
          <p className="transcript-empty-state__eyebrow">Waiting for the first turn</p>
          <h3>Shared transcript appears here</h3>
          <p>Connect the session and use voice or the typed chat fallback to populate the history.</p>
        </div>
      ) : (
        displayableMessages.map((message) => {
          const body = getDisplayableBody(message);
          const senderIdentity = message.from?.identity;
          const isLocalTypedMessage = Boolean(senderIdentity) && senderIdentity === localParticipant?.identity;
          const isAgentAuthoredChat =
            Boolean(senderIdentity) &&
            (senderIdentity === agent.internal.agentParticipant?.identity ||
              senderIdentity === agent.internal.workerParticipant?.identity);
          const tone = getTranscriptTone({
            messageType: message.type,
            isAgentAuthoredChat,
            isLocalTypedMessage,
          });
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
    </div>
  );
}
