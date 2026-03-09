import assert from 'node:assert/strict';
import test from 'node:test';

import { getAudioRecoveryCopy, getConnectLabel } from '@/components/demo-ui/session-panel';

test('getConnectLabel returns connected copy for active sessions', () => {
  assert.equal(getConnectLabel({ isConnected: true, microphoneEnabledOnConnect: true }), 'Connected');
});

test('getConnectLabel shortens microphone connect copy', () => {
  assert.equal(getConnectLabel({ isConnected: false, microphoneEnabledOnConnect: true }), 'Connect mic');
});

test('getConnectLabel preserves typed-only copy', () => {
  assert.equal(getConnectLabel({ isConnected: false, microphoneEnabledOnConnect: false }), 'Connect typed-only');
});

test('getAudioRecoveryCopy points to the speaker audio card below', () => {
  assert.equal(
    getAudioRecoveryCopy('Playback blocked'),
    'Playback blocked. If playback stays blocked, use the speaker audio card below.',
  );
});
