# Realtime Backend Refactor - Implementation Plan

## Problem Statement
The current worker is a chained voice pipeline using Deepgram STT, Gemini LLM, and Cartesia TTS inside a single `voice.AgentSession` (`agent/ecommerce-agent.ts:81-93`). The repo already pins LiveKit Agents `1.0.48`, whose installed source includes `RealtimeModel` support (`agent/node_modules/@livekit/agents/src/llm/realtime.ts:62-79`), but the repo does not currently install or reference any concrete realtime provider plugin (`agent/package.json:12-20`).

The requested change is to migrate the worker/backend to a realtime architecture first, with minimal blast radius, while proving package compatibility, env contract changes, parity expectations, validation steps, and rollback.

## Approach
Use the smallest viable backend migration: keep the existing LiveKit worker shape, tools, prompt, token endpoint, and frontend session contract, but replace the chained speech stack with a LiveKit-supported provider realtime model via `@livekit/agents-plugin-openai@1.0.48`, gated by a bounded worker env mode for safe rollout and rollback.

## Chosen Target Architecture
**Primary target:** LiveKit Agents JS `1.0.48` worker using `@livekit/agents-plugin-openai@1.0.48` and `openai.realtime.RealtimeModel` as the single realtime backend.

### Why this is the most plausible architecture now
- **Verified support in current core:** installed `@livekit/agents` exposes `RealtimeModel` and `AgentSession` accepts `LLM | RealtimeModel` (`agent/node_modules/@livekit/agents/src/voice/agent_session.ts:110-119`, `:131-135`).
- **Verified plugin match:** `npm view` shows `@livekit/agents-plugin-openai@1.0.48` peers exactly on `@livekit/agents: 1.0.48` and `@livekit/rtc-node: ^0.13.24`, which matches this repo (`agent/package.json:13-17`; `agent/package-lock.json:11-18`).
- **Documented Node realtime path:** Context7 LiveKit docs show Node usage with `new openai.realtime.RealtimeModel(...)` in `voice.AgentSession`; OpenAI plugin docs explicitly state the plugin supports the Realtime API.
- **Lower blast radius than Google beta realtime:** Context7/docs show Google realtime under `google.beta.realtime.RealtimeModel`, so OpenAI is the safer non-beta target for a first backend migration.
- **Preserves existing app boundaries:** token issuance, room join, `lk.chat` typed path, prompt, and tool implementations remain in the same repo shape.

## Success Criteria
- [ ] Worker can run in realtime mode without STT/LLM/TTS string wiring.
- [ ] Exact package/provider compatibility is documented and validated before code merge.
- [ ] Env contract clearly defines required vars for chained vs realtime mode.
- [ ] Existing greeting, tools, transcript path, typed `lk.chat`, interruptions, and audible output have explicit parity expectations.
- [ ] Rollback is one env flip, not a code revert.
- [ ] No CRITICAL/HIGH unresolved assumptions remain.

## Verified Facts vs Assumptions
| Type | Item | Evidence | Status / Resolution |
|------|------|----------|---------------------|
| Verified fact | Current worker is chained and uses Deepgram + Gemini + Cartesia. | `agent/ecommerce-agent.ts:81-93` | Resolved |
| Verified fact | Current greeting is issued through `session.generateReply(...)` in `onEnter()`. | `agent/ecommerce-agent.ts:24-34` | Resolved |
| Verified fact | Current worker relies on Silero prewarm and LiveKit turn detector. | `agent/ecommerce-agent.ts:16-18`, `:71-76`, `:82`, `:86`, `:115-118` | Resolved |
| Verified fact | Current worker logs state, transcript, tools, speech, and errors via `AgentSessionEventTypes`. | `agent/ecommerce-agent.ts:37-67` | Resolved |
| Verified fact | Repo root `.env` is the canonical worker env source; `agent/main.ts` loads it explicitly. | `agent/main.ts:19-27`; `agent/runtime-paths.ts:32-34`; `README.md:20-27`, `:52` | Resolved |
| Verified fact | Current public env example contains no provider-specific voice/model variables. | `.env.example:1-5` | Resolved |
| Verified fact | Current agent package does not include a concrete realtime provider plugin. | `agent/package.json:12-20` | Resolved |
| Verified fact | The repo already uses Node's built-in test runner with `tsx` at the root, and the agent package already depends on `tsx`, so Phase 2 can reuse the same minimal harness pattern without adding another test framework. | `package.json:10`; `agent/package.json:7`, `:22-25` | Resolved |
| Verified fact | Installed LiveKit core supports realtime models. | `agent/node_modules/@livekit/agents/src/llm/realtime.ts:62-79`; `agent/node_modules/@livekit/agents/src/voice/agent_session.ts:114`; Context7 `/livekit/agents-js` | Resolved |
| Verified fact | LiveKit Agent internals update realtime instructions/chat context/tools for realtime sessions. | `agent/node_modules/@livekit/agents/src/voice/agent_activity.ts:271-301` | Resolved |
| Verified fact | LiveKit warns that server-side realtime turn detection supersedes normal turn detection settings. | `agent/node_modules/@livekit/agents/src/voice/agent_activity.ts:177-217` | Resolved |
| Verified fact | LiveKit docs show Node realtime setup via `@livekit/agents-plugin-openai` and `new openai.realtime.RealtimeModel({ voice: ... })`. | Context7 `/websites/livekit_io_agents` and `/livekit/agents-js` | Resolved |
| Verified fact | `@livekit/agents-plugin-openai@1.0.48` peers exactly on `@livekit/agents: 1.0.48` and `@livekit/rtc-node: ^0.13.24`. | `npm view @livekit/agents-plugin-openai@1.0.48 ...`; current repo pins `@livekit/agents 1.0.48`, `@livekit/rtc-node ^0.13.24` in `agent/package.json:13-17` | Resolved |
| Verified fact | OpenAI Node SDK supports Realtime WebSocket APIs in v6.x docs; repo lock already contains `openai@6.27.0` transitively. | Context7 `/openai/openai-node/v6_1_0`; `agent/package-lock.json:3390-3405` | Resolved |
| Verified fact | OpenAI Realtime docs list `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, and `cedar` as supported built-in voices, and recommend `marin`/`cedar` for best quality. | Context7 `/websites/developers_openai_api` | Resolved |
| Verified fact | Retrieved OpenAI Realtime docs describe `server_vad` as the default VAD mode and document `threshold`, `prefix_padding_ms`, and `silence_duration_ms`; retrieved LiveKit docs verify `server_vad` as a supported Node configuration for `RealtimeModel`. | Context7 `/websites/developers_openai_api`; `/websites/livekit_io_agents` | Resolved |
| Verified fact | Google realtime is documented as beta in the LiveKit plugin docs. | Context7 `/livekit/agents-js` / Google plugin README excerpt | Resolved |
| Verified fact | Current startup docs require `npm --prefix agent run download-files` before worker start, and the chained worker still prewarms Silero VAD at runtime. | `README.md:98-110`; `agent/package.json:7-10`; `agent/ecommerce-agent.ts:74-76`, `:115-118` | Resolved |
| Verified fact | Frontend typed fallback uses LiveKit text stream topic `lk.chat`. | `components/transcript-panel.tsx:22-29`; `README.md:155`; `verify/browser-smoke.md:47-52` | Resolved |
| Planned rollout choice | Initial realtime rollout will set `voice: 'marin'`. | Supported and recommended by OpenAI docs, but not verified as a plugin/runtime default in this repo. | Validate in Phase 3 / Gate 3 with credentialed runtime smoke |
| Planned rollout choice | Initial realtime rollout will set `turnDetection.type: 'server_vad'`. | Supported by retrieved LiveKit/OpenAI docs and compatible with the documented OpenAI default behavior, but still requires runtime validation in this worker. | Validate in Phase 3 / Gate 3 for interruption and endpointing behavior |
| Verified fact | Typed input readiness is currently gated on the frontend receiving at least one `agentTranscript` message before `lk.chat` send controls enable. | `components/transcript-panel.tsx:19-20`, `:27`; `components/agents-ui/agent-chat-transcript.tsx:20-24` | Must be revalidated under realtime mode before rollout approval |
| Low assumption | OpenAI realtime voice will not perfectly match Cartesia timbre; parity is behavioral, not identical voice identity. | Provider change is explicit; validate audible output presence/intelligibility, not exact timbre. | Bounded, non-critical |
| Low assumption | User will supply `OPENAI_API_KEY` when they are ready to activate realtime mode. | User explicitly said they may provide the key later; rollout is gated by env mode. | Bounded, non-critical |

**Summary:** zero CRITICAL/HIGH unresolved assumptions remain. Verified items are limited to package compatibility, documented constructor/support surfaces, supported voice options, documented turn-detection behavior, and the current frontend transcript-readiness dependency on `agentTranscript`. The initial `marin` + explicit `server_vad` settings are deliberate rollout choices supported by docs but still require Phase 3 / Gate 3 credentialed validation before they can be treated as confirmed runtime behavior.

## Compatibility Matrix
| Layer | Repo / Target Version | Verified Source | Compatibility | Notes |
|------|------------------------|-----------------|---------------|-------|
| LiveKit core | `@livekit/agents` `1.0.48` | `agent/package.json:13`; installed source | ✅ Compatible | Core exposes `RealtimeModel` and accepts it in `AgentSession`. |
| LiveKit RTC peer | `@livekit/rtc-node` `^0.13.24` | `agent/package.json:17` | ✅ Compatible | Matches OpenAI plugin peer requirement. |
| Chosen realtime plugin | `@livekit/agents-plugin-openai` `1.0.48` | `npm view @livekit/agents-plugin-openai@1.0.48` | ✅ Compatible | Exact peer match with current LiveKit core. |
| OpenAI SDK | plugin dependency `openai ^6.8.1`; repo lock already resolves `6.27.0` | `npm view ...`; `agent/package-lock.json:3390-3405` | ✅ Compatible | Realtime API documented in OpenAI Node v6 docs. |
| Worker runtime pattern | `voice.AgentSession({ llm: new openai.realtime.RealtimeModel(...) })` | Context7 `/websites/livekit_io_agents`, `/livekit/agents-js` | ✅ Compatible | Documented Node path; no custom transport needed in app code. |
| Existing worker tools | `llm.tool(...)` catalog tools | `agent/tools/search-products.ts:6-36`; `agent/tools/get-product-details.ts:6-31`; realtime tool updates in `agent_activity.ts:297-301` | ✅ Compatible | LiveKit updates tools into realtime session. |
| Existing frontend typed path | `lk.chat` plus `agentTranscript` readiness gate | `components/transcript-panel.tsx:19-29`; `components/agents-ui/agent-chat-transcript.tsx:20-24` | ✅ Expected | Rollout is blocked until realtime smoke proves `agentTranscript` still appears and typed input stays enabled. |
| Alternative plugin | `@livekit/agents-plugin-google@1.0.48` | `npm view ...`; Context7 Google plugin docs | ⚠️ Available but not chosen | Realtime is documented under `google.beta.*`; higher rollout risk. |

## Parity Checklist
| Behavior | Current Evidence | Realtime Expectation | Validation Gate |
|---------|------------------|----------------------|-----------------|
| Greeting | `EcommerceAgent.onEnter()` triggers greeting via `generateReply` (`agent/ecommerce-agent.ts:24-34`) | Same greeting occurs on first connect in realtime mode | Phase 3 runtime smoke |
| Tool use | Search/detail tools exist and are registered on agent (`agent/ecommerce-agent.ts:98-103`) | Same tools remain registered and callable by model | Phase 3 typed product query + log proof |
| Typed path | Frontend sends `lk.chat` text only after `agentTranscript` is seen (`components/transcript-panel.tsx:19-29`) | Same typed input remains functional after the first realtime greeting transcript lands | Gate 4 transcript compatibility checkpoint |
| Transcript behavior | Worker logs final user transcripts and conversation items (`agent/ecommerce-agent.ts:42-54`) and UI labels `agentTranscript` / `userTranscript` (`components/agents-ui/agent-chat-transcript.tsx:17-24`) | Transcript still appears in UI, enables typed fallback, and logs remain intelligible | Gate 3 + Gate 4 transcript compatibility checkpoint |
| Interruptions | Current voice stack enables preemptive generation (`agent/ecommerce-agent.ts:90-92`) | Realtime mode should allow interruption-friendly turn handling using server VAD/turn detection | Phase 3 manual voice check |
| Audible output | Browser smoke already requires audible confirmation (`verify/agent-worker-smoke.md:51-77`; `verify/browser-smoke.md:47-60`) | Realtime replies must still be audible in browser | Phase 4 human-audible check |

---

## Phase 1: Add the exact realtime provider dependency and rollout env contract
**Owner**: @implementer (backend/platform)
**Dependencies**: None
**Complexity**: LOW

### Tasks
- [ ] Update `agent/package.json` to add `@livekit/agents-plugin-openai@1.0.48` and an agent-local test script wired as `"test": "node --import tsx --test tests/**/*.test.ts"` for pure config tests.
- [ ] Regenerate `agent/package-lock.json` so the lockfile reflects the chosen plugin/version exactly.
- [ ] Extend `.env.example` with only the bounded new contract needed for rollout: `VOICE_PIPELINE_MODE` and `OPENAI_API_KEY`.
- [ ] Keep existing LiveKit env vars unchanged so `/api/token` and dispatch behavior remain untouched.
- [ ] Verify install/build still succeed with the pinned dependency set.

### Acceptance Criteria
- [ ] `@livekit/agents-plugin-openai@1.0.48` is pinned in the agent package.
- [ ] Lockfile reflects the same plugin version.
- [ ] New env contract is minimal and limited to backend rollout needs.
- [ ] No frontend files or token endpoint files change in this phase.

### Validation Commands
- [ ] `npm --prefix agent install`
- [ ] `npm --prefix agent run build`

### Gate 1 Reproducible Package-Compatibility Verification
- [ ] `npm view @livekit/agents-plugin-openai@1.0.48 peerDependencies dependencies.openai --json`
- [ ] `node -p "const pkg=require('./agent/package.json'); ({ agents: pkg.dependencies['@livekit/agents'], rtcNode: pkg.dependencies['@livekit/rtc-node'] })"`
- [ ] `npm --prefix agent ls @livekit/agents @livekit/rtc-node @livekit/agents-plugin-openai openai`

### Expected Gate 1 Checks
- [ ] `npm view` output shows `peerDependencies["@livekit/agents"] === "1.0.48"`.
- [ ] `npm view` output shows `peerDependencies["@livekit/rtc-node"] === "^0.13.24"`.
- [ ] `npm view` output shows the plugin depends on `openai` `^6.8.1` or another compatible `6.x` range.
- [ ] `node -p` output shows repo pins `@livekit/agents` to `1.0.48` and `@livekit/rtc-node` to `^0.13.24`.
- [ ] `npm ls` resolves `@livekit/agents-plugin-openai@1.0.48`, `@livekit/agents@1.0.48`, a compatible `@livekit/rtc-node@0.13.x`, and `openai@6.x`.

---

## Phase 2: Isolate realtime/chained worker config behind a small tested contract
**Owner**: @implementer (backend/config)
**Dependencies**: Phase 1
**Complexity**: MEDIUM

### Tasks
- [ ] Create `agent/realtime-config.ts` to parse `VOICE_PIPELINE_MODE` and validate required provider env vars.
- [ ] Keep the contract intentionally narrow: only `chained` and `realtime`, with `OPENAI_API_KEY` required only for realtime mode.
- [ ] Add `agent/tests/realtime-config.test.ts` and run it through the agent-local harness `node --import tsx --test tests/**/*.test.ts` exposed as `npm --prefix agent test` in `agent/package.json`.
- [ ] Cover at minimum: default mode, invalid mode rejection, realtime mode requiring `OPENAI_API_KEY`, and chained mode preserving current behavior.
- [ ] Update `agent/main.ts` to log the selected pipeline mode during bootstrap without logging secrets.
- [ ] Do **not** introduce a generic provider abstraction layer; this module is only a rollout guard and config validator.

### Acceptance Criteria
- [ ] Realtime activation is impossible without explicit env opt-in.
- [ ] Missing realtime credentials fail fast at bootstrap with a clear error.
- [ ] Automated tests run via `npm --prefix agent test` using `node:test` + `tsx` and cover config parsing/guardrails.
- [ ] Current chained mode remains bootable after this phase.

### Validation Commands
- [ ] `npm --prefix agent test`
- [ ] `npm --prefix agent run build`
- [ ] `VOICE_PIPELINE_MODE=chained npm --prefix agent run dev`

---

## Phase 3: Wire the worker session to OpenAI RealtimeModel with minimal code churn
**Owner**: @implementer (backend/livekit)
**Dependencies**: Phase 2
**Complexity**: HIGH

### Documented supported constructor/config surface
- [ ] Limit Phase 3's mandatory constructor claims to fields verified in official docs today:

      new openai.realtime.RealtimeModel()
      new openai.realtime.RealtimeModel({ voice: 'marin' })
      new openai.realtime.RealtimeModel({
        turnDetection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
          interrupt_response: true,
        },
      })

- [ ] OpenAI docs list supported built-in voices including `marin` and `cedar`, and recommend those two for best quality; docs do **not** verify `marin` as the default voice.
- [ ] LiveKit/OpenAI docs show `server_vad` as a supported `turnDetection` option; OpenAI docs say the default VAD mode is `server_vad`, so this plan treats `server_vad` as a documented supported choice rather than inventing extra defaults.
- [ ] OpenAI docs state `output_modalities` cannot request both text and audio simultaneously; therefore this plan must **not** require or recommend `modalities: ['text', 'audio']`.
- [ ] `inputAudioTranscription` and explicit `model` overrides are **not** treated as verified mandatory constructor fields in this plan because they were not confirmed in the retrieved LiveKit Node examples for `@livekit/agents-plugin-openai@1.0.48`.

### Chosen rollout values for this plan (supported, not overstated)
- [ ] Set `voice: 'marin'` as the initial rollout voice because it is a documented supported/recommended option; treat this as a deliberate operator choice, not a verified runtime default.
- [ ] Set `turnDetection.type: 'server_vad'` with `threshold: 0.5`, `prefix_padding_ms: 300`, `silence_duration_ms: 500`, `create_response: true`, and `interrupt_response: true`; treat this as a documented supported configuration to validate in runtime smoke.
- [ ] Omit `modalities` in the first rollout so the worker follows provider defaults instead of asserting an unverified text+audio combination that conflicts with OpenAI docs.
- [ ] Omit `inputAudioTranscription` unless the implementer verifies the exact field name and nesting against the installed `@livekit/agents-plugin-openai@1.0.48` source after Phase 1 install; if later added, record it as a separately validated implementation choice.
- [ ] Gate 3 must validate the actual chosen runtime config with a real key before it is described as confirmed behavior.

### Tasks
- [ ] Update `agent/ecommerce-agent.ts` so realtime mode builds `voice.AgentSession` with `llm: new openai.realtime.RealtimeModel(...)` using only the verified constructor fields required by this plan (`voice` and optional `turnDetection`), while keeping the existing `voice.Agent`, prompt, and tool registrations intact.
- [ ] Preserve the existing chained path behind `VOICE_PIPELINE_MODE=chained` for rollback; do not redesign the token flow or room join flow.
- [ ] In realtime mode, remove chained-only session inputs (`stt`, `tts`, `turnDetection: new livekit.turnDetector.MultilingualModel()`, and mandatory Silero VAD dependency) because LiveKit internals explicitly treat realtime turn detection differently (`agent_activity.ts:177-217`).
- [ ] Keep `BackgroundVoiceCancellation()` in `inputOptions`, since LiveKit’s documented Node realtime example still uses it.
- [ ] Keep existing greeting and session logging; add one explicit log line identifying `pipeline_mode=realtime|chained` at session start.
- [ ] Add/update a focused regression test in `agent/tests/realtime-config.test.ts` or a new adjacent pure test file only for any extracted pure session-option builder logic; avoid fake end-to-end framework tests.
- [ ] Make credentialed runtime smoke mandatory: placeholder-key boot validation is allowed earlier for config proof, but Phase 3 is not complete and Gate 3 cannot pass until realtime mode has been exercised once with a real `OPENAI_API_KEY`.

### Acceptance Criteria
- [ ] Realtime mode uses a concrete provider plugin, not string model aliases.
- [ ] Realtime mode uses only constructor/config fields verified for this plan (`voice: 'marin'` and optional `turnDetection.type: 'server_vad'` with the documented server-VAD settings), unless any extra field is first verified against installed `@livekit/agents-plugin-openai@1.0.48` source and then recorded in implementation evidence.
- [ ] Tools, prompt, greeting, and room start flow remain structurally unchanged.
- [ ] Chained mode still exists as the immediate rollback path.
- [ ] Worker builds cleanly in both modes.
- [ ] Gate 3 remains **conditionally blocked** if a real `OPENAI_API_KEY` is not yet available; in that case the recorded status must explicitly say `blocked: awaiting credentialed realtime smoke` rather than marking Phase 3 complete.

### Validation Commands
- [ ] `npm --prefix agent test`
- [ ] `npm --prefix agent run build`
- [ ] `VOICE_PIPELINE_MODE=chained npm --prefix agent run dev`
- [ ] `VOICE_PIPELINE_MODE=realtime OPENAI_API_KEY=placeholder npm --prefix agent run dev` *(bootstrap contract check only until a real key is provided)*
- [ ] `VOICE_PIPELINE_MODE=realtime OPENAI_API_KEY=<real-key> npm --prefix agent run dev` *(mandatory Gate 3 runtime smoke; required before Phase 3 can be marked complete)*

---

## Phase 4: Update backend runbooks and parity verification steps
**Owner**: @implementer (verification/docs)
**Dependencies**: Phase 3
**Complexity**: MEDIUM

### Tasks
- [ ] Update `README.md` environment and worker sections to document the new rollout mode, realtime dependency, and activation flow.
- [ ] Update `verify/agent-worker-smoke.md` with two explicit branches: chained rollback mode and realtime mode, including required logs and provider-env proof without exposing secrets.
- [ ] Update `verify/browser-smoke.md` so typed `lk.chat`, transcript parity, and audible output are rechecked specifically against realtime mode.
- [ ] Add a concise rollback note: set `VOICE_PIPELINE_MODE=chained` and restart the worker.
- [ ] Document rollback prerequisites explicitly: keep `@livekit/agents-plugin-silero`, keep `npm --prefix agent run download-files`, and do not remove the current chained prewarm/model-artifact path until realtime rollout has passed.
- [ ] Keep documentation changes backend-scoped; do not redesign the frontend or token API docs.

### Acceptance Criteria
- [ ] Operators can understand how to run chained vs realtime mode from docs alone.
- [ ] Smoke docs explicitly verify greeting, tools, typed path, transcript, interruptions, and audible output.
- [ ] Rollback steps are one env change plus worker restart **after** the preserved chained prerequisites (`download-files` path and Silero-backed chained startup path) are still present.

### Validation Commands
- [ ] `npm run dev`
- [ ] `VOICE_PIPELINE_MODE=realtime OPENAI_API_KEY=<real-key> npm --prefix agent run dev`
- [ ] `npm --prefix agent run download-files`
- [ ] `VOICE_PIPELINE_MODE=chained npm --prefix agent run dev`
- [ ] `agent-browser open http://localhost:3000`
- [ ] Follow `verify/agent-worker-smoke.md` and `verify/browser-smoke.md`

## Deliverables
| Phase | Files Created/Modified |
|-------|------------------------|
| Phase 1 | `agent/package.json`, `agent/package-lock.json`, `.env.example` |
| Phase 2 | `agent/realtime-config.ts` (new), `agent/tests/realtime-config.test.ts` (new), `agent/main.ts` |
| Phase 3 | `agent/ecommerce-agent.ts`, `agent/realtime-config.ts`, `agent/tests/realtime-config.test.ts` |
| Phase 4 | `README.md`, `verify/agent-worker-smoke.md`, `verify/browser-smoke.md` |

## Exact Likely Files to Change
- `agent/package.json:12-25` — add the realtime plugin and agent-local test script.
- `agent/package-lock.json:10-18` and new plugin resolution blocks — lock the chosen provider dependency.
- `agent/main.ts:9-41` — extend bootstrap validation/logging for rollout mode.
- `agent/ecommerce-agent.ts:16-123` — swap session construction from chained provider strings to bounded mode-based realtime/chained selection.
- `.env.example:1-5` — add the minimal new worker env contract.
- `README.md:20-52` and `:119-171` — update environment, worker commands, verification, and rollback notes.
- `verify/agent-worker-smoke.md:41-88` — add realtime-specific runtime evidence requirements.
- `verify/browser-smoke.md:37-69` — ensure typed path + audible output are validated against realtime mode.
- `agent/realtime-config.ts` (new) — isolate rollout/env validation logic.
- `agent/tests/realtime-config.test.ts` (new) — cover config guardrails.

## Files Explicitly Not Expected to Change
- `app/api/token/route.ts` — dispatch contract stays the same.
- `components/transcript-panel.tsx` — typed `lk.chat` path should remain unchanged.
- `agent/tools/search-products.ts` and `agent/tools/get-product-details.ts` — tools are reused, not redesigned.
- `agent/prompt.ts` — same assistant behavior contract.

## Review Gates
| Gate | After Phase | Focus Area |
|------|-------------|------------|
| **Gate 1** | Phase 1 | Verify exact package/version compatibility and bounded env contract using the reproducible `npm view`, `node -p`, and `npm ls` checks above |
| **Gate 2** | Phase 2 | Verify no over-abstraction was introduced and config tests cover failure modes |
| **Gate 3** | Phase 3 | Verify realtime wiring removes chained-only session settings, uses no unverified mandatory fields such as `modalities: ['text', 'audio']` or `inputAudioTranscription`, and has passed one real-key runtime smoke; otherwise mark as `blocked: awaiting credentialed realtime smoke` |
| **Gate 4** | Phase 4 | Verify parity checklist, transcript compatibility checkpoint (`agentTranscript`-gated typed readiness under realtime mode), validation commands, blast radius, and rollback docs are complete |

## Validation Strategy
1. **Dependency validation**
   - `npm --prefix agent install`
   - `npm --prefix agent test`
   - `npm --prefix agent run build`
2. **Chained rollback sanity**
   - `VOICE_PIPELINE_MODE=chained npm --prefix agent run dev`
   - confirm existing bootstrap/session logs still appear.
3. **Realtime bootstrap validation**
    - without `OPENAI_API_KEY`, confirm realtime mode fails fast with a clear bootstrap error.
    - with `OPENAI_API_KEY`, start worker in realtime mode and confirm startup logs show `pipeline_mode=realtime`.
4. **Runtime parity verification**
     - `npm run dev`
     - `VOICE_PIPELINE_MODE=realtime OPENAI_API_KEY=<real-key> npm --prefix agent run dev`
     - connect from browser and confirm the first realtime greeting produces an `agentTranscript` entry, because typed controls stay disabled until that event exists (`components/transcript-panel.tsx:19-20`).
     - after the greeting transcript appears, run a typed `lk.chat` prompt, confirm the send controls remain enabled, exercise a product lookup, and confirm both `userTranscript` and follow-up `agentTranscript` entries still render in the transcript UI (`components/agents-ui/agent-chat-transcript.tsx:17-24`).
     - confirm audible output.
     - if no real key is available yet, record Phase 3 / Gate 3 as `blocked: awaiting credentialed realtime smoke`; do **not** mark the phase complete from placeholder-key startup alone.
5. **Rollback verification**
    - `npm --prefix agent run download-files`
    - set `VOICE_PIPELINE_MODE=chained`
    - restart worker
    - repeat the same smoke steps to confirm recovery.
    - rollback is only considered valid if the chained artifact/model-download path and Silero-backed startup path still work on a clean or newly refreshed local environment.

## Blast Radius Assessment
| Area | Impact | Why |
|------|--------|-----|
| Worker runtime | HIGH | Core migration target; session construction changes here. |
| Worker env contract | MEDIUM | Adds two vars but keeps existing LiveKit vars unchanged. |
| Frontend runtime behavior | LOW | Same room/session/token/typed path; verification only. |
| Token endpoint | LOW | No design or code changes planned. |
| Tools/catalog | LOW | Reused as-is. |
| Operator docs | MEDIUM | Must reflect new run/rollback path. |

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OpenAI realtime activation cannot be fully smoke-tested until a real API key is available | MEDIUM | MEDIUM | Make realtime mode opt-in and validate bootstrap/build first; full runtime smoke stays a release gate, not an assumption. |
| Realtime session behaves poorly if chained-only VAD/turn detection settings are left in place | MEDIUM | HIGH | Explicitly remove those settings in realtime mode per LiveKit internals/docs. |
| Tool behavior changes under realtime prompting | MEDIUM | MEDIUM | Preserve existing tool schemas and run a deterministic typed product query in smoke verification. |
| Realtime mode changes transcript event shape/timing so `agentTranscript` never appears and typed fallback stays disabled | MEDIUM | MEDIUM | Treat this as an explicit rollout checkpoint: Gate 4 must prove the greeting emits `agentTranscript` and that a typed `lk.chat` round-trip still renders `userTranscript` + `agentTranscript` in the existing UI. |
| Audible output works but transcript timing differs slightly from chained mode | MEDIUM | LOW | Treat transcript timing as best-effort parity; require behavioral parity, not byte-for-byte transcript timing. |
| Rollout creates confusion across environments | LOW | MEDIUM | Log selected pipeline mode at bootstrap and document exact env contract/rollback steps. |

## Rollback Strategy
- **Primary rollback:** set `VOICE_PIPELINE_MODE=chained` in the repo-root `.env` and restart the worker.
- **Rollback prerequisites that must remain intact until rollout is accepted:** preserve `@livekit/agents-plugin-silero`, preserve `npm --prefix agent run download-files`, and preserve the current chained prewarm path so existing model artifacts remain fetchable and usable.
- **Rollback proof requirement:** `npm --prefix agent run download-files && VOICE_PIPELINE_MODE=chained npm --prefix agent run dev` must still succeed before calling `VOICE_PIPELINE_MODE=chained` a true rollback path.
- **Secondary rollback:** if realtime-only code causes instability before release, revert Phase 3 while keeping Phase 1 compatibility work and Phase 2 config tests.
- **No rollback changes required** in frontend or token endpoint because those paths are intentionally preserved.

## Notes
- YAGNI: no token-endpoint redesign, no provider abstraction framework, no frontend redesign, no speculative multi-provider router.
- KISS: one new provider plugin, one bounded mode switch, one config module.
- DRY: reuse current prompt, tool implementations, token dispatch, room contract, and verification flows.
- LiveKit Inference-backed string aliases are currently used for the chained path, but the verified realtime path in retrieved docs is a concrete plugin instance; this plan therefore does **not** assume inference-backed OpenAI realtime support.

## Decision Log
| Decision | Chosen | Rejected | Rationale | Evidence |
|----------|--------|----------|-----------|---------|
| Realtime provider | `@livekit/agents-plugin-openai@1.0.48` | `@livekit/agents-plugin-google@1.0.48` beta realtime | OpenAI plugin is documented as a realtime provider without beta framing and matches user intent for later API-key activation | Context7 LiveKit docs + `npm view` peer data |
| Rollout strategy | Bounded `VOICE_PIPELINE_MODE=chained|realtime` | Immediate hard cutover | Smallest safe rollback surface with no frontend/token changes | Current chained worker exists and can be preserved with minimal branching |
| Backend scope | Worker/backend only | Frontend/token redesign | User explicitly scoped this as backend realtime migration first | User request |
| Session architecture | `RealtimeModel` inside existing `voice.AgentSession` | Separate custom websocket bridge | Official LiveKit path is lower risk and compatible with existing worker structure | Context7 `/websites/livekit_io_agents`, `/livekit/agents-js` |
| Tool migration | Reuse existing tools unchanged | Rewrite tools/provider abstraction | LiveKit realtime session already updates tools into the realtime session | `agent_activity.ts:297-301` |

## Handoff for Implementation
1. Start with Phase 1 and prove the package/version matrix exactly.
2. Keep rollback available until realtime smoke has passed with a real `OPENAI_API_KEY`.
3. Do not modify `/api/token` or the frontend typed path unless Phase 4 validation disproves the low-risk assumptions above.
4. Treat Phase 3 as complete only when chained-only session knobs are explicitly separated from realtime mode.
5. Analyzer should reject implementation if any of these are missing: exact version pins, env gating, parity smoke steps, or one-step rollback.
