import { ServerOptions, cli } from '@livekit/agents';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

import agent from './ecommerce-agent.js';
import { loadVoicePipelineConfig } from './realtime-config.js';
import { loadProductCatalog } from './catalog.js';
import { getProductCatalogPath, getRootEnvPath } from './runtime-paths.js';

function requireEnv(name: 'LIVEKIT_URL' | 'LIVEKIT_API_KEY' | 'LIVEKIT_API_SECRET' | 'LIVEKIT_AGENT_NAME') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function boot() {
  const envPath = getRootEnvPath();
  dotenv.config({ path: envPath });

  const agentName = requireEnv('LIVEKIT_AGENT_NAME');
  requireEnv('LIVEKIT_URL');
  requireEnv('LIVEKIT_API_KEY');
  requireEnv('LIVEKIT_API_SECRET');
  const pipelineConfig = loadVoicePipelineConfig();

  const catalog = await loadProductCatalog();

  console.info(`[worker] bootstrap:env ${envPath}`);
  console.info(`[worker] bootstrap:catalog ${getProductCatalogPath()}`);
  console.info(`[worker] bootstrap:catalog_count ${catalog.length}`);
  console.info(`[worker] bootstrap:agent_name ${agentName}`);
  console.info(`[worker] bootstrap:pipeline_mode ${pipelineConfig.mode}`);
  console.info('[worker] readiness:bootstrap-complete');

  cli.runApp(
    new ServerOptions({
      agent: fileURLToPath(import.meta.url),
      agentName,
    }),
  );
}

export default agent;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  boot().catch((error) => {
    console.error('[worker] bootstrap:error', error);
    process.exitCode = 1;
  });
}
