import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import {
  buildTokenRoomConfig,
  isLocalHost,
  normalizeLocalHostname,
  POST,
  validateTokenRequest,
} from '@/app/api/token/route';

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

test('buildTokenRoomConfig preserves supported metadata while enforcing canonical agent name', () => {
  const config = buildTokenRoomConfig(
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

test('buildTokenRoomConfig rejects non-string metadata', () => {
  assert.throws(
    () =>
      buildTokenRoomConfig(
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

test('buildTokenRoomConfig rejects unsupported room_config keys', () => {
  assert.throws(
    () =>
      buildTokenRoomConfig(
        {
          name: 'client-room',
        } as unknown as { agents?: Array<{ agent_name?: string; metadata?: string }> },
        'canonical-agent',
      ),
    /Unsupported room_config key: name/,
  );
});

test('buildTokenRoomConfig rejects multiple agent dispatch entries', () => {
  assert.throws(
    () =>
      buildTokenRoomConfig(
        {
          agents: [{ metadata: 'first' }, { metadata: 'second' }],
        },
        'canonical-agent',
      ),
    /MVP supports at most one agent dispatch entry/,
  );
});

test('buildTokenRoomConfig rejects null agent dispatch entries', () => {
  assert.throws(
    () =>
      buildTokenRoomConfig(
        {
          agents: [null as unknown as { agent_name?: string; metadata?: string }],
        },
        'canonical-agent',
      ),
    /room_config\.agents\[0\] must be an object when provided/,
  );
});

test('validateTokenRequest rejects client-provided participant_identity', () => {
  assert.throws(
    () => validateTokenRequest({ participant_identity: 'client-specified' }),
    /participant_identity cannot be provided in the MVP token endpoint/,
  );
});

test('validateTokenRequest rejects participant_metadata on presence', () => {
  assert.throws(
    () => validateTokenRequest({ participant_metadata: '' }),
    /participant_metadata is not supported in the MVP token endpoint/,
  );
});

test('validateTokenRequest rejects participant_attributes on presence', () => {
  assert.throws(
    () => validateTokenRequest({ participant_attributes: {} }),
    /participant_attributes is not supported in the MVP token endpoint/,
  );
});

test('POST returns 400 for client-provided participant_identity', async () => {
  const previousEnv = {
    LIVEKIT_URL: process.env.LIVEKIT_URL,
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
    LIVEKIT_AGENT_NAME: process.env.LIVEKIT_AGENT_NAME,
  };

  process.env.LIVEKIT_URL = 'wss://example.livekit.cloud';
  process.env.LIVEKIT_API_KEY = 'test-key';
  process.env.LIVEKIT_API_SECRET = 'test-secret';
  process.env.LIVEKIT_AGENT_NAME = 'canonical-agent';

  try {
    const request = new NextRequest('http://localhost:3000/api/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ participant_identity: 'client-value' }),
    });

    const response = await POST(request);

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: 'participant_identity cannot be provided in the MVP token endpoint',
    });
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test('POST returns 400 for null room_config agent entry', async () => {
  const previousEnv = {
    LIVEKIT_URL: process.env.LIVEKIT_URL,
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
    LIVEKIT_AGENT_NAME: process.env.LIVEKIT_AGENT_NAME,
  };

  process.env.LIVEKIT_URL = 'wss://example.livekit.cloud';
  process.env.LIVEKIT_API_KEY = 'test-key';
  process.env.LIVEKIT_API_SECRET = 'test-secret';
  process.env.LIVEKIT_AGENT_NAME = 'canonical-agent';

  try {
    const request = new NextRequest('http://localhost:3000/api/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ room_config: { agents: [null] } }),
    });

    const response = await POST(request);

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: 'room_config.agents[0] must be an object when provided',
    });
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
