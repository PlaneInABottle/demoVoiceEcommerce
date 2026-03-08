# Browser Audio Fix - Implementation Plan

## Problem Statement
The LiveKit worker appears to reach agent speaking/TTS generation, and the browser already shows transcript/state updates, but the web app does not reliably produce audible agent voice. Current frontend evidence points to a missing room-audio renderer plus missing browser audio-unlock handling.

## Approach
Keep the fix frontend-only unless validation disproves the current hypothesis: add the minimal LiveKit audio playback primitives required for remote room audio, then add a small autoplay/unlock UX tied to the existing user connect flow.

## Success Criteria
- [ ] Remote agent speech is rendered in the browser through LiveKit’s room audio playback path.
- [ ] A first-time user can reliably unlock speaker audio with an explicit user gesture when autoplay blocks playback.
- [ ] The existing transcript/state UI remains unchanged except for minimal audio-status UX.
- [ ] Validation proves the typed-only path can still trigger an audible agent reply.
- [ ] No `agent/` worker, token endpoint, or product-scope changes are required.

## Verified Facts vs Assumptions
| Type | Item | Evidence | Status / Resolution |
|------|------|----------|---------------------|
| Verified fact | LiveKit React dependencies are already installed in the root app. | `package.json:12-19` lists `@livekit/components-react` and `livekit-client`. | Resolved |
| Verified fact | The page creates a LiveKit session and wraps UI with `AgentSessionProvider`, but no audio renderer is mounted in the current shell. | `components/demo-shell.tsx:18-25` creates `useSession(...)`; `components/demo-shell.tsx:43-56` renders transcript/controls/sidebar only. Repository search found no `RoomAudioRenderer`, `StartAudio`, or `useAudioPlayback` usage. | Resolved |
| Verified fact | The provider currently only returns `SessionProvider session={session}`; it does not add playback UI. | `components/agents-ui/agent-session-provider.tsx:11-12` | Resolved |
| Verified fact | Connect currently only starts the session; it does not perform any browser audio unlock step. | `components/session-panel.tsx:42-63` | Resolved |
| Verified fact | The UI already exposes agent speaking state, so frontend state can show speech even if audio is not rendered. | `components/agent-state-badge.tsx:9-18` maps `speaking`; `components/agent-state-badge.tsx:21-25` renders it. | Resolved |
| Verified fact | Transcript flow is working and is used as the current deterministic proof path. | `components/transcript-panel.tsx:14-29`; `verify/browser-smoke.md:37-48`; `verify/BROWSER_VERIFICATION_REPORT.md:50-51`; `verify/RUNTIME_VERIFICATION_SUMMARY.txt:65-83` | Resolved |
| Verified fact | Official LiveKit React docs expose `RoomAudioRenderer` for room audio playback and `StartAudio` / `useAudioPlayback()` for autoplay-gated audio unlock. | Context7 `/livekit/components-js` for `RoomAudioRenderer`, `StartAudio`, `useAudioPlayback` | Resolved |
| Verified fact | Current external analysis says the worker reaches speaking state and the TTS websocket opens. | User-provided context for this plan | Resolved |
| Low assumption | Adding the missing renderer plus unlock flow will restore audible browser playback without server/worker changes. | Consistent with current frontend evidence and LiveKit docs. | Bounded by Phase 2 validation; not critical/high |
| Low assumption | Existing Session/Provider context is sufficient for a thin audio-output child component mounted inside the current provider subtree. | Current app already uses provider-backed hooks successfully. | Confirm during Phase 1; fallback is passing `session.room` explicitly inside the new component |

**Summary:** zero CRITICAL/HIGH unresolved assumptions remain. Only low-risk implementation assumptions remain, and both are directly validated by the first two phases.

---

## Phase 1: Add the missing LiveKit room audio output path
**Owner**: @implementer (frontend/livekit)
**Dependencies**: None
**Complexity**: LOW

### Tasks
- [ ] Create a thin client component at `components/livekit-room-audio.tsx` that mounts LiveKit room audio playback primitives inside the existing session/provider tree.
- [ ] Use `RoomAudioRenderer` as the single shared remote-audio sink for the room, rather than adding custom audio element management.
- [ ] Mount the new audio component from `components/demo-shell.tsx` inside the existing `AgentSessionProvider` subtree so it is active whenever the session UI is active.
- [ ] Keep the component SRP-focused: audio output/rendering only, no transcript or connection logic.
- [ ] Perform a quick regression check that transcript, controls, and sidebar still render unchanged.

### Acceptance Criteria
- [ ] The frontend has an explicit room-audio renderer in the provider subtree.
- [ ] No custom parallel audio state/store is introduced.
- [ ] `agent/` files and `app/api/token/route.ts` remain untouched in this phase.

---

## Phase 2: Add minimal autoplay/audio-unlock UX and connect-path wiring
**Owner**: @implementer (frontend/browser UX)
**Dependencies**: Phase 1
**Complexity**: MEDIUM

### Tasks
- [ ] Update `components/session-panel.tsx` so the existing connect gesture also attempts the LiveKit audio-unlock path after a successful session start, using the documented playback API rather than custom browser media hacks.
- [ ] In `components/livekit-room-audio.tsx`, expose the smallest possible unlock UI for blocked playback (prefer a single inline CTA/status using `StartAudio` or `useAudioPlayback()` semantics; no modal, wizard, or new page flow).
- [ ] Add minimal styles in `app/globals.css` for the audio status/unlock callout, reusing existing button/panel patterns.
- [ ] Keep the typed-only verification path intact so browser playback can be tested without microphone capture.
- [ ] Verify the UX states cover: connected-and-ready, blocked-waiting-for-click, and unlock-error/fallback copy.

### Acceptance Criteria
- [ ] A user can connect and, if autoplay blocks playback, see a clear “enable speaker audio” style action.
- [ ] The app attempts audio unlock from a real user gesture instead of waiting for passive autoplay.
- [ ] No extra product/UI scope is added beyond one small audio readiness affordance.
- [ ] Typed prompts still work and can trigger audible responses after audio is unlocked.

---

## Phase 3: Update runtime validation flow for audible playback proof
**Owner**: @implementer (verification)
**Dependencies**: Phase 2
**Complexity**: LOW

### Tasks
- [ ] Update `verify/browser-smoke.md` to add the audible-playback verification branch: connect typed-only first, unlock audio if prompted, send a typed prompt, and confirm the browser audibly plays the agent reply.
- [ ] Update `verify/agent-worker-smoke.md` so the first-connect gate distinguishes “transcript arrived” from “audio was actually audible in browser speakers.”
- [ ] Reuse existing local runtime flow (`npm run dev`, `npm --prefix agent run dev`, `agent-browser`) instead of adding new framework integration tests.
- [ ] Capture the manual-vs-automated boundary explicitly: `agent-browser` can confirm UI state and unlock CTA presence, but a human local run is still required to verify actual speaker output.

### Acceptance Criteria
- [ ] Verification docs describe exact steps to prove audible playback, not just transcript updates.
- [ ] The documented smoke path remains local, minimal, and reproducible.
- [ ] No new test harness or speculative automation layer is introduced.

---

## Deliverables
| Phase | Files Created/Modified |
|-------|------------------------|
| Phase 1 | `components/livekit-room-audio.tsx` (new), `components/demo-shell.tsx` |
| Phase 2 | `components/session-panel.tsx`, `components/livekit-room-audio.tsx`, `app/globals.css` |
| Phase 3 | `verify/browser-smoke.md`, `verify/agent-worker-smoke.md` |

## Review Gates
| Gate | After Phase | Focus Area |
|------|-------------|------------|
| **Gate 1** | Phase 1 | Confirm `RoomAudioRenderer` exists in the provider subtree and no unnecessary worker/backend edits were introduced |
| **Gate 2** | Phase 2 | Confirm autoplay/unlock UX is minimal, uses documented LiveKit playback APIs, and preserves typed-only verification |
| **Gate 3** | Phase 3 | Confirm runtime docs now prove audible playback rather than transcript-only success |

## Exact Likely Files to Modify
- `components/demo-shell.tsx` — current provider subtree is the simplest mount point for shared room audio (`components/demo-shell.tsx:43-56`).
- `components/session-panel.tsx` — current connect action is where user-gesture-based audio unlock can piggyback (`components/session-panel.tsx:42-63`, `115-122`).
- `app/globals.css` — existing shared button/panel styles can host a small unlock callout without new design work.
- `verify/browser-smoke.md` — current flow proves transcript only, not audible playback (`verify/browser-smoke.md:37-48`).
- `verify/agent-worker-smoke.md` — current gate allows “heard or appears in transcript”; it should explicitly call out audible browser proof (`verify/agent-worker-smoke.md:51-73`).

## Files Not Expected to Change
- `agent/main.ts`, `agent/ecommerce-agent.ts`, other `agent/` files
- `app/api/token/route.ts`
- `components/transcript-panel.tsx`
- `components/agents-ui/agent-session-provider.tsx` (unless implementation discovers provider/context limitations during Phase 1)

## Validation Strategy
1. Start the existing local runtimes:
   - `npm run dev`
   - `npm --prefix agent run dev`
2. Open `http://localhost:3000` with `agent-browser`, snapshot the page, and connect with microphone **unchecked** to isolate browser playback from capture issues.
3. Confirm the greeting transcript still appears and the agent can enter `speaking` state.
4. If audio is blocked, use the new unlock CTA from a user gesture.
5. Send a typed prompt via the existing `lk.chat` fallback.
6. Validate both:
   - UI proof: transcript updates, no persistent blocked-audio CTA, expected session state.
   - Human local proof: the agent reply is actually audible through browser speakers/headphones.
7. Re-run once with microphone enabled only after typed-only audible playback is confirmed.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `RoomAudioRenderer` alone is not sufficient in this provider setup | LOW | MEDIUM | Validate in Phase 1; fallback is explicit room-based playback wiring inside the new audio component, not a broader refactor |
| Browser autoplay policy still blocks first reply | MEDIUM | HIGH | Phase 2 adds an explicit unlock CTA tied to a real user gesture |
| Implementation drifts into broader session/UI redesign | LOW | MEDIUM | Keep all work confined to the files listed above; no backend/worker scope |
| Validation incorrectly treats transcript-only success as audio success | MEDIUM | HIGH | Phase 3 updates smoke docs to require explicit audible proof |

## Rollback Strategy
- If Phase 1 causes regressions, revert the new audio component and `components/demo-shell.tsx` only.
- If Phase 2 UX proves unreliable, keep the renderer and fallback to an always-visible explicit unlock button rather than changing server/worker behavior.
- Do not expand into worker or token-endpoint changes unless Phase 2 validation shows remote audio tracks are still absent after renderer/unlock wiring.

## Notes
- YAGNI: no new backend endpoints, no device picker, no settings page, no waveform visualizer.
- KISS: one shared room-audio renderer plus one small unlock affordance.
- DRY: reuse existing session state, button styles, and typed `lk.chat` verification path.
- Preferred implementation boundary is frontend-only because current evidence already shows agent state/transcript activity.

## Decision Log
| Decision | Chosen | Rejected | Rationale | Evidence |
|----------|--------|----------|-----------|---------|
| Primary fix surface | Frontend audio playback path | Worker/backend changes first | Current app already receives session/transcript/state data; missing browser playback is the smallest plausible fault domain | `components/demo-shell.tsx:43-56`, `components/session-panel.tsx:42-63`, user-provided worker context |
| Audio rendering strategy | Add LiveKit `RoomAudioRenderer` | Custom `<audio>` orchestration | Official primitive already exists for room audio and is lower risk | Context7 `/livekit/components-js` |
| Autoplay handling | Minimal unlock CTA using documented LiveKit playback API | Ad-hoc browser media workarounds | Keeps the fix aligned with library behavior and browser policy realities | Context7 `/livekit/components-js` for `StartAudio` and `useAudioPlayback()` |
| Verification path | Reuse typed `lk.chat` + local audible check | New browser-test harness | Typed path already exists and isolates playback from microphone variables | `components/transcript-panel.tsx:22-29`, `verify/browser-smoke.md:44-48` |

## Handoff for Implementation
1. Implement Phase 1 first and verify the audio renderer is present before touching UX.
2. Keep all changes inside the listed frontend/verify files unless Phase 1 evidence proves the hypothesis wrong.
3. Prefer the smallest new component possible (`components/livekit-room-audio.tsx`) to preserve SRP and avoid bloating `SessionPanel`.
4. Treat transcript-only success as insufficient; the feature is not complete until a local human run hears agent speech.
