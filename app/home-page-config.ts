import { randomUUID } from 'node:crypto';

const ROOM_NAME_PREFIX = 'demoVoice-room-';
const ENABLED_UI_FLAG_VALUES = new Set(['1', 'true', 'yes', 'on']);

function normalizeFlagValue(value: string | undefined) {
  return value?.trim().toLowerCase();
}

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

export function isUiRefactorEnabled(env: NodeJS.ProcessEnv = process.env) {
  // Server-only rollout flag. Use UI_REFACTOR_ENABLED rather than NEXT_PUBLIC_*.
  return ENABLED_UI_FLAG_VALUES.has(normalizeFlagValue(env.UI_REFACTOR_ENABLED) ?? '');
}
