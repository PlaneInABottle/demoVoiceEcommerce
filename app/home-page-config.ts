import { randomUUID } from 'node:crypto';

const ROOM_NAME_PREFIX = 'demoVoice-room-';

export function getCanonicalAgentName(env: NodeJS.ProcessEnv = process.env) {
  const agentName = env.LIVEKIT_AGENT_NAME;

  if (!agentName) {
    throw new Error('Missing required environment variable: LIVEKIT_AGENT_NAME');
  }

  return agentName;
}

export function createHomepageRoomName(createUuid: () => string = randomUUID) {
  return `${ROOM_NAME_PREFIX}${createUuid()}`;
}
