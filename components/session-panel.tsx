'use client';

import { useSession } from '@livekit/components-react';
import { ConnectionState, TokenSource } from 'livekit-client';
import { useMemo, useState } from 'react';

type SessionPanelProps = {
  agentName: string;
};

export function SessionPanel({ agentName }: SessionPanelProps) {
  const tokenSource = useMemo(() => TokenSource.endpoint('/api/token'), []);
  const session = useSession(tokenSource, {
    agentName,
    participantName: 'Demo shopper',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusLabel =
    session.connectionState === ConnectionState.Connected
      ? 'Connected'
      : session.connectionState === ConnectionState.Connecting
        ? 'Connecting'
        : session.connectionState === ConnectionState.Reconnecting ||
            session.connectionState === ConnectionState.SignalReconnecting
          ? 'Reconnecting'
          : 'Disconnected';

  const handleConnect = async () => {
    setErrorMessage(null);

    try {
      await session.start({
        tracks: {
          microphone: {
            enabled: false,
          },
        },
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect the session');
    }
  };

  const handleDisconnect = async () => {
    setErrorMessage(null);

    try {
      await session.end();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to disconnect the session');
    }
  };

  return (
    <div className="control-stack">
      <div className="session-summary">
        <div>
          <span className="agent-card__label">Session status</span>
          <strong>{statusLabel}</strong>
        </div>
        <p className="helper-copy">
          Connects through <code>/api/token</code> using the canonical agent dispatch name:
          <strong> {agentName}</strong>
        </p>
      </div>

      <button
        className="primary-button"
        type="button"
        disabled={session.connectionState === ConnectionState.Connecting}
        onClick={handleConnect}
      >
        Connect session
      </button>

      <button
        className="secondary-button"
        type="button"
        disabled={!session.isConnected}
        onClick={handleDisconnect}
      >
        Disconnect
      </button>

      <p className="helper-copy">
        Connect starts without enabling the microphone so local browser verification can use the
        typed transcript path later in the MVP.
      </p>

      {errorMessage ? <p className="error-copy">{errorMessage}</p> : null}
    </div>
  );
}
