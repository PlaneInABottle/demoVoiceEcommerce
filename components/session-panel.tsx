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
  const isConnecting = session.connectionState === ConnectionState.Connecting;
  const connectLabel = session.isConnected
    ? 'Connected'
    : microphoneEnabledOnConnect
      ? 'Connect with microphone'
      : 'Connect typed-only';

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
    <section className="agent-control-bar" aria-label="Session controls">
      <div className="agent-control-bar__status">
        <div className="agent-control-pill">
          <span className="agent-card__label">Session</span>
          <strong>{statusLabel}</strong>
        </div>
        <div className="agent-control-pill">
          <span className="agent-card__label">Microphone</span>
          <strong>{microphoneStatusLabel}</strong>
        </div>
      </div>

      <div className="agent-control-bar__buttons">
        <button
          className="primary-button"
          type="button"
          disabled={session.isConnected || isConnecting}
          onClick={handleConnect}
        >
          {connectLabel}
        </button>

        <button
          aria-pressed={isMicrophoneEnabled}
          className="secondary-button"
          type="button"
          disabled={!session.isConnected}
          onClick={handleMicrophoneToggle}
        >
          {isMicrophoneEnabled ? 'Mute microphone' : 'Turn microphone on'}
        </button>

        <button
          className="secondary-button secondary-button--danger"
          type="button"
          disabled={!session.isConnected}
          onClick={handleDisconnect}
        >
          Disconnect
        </button>
      </div>

      <label className="toggle-row agent-control-bar__toggle">
        <input
          type="checkbox"
          checked={microphoneEnabledOnConnect}
          disabled={session.isConnected || isConnecting}
          onChange={(event) => setMicrophoneEnabledOnConnect(event.target.checked)}
        />
        <span>Enable microphone when connecting for live voice turns</span>
      </label>

      <p className="helper-copy agent-control-bar__helper">
        The typed <code>lk.chat</code> path remains available for deterministic verification. Uncheck
        the toggle above if you want a typed-only session, or connect with the microphone enabled
        for live voice capture.
      </p>

      <p className="helper-copy agent-control-bar__helper">
        Connects through <code>/api/token</code> using the canonical agent dispatch name:
        <strong> {agentName}</strong>
      </p>

      {session.isConnected ? (
        <p className="helper-copy agent-control-bar__helper">
          Microphone track: <strong>{microphoneTrack ? 'published to the LiveKit session' : 'not published yet'}</strong>
        </p>
      ) : null}

      {lastMicrophoneError ? <p className="error-copy">{lastMicrophoneError.message}</p> : null}
      {errorMessage ? <p className="error-copy">{errorMessage}</p> : null}
    </section>
  );
}
