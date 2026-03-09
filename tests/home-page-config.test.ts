import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createHomepageRoomName,
  getCanonicalAgentName,
} from '@/app/home-page-config';

function createEnv(entries: Record<string, string | undefined>) {
  return entries as NodeJS.ProcessEnv;
}

test('getCanonicalAgentName returns the configured agent name', () => {
  assert.equal(getCanonicalAgentName(createEnv({ LIVEKIT_AGENT_NAME: 'ecommerce-agent' })), 'ecommerce-agent');
});

test('getCanonicalAgentName throws when the canonical agent name is missing', () => {
  assert.throws(() => getCanonicalAgentName(createEnv({})), /Missing required environment variable/);
});

test('createHomepageRoomName prefixes the generated UUID', () => {
  assert.equal(createHomepageRoomName(() => 'test-uuid'), 'demoVoice-room-test-uuid');
});
