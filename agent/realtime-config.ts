export type VoicePipelineMode = 'chained' | 'realtime';

type EnvSource = Record<string, string | undefined>;

export type VoicePipelineConfig =
  | {
      mode: 'chained';
    }
  | {
      mode: 'realtime';
      openAIApiKey: string;
    };

export type RealtimeTurnDetectionConfig = {
  type: 'server_vad';
  threshold: number;
  prefix_padding_ms: number;
  silence_duration_ms: number;
  create_response: true;
  interrupt_response: true;
};

export type RealtimeModelConfig = {
  voice: 'marin';
  turnDetection: RealtimeTurnDetectionConfig;
};

export type SessionSelectionSummary = {
  mode: 'chained' | 'realtime';
  usesRealtimeModel: boolean;
  includesVad: boolean;
  includesStt: boolean;
  includesTts: boolean;
  hasTurnDetection: boolean;
};

const DEFAULT_REALTIME_MODEL_CONFIG: RealtimeModelConfig = {
  voice: 'marin',
  turnDetection: {
    type: 'server_vad',
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500,
    create_response: true,
    interrupt_response: true,
  },
};

export function getVoicePipelineMode(env: EnvSource = process.env): VoicePipelineMode {
  const rawMode = env.VOICE_PIPELINE_MODE?.trim();

  if (!rawMode) {
    return 'chained';
  }

  if (rawMode === 'chained' || rawMode === 'realtime') {
    return rawMode;
  }

  throw new Error(`Invalid VOICE_PIPELINE_MODE: ${rawMode}. Expected one of: chained, realtime`);
}

export function loadVoicePipelineConfig(env: EnvSource = process.env): VoicePipelineConfig {
  const mode = getVoicePipelineMode(env);

  if (mode === 'chained') {
    return { mode };
  }

  const openAIApiKey = env.OPENAI_API_KEY?.trim();

  if (!openAIApiKey) {
    throw new Error('OPENAI_API_KEY is required when VOICE_PIPELINE_MODE=realtime');
  }

  return {
    mode,
    openAIApiKey,
  };
}

export function getRealtimeModelConfig(): RealtimeModelConfig {
  return {
    voice: DEFAULT_REALTIME_MODEL_CONFIG.voice,
    turnDetection: { ...DEFAULT_REALTIME_MODEL_CONFIG.turnDetection },
  };
}

export function summarizeSessionSelection(mode: 'chained' | 'realtime'): SessionSelectionSummary {
  if (mode === 'realtime') {
    return {
      mode,
      usesRealtimeModel: true,
      includesVad: false,
      includesStt: false,
      includesTts: false,
      hasTurnDetection: false,
    };
  }

  return {
    mode,
    usesRealtimeModel: false,
    includesVad: true,
    includesStt: true,
    includesTts: true,
    hasTurnDetection: true,
  };
}
