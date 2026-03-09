'use client';

import { useAudioPlayback, useLocalParticipant, type UseSessionReturn } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

type SessionPanelProps = {
  agentName: string;
  session: UseSessionReturn;
};

export function getAudioRecoveryCopy(message: string) {
  return `${message}. If playback stays blocked, use the speaker audio card below.`;
}

export function getConnectLabel({
  isConnected,
  microphoneEnabledOnConnect,
}: {
  isConnected: boolean;
  microphoneEnabledOnConnect: boolean;
}) {
  if (isConnected) {
    return 'Connected';
  }

  return microphoneEnabledOnConnect ? 'Connect mic' : 'Connect typed-only';
}

export function SessionPanel({ agentName: _agentName, session: _session }: SessionPanelProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [microphoneEnabledOnConnect, setMicrophoneEnabledOnConnect] = useState(true);
  const { startAudio } = useAudioPlayback(_session.room);
  const { isMicrophoneEnabled, lastMicrophoneError, localParticipant, microphoneTrack } = useLocalParticipant({
    room: _session.room,
  });

  const statusLabel =
    _session.connectionState === ConnectionState.Connected
      ? 'Connected'
      : _session.connectionState === ConnectionState.Connecting
        ? 'Connecting'
        : _session.connectionState === ConnectionState.Reconnecting ||
            _session.connectionState === ConnectionState.SignalReconnecting
          ? 'Reconnecting'
          : 'Disconnected';
  const isConnecting = _session.connectionState === ConnectionState.Connecting;
  const connectLabel = getConnectLabel({
    isConnected: _session.isConnected,
    microphoneEnabledOnConnect,
  });
  const microphoneStatusLabel = _session.isConnected
    ? isMicrophoneEnabled
      ? 'Live microphone on'
      : 'Live microphone off'
    : microphoneEnabledOnConnect
      ? 'Will start with microphone'
      : 'Typed-only start';

  const handleConnect = async () => {
    setErrorMessage(null);

    try {
      await _session.start({
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
      return;
    }

    if (!_session.room.canPlaybackAudio) {
      try {
        await startAudio();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? getAudioRecoveryCopy(error.message)
            : 'Connected, but speaker audio still needs a click. Use the speaker audio card below.',
        );
      }
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
      await _session.end();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to disconnect the session');
    }
  };

  return (
    <section aria-label="Session controls" className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-4">
          <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">Session</p>
          <p className="mt-2 text-lg font-semibold text-white">{statusLabel}</p>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-4">
          <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">Microphone</p>
          <p className="mt-2 text-lg font-semibold text-white">{microphoneStatusLabel}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button className="h-11 w-full min-w-0 px-3 text-center whitespace-normal sm:px-4" disabled={_session.isConnected || isConnecting} onClick={handleConnect}>
          {connectLabel}
        </Button>

        <Button
          aria-pressed={isMicrophoneEnabled}
          className="h-11 w-full min-w-0 px-3 text-center whitespace-normal sm:px-4"
          disabled={!_session.isConnected}
          type="button"
          variant="secondary"
          onClick={handleMicrophoneToggle}
        >
          {isMicrophoneEnabled ? <MicOff aria-hidden="true" className="size-4" /> : <Mic aria-hidden="true" className="size-4" />}
          {isMicrophoneEnabled ? 'Mute microphone' : 'Turn microphone on'}
        </Button>

        <Button
          className="h-11 w-full min-w-0 px-3 text-center whitespace-normal sm:px-4"
          disabled={!_session.isConnected}
          type="button"
          variant="destructive"
          onClick={handleDisconnect}
        >
          <PhoneOff aria-hidden="true" className="size-4" />
          Disconnect
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-white" htmlFor="connect-mic-switch">
            Start with live microphone
          </label>
          <p className="text-sm leading-6 text-slate-400">
            Turn this off for a typed-only session while preserving the same connection flow.
          </p>
        </div>
        <Switch
          checked={microphoneEnabledOnConnect}
          disabled={_session.isConnected || isConnecting}
          id="connect-mic-switch"
          name="microphoneEnabledOnConnect"
          onCheckedChange={setMicrophoneEnabledOnConnect}
        />
      </div>

      <div className="space-y-2 text-sm leading-6 text-slate-400">
        <p>
          The typed <code>lk.chat</code> path remains available for deterministic verification.
        </p>
        <p>
          Connects through <code>/api/token</code> using the canonical agent dispatch name:
          <strong className="text-slate-200"> {_agentName}</strong>
        </p>
        {_session.isConnected ? (
          <p>
            Microphone track:{' '}
            <strong className="text-slate-200">
              {microphoneTrack ? 'published to the LiveKit session' : 'not published yet'}
            </strong>
          </p>
        ) : null}
      </div>

      {lastMicrophoneError ? (
        <p aria-live="polite" className="text-sm leading-6 text-red-300" role="alert">
          {lastMicrophoneError.message}
        </p>
      ) : null}
      {errorMessage ? (
        <p aria-live="polite" className="text-sm leading-6 text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
