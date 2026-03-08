# LiveKit UI Refresh - Implementation Plan

## Problem Statement
The homepage still presents the voice demo as a custom three-panel dashboard instead of a conversation-first LiveKit agent experience. `components/demo-shell.tsx:27-55` currently renders a hero section plus `TranscriptPanel`, `SessionPanel`, and `ProductSidebar`, while `app/globals.css:88-90` defines a two-column grid that effectively leaves the product sidebar competing with the core interaction model instead of supporting a clean half-chat / half-agent layout.

The requested refresh is to make the frontend look and behave more like LiveKit agent UIs: a split, responsive conversation surface with a visible agent presence, integrated chat/transcript, and compact controls suitable for Auro-style voice assistant experiences.

## Approach
Refactor the homepage into a two-pane LiveKit conversation shell using the existing Next.js + React + `@livekit/components-react` stack, borrowing layout and interaction patterns from LiveKit Agents UI while **not** introducing Tailwind/shadcn in this pass.

## Success Criteria
- [ ] Desktop and tablet render a true two-pane layout with roughly equal visual weight for conversation and agent UI.
- [ ] Mobile collapses into a readable stacked layout without losing transcript/chat or connect controls.
- [ ] Voice transcript and typed `lk.chat` messages remain in one shared conversation stream.
- [ ] The agent pane visibly reflects connection/agent state and exposes connect, mic, and disconnect actions.
- [ ] Browser verification docs and proof expectations reflect the new split layout instead of the product-sidebar-centered layout.
- [ ] `docs/livekit-ui-refresh.plan.md` is analyzable phase-by-phase and each implementation phase is independently revertible.

## Current state (evidence)
- `app/page.tsx:6-11` is a Server Component that renders the client-side `<DemoShell />`; this can remain the server/client boundary for the refresh.
- `components/demo-shell.tsx:18-24` creates the LiveKit session with `useSession(TokenSource.endpoint('/api/token'), { agentName, participantName, roomName })`.
- `components/demo-shell.tsx:27-55` renders the hero block plus `TranscriptPanel`, `SessionPanel`, and `ProductSidebar` inside `section.content-grid`.
- `app/globals.css:88-90` defines `content-grid` as two columns, and `app/globals.css:297-301` collapses it to one column under `900px`.
- `components/transcript-panel.tsx:15-28` uses `useSessionMessages(session)` and sends typed messages with `send(text.trim(), { topic: 'lk.chat' })`.
- `components/agents-ui/agent-chat-transcript.tsx:17-35` renders the shared message list and already differentiates `agentTranscript`, `userTranscript`, and fallback chat senders.
- `components/session-panel.tsx:42-83` owns the existing connect / mic toggle / disconnect flows and should remain the logic source of truth unless a verified API gap forces a different shape.
- `components/agents-ui/agent-session-provider.tsx:11-12` wraps LiveKit `SessionProvider`, so descendant UI can continue using session hooks without new provider wiring.
- `components/agent-state-badge.tsx:9-19` already defines the UI labels for agent states (`disconnected`, `connecting`, `pre-connect-buffering`, `initializing`, `idle`, `listening`, `thinking`, `speaking`, `failed`).
- `verify/browser-smoke.md:19-23` and `verify/BROWSER_VERIFICATION_REPORT.md:42-52` still expect the current layout, including the featured products sidebar and the old panel flow.
- `package.json:12-27` includes `@livekit/components-react`, `livekit-client`, and `livekit-server-sdk`, but no Tailwind, shadcn, Radix, Motion, or CVA dependencies.
- LiveKit Agents UI's shadcn package explicitly depends on shadcn/Tailwind 4 conventions and extra UI/runtime packages (`packages/shadcn/README.md` fetched from the reference repo: prerequisites and architecture sections; `packages/shadcn/package.json:835-859` in the fetched reference) rather than being a zero-config drop-in for this repo.
- The LiveKit Agents UI docs confirm the desired reference patterns exist: `AgentControlBar`, `AgentChatTranscript`, and `AgentAudioVisualizerAura` are designed for agent sessions, but their documented installation path is via the shadcn registry, not direct npm usage (`https://docs.livekit.io/reference/components/agents-ui/component/agent-control-bar.md`, `.../agent-chat-transcript.md`, `.../agent-audio-visualizer-aura.md`).
- Next.js App Router documentation for v16.1.6 confirms that global CSS can remain imported from `app/layout.tsx`, and `page.tsx` can stay a Server Component that renders a Client Component shell (Context7, `/vercel/next.js/v16.1.6`, CSS/App Router guidance).

## Scope / Non-goals
### In scope
- Homepage layout refactor for a split transcript/chat + agent UI experience.
- Responsive behavior across desktop / tablet / mobile.
- Stronger visual agent presence using existing LiveKit session/agent hooks.
- Minimal verification-doc updates required to keep browser proof current.

### Out of scope
- `/api/token` contract changes.
- Agent worker business-logic changes.
- Full design-system migration to Tailwind/shadcn.
- Unrelated cleanup of the worker, catalog, or token-route internals.

## Primary design decision: Tailwind/shadcn vs existing stack
**Decision:** Do **not** introduce Tailwind/shadcn for this refresh.

**Why this is the smallest correct change (YAGNI/KISS/DRY):**
- The repo has no Tailwind/shadcn foundation today (`package.json:12-27`; repo search found no `tailwind.config*`, `postcss.config*`, or `components.json`).
- The referenced LiveKit Agents UI package is distributed through the shadcn registry and expects Tailwind CSS 4 plus supporting dependencies such as Radix UI, Motion, and `class-variance-authority` (reference repo README/package evidence above).
- Adding that foundation would turn a frontend refresh into an infrastructure + styling-system migration, widening risk and file count far beyond the requested UI/layout refactor.
- The app already has the core LiveKit runtime primitives needed for the requested UX: `useSession`, `SessionProvider`, `useSessionMessages`, `useAgent`, and `useLocalParticipant`.
- Therefore the immediate implementation should mirror **LiveKit UI patterns** (conversation-first transcript, compact control bar, visible agent presence/state) using the existing stack and only revisit exact shadcn-registry adoption if a later analyzer-approved phase requires it.

## Verified Facts vs Unverified Assumptions
| Item | Verified at | Evidence / Note |
|------|------------|-----------------|
| Homepage shell is server `page.tsx` -> client `DemoShell` | `app/page.tsx:6-11`, `components/demo-shell.tsx:18-24` | ✅ Existing server/client boundary already supports a client-side UI refactor. |
| Current layout is not a true split-screen voice UI | `components/demo-shell.tsx:27-55`, `app/globals.css:88-90` | ✅ Transcript, controls, and product sidebar compete in the same grid flow. |
| Shared conversation data already combines voice transcript + chat | `components/transcript-panel.tsx:15-28`; LiveKit `useSessionMessages` source (fetched) `56-165` | ✅ `useSessionMessages` merges transcription messages with chat messages and exposes `send(...)`. |
| Existing typed chat uses the `lk.chat` topic | `components/transcript-panel.tsx:22-29` | ✅ UI refresh must preserve this path. |
| Session context contract is already correct for descendant hooks | `components/agents-ui/agent-session-provider.tsx:11-12`; LiveKit API `SessionProviderProps` fetched `873-879` | ✅ No new provider shape is required. |
| Agent state labels currently used by the UI exist | `components/agent-state-badge.tsx:9-19` | ✅ `disconnected`, `connecting`, `pre-connect-buffering`, `initializing`, `idle`, `listening`, `thinking`, `speaking`, `failed` are already handled. |
| LiveKit docs provide the desired reference components/patterns | LiveKit docs pages for `AgentControlBar`, `AgentChatTranscript`, `AgentAudioVisualizerAura` | ✅ These are valid design inputs, but not direct zero-cost imports here. |
| LiveKit shadcn package requires extra foundation not present in repo | Reference repo README `78-113`; fetched `packages/shadcn/package.json:835-859` | ✅ Tailwind/shadcn adoption is a significant dependency/config expansion. |
| Next.js App Router allows current CSS/layout boundary to remain valid | Context7 `/vercel/next.js/v16.1.6` CSS/App Router docs | ✅ `app/layout.tsx` global CSS import and server-page -> client-shell composition are supported. |
| Browser verification docs are stale relative to requested target UX | `verify/browser-smoke.md:19-23`, `verify/BROWSER_VERIFICATION_REPORT.md:42-52`, `VERIFICATION_INDEX.md:12-17` | ✅ Verification artifacts/docs must be refreshed with the UI work. |
| Token API returns JSON with `server_url` and `participant_token` and status `201` | `app/api/token/route.ts:156-182` | ✅ UI plan can keep the existing token contract untouched. |
| Deleted UI test files / orphaned replacement gaps | `find tests verify -type f`, `git log --diff-filter=D --summary -- tests verify components app` | ✅ No deleted UI-test files or orphaned replacement gaps were found in the repo history check. |
| Remaining critical/high assumptions | — | ✅ None. No CRITICAL/HIGH assumptions remain unresolved in this plan. |

---

## Phase 0: Analyzer Plan Gate
**Owner**: @analyzer (architecture review)
**Dependencies**: None
**Complexity**: LOW

### Tasks
- [ ] Review this plan before any code changes.
- [ ] Confirm the Tailwind/shadcn rejection is acceptable for the first pass.
- [ ] Confirm the split-layout approach preserves `lk.chat` and existing token/session flows.

### Acceptance Criteria
- [ ] Analyzer approves the existing-stack approach or requests only scoped plan edits.
- [ ] No new backend/API work is required for Phase 1.

---

## Phase 1: Replace the three-panel shell with a true split layout
**Owner**: @implementer (frontend layout)
**Dependencies**: Phase 0
**Complexity**: MEDIUM

### Files
- `components/demo-shell.tsx`
- `components/agent-pane.tsx` **(new)**
- `app/globals.css`

### Tasks
- [ ] Update `components/demo-shell.tsx` so the homepage becomes a two-pane shell instead of hero + `content-grid` + sidebar.
- [ ] Remove `ProductSidebar` from the primary homepage composition, but leave the component file untouched for rollback safety.
- [ ] Add `components/agent-pane.tsx` to own the right-hand pane scaffold (agent identity, state slot, control slot, helper copy).
- [ ] Extend `app/globals.css` with a dedicated split-shell layout (`conversation-pane` / `agent-pane`) that targets a roughly 50/50 desktop/tablet presentation and stacks cleanly below the existing mobile breakpoint.
- [ ] Preserve the existing `useSession(...)` creation path and `AgentSessionProvider` wrapping; this phase is layout-only, not a session-logic rewrite.
- [ ] Run `npm test` and `npm run build` after the shell refactor.
- [ ] Run an initial browser smoke pass with `agent-browser open http://localhost:3000` and `agent-browser snapshot -i` to confirm the split shell renders before connect.

### Acceptance Criteria
- [ ] The homepage no longer renders the product sidebar in the primary interaction area.
- [ ] Desktop/tablet show a visually balanced two-pane shell.
- [ ] Mobile collapses to a single column without clipped controls or transcript overflow.
- [ ] Existing connect flow still mounts and the app still builds.

### Analyzer checkpoint
- [ ] **Gate 1**: Analyzer validates the shell split, responsive breakpoints, and sidebar removal before transcript/control refinements proceed.

---

## Phase 2: Refresh the conversation pane around shared transcript + chat
**Owner**: @implementer (conversation UX)
**Dependencies**: Phase 1
**Complexity**: MEDIUM

### Files
- `components/transcript-panel.tsx`
- `components/agents-ui/agent-chat-transcript.tsx`
- `app/globals.css`

### Tasks
- [ ] Rework `components/transcript-panel.tsx` into a conversation-first pane with a header, scrollable transcript body, prompt chips as secondary affordances, and a persistent chat composer footer.
- [ ] Preserve the existing `useSessionMessages(session)` and `send(..., { topic: 'lk.chat' })` behavior; do not swap to a different text API unless analyzer finds a proven need.
- [ ] Update `components/agents-ui/agent-chat-transcript.tsx` so agent/user turns are visually distinct and easier to scan in a half-screen transcript.
- [ ] Add a lightweight LiveKit-style “agent is thinking” or “live state” indicator to the transcript pane **only if implemented using already verified hooks** (`useAgent`, existing `messages`) and without new package dependencies.
- [ ] Extend `app/globals.css` for conversation-specific layout, bubble/tile treatment, transcript scrolling, sticky composer spacing, and empty-state polish.
- [ ] Run `npm test` and `npm run build`.
- [ ] Run `agent-browser snapshot -i`, connect via the existing flow, then confirm the greeting transcript still unlocks typed input and the prompt chips / text entry remain usable.

### Acceptance Criteria
- [ ] The left pane reads as a chat/transcript surface rather than a generic panel.
- [ ] Agent and user turns are visually distinct and remain in one shared conversation history.
- [ ] Typed `lk.chat` still works after the greeting transcript arrives.
- [ ] Transcript overflow and composer behavior are stable in the narrower split layout.

### Analyzer checkpoint
- [ ] **Gate 2**: Analyzer validates conversation readability, `lk.chat` preservation, and no regression in transcript readiness gating.

---

## Phase 3: Add a stronger LiveKit-style agent presence and compact control bar
**Owner**: @implementer (agent-side UI)
**Dependencies**: Phase 2
**Complexity**: MEDIUM

### Files
- `components/agent-pane.tsx`
- `components/session-panel.tsx`
- `app/globals.css`

### Tasks
- [ ] Extend `components/agent-pane.tsx` so the right pane becomes a clear “agent stage” instead of a generic card stack.
- [ ] Use existing LiveKit state sources (`useAgent` for state/audio awareness; existing `SessionPanel` props for session controls) to create a visual hierarchy inspired by LiveKit Agents UI: presence area first, controls second, helper/status text third.
- [ ] Keep `components/session-panel.tsx` as the logic owner for connect, mic, and disconnect actions, but restyle/restructure it into a more compact control-bar presentation that fits the agent pane.
- [ ] Do **not** attempt to import the shadcn `AgentControlBar` or `AgentAudioVisualizerAura` directly in this phase. Instead, create a CSS-based agent presence treatment that mirrors the pattern (visible state-driven agent presence) without adding Tailwind/shadcn infrastructure.
- [ ] Reuse `components/agent-state-badge.tsx` labels and current state strings rather than inventing new agent status constants.
- [ ] Run `npm test` and `npm run build`.
- [ ] Run browser verification with the agent connected: confirm connect, mute/unmute, and disconnect remain usable, and the agent pane visibly reacts to state changes.

### Acceptance Criteria
- [ ] The right pane clearly represents the agent, not just a form of buttons.
- [ ] Connect / mic / disconnect actions remain functional.
- [ ] The agent pane gives a visible state cue that matches the conversation flow.
- [ ] No new design-system/runtime dependencies were added for this phase.

### Analyzer checkpoint
- [ ] **Gate 3**: Analyzer validates that the agent pane is now LiveKit-pattern-aligned enough for implementation goals without unjustified framework expansion.

---

## Phase 4: Refresh browser-proof documentation for the new UI
**Owner**: @implementer (verification/docs)
**Dependencies**: Phase 3
**Complexity**: LOW

### Files
- `verify/browser-smoke.md`
- `verify/BROWSER_VERIFICATION_REPORT.md`
- `VERIFICATION_INDEX.md`

### Tasks
- [ ] Update `verify/browser-smoke.md` so its expected UI states refer to the split chat + agent layout instead of the product sidebar.
- [ ] Refresh `verify/BROWSER_VERIFICATION_REPORT.md` narrative/screenshots text to describe the new conversation-first layout and agent pane.
- [ ] Update `VERIFICATION_INDEX.md` so artifact descriptions remain accurate after the UI change.
- [ ] Preserve the existing proof rule that greeting / chat verification requires both the web app and the worker.
- [ ] Re-run the documented browser flow with `agent-browser`, capturing updated screenshots/text artifacts that match the new layout.

### Acceptance Criteria
- [ ] Browser proof docs no longer mention the old featured-products primary panel layout.
- [ ] The verification packet still documents the required worker + web runtime combination.
- [ ] Screenshots/artifact descriptions match the refreshed UI.

### Analyzer checkpoint
- [ ] **Gate 4**: Analyzer confirms implementation evidence and docs align before the work is considered complete.

---

## Deliverables
| Phase | Files Created/Modified |
|-------|------------------------|
| Phase 1 | `components/demo-shell.tsx`, `components/agent-pane.tsx`, `app/globals.css` |
| Phase 2 | `components/transcript-panel.tsx`, `components/agents-ui/agent-chat-transcript.tsx`, `app/globals.css` |
| Phase 3 | `components/agent-pane.tsx`, `components/session-panel.tsx`, `app/globals.css` |
| Phase 4 | `verify/browser-smoke.md`, `verify/BROWSER_VERIFICATION_REPORT.md`, `VERIFICATION_INDEX.md` |

## Review Gates
| Gate | After Phase | Focus Area |
|------|-------------|------------|
| **Gate 0** | Plan | Tailwind/shadcn decision, scope, session/token contract preservation |
| **Gate 1** | Phase 1 | Split-shell layout, responsive behavior, removal of third-panel conflict |
| **Gate 2** | Phase 2 | Transcript/chat UX, `lk.chat` preservation, conversation readability |
| **Gate 3** | Phase 3 | Agent presence, control usability, LiveKit-pattern alignment without dependency sprawl |
| **Gate 4** | Phase 4 | Browser verification packet accuracy and completeness |

## Test / Verification Strategy
### Per-phase guardrails
- Run `npm test` after each code phase to keep existing unit coverage green (`tests/home-page-config.test.ts`, `tests/token-route.test.ts`, `tests/product-catalog.test.ts`).
- Run `npm run build` after each UI phase to catch App Router / TypeScript / CSS regressions.
- Do **not** add new language-specific UI integration tests for this refresh; follow the loaded `ai-native-workflow` guidance and verify browser behavior with `agent-browser`.

### Runtime/browser verification
- Development validation path:
  - `npm run dev`
  - `npm --prefix agent run dev`
  - `agent-browser open http://localhost:3000`
  - `agent-browser snapshot -i`
- Production-style proof path (when refreshing the verification packet): reuse the documented `next build && next start` / worker flow already captured in `verify/BROWSER_VERIFICATION_REPORT.md:9-26` and `VERIFICATION_INDEX.md:38-57`.
- `agent-browser` guardrails from the loaded skill remain mandatory:
  - snapshot before interacting
  - re-snapshot after each DOM-changing action
  - do not guess refs
  - use screenshots/transcript captures as proof artifacts

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Split layout looks good on desktop but compresses poorly on smaller screens | MEDIUM | HIGH | Keep the responsive collapse explicit in CSS, verify narrow layouts in browser before phase sign-off, and keep Phase 1 limited to layout only. |
| Transcript/chat readiness gating regresses during layout work | MEDIUM | HIGH | Preserve `TranscriptPanel` logic contract in Phase 1; only restyle/refactor the pane in Phase 2; verify greeting-gated input before moving on. |
| Agent controls regress while being visually compacted | MEDIUM | MEDIUM | Keep connect/mic/disconnect logic inside `SessionPanel`; limit Phase 3 mostly to structure/styling. |
| Tailwind/shadcn creep expands scope mid-implementation | MEDIUM | MEDIUM | Hold the line on the plan decision; require analyzer approval before any dependency/config expansion. |
| Verification docs become stale again after UI changes | HIGH | MEDIUM | Treat Phase 4 as mandatory, not optional, and do not declare completion without updated browser proof text/artifacts. |

## Rollback Strategy
- Each phase is intended to land as its own commit/PR so rollback can happen at phase granularity.
- If Phase 1 fails review, revert only the shell/layout commit and restore `components/demo-shell.tsx` to the current composition.
- If Phase 2 causes transcript regressions, revert only the conversation-pane commit and keep the split shell from Phase 1.
- If Phase 3 styling harms control usability, revert only the agent-pane/control-bar commit and keep the improved transcript layout.
- Leave `components/product-sidebar.tsx` untouched in the first implementation pass so the prior sidebar content can be restored quickly if product stakeholders object.

## Notes
- No new backend route, token shape, or agent-worker behavior should be introduced in this refresh.
- Prefer CSS evolution over introducing a new design system.
- Use LiveKit patterns directly through existing hooks/providers rather than re-implementing session state management.
- The “Auro-style” requirement should be interpreted as a **visual conversation stage + transcript split**, not as a mandate to import a specific third-party UI package.

## Decision Log
| Decision | Chosen | Rejected | Rationale | Evidence |
|----------|--------|----------|-----------|---------|
| UI foundation | Existing React + CSS + LiveKit hooks | Tailwind/shadcn registry adoption | Smallest viable change; avoids a styling-system migration while still aligning to LiveKit patterns | `package.json:12-27`; LiveKit shadcn README/package evidence |
| Homepage structure | Two-pane split shell | Current hero + transcript + controls + sidebar composition | Matches user request and removes the third-panel conflict | `components/demo-shell.tsx:27-55`, `app/globals.css:88-90` |
| Conversation data source | Keep `useSessionMessages` + `lk.chat` | New chat state layer / alternate transport | Existing hook already merges chat + transcription and exposes send behavior | `components/transcript-panel.tsx:15-28`; fetched LiveKit `useSessionMessages` source `56-165` |
| Agent controls | Keep `SessionPanel` logic, restyle structure | Replace logic with unverified third-party control component | Lowest risk path; logic already works | `components/session-panel.tsx:42-83` |
| Product catalog panel | Remove from primary homepage layout but keep file for rollback | Keep as third primary panel / fully delete immediately | Required to achieve the requested clean split while keeping rollback simple | `components/demo-shell.tsx:43-55`; `verify/browser-smoke.md:19-23` |
