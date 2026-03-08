import { DemoShell } from '@/components/demo-shell';

export default function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'LiveKit Ecommerce Voice Demo';
  const agentName = process.env.LIVEKIT_AGENT_NAME ?? 'ecommerce-agent';

  return <DemoShell appName={appName} agentName={agentName} />;
}
