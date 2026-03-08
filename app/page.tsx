import { randomUUID } from 'node:crypto';

import { DemoShell } from '@/components/demo-shell';

function getCanonicalAgentName() {
  const agentName = process.env.LIVEKIT_AGENT_NAME;

  if (!agentName) {
    throw new Error('Missing required environment variable: LIVEKIT_AGENT_NAME');
  }

  return agentName;
}

export default function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'LiveKit Ecommerce Voice Demo';
  const agentName = getCanonicalAgentName();
  const roomName = `demoVoice-room-${randomUUID()}`;

  return <DemoShell appName={appName} agentName={agentName} roomName={roomName} />;
}
