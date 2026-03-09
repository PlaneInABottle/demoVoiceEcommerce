'use client';

import { useAgent, useLocalParticipant, useMaybeSessionContext, useSessionMessages } from '@livekit/components-react';
import { useEffect, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { isScrolledNearBottom, scrollElementToBottom } from '@/lib/transcript-scroll';
import { cn } from '@/lib/utils';

type TranscriptTone = 'agent' | 'user' | 'chat';

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

export function RefactorAgentChatTranscript() {
  const session = useMaybeSessionContext();
  const agent = useAgent(session);
  const { messages } = useSessionMessages(session);
  const { localParticipant } = useLocalParticipant({ room: session?.room });
  const transcriptListRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const displayableMessages = messages.filter((message) => getDisplayableBody(message).length > 0);
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
  }, [displayableMessages.length, lastMessageSignature]);

  return (
    <div
      ref={transcriptListRef}
      aria-live="polite"
      className="flex min-h-[24rem] flex-1 flex-col gap-3 overflow-y-auto pr-1"
      role="log"
      onScroll={handleTranscriptScroll}
    >
      {displayableMessages.length === 0 ? (
        <div className="flex min-h-[22rem] flex-1 flex-col items-start justify-center gap-4 rounded-[28px] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-6 py-8 text-left">
          <Badge variant="secondary">Awaiting first turn</Badge>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-white text-balance">
              The shared transcript will settle here.
            </h3>
            <p className="max-w-md text-sm leading-6 text-slate-400">
              Connect the session, speak, or use typed fallback once the first agent transcript arrives.
            </p>
          </div>
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
              key={message.id}
              aria-label={`${label} at ${TIMESTAMP_FORMATTER.format(new Date(message.timestamp))}`}
              className={cn(
                'flex flex-col gap-2 rounded-[26px] border px-4 py-4 shadow-[0_20px_60px_-42px_rgba(0,0,0,0.95)] sm:px-5',
                tone === 'agent'
                  ? 'border-cyan-400/14 bg-[linear-gradient(180deg,rgba(18,31,49,0.88),rgba(8,16,29,0.96))]'
                  : tone === 'user'
                    ? 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]'
                    : 'border-violet-400/12 bg-[linear-gradient(180deg,rgba(32,19,54,0.52),rgba(13,10,26,0.82))]',
              )}
            >
              <div className="flex items-center justify-between gap-3 text-[0.72rem] uppercase tracking-[0.18em] text-slate-500">
                <strong
                  className={cn(
                    'font-medium',
                    tone === 'agent' ? 'text-cyan-200' : tone === 'user' ? 'text-slate-200' : 'text-violet-200',
                  )}
                >
                  {label}
                </strong>
                <span className="tabular-nums">{TIMESTAMP_FORMATTER.format(new Date(message.timestamp))}</span>
              </div>
              <p className="break-words text-[15px] leading-7 text-slate-100">{body}</p>
            </article>
          );
        })
      )}
    </div>
  );
}
