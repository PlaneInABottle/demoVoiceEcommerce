'use client';

import { RoomAudioRenderer, useAudioPlayback } from '@livekit/components-react';
import type { Room } from 'livekit-client';
import { useState } from 'react';

type LiveKitRoomAudioProps = {
  room?: Room;
  isConnected: boolean;
};

export function LiveKitRoomAudio({ room, isConnected }: LiveKitRoomAudioProps) {
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const { canPlayAudio, startAudio } = useAudioPlayback(room);

  const handleStartAudio = async () => {
    setUnlockError(null);

    try {
      await startAudio();
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : 'Unable to enable speaker audio.');
    }
  };

  return (
    <>
      <RoomAudioRenderer room={room} />

      {isConnected ? (
        <div className="audio-status" aria-live="polite">
          {canPlayAudio ? (
            <p className="audio-status__copy">Speaker audio ready for agent replies.</p>
          ) : (
            <div className="audio-status__blocked">
              <p className="audio-status__copy">
                Browser playback is waiting for a click before the agent can be heard.
              </p>
              <button className="secondary-button" type="button" onClick={handleStartAudio}>
                Enable speaker audio
              </button>
            </div>
          )}

          {unlockError ? (
            <p className="error-copy">
              {unlockError} If playback stays blocked, click the button again after focusing the tab.
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
