import assert from 'node:assert/strict';
import test from 'node:test';

import { getRefactorConnectLabel } from '@/components/refactor-ui/refactor-session-panel';

test('getRefactorConnectLabel returns connected copy for active sessions', () => {
  assert.equal(getRefactorConnectLabel({ isConnected: true, microphoneEnabledOnConnect: true }), 'Connected');
});

test('getRefactorConnectLabel shortens microphone connect copy', () => {
  assert.equal(getRefactorConnectLabel({ isConnected: false, microphoneEnabledOnConnect: true }), 'Connect mic');
});

test('getRefactorConnectLabel preserves typed-only copy', () => {
  assert.equal(getRefactorConnectLabel({ isConnected: false, microphoneEnabledOnConnect: false }), 'Connect typed-only');
});
