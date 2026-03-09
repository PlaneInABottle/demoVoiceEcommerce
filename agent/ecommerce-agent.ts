import {
  defineAgent,
  type JobContext,
  type JobProcess,
  voice,
} from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';

import { loadProductCatalog } from './catalog.js';
import {
  ECOMMERCE_AGENT_INSTRUCTIONS,
  INITIAL_GREETING_PROMPT,
} from './prompt.js';
import { getRealtimeModelConfig, getVoicePipelineMode } from './realtime-config.js';
import { createGetProductDetailsTool } from './tools/get-product-details.js';
import { createSearchProductsTool } from './tools/search-products.js';

type WorkerUserData = {
  vad?: silero.VAD;
};

type SessionUserData = {
  catalogSize: number;
};

type SessionStartDependencies = {
  catalogSize: number;
};

type SessionSelection = {
  mode: 'chained' | 'realtime';
  session: voice.AgentSession<SessionUserData>;
};

class EcommerceAgent extends voice.Agent<SessionUserData> {
  async onEnter() {
    console.info(
      `[worker] greeting:start catalog_size=${this.session.userData?.catalogSize ?? 'unknown'}`,
    );
    await this.session.generateReply({
      userInput: INITIAL_GREETING_PROMPT,
      toolChoice: 'none',
    });
  }
}

function attachSessionLogging(session: voice.AgentSession<SessionUserData>) {
  session.on(voice.AgentSessionEventTypes.AgentStateChanged, (event) => {
    console.info(`[worker] agent:state ${event.oldState} -> ${event.newState}`);
  });

  session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (event) => {
    const text = event.item.textContent?.replace(/\s+/g, ' ').trim();

    if (text) {
      console.info(`[worker] conversation:${event.item.role} ${text}`);
    }
  });

  session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (event) => {
    if (event.isFinal) {
      console.info(`[worker] transcript:user ${event.transcript}`);
    }
  });

  session.on(voice.AgentSessionEventTypes.FunctionToolsExecuted, (event) => {
    console.info(`[worker] tools:executed count=${event.functionCalls.length}`);
  });

  session.on(voice.AgentSessionEventTypes.SpeechCreated, (event) => {
    console.info(`[worker] speech:created source=${event.source}`);
  });

  session.on(voice.AgentSessionEventTypes.Error, (event) => {
    console.error('[worker] session:error', event.error);
  });
}

function createAgent() {
  return new EcommerceAgent({
    instructions: ECOMMERCE_AGENT_INSTRUCTIONS,
    tools: {
      searchProducts: createSearchProductsTool(),
      getProductDetails: createGetProductDetailsTool(),
    },
  });
}

function createChainedSession(
  ctx: JobContext,
  dependencies: SessionStartDependencies,
): voice.AgentSession<SessionUserData> {
  const vad = (ctx.proc.userData as WorkerUserData).vad;

  if (!vad) {
    throw new Error('Silero VAD was not prewarmed before job entry');
  }

  return new voice.AgentSession<SessionUserData>({
    vad,
    stt: 'deepgram/nova-3:multi',
    llm: 'google/gemini-3-flash-preview',
    tts: 'cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc',
    turnDetection: new livekit.turnDetector.MultilingualModel(),
    userData: {
      catalogSize: dependencies.catalogSize,
    },
    voiceOptions: {
      preemptiveGeneration: true,
    },
  });
}

function createRealtimeSession(dependencies: SessionStartDependencies): voice.AgentSession<SessionUserData> {
  const realtimeConfig = getRealtimeModelConfig();

  return new voice.AgentSession<SessionUserData>({
    llm: new openai.realtime.RealtimeModel({
      voice: realtimeConfig.voice,
      turnDetection: realtimeConfig.turnDetection,
    }),
    userData: {
      catalogSize: dependencies.catalogSize,
    },
    voiceOptions: {
      preemptiveGeneration: true,
    },
  });
}

function createSession(
  ctx: JobContext,
  dependencies: SessionStartDependencies,
): SessionSelection {
  const mode = getVoicePipelineMode();

  if (mode === 'realtime') {
    return {
      mode,
      session: createRealtimeSession(dependencies),
    };
  }

  return {
    mode,
    session: createChainedSession(ctx, dependencies),
  };
}

async function runEntry(ctx: JobContext) {
  const catalog = await loadProductCatalog();
  const roomIdentifier = ctx.room.name || 'connected-room';

  console.info(`[worker] job:accepted room=${roomIdentifier}`);
  console.info(`[worker] catalog:loaded count=${catalog.length}`);

  const { mode, session } = createSession(ctx, {
    catalogSize: catalog.length,
  });
  console.info(`[worker] session:pipeline_mode ${mode}`);

  attachSessionLogging(session);

  await session.start({
    agent: createAgent(),
    room: ctx.room,
    inputOptions: {
      noiseCancellation: BackgroundVoiceCancellation(),
    },
  });

  console.info('[worker] session:started');
}

const agent = defineAgent({
  prewarm: async (proc: JobProcess) => {
    if (getVoicePipelineMode() === 'realtime') {
      console.info('[worker] prewarm:skipped pipeline_mode=realtime');
      return;
    }

    console.info('[worker] prewarm:start');
    (proc.userData as WorkerUserData).vad = await silero.VAD.load();
    console.info('[worker] prewarm:ready');
  },
  entry: runEntry,
});

export default agent;
