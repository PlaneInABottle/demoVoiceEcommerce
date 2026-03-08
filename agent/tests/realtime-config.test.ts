import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getRealtimeModelConfig,
  summarizeSessionSelection,
  getVoicePipelineMode,
  loadVoicePipelineConfig,
} from '../realtime-config.js';

test('defaults VOICE_PIPELINE_MODE to chained', () => {
  assert.equal(getVoicePipelineMode({}), 'chained');
  assert.deepEqual(loadVoicePipelineConfig({}), { mode: 'chained' });
});

test('rejects unsupported VOICE_PIPELINE_MODE values', () => {
  assert.throws(
    () => getVoicePipelineMode({ VOICE_PIPELINE_MODE: 'invalid' }),
    /Invalid VOICE_PIPELINE_MODE: invalid/,
  );
});

test('requires OPENAI_API_KEY for realtime mode', () => {
  assert.throws(
    () => loadVoicePipelineConfig({ VOICE_PIPELINE_MODE: 'realtime' }),
    /OPENAI_API_KEY is required when VOICE_PIPELINE_MODE=realtime/,
  );
});

test('accepts realtime mode when OPENAI_API_KEY is provided', () => {
  assert.deepEqual(
    loadVoicePipelineConfig({
      VOICE_PIPELINE_MODE: 'realtime',
      OPENAI_API_KEY: 'test-key',
    }),
    {
      mode: 'realtime',
      openAIApiKey: 'test-key',
    },
  );
});

test('preserves chained mode without requiring OPENAI_API_KEY', () => {
  assert.deepEqual(loadVoicePipelineConfig({ VOICE_PIPELINE_MODE: 'chained' }), { mode: 'chained' });
});

test('returns the documented realtime model rollout config', () => {
  assert.deepEqual(getRealtimeModelConfig(), {
    voice: 'cedar',
    turnDetection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500,
      create_response: true,
      interrupt_response: true,
    },
  });
});

test('realtime mode summary removes chained-only session inputs', () => {
  assert.deepEqual(summarizeSessionSelection('realtime'), {
    mode: 'realtime',
    usesRealtimeModel: true,
    includesVad: false,
    includesStt: false,
    includesTts: false,
    hasTurnDetection: false,
  });
});

test('chained mode summary preserves existing session inputs', () => {
  assert.deepEqual(summarizeSessionSelection('chained'), {
    mode: 'chained',
    usesRealtimeModel: false,
    includesVad: true,
    includesStt: true,
    includesTts: true,
    hasTurnDetection: true,
  });
});
