import { DemoShell } from '@/components/demo-shell';
import {
  createHomepageRoomName,
  getCanonicalAgentName,
  isUiRefactorEnabled,
} from '@/app/home-page-config';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'LiveKit Ecommerce Voice Demo';
  const agentName = getCanonicalAgentName();
  const roomName = createHomepageRoomName();
  const isRefactorEnabled = isUiRefactorEnabled();

  return (
    <DemoShell
      appName={appName}
      agentName={agentName}
      isRefactorEnabled={isRefactorEnabled}
      roomName={roomName}
    />
  );
}
