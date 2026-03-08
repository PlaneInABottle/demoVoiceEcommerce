'use client';

import { useLocalParticipant, type UseSessionReturn } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useState } from 'react';

type SessionPanelProps = {
  agentName: string;
  session: UseSessionReturn;
};

export function SessionPanel({ agentName, session }: SessionPanelProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [microphoneEnabledOnConnect, setMicrophoneEnabledOnConnect] = useState(true);
  const {
    isMicrophoneEnabled,
    lastMicrophoneError,
    localParticipant,
    microphoneTrack,
  } = useLocalParticipant({ room: session.room });

  const statusLabel =
    session.connectionState === ConnectionState.Connected
      ? 'Connected'
      : session.connectionState === ConnectionState.Connecting
        ? 'Connecting'
        : session.connectionState === ConnectionState.Reconnecting ||
            session.connectionState === ConnectionState.SignalReconnecting
          ? 'Reconnecting'
          : 'Disconnected';

  const microphoneStatusLabel = session.isConnected
    ? isMicrophoneEnabled
      ? 'Live microphone on'
      : 'Live microphone off'
    : microphoneEnabledOnConnect
      ? 'Will start with microphone'
      : 'Typed-only start';

  const handleConnect = async () => {
    setErrorMessage(null);

    try {
      await session.start({
        tracks: {
          microphone: microphoneEnabledOnConnect
            ? {
                enabled: true,
                publishOptions: {
                  preConnectBuffer: true,
                },
              }
            : {
                enabled: false,
              },
        },
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect the session');
    }
  };

  const handleMicrophoneToggle = async () => {
    setErrorMessage(null);

    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update microphone state');
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
        <div>
          <span className="agent-card__label">Microphone</span>
          <strong>{microphoneStatusLabel}</strong>
        </div>
        <p className="helper-copy">
          Connects through <code>/api/token</code> using the canonical agent dispatch name:
          <strong> {agentName}</strong>
        </p>
      </div>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={microphoneEnabledOnConnect}
          disabled={session.isConnected || session.connectionState === ConnectionState.Connecting}
          onChange={(event) => setMicrophoneEnabledOnConnect(event.target.checked)}
        />
        <span>Enable microphone when connecting for live voice turns</span>
      </label>

      <button
        className="primary-button"
        type="button"
        disabled={session.connectionState === ConnectionState.Connecting}
        onClick={handleConnect}
      >
        {microphoneEnabledOnConnect ? 'Connect with microphone' : 'Connect typed-only'}
      </button>

      <button
        className="secondary-button"
        type="button"
        disabled={!session.isConnected}
        onClick={handleMicrophoneToggle}
      >
        {isMicrophoneEnabled ? 'Mute microphone' : 'Turn microphone on'}
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
        The typed <code>lk.chat</code> path remains available for deterministic verification. Uncheck
        the toggle above if you want a typed-only session, or connect with the microphone enabled
        for live voice capture.
      </p>

      {session.isConnected ? (
        <p className="helper-copy">
          Microphone track: <strong>{microphoneTrack ? 'published to the LiveKit session' : 'not published yet'}</strong>
        </p>
      ) : null}

      {lastMicrophoneError ? <p className="error-copy">{lastMicrophoneError.message}</p> : null}
      {errorMessage ? <p className="error-copy">{errorMessage}</p> : null}
    </div>
  );
}
