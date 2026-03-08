'use client';

import { type UseSessionReturn } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useState } from 'react';

import { AgentStateBadge } from '@/components/agent-state-badge';

type SessionPanelProps = {
  agentName: string;
  session: UseSessionReturn;
};

export function SessionPanel({ agentName, session }: SessionPanelProps) {
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
        <div className="badge-row">
          <AgentStateBadge session={session} />
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
