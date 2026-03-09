import { AccessToken, RoomConfiguration, RoomAgentDispatch } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

const DEFAULT_ROOM_NAME = 'demoVoice-room';
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0:0:0:0:0:0:0:1']);
const ALLOWED_ROOM_CONFIG_KEYS = new Set(['agents']);
const ALLOWED_AGENT_KEYS = new Set(['agent_name', 'metadata']);

type TokenRequestBody = {
  participant_name?: string;
  participant_identity?: string;
  participant_metadata?: string;
  participant_attributes?: Record<string, string>;
  room_name?: string;
  room_config?: {
    agents?: Array<{
      agent_name?: string;
      metadata?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getRequiredEnv(name: 'LIVEKIT_URL' | 'LIVEKIT_API_KEY' | 'LIVEKIT_API_SECRET' | 'LIVEKIT_AGENT_NAME') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function normalizeLocalHostname(hostname: string) {
  return hostname.replace(/^\[(.*)\]$/, '$1').toLowerCase();
}

export function isLocalHost(hostname: string) {
  const normalizedHostname = normalizeLocalHostname(hostname);
  return LOOPBACK_HOSTS.has(normalizedHostname);
}

function isLocalRequest(request: NextRequest) {
  if (!isLocalHost(request.nextUrl.hostname)) {
    return false;
  }

  const origin = request.headers.get('origin');

  if (!origin) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const requestHostname = normalizeLocalHostname(request.nextUrl.hostname);
    const originHostname = normalizeLocalHostname(originUrl.hostname);

    return (
      isLocalHost(originHostname) &&
      originHostname === requestHostname &&
      originUrl.port === request.nextUrl.port
    );
  } catch {
    return false;
  }
}

async function parseTokenRequest(request: NextRequest) {
  const body = await request.json();

  if (!isRecord(body)) {
    throw new Error('Request body must be a JSON object');
  }

  return body as TokenRequestBody;
}

export function buildTokenRoomConfig(
  roomConfig: TokenRequestBody['room_config'],
  canonicalAgentName: string,
) {
  const dispatch = new RoomAgentDispatch({ agentName: canonicalAgentName });

  if (roomConfig === undefined) {
    return new RoomConfiguration({ agents: [dispatch] });
  }

  if (!isRecord(roomConfig)) {
    throw new Error('room_config must be an object when provided');
  }

  for (const key of Object.keys(roomConfig)) {
    if (!ALLOWED_ROOM_CONFIG_KEYS.has(key)) {
      throw new Error(`Unsupported room_config key: ${key}`);
    }
  }

  if (roomConfig.agents !== undefined && !Array.isArray(roomConfig.agents)) {
    throw new Error('room_config.agents must be an array when provided');
  }

  if (roomConfig.agents && roomConfig.agents.length > 1) {
    throw new Error('MVP supports at most one agent dispatch entry');
  }

  const providedAgent = roomConfig.agents?.[0];

  if (roomConfig.agents?.length === 1) {
    if (!isRecord(providedAgent)) {
      throw new Error('room_config.agents[0] must be an object when provided');
    }

    for (const key of Object.keys(providedAgent)) {
      if (!ALLOWED_AGENT_KEYS.has(key)) {
        throw new Error(`Unsupported room_config.agents[0] key: ${key}`);
      }
    }

    if (providedAgent.agent_name !== undefined && typeof providedAgent.agent_name !== 'string') {
      throw new Error('room_config.agents[0].agent_name must be a string when provided');
    }

    if (providedAgent.metadata !== undefined) {
      if (typeof providedAgent.metadata !== 'string') {
        throw new Error('room_config.agents[0].metadata must be a string when provided');
      }

      dispatch.metadata = providedAgent.metadata;
    }
  }

  return new RoomConfiguration({ agents: [dispatch] });
}

async function createParticipantToken(body: TokenRequestBody) {
  const livekitUrl = getRequiredEnv('LIVEKIT_URL');
  const apiKey = getRequiredEnv('LIVEKIT_API_KEY');
  const apiSecret = getRequiredEnv('LIVEKIT_API_SECRET');
  const canonicalAgentName = getRequiredEnv('LIVEKIT_AGENT_NAME');
  const roomName = body.room_name?.trim() || DEFAULT_ROOM_NAME;
  const participantName = body.participant_name?.trim() || 'Demo shopper';
  const participantIdentity = `demo-${randomUUID()}`;

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    ttl: '10m',
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });
  token.roomConfig = buildTokenRoomConfig(body.room_config, canonicalAgentName);

  return {
    server_url: livekitUrl,
    participant_token: await token.toJwt(),
  };
}

export function validateTokenRequest(body: TokenRequestBody) {
  if (body.participant_identity !== undefined) {
    throw new Error('participant_identity cannot be provided in the MVP token endpoint');
  }

  if (body.participant_metadata !== undefined) {
    throw new Error('participant_metadata is not supported in the MVP token endpoint');
  }

  if (body.participant_attributes !== undefined) {
    throw new Error('participant_attributes is not supported in the MVP token endpoint');
  }
}

export async function POST(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return jsonError('This MVP token endpoint is restricted to local same-origin development use', 403);
  }

  try {
    const body = await parseTokenRequest(request);
    validateTokenRequest(body);

    const payload = await createParticipantToken(body);
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError('Request body must be valid JSON', 400);
    }

    if (error instanceof Error) {
      const status = error.message.startsWith('Missing required environment variable') ? 500 : 400;
      return jsonError(error.message, status);
    }

    return jsonError('Failed to generate token', 500);
  }
}
