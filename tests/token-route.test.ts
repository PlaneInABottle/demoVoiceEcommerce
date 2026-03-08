import test from 'node:test';
import assert from 'node:assert/strict';

import { buildNormalizedRoomConfig, isLocalHost, normalizeLocalHostname } from '@/app/api/token/route';

test('normalizeLocalHostname strips IPv6 brackets', () => {
  assert.equal(normalizeLocalHostname('[::1]'), '::1');
});

test('isLocalHost accepts only loopback hostnames', () => {
  assert.equal(isLocalHost('localhost'), true);
  assert.equal(isLocalHost('127.0.0.1'), true);
  assert.equal(isLocalHost('::1'), true);
  assert.equal(isLocalHost('[::1]'), true);
  assert.equal(isLocalHost('0:0:0:0:0:0:0:1'), true);
  assert.equal(isLocalHost('shop.localhost'), false);
  assert.equal(isLocalHost('example.com'), false);
});

test('buildNormalizedRoomConfig preserves supported metadata while enforcing canonical agent name', () => {
  const config = buildNormalizedRoomConfig(
    {
      agents: [
        {
          agent_name: 'client-agent',
          metadata: 'browser-flow',
        },
      ],
    },
    'canonical-agent',
  );

  assert.equal(config.agents.length, 1);
  assert.equal(config.agents[0]?.agentName, 'canonical-agent');
  assert.equal(config.agents[0]?.metadata, 'browser-flow');
});

test('buildNormalizedRoomConfig rejects non-string metadata', () => {
  assert.throws(
    () =>
      buildNormalizedRoomConfig(
        {
          agents: [
            {
              metadata: 42 as unknown as string,
            },
          ],
        },
        'canonical-agent',
      ),
    /room_config\.agents\[0\]\.metadata must be a string/,
  );
});
