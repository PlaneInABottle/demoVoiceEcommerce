'use client';

import { RoomAudioRenderer, useAudioPlayback } from '@livekit/components-react';
import type { Room } from 'livekit-client';
import { Volume2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RefactorLiveKitRoomAudioProps = {
  room?: Room;
  isConnected: boolean;
};

export function RefactorLiveKitRoomAudio({ room: _room, isConnected: _isConnected }: RefactorLiveKitRoomAudioProps) {
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const { canPlayAudio, startAudio } = useAudioPlayback(_room);

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
      <RoomAudioRenderer room={_room} />

      {_isConnected ? (
        <div
          aria-live="polite"
          className={cn(
            'rounded-[24px] border border-white/8 px-4 py-3 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]',
            canPlayAudio
              ? 'bg-[linear-gradient(180deg,rgba(14,26,28,0.82),rgba(8,15,19,0.92))]'
              : 'bg-[linear-gradient(180deg,rgba(26,20,12,0.8),rgba(18,12,8,0.92))]',
          )}
        >
          {canPlayAudio ? (
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="flex size-9 items-center justify-center rounded-full border border-emerald-300/18 bg-emerald-300/10 text-emerald-200">
                <Volume2 aria-hidden="true" className="size-4" />
              </span>
              <div>
                <p className="font-medium text-white">Speaker audio ready</p>
                <p className="text-slate-400">Agent replies can be heard in this tab.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Speaker audio is still locked</p>
                <p className="text-sm text-slate-400">
                  Browser playback needs one click before the agent can be heard.
                </p>
              </div>
              <Button className="h-10 px-4" type="button" variant="secondary" onClick={handleStartAudio}>
                Enable speaker audio
              </Button>
            </div>
          )}

          {unlockError ? (
            <p className="mt-3 text-sm leading-6 text-red-300">
              {unlockError} If playback stays blocked, focus the tab and try again.
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
