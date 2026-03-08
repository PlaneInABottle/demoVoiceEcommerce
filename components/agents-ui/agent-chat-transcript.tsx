'use client';

import { useMaybeSessionContext, useSessionMessages } from '@livekit/components-react';

export function AgentChatTranscript() {
  const session = useMaybeSessionContext();
  const { messages } = useSessionMessages(session);

  return (
    <div className="transcript-list">
      {messages.length === 0 ? (
        <div className="empty-state">
          <p>No transcript yet.</p>
          <p>Connect the session and use voice or the typed chat fallback to populate the history.</p>
        </div>
      ) : (
        messages.map((message) => {
          const body = 'message' in message ? message.message : '';
          const label =
            message.type === 'agentTranscript'
              ? 'Agent'
              : message.type === 'userTranscript'
                ? 'You'
                : message.from?.name || message.from?.identity || 'Chat';

          return (
            <article className="transcript-item" key={message.id}>
              <div className="transcript-item__meta">
                <strong>{label}</strong>
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              </div>
              <p>{body}</p>
            </article>
          );
        })
      )}
    </div>
  );
}
