import {
  defineAgent,
  type JobContext,
  type JobProcess,
  voice,
} from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';

import { loadProductCatalog } from './catalog.js';
import { ECOMMERCE_AGENT_INSTRUCTIONS } from './prompt.js';
import { createGetProductDetailsTool } from './tools/get-product-details.js';
import { createSearchProductsTool } from './tools/search-products.js';

type WorkerUserData = {
  vad?: silero.VAD;
};

type SessionUserData = {
  catalogSize: number;
};

class EcommerceAgent extends voice.Agent<SessionUserData> {
  async onEnter() {
    console.info(
      `[worker] greeting:start catalog_size=${this.session.userData?.catalogSize ?? 'unknown'}`,
    );
    await this.session.generateReply({
      userInput:
        'Greet the shopper, explain that you can help with product discovery, comparisons, and grounded shipping, return, and warranty questions, then ask what they need.',
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

async function runEntry(ctx: JobContext) {
  const catalog = await loadProductCatalog();
  const vad = (ctx.proc.userData as WorkerUserData).vad;
  const roomIdentifier = ctx.room.name || 'connected-room';

  if (!vad) {
    throw new Error('Silero VAD was not prewarmed before job entry');
  }

  console.info(`[worker] job:accepted room=${roomIdentifier}`);
  console.info(`[worker] catalog:loaded count=${catalog.length}`);

  const session = new voice.AgentSession<SessionUserData>({
    vad,
    stt: 'deepgram/nova-3:multi',
    llm: 'google/gemini-3-flash-preview',
    tts: 'cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc',
    turnDetection: new livekit.turnDetector.MultilingualModel(),
    userData: {
      catalogSize: catalog.length,
    },
    voiceOptions: {
      preemptiveGeneration: true,
    },
  });

  attachSessionLogging(session);

  await session.start({
    agent: new EcommerceAgent({
      instructions: ECOMMERCE_AGENT_INSTRUCTIONS,
      tools: {
        searchProducts: createSearchProductsTool(),
        getProductDetails: createGetProductDetailsTool(),
      },
    }),
    room: ctx.room,
    inputOptions: {
      noiseCancellation: BackgroundVoiceCancellation(),
    },
  });

  console.info('[worker] session:started');
}

const agent = defineAgent({
  prewarm: async (proc: JobProcess) => {
    console.info('[worker] prewarm:start');
    (proc.userData as WorkerUserData).vad = await silero.VAD.load();
    console.info('[worker] prewarm:ready');
  },
  entry: runEntry,
});

export default agent;
