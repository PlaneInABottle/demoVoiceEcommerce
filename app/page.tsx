import { DemoSessionShell } from '@/components/demo-session-shell';
import { createHomepageRoomName, getCanonicalAgentName } from '@/app/home-page-config';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'LiveKit Ecommerce Voice Demo';
  const agentName = getCanonicalAgentName();
  const roomName = createHomepageRoomName();

  return <DemoSessionShell appName={appName} agentName={agentName} roomName={roomName} />;
}
