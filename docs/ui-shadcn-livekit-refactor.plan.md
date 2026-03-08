# UI Shadcn + LiveKit Refactor - Implementation Plan

## Problem Statement
The homepage still ships as a custom global-CSS shell instead of a reusable design system. `app/layout.tsx:14-18` only renders raw children, `app/globals.css:1-782` centralizes nearly all styling, and `components/demo-shell.tsx:27-45` composes the full experience with bespoke panel markup.

The requested refactor is to migrate the frontend to a cleaner, more polished voice-agent interface using shadcn/ui and LiveKit Agents UI patterns while preserving the current session, transcript, typed-chat, and audio-visualization behavior. The migration must stay incremental, minimize behavioral risk, and gate all user-visible behavior changes behind a feature flag.

## Approach
Incremental, flag-gated migration: first add the design-system/tooling foundation, then build a **parallel flagged UI tree** that leaves legacy UI components untouched. The flag-off path continues rendering the existing shell, existing component files, and the existing legacy CSS rules in `app/globals.css` until the new flagged shell is complete and validated.

## Success Criteria
- [ ] `docs/ui-shadcn-livekit-refactor.plan.md` remains the source of truth for implementation.
- [ ] Tailwind v4, shadcn/ui, and the LiveKit Agents UI install flow are configured for this Next.js App Router repo.
- [ ] The current transcript flow and typed `lk.chat` path remain intact.
- [ ] The current agent/session logic remains the source of truth unless a verified API mismatch requires a thin adapter.
- [ ] The refactored UI is hidden behind a server-owned rollout flag until validated.
- [ ] The flag-off path keeps rendering the current legacy components unchanged.
- [ ] The new UI materially improves visual hierarchy, spacing, and polish on desktop and mobile.
- [ ] Aura-style audio presence is preserved or improved.

## Verified Facts vs Assumptions
| Type | Item | Evidence |
|---|---|---|
| Fact | App Router root imports global CSS and renders raw children only. | `app/layout.tsx:1-18` |
| Fact | Homepage is a Server Component that renders a client shell with `appName`, canonical `agentName`, and `roomName`. | `app/page.tsx:1-11` |
| Fact | Current shell creates the LiveKit session with `useSession(TokenSource.endpoint('/api/token'), ...)`. | `components/demo-shell.tsx:18-24` |
| Fact | Current UI is driven by custom classes from one large stylesheet. | `app/globals.css:35-782` |
| Fact | Legacy flag-off rendering depends on the existing class rules in `app/globals.css`; early removal would break rollout isolation. | `components/demo-shell.tsx:27-45`, `components/transcript-panel.tsx:40-114`, `components/agent-pane.tsx:46-111`, `components/session-panel.tsx:107-179`, `app/globals.css:35-782` |
| Fact | Transcript panel preserves typed chat gating until first `agentTranscript` arrives. | `components/transcript-panel.tsx:19-31`, `components/transcript-panel.tsx:81-111` |
| Fact | Transcript rendering already distinguishes agent/user/chat tone and has tested scroll helpers. | `components/agents-ui/agent-chat-transcript.tsx:27-45`, `tests/agent-chat-transcript.test.ts:1-48` |
| Fact | Agent presence is currently custom CSS, not a registry component. | `components/agent-pane.tsx:60-97`, `app/globals.css:168-346` |
| Fact | Session connect/mic/disconnect behavior currently lives in `SessionPanel`. | `components/session-panel.tsx:51-105`, `components/session-panel.tsx:107-179` |
| Fact | Speaker-audio unlock currently lives in `LiveKitRoomAudio`. | `components/livekit-room-audio.tsx:12-53` |
| Fact | Agent state labels already exist and should be reused. | `components/agent-state-badge.tsx:9-25` |
| Fact | Repo already has `@/*` path aliases configured. | `tsconfig.json:20-25` |
| Fact | Repo currently lacks Tailwind/shadcn config files. | Repo glob found `next.config.ts` only; no `postcss.config.*`, `tailwind.config.*`, or `components.json` |
| Fact | `package.json` currently has Next/React/LiveKit but no Tailwind, shadcn utility stack, or `next-themes`. | `package.json:12-27` |
| Fact | Only `NEXT_PUBLIC_APP_NAME` is read in frontend code today; no UI rollout flag exists yet. | `app/page.tsx:7`; repo grep found no UI flag usage |
| Fact | Web-guidelines gaps exist today: no skip link/theming wrapper at root, typed input lacks `name`/`autocomplete`, and current buttons rely on custom classes rather than shared focus variants. | `app/layout.tsx:14-18`, `components/transcript-panel.tsx:81-111` |
| Fact | Official shadcn docs require CLI init plus `components.json`; Tailwind v4 uses `config: ""`, CSS variables, and `@theme inline`. | Context7 `/shadcn-ui/ui`; `https://ui.shadcn.com/docs/installation/next`; `https://ui.shadcn.com/docs/tailwind-v4` |
| Fact | Official Tailwind Next.js docs require `tailwindcss`, `@tailwindcss/postcss`, `postcss`, a `postcss.config.mjs`, and `@import "tailwindcss"` in globals. | `https://tailwindcss.com/docs/installation/framework-guides/nextjs` |
| Fact | Current LiveKit Agents UI docs say to `npx shadcn@latest init`, then `npx shadcn@latest registry add @agents-ui`, then `npx shadcn@latest add @agents-ui/{component-name}`. | `https://docs.livekit.io/frontends/agents-ui/` |
| Fact | Current shadcn registry docs say `shadcn add` can auto-check the open registry index, but LiveKit docs still explicitly instruct adding the `@agents-ui` registry first. | `https://ui.shadcn.com/docs/registry/registry-index`; Context7 `/shadcn-ui/ui` registry docs |
| Fact | Official LiveKit docs provide `AgentSessionView - 01`, `AgentControlBar`, `AgentChatTranscript`, and `AgentAudioVisualizerAura`. | `https://docs.livekit.io/reference/components/agents-ui/block/agent-session-view-01/`; `.../agent-control-bar/`; `.../agent-chat-transcript/`; `.../agent-audio-visualizer-aura/` |
| Assumption | `@agents-ui/agent-audio-visualizer-aura` can be adopted without forcing a rewrite of transcript or connect logic. | Reasonable from docs because Aura only needs `audioTrack`, `state`, and `themeMode`; verify at install/integration time |
| Assumption | `AgentSessionView - 01` will be more disruptive than helpful because it bundles transcript, controls, and pre-connect behavior already implemented locally. | Based on current ownership split across `DemoShell`, `TranscriptPanel`, `SessionPanel`, `LiveKitRoomAudio` |

## External Guidance Summary

### shadcn / Tailwind v4
- Use `npx shadcn@latest init -t next` for an existing Next.js app.
- Keep `components.json` with `tailwind.config` empty for Tailwind v4 and point CSS to `app/globals.css`.
- Use CSS variables plus `@theme inline` in `app/globals.css`.
- Add `tw-animate-css` instead of deprecated `tailwindcss-animate`.
- Add `next-themes` with `<ThemeProvider attribute="class">` in `app/layout.tsx` and `suppressHydrationWarning` on `<html>`.
- For rollout safety in this repo, add Tailwind/token layers **alongside** legacy rules first; do not slim or delete legacy class rules during the migration.

### LiveKit Agents UI
- Match current LiveKit docs literally: `npx shadcn@latest init`, then `npx shadcn@latest registry add @agents-ui`, then `npx shadcn@latest add @agents-ui/{component-name}`.
- shadcn's registry index may auto-discover registries, but this plan follows the explicit LiveKit flow to avoid CLI/version ambiguity.
- `AgentAudioVisualizerAura` is a focused component requiring `audioTrack`, `state`, `themeMode`, and optional color controls.
- `AgentControlBar` and `AgentSessionView - 01` are higher-level session surfaces and would overlap with current local logic.
- `AgentChatTranscript` is a full transcript component, but current repo already owns message tone mapping and tested scroll helpers.

## Isolation Strategy for Safe Rollout
**Non-negotiable:** every behavior-changing UI step must modify only the flagged path until final rollout.

### Legacy path stays untouched
- Keep these files behaviorally unchanged for the flag-off path until rollout completion:
  - `components/transcript-panel.tsx`
  - `components/agents-ui/agent-chat-transcript.tsx`
  - `components/agent-pane.tsx`
  - `components/session-panel.tsx`
  - `components/livekit-room-audio.tsx`
  - `components/agent-state-badge.tsx`
- Keep the legacy class rules inside `app/globals.css` available to the flag-off path until rollout completion.
- `components/demo-shell.tsx` remains the orchestration boundary and only gains a top-level branch between legacy and refactor trees.

### New flagged tree
- Create explicit refactor-only counterparts under a separate namespace, recommended: `components/refactor-ui/*`.
- The new shell imports only refactor components.
- Legacy shell continues importing only legacy components.
- Shared logic extraction is allowed **only** for pure non-UI helpers, after parity is proven and without changing legacy behavior.

## Recommendation: `agent-session-view-01` vs smaller composition
**Recommendation: Do not adopt `agent-session-view-01` as the base. Compose from smaller Agents UI + local components instead.**

### Why
- `AgentSessionView - 01` bundles transcript, controls, pre-connect behavior, and visualizer into one block, which overlaps with behavior already split across `components/demo-shell.tsx:27-45`, `components/transcript-panel.tsx:15-113`, `components/session-panel.tsx:16-179`, and `components/livekit-room-audio.tsx:12-53`.
- The current repo has product-specific typed chat gating (`components/transcript-panel.tsx:20-31`) that should not be casually replaced.
- The current transcript component already has repo-local tests (`tests/agent-chat-transcript.test.ts:1-48`), which would be discarded if the block fully replaces it.
- The user explicitly asked to reuse existing app/session logic where possible.

### Planned use of Agents UI instead
- **Adopt** `@agents-ui/agent-audio-visualizer-aura` for the flagged presence surface if integration stays thin.
- **Borrow patterns, not full replacements**, from `AgentControlBar` and `AgentChatTranscript` for structure, spacing, and interaction hierarchy.
- **Keep local logic owners** for session connect/disconnect/mic behavior and transcript gating unless an isolated adapter proves cleaner.

## Design-System / Theming Strategy
- Use **Tailwind v4 + shadcn CSS-variable tokens** as the new foundation.
- Keep a **single dark-first premium palette** for the initial migration, with light mode supported structurally via `next-themes` and tokenized colors.
- Prefer **semantic tokens** (`background`, `card`, `muted`, `primary`, `border`, `ring`) over hardcoded blues from `app/globals.css:20-23`, `app/globals.css:485-499`, and similar sections.
- Use a constrained spacing scale aligned with Refactoring UI: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- Use shadcn primitives for buttons/cards/badges/inputs/scroll areas; do not recreate a second local primitive system.
- Keep animation restrained and state-driven; respect reduced motion for aura/visual transitions.
- **Chosen CSS isolation approach (simplest safe option): keep legacy class rules in `app/globals.css` during the migration.** Add Tailwind imports, tokens, and base styles safely alongside them.
- Do **not** move legacy rules into a separate stylesheet unless implementation proves co-location unsafe; that extra CSS split is not justified yet.
- Only after rollout is complete should a follow-up cleanup phase consider deleting obsolete legacy rules.

## Component Mapping
| Current | Proposed flagged replacement | Decision |
|---|---|---|
| `components/demo-shell.tsx` | `components/refactor-ui/refactor-demo-shell.tsx` | Keep legacy shell untouched; branch at top level only |
| `components/transcript-panel.tsx` | `components/refactor-ui/refactor-transcript-panel.tsx` | Preserve legacy typed chat gating path untouched |
| `components/agents-ui/agent-chat-transcript.tsx` | `components/refactor-ui/refactor-agent-chat-transcript.tsx` | Preserve tested legacy transcript renderer |
| `components/agent-pane.tsx` | `components/refactor-ui/refactor-agent-pane.tsx` | Keep legacy presence UI intact for flag-off |
| `components/session-panel.tsx` | `components/refactor-ui/refactor-session-panel.tsx` | Keep current logic behavior but isolate UI rewrite |
| `components/livekit-room-audio.tsx` | `components/refactor-ui/refactor-livekit-room-audio.tsx` | Isolate audio-unlock UI treatment |
| `components/agent-state-badge.tsx` | `components/refactor-ui/refactor-agent-state-badge.tsx` | Preserve legacy badge path |
| `app/globals.css` | Shared migration stylesheet: Tailwind imports + tokens + base styles **plus existing legacy class rules** | Simplest safe option; preserves flag-off styling |

---

## Phase 1: Add rollout flag foundation
**Owner**: @implementer (frontend platform)
**Dependencies**: None
**Complexity**: LOW

### Target Files
- `app/home-page-config.ts`
- `app/page.tsx`
- `tests/home-page-config.test.ts`

### Tasks
- [ ] Add a server-owned boolean helper (recommended name: `isUiRefactorEnabled`) in `app/home-page-config.ts` beside existing homepage config helpers.
- [ ] Gate the refactored experience from `app/page.tsx` using that helper; default to legacy shell when the flag is off.
- [ ] Add unit coverage for enabled/disabled parsing in `tests/home-page-config.test.ts`.
- [ ] Document the recommended env name in comments and follow-up docs (`UI_REFACTOR_ENABLED`, not `NEXT_PUBLIC_*`) so rollout stays server-controlled.
- [ ] Verify the flag defaults to legacy UI so deployment risk is zero until later phases land.

### Validation
- [ ] `npm test`
- [ ] `npm run build`

### Acceptance Criteria
- [ ] No visual change when the flag is absent/false.
- [ ] A single top-level feature flag exists for all later behavior-changing UI rollout work.
- [ ] Flag parsing is unit tested.

---

## Phase 2: Install Tailwind v4 + shadcn CLI foundation
**Owner**: @implementer (frontend platform)
**Dependencies**: Phase 1
**Complexity**: LOW

### Target Files
- `package.json`
- `postcss.config.mjs` *(new)*
- `components.json` *(new)*

### Tasks
- [ ] Add Tailwind v4 runtime/config dependencies required by official Next.js + shadcn guidance: `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `tw-animate-css`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `next-themes`.
- [ ] Create `postcss.config.mjs` with the Tailwind v4 PostCSS plugin per official Tailwind docs.
- [ ] Create `components.json` for shadcn with Tailwind v4 settings (`config: ""`, `css: "app/globals.css"`, aliases using existing `@/*`).
- [ ] Run shadcn init after file setup so generated components match repo aliases and App Router structure.
- [ ] Follow current LiveKit docs literally for Agents UI install preparation: `npx shadcn@latest registry add @agents-ui` before any `add @agents-ui/...` command.

### Dependency Justification
- `tailwindcss` + `@tailwindcss/postcss` + `postcss`: required for Tailwind v4 in Next.js.
- `tw-animate-css`: current shadcn v4 animation package.
- `class-variance-authority` + `clsx` + `tailwind-merge`: standard shadcn utility stack.
- `lucide-react`: default icon library used by shadcn.
- `next-themes`: required for class-based dark mode and for passing `themeMode` into Aura.

### Validation
- [ ] `npm install`
- [ ] `npm run build`

### Acceptance Criteria
- [ ] Project has the minimal official Tailwind/shadcn config files.
- [ ] No user-visible behavior change yet; migration risk remains zero.

---

## Phase 3: Establish theme tokens and root provider
**Owner**: @implementer (design system)
**Dependencies**: Phase 2
**Complexity**: MEDIUM

### Target Files
- `app/layout.tsx`
- `app/globals.css`
- `components/theme-provider.tsx` *(new)*

### Tasks
- [ ] Add Tailwind v4 imports, CSS variables, `@theme inline`, and base semantic tokens to `app/globals.css` **without removing legacy class rules** used by the flag-off path.
- [ ] Add `components/theme-provider.tsx` using `next-themes`.
- [ ] Update `app/layout.tsx` to wrap the app in `ThemeProvider`, add `suppressHydrationWarning`, and set up root classes/metadata needed for theming.
- [ ] Keep `app/globals.css` as a dual-purpose migration file: Tailwind/theme layers first, legacy class rules retained below for the flag-off UI.
- [ ] Add a skip-link and top-level `id` anchor plan in layout to address current accessibility gaps.

### Validation
- [ ] `npm run build`
- [ ] Start app locally with flag off and verify there are no hydration warnings.
- [ ] `agent-browser open http://localhost:3000`
- [ ] `agent-browser snapshot -i`

### Acceptance Criteria
- [ ] Tailwind utilities compile.
- [ ] Root theming works without hydration mismatch.
- [ ] Legacy UI still renders correctly with the flag off because its existing class rules remain available.

---

## Phase 4: Add shared shadcn primitives and primitive smoke page
**Owner**: @implementer (design system)
**Dependencies**: Phase 3
**Complexity**: LOW

### Target Files
- `lib/utils.ts` *(new)*
- `components/ui/button.tsx` *(new)*
- `components/ui/card.tsx` *(new)*

### Tasks
- [ ] Generate `lib/utils.ts` and the first shadcn primitives used across all later phases.
- [ ] Ensure button/card variants cover primary, secondary, ghost, and destructive needs expected in the refactor UI.
- [ ] Keep variants minimal; do not preload unused primitives.
- [ ] Add a **temporary primitive smoke check step** in local verification: render a button/card in a scratch branch-local test point or temporary dev-only route before using them in refactor components. Remove the scratch surface before phase completion if a route/file was needed.

### Validation
- [ ] `npm run build`
- [ ] Primitive smoke check command path:
  - start dev server: `pm2 start npm --name "demoVoice-web" -- run dev`
  - open smoke surface if added locally: `agent-browser open http://localhost:3000/__ui-smoke` *(or equivalent temporary local route if used)*
  - `agent-browser snapshot -i`
  - verify rendered button/card classes appear and page loads without console errors

### Acceptance Criteria
- [ ] Shared primitives exist for later refactor work.
- [ ] Primitive render path was verified at least once before composing the flagged UI.
- [ ] No persistent user-visible behavior change ships from this phase.

---

## Phase 5: Add input/state primitives used by transcript and controls
**Owner**: @implementer (design system)
**Dependencies**: Phase 4
**Complexity**: LOW

### Target Files
- `components/ui/input.tsx` *(new)*
- `components/ui/badge.tsx` *(new)*
- `components/ui/scroll-area.tsx` *(new)*

### Tasks
- [ ] Add only the primitives needed for transcript entry, status chips, and transcript scrolling.
- [ ] Confirm generated files match App Router + Tailwind v4 output from the current shadcn CLI.
- [ ] Keep this phase separate so registry-generated code review is isolated and revertible.

### Validation
- [ ] `npm run build`
- [ ] Re-run the primitive smoke surface if one was used in Phase 4 and confirm input/badge render.

### Acceptance Criteria
- [ ] Required UI building blocks for transcript/status work are present.
- [ ] No user-visible behavior change yet.

---

## Phase 6: Create the parallel flagged shell
**Owner**: @implementer (frontend layout)
**Dependencies**: Phase 5
**Complexity**: MEDIUM

### Target Files
- `components/demo-shell.tsx`
- `components/refactor-ui/refactor-demo-shell.tsx` *(new)*
- `components/refactor-ui/refactor-shell-header.tsx` *(new)*
- `app/globals.css`

### Tasks
- [ ] Keep `components/demo-shell.tsx:18-29` session creation and provider wiring, but branch to a new `RefactorDemoShell` when the rollout flag is enabled.
- [ ] Create `components/refactor-ui/refactor-demo-shell.tsx` as the refactored composition root using shadcn layout primitives and Tailwind classes instead of bespoke global classnames.
- [ ] Create a separate flagged header/summary component rather than altering the current intro markup in place.
- [ ] If any shared shell-level global selectors are needed for the refactor, add them additively in `app/globals.css`; do not remove or rename legacy selectors.
- [ ] Preserve current behavior when the flag is off.
- [ ] Establish new layout hierarchy: top summary/header, conversation pane, agent pane, compact mobile stacking.

### Validation
- [ ] `npm run build`
- [ ] `npm test`
- [ ] Flag-off startup:
  - `UI_REFACTOR_ENABLED=false pm2 start npm --name "demoVoice-web-off" -- run dev`
  - `agent-browser --session flag-off open http://localhost:3000`
  - `agent-browser --session flag-off snapshot -i`
  - verify legacy panel classes/content still appear
- [ ] Flag-on startup:
  - `UI_REFACTOR_ENABLED=true pm2 start npm --name "demoVoice-web-on" -- run dev -- --port 3001`
  - `agent-browser --session flag-on open http://localhost:3001`
  - `agent-browser --session flag-on snapshot -i`
  - verify new shell/header appears and legacy shell does not

### Acceptance Criteria
- [ ] Flag-off path is unchanged and still renders legacy components only.
- [ ] Flag-on path renders the new shell without breaking session startup.
- [ ] No legacy component file besides `components/demo-shell.tsx` was behaviorally rewritten.

---

## Phase 7: Add the parallel flagged conversation pane
**Owner**: @implementer (conversation UX)
**Dependencies**: Phase 6
**Complexity**: MEDIUM

### Target Files
- `components/refactor-ui/refactor-transcript-panel.tsx` *(new)*
- `components/refactor-ui/refactor-agent-chat-transcript.tsx` *(new)*
- `tests/agent-chat-transcript.test.ts`

### Tasks
- [ ] Build `RefactorTranscriptPanel` with shadcn input/button/card/badge patterns while preserving current chat-send logic semantics from `components/transcript-panel.tsx:25-37` and readiness gating from `components/transcript-panel.tsx:19-31`.
- [ ] Add proper `name`, `autocomplete="off"`, improved helper/error text hierarchy, and stronger focus states to the flagged typed input.
- [ ] Build `RefactorAgentChatTranscript` to match LiveKit transcript patterns while keeping local tone mapping and auto-scroll semantics isolated in the flagged path.
- [ ] Consider adding a lightweight thinking indicator only if it can be sourced from already-used LiveKit hooks without new behavior risk.
- [ ] Extend transcript tests only for preserved local helper behavior; use browser verification for rendered UI states per `ai-native-workflow`.

### Validation
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Flag-off browser check on `http://localhost:3000`: transcript surface remains legacy.
- [ ] Flag-on browser flow on `http://localhost:3001`: connect, wait for first agent transcript, verify typed input unlocks, send a typed prompt, confirm it appears in shared transcript.

### Acceptance Criteria
- [ ] Transcript remains a single shared history for voice + typed chat in the flagged UI.
- [ ] Typed chat gating behavior is unchanged.
- [ ] Legacy transcript files remain untouched for the flag-off path.

---

## Phase 8: Add the parallel flagged agent pane and integrate Aura
**Owner**: @implementer (agent-side UI)
**Dependencies**: Phase 7
**Complexity**: MEDIUM

### Target Files
- `components/refactor-ui/refactor-agent-pane.tsx` *(new)*
- `components/refactor-ui/refactor-agent-state-badge.tsx` *(new)*
- `components/agents-ui/agent-audio-visualizer-aura.tsx` *(new, registry-generated)*

### Tasks
- [ ] Install `@agents-ui/agent-audio-visualizer-aura` using the current documented flow: `npx shadcn@latest registry add @agents-ui`, then `npx shadcn@latest add @agents-ui/agent-audio-visualizer-aura`.
- [ ] Build `RefactorAgentPane` instead of editing `components/agent-pane.tsx` in place.
- [ ] Use Aura in the flagged pane with current `useAgent` state and audio track.
- [ ] Pass `themeMode` from `next-themes` so Aura matches active tokens.
- [ ] Build a separate flagged badge component, reusing the same `AGENT_STATE_LABELS` values or a shared constant only if extraction does not alter legacy behavior.
- [ ] If Aura introduces unexpected runtime or bundle issues, keep a documented fallback to a flagged local visual surface behind the same flag.

### Validation
- [ ] `npm run build`
- [ ] Flag-off browser check: legacy custom visualizer still appears on `http://localhost:3000`.
- [ ] Flag-on browser check: listen/thinking/speaking/disconnected states visibly change on `http://localhost:3001`.
- [ ] Verify reduced-motion fallback behavior manually in the flagged UI.

### Acceptance Criteria
- [ ] Audio visualization is preserved and visually improved in the flagged UI.
- [ ] Agent state remains readable without relying on color alone.
- [ ] Legacy `components/agent-pane.tsx` remains untouched for flag-off.

---

## Phase 9: Add the parallel flagged controls stack
**Owner**: @implementer (session controls)
**Dependencies**: Phase 8
**Complexity**: MEDIUM

### Target Files
- `components/refactor-ui/refactor-session-panel.tsx` *(new)*
- `components/refactor-ui/refactor-livekit-room-audio.tsx` *(new)*
- `components/ui/switch.tsx` *(new)*

### Tasks
- [ ] Build `RefactorSessionPanel` with shadcn buttons/badges/switch patterns inspired by `AgentControlBar`, but keep existing connect/mic/disconnect behavior semantics from `components/session-panel.tsx:51-105`.
- [ ] Replace the raw checkbox pattern only in the flagged UI.
- [ ] Build a separate `RefactorLivekitRoomAudio` so audio-unlock treatment changes do not affect flag-off behavior.
- [ ] Do not swap to registry `AgentControlBar` unless a small adapter clearly reduces code and preserves current behavior; default plan is visual composition only.

### Validation
- [ ] `npm run build`
- [ ] Flag-off browser flow on `http://localhost:3000`: connect, mute/unmute, disconnect still match legacy UI.
- [ ] Flag-on browser flow on `http://localhost:3001`: connect with mic, mute/unmute, disconnect, typed-only connect path, speaker unlock path.

### Acceptance Criteria
- [ ] Control bar feels polished and compact in the flagged UI.
- [ ] Existing session behavior is unchanged.
- [ ] Legacy `SessionPanel` and `LiveKitRoomAudio` remain untouched for flag-off.

---

## Phase 10: Finalize rollout docs and verification packet
**Owner**: @implementer (verification/docs)
**Dependencies**: Phase 9
**Complexity**: LOW

### Target Files
- `verify/browser-smoke.md`
- `verify/BROWSER_VERIFICATION_REPORT.md`
- `VERIFICATION_INDEX.md`

### Tasks
- [ ] Update browser verification steps/screenshots to describe the new flagged UI.
- [ ] Add explicit flag-on/flag-off startup commands and expected DOM/screenshot differences.
- [ ] Document the rollback path: toggle the feature flag off, then revert the latest phase if needed.
- [ ] Record final browser evidence for transcript continuity, Aura presence, controls, and mobile responsiveness.

### Validation
- [ ] `npm run build`
- [ ] Flag-off smoke:
  - `UI_REFACTOR_ENABLED=false pm2 start npm --name "demoVoice-web-off" -- run dev`
  - `agent-browser --session flag-off open http://localhost:3000`
  - `agent-browser --session flag-off snapshot -i`
- [ ] Flag-on smoke:
  - `UI_REFACTOR_ENABLED=true pm2 start npm --name "demoVoice-web-on" -- run dev -- --port 3001`
  - `agent-browser --session flag-on open http://localhost:3001`
  - `agent-browser --session flag-on snapshot -i`
- [ ] Capture refreshed screenshots and transcript evidence for both modes.

### Acceptance Criteria
- [ ] Verification docs match shipped UI.
- [ ] Operators can disable the refactor instantly with the rollout flag.

---

## Deliverables
| Phase | Files Created/Modified |
|---|---|
| 1 | `app/home-page-config.ts`, `app/page.tsx`, `tests/home-page-config.test.ts` |
| 2 | `package.json`, `postcss.config.mjs`, `components.json` |
| 3 | `app/layout.tsx`, `app/globals.css`, `components/theme-provider.tsx` |
| 4 | `lib/utils.ts`, `components/ui/button.tsx`, `components/ui/card.tsx` |
| 5 | `components/ui/input.tsx`, `components/ui/badge.tsx`, `components/ui/scroll-area.tsx` |
| 6 | `components/demo-shell.tsx`, `components/refactor-ui/refactor-demo-shell.tsx`, `components/refactor-ui/refactor-shell-header.tsx` |
| 7 | `components/refactor-ui/refactor-transcript-panel.tsx`, `components/refactor-ui/refactor-agent-chat-transcript.tsx`, `tests/agent-chat-transcript.test.ts` |
| 8 | `components/refactor-ui/refactor-agent-pane.tsx`, `components/refactor-ui/refactor-agent-state-badge.tsx`, `components/agents-ui/agent-audio-visualizer-aura.tsx` |
| 9 | `components/refactor-ui/refactor-session-panel.tsx`, `components/refactor-ui/refactor-livekit-room-audio.tsx`, `components/ui/switch.tsx` |
| 10 | `verify/browser-smoke.md`, `verify/BROWSER_VERIFICATION_REPORT.md`, `VERIFICATION_INDEX.md` |

## Review Gates
| Gate | After Phase | Focus Area |
|---|---|---|
| Gate 1 | Phase 1 | Feature-flag default safety |
| Gate 2 | Phase 3 | Tailwind/shadcn/theming correctness and no legacy breakage |
| Gate 3 | Phase 6 | Legacy-vs-new shell branching and isolation correctness |
| Gate 4 | Phase 7 | Transcript continuity and typed gating preservation |
| Gate 5 | Phase 8 | Aura integration quality, accessibility, reduced-motion behavior |
| Gate 6 | Phase 9 | Session-control parity with prior UI |
| Gate 7 | Phase 10 | Verification packet completeness and rollback readiness |

## Validation Strategy

### Per-phase build/test guardrails
- `npm test` after any logic or helper changes.
- `npm run build` after every phase.
- Prefer browser verification for UI behavior; do not add new framework-specific UI integration suites.

### Exact startup commands
#### Flag-off verification
- Start legacy mode: `UI_REFACTOR_ENABLED=false pm2 start npm --name "demoVoice-web-off" -- run dev`
- Open: `agent-browser --session flag-off open http://localhost:3000`
- Inspect: `agent-browser --session flag-off snapshot -i`

#### Flag-on verification
- Start refactor mode on alternate port: `UI_REFACTOR_ENABLED=true pm2 start npm --name "demoVoice-web-on" -- run dev -- --port 3001`
- Open: `agent-browser --session flag-on open http://localhost:3001`
- Inspect: `agent-browser --session flag-on snapshot -i`

### Browser verification checks
- Re-snapshot after every DOM-changing action.
- Flag-off check: confirm legacy hero/panel shell still renders and no refactor-only header/layout appears.
- Flag-on check: confirm new shell/header renders and legacy shell does not.
- CSS isolation check: after every `app/globals.css` change, confirm flag-off mode still shows the legacy class-based layout/styling.
- Transcript validation: connect, wait for first agent transcript, send typed prompt, verify transcript ordering and input state.
- Controls validation: verify connect, mute/unmute, disconnect, speaker unlock, and typed-only start.
- Agent-pane validation: verify visual/state changes across listening, thinking, speaking, disconnected.

### Primitive render smoke check
- After shadcn primitive generation and before refactor composition, verify at least one locally rendered primitive surface:
  - `pm2 start npm --name "demoVoice-web" -- run dev`
  - `agent-browser open http://localhost:3000/__ui-smoke` *(if a temporary route is used)*
  - `agent-browser snapshot -i`
  - confirm button/card/input render without console or hydration errors
  - remove temporary surface before phase close if it was added solely for smoke testing

### Visual review checklist
- Clear hierarchy: page heading < pane heading < message content < metadata.
- Consistent spacing scale and no ad-hoc pixel values in the flagged UI.
- Focus-visible states on all buttons and inputs.
- Mobile stacked layout preserves transcript readability and control reachability.
- Reduced-motion path is acceptable.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tailwind/shadcn setup disrupts existing styling unexpectedly | MEDIUM | HIGH | Land setup before shell changes; keep refactor UI behind flag; preserve legacy component imports |
| Early cleanup of `app/globals.css` breaks flag-off legacy styling | MEDIUM | HIGH | Keep legacy CSS rules in `app/globals.css` until rollout completion; make only additive global CSS changes during migration |
| Aura introduces rendering/perf issues | MEDIUM | MEDIUM | Integrate in isolated flagged phase; keep fallback to a flagged local visualizer |
| Replacing too much with registry components breaks local product rules | MEDIUM | HIGH | Prefer thin component adoption; keep transcript and session logic local |
| Feature-flag drift leaves mixed old/new surfaces | MEDIUM | HIGH | Use a separate `components/refactor-ui/*` tree and top-level branch only |
| Accessibility regressions during visual polish | MEDIUM | HIGH | Use shadcn primitives, browser keyboard pass, and web-guidelines review points |
| Global CSS and Tailwind utilities fight each other | MEDIUM | MEDIUM | Keep legacy rules in `app/globals.css`, add Tailwind/theme layers additively, and defer legacy CSS cleanup until after rollout |

## Rollback Strategy
- Immediate rollback: set `UI_REFACTOR_ENABLED=false` (or unset it) to restore the legacy shell without code revert.
- Because the refactor lives in `components/refactor-ui/*`, rollback can delete or revert that subtree without touching legacy components.
- Because legacy CSS rules stay in `app/globals.css` during migration, rollback does not depend on reconstructing old styles.
- Aura rollback: keep a flagged local visual fallback until Aura is proven stable.
- If Tailwind setup causes systemic issues, revert Phases 2-5 as a block before touching live behavior.

## Notes
- No backend/business-logic changes are planned.
- No new routes are planned as product features; any temporary smoke route is local-only verification scaffolding and should not remain unless justified.
- No speculative primitives beyond the components actually needed by the refactor should be added.
- Do not remove transcription or audio visualization.
- Keep session/transcript behavior semantics as the default logic source of truth.

## Decision Log
| Decision | Chosen | Rejected | Rationale | Evidence |
|---|---|---|---|---|
| UI rollout mechanism | Single server-owned feature flag + parallel component tree + preserved legacy CSS | Ungated progressive overwrite | Safest rollback path and avoids accidental flag-off regressions | `app/page.tsx:6-11`; `app/globals.css:35-782`; no existing UI flag |
| Base migration path | Tailwind v4 + shadcn/ui | Continue expanding bespoke global CSS | Requested direction; better long-term systemization | `app/globals.css:1-782`; official shadcn/Tailwind docs |
| Global CSS migration | Keep legacy rules in `app/globals.css` until rollout completes | Early slimming of `app/globals.css` or immediate CSS extraction | Smallest safe change; preserves flag-off styling without inventing extra CSS architecture | `app/globals.css:35-782`; legacy component class usage |
| LiveKit install flow wording | Follow LiveKit docs literally: `init` → `registry add @agents-ui` → `add @agents-ui/...` | Rely on registry auto-discovery wording alone | Removes CLI ambiguity and matches current upstream guidance | `https://docs.livekit.io/frontends/agents-ui/`; shadcn registry docs |
| LiveKit integration style | Smaller Agents UI + local logic | `agent-session-view-01` as full base | Reuses existing tested logic and avoids block-level rewrite | `components/transcript-panel.tsx:19-31`; `components/session-panel.tsx:51-105`; LiveKit block docs |
| Audio visualizer | Adopt Aura if thin integration succeeds | Keep only bespoke CSS bars/halo | Meets polish goal while preserving core behavior | `components/agent-pane.tsx:60-78`; Aura docs |
| Transcript implementation | Parallel flagged local component | In-place rewrite of legacy transcript files | Keeps flag-off path unchanged | `components/transcript-panel.tsx:15-113`; analyzer finding #1 |
| Control implementation | Parallel flagged local component | Full replacement with `AgentControlBar` or in-place rewrite | Lowest behavior risk, easiest rollback | `components/session-panel.tsx:51-105`; `components/livekit-room-audio.tsx:16-24` |
