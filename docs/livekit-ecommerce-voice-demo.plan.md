# LiveKit Ecommerce Voice Demo - Implementation Plan

## Problem Statement
The repository is still a near-blank slate, but local LiveKit Cloud credentials already exist in an untracked root `.env`. We need an MVP ecommerce voice demo where a LiveKit AI agent acts like a customer service / sales rep, answers questions about a small catalog, and a local web frontend shows connection controls plus realtime transcript/chat.

## Current state (evidence)
- Repo file scan currently finds exactly two non-git files: `./.env` and `./docs/livekit-ecommerce-voice-demo.plan.md`.
- `git --no-pager status --short --branch` shows `## No commits yet on main`, plus untracked `.env` and `docs/`; there are **no tracked files yet**.
- `.env:1-3` currently defines `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`; `LIVEKIT_AGENT_NAME` is **not** present yet and must be added locally before runtime verification (values intentionally not copied into this plan).
- No `package.json`, no app code, no tests, and no build artifacts currently exist.
- Because there is no application code yet, there are no existing internal enums, models, routes, or call chains to preserve; runtime contracts must come from verified LiveKit and Next.js docs.

## Approach
Keep the chosen architecture: **one root Next.js app for the local web UI plus one separate Node.js LiveKit worker under `agent/`**.

### Package / runtime model
Use a **two-package, non-workspace MVP layout**:
- **Root package**: Next.js web app only.
- **`agent/` package**: standalone Node worker package for `@livekit/agents`.
- **No workspace manager in MVP**: this avoids unnecessary monorepo plumbing in a blank repo.

Why this remains the simplest viable option:
- It preserves the clean runtime boundary the analyzer asked for: the worker is an independent long-lived process, not tied to web requests.
- A dedicated `agent/package.json` and `agent/tsconfig.json` keep Node-worker build settings separate from Next.js app settings.
- The two runtimes still share a single source of business truth through `data/products.json`, without adding a database or another service.
- This stays MVP-focused: one web app, one worker, one JSON catalog, no Docker, no auth system, no extra backend service.

## Runtime / version contract
- **Supported baseline**: LiveKit Agents for Node.js requires **Node.js >= 20**.
- **Docs example note**: LiveKit’s Node quickstart uses `pnpm >= 10.15.0`, but this MVP can standardize on plain `npm` scripts to avoid adding another mandatory tool in an empty repo.
- **Local machine observation**: `node -v` currently reports **`v23.11.0`**.
- **Plan stance**: local Node 23 is **above the documented minimum** and is acceptable to attempt for this MVP, but it is **not explicitly verified by LiveKit docs as a tested target**. If dependency install or runtime issues appear, the rollback path is to standardize on **Node 20 LTS** before changing architecture.

## Architecture Summary
- **Web app (Next.js, repo root)**
  - Renders a single local demo page.
  - Uses LiveKit Session APIs and Agents UI components.
  - Calls a same-origin `/api/token` endpoint to fetch room credentials.
  - Reads `LIVEKIT_AGENT_NAME` in a Next.js server component and passes that canonical value into the client UI instead of adding a second public env var.
  - Shows connect/disconnect controls, transcript/chat, agent state, and a small featured-product sidebar.
- **Token endpoint (`app/api/token/route.ts`)**
  - Reads server-only LiveKit credentials plus the canonical `LIVEKIT_AGENT_NAME` from env.
  - Implements the standard LiveKit endpoint contract with a narrowed MVP allowlist for accepted request fields.
  - Normalizes agent dispatch to the same canonical `LIVEKIT_AGENT_NAME` used by the frontend session and worker.
  - Returns `{ server_url, participant_token }` with HTTP 201.
  - Is treated as **localhost/dev-only in MVP** unless a real auth layer is later added.
- **Voice agent worker (`agent/`)**
  - Runs as its own Node process using `@livekit/agents`.
  - Uses `dotenv` with an explicit path to the repo-root `.env`, so the worker and Next.js app share one credential source of truth.
  - Sets `ServerOptions.agentName` from `process.env.LIVEKIT_AGENT_NAME`, matching the frontend session and token endpoint dispatch contract.
  - Starts a voice session, greets the user, answers product questions, and uses tool calls against a static catalog.
  - Can be developed, built, and started independently from the web app.
- **Catalog source (`data/products.json`)**
  - Small curated MVP catalog (roughly 8-12 products across 2-3 categories).
  - Shared read-only source for frontend display and agent lookup behavior.

## Success Criteria
- [ ] User can open the web app locally and connect to a LiveKit-backed session.
- [ ] The agent can hold a basic voice/text conversation about products in the static catalog.
- [ ] The UI shows realtime transcript/chat via LiveKit components.
- [ ] The app uses a backend token endpoint rather than client-side secrets.
- [ ] The worker can be started, smoke-tested, built, and started independently from the web app.
- [ ] Frontend Session setup, token endpoint dispatch normalization, and worker `ServerOptions.agentName` all use the same canonical `LIVEKIT_AGENT_NAME` value.
- [ ] The web app and worker both use the same repo-root `.env` contract, with no second agent-only env file.
- [ ] The worker resolves repo-root `data/products.json` in both dev and built modes without copying the catalog into `agent/dist`.
- [ ] MVP verification works through system boundaries (`curl`/`.hurl`, direct CLI or PM2 process logs, `agent-browser`), not framework-specific integration tests.

## MVP Scope
### In scope
- Single demo page
- LiveKit session setup and token endpoint
- One ecommerce voice agent persona
- Static catalog JSON + tool calling
- Transcript/chat UI
- Basic featured products sidebar/cards
- Local runtime and verification instructions
- Standalone worker smoke verification before full UI integration

### Explicitly out of scope
- End-user authentication / accounts
- Database / ORM / admin CMS
- Checkout, cart, or payment flows
- Real order lookup, returns processing, CRM, or email
- Analytics, observability platform integrations, A/B tests
- Multi-agent routing / department transfers
- Dockerized infrastructure
- Native mobile apps

## Specific file / folder layout to create
```text
.
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       └── token/
│           └── route.ts
├── components/
│   ├── agents-ui/
│   │   ├── agent-session-provider.tsx
│   │   └── agent-chat-transcript.tsx
│   ├── demo-shell.tsx
│   ├── session-panel.tsx
│   ├── transcript-panel.tsx
│   ├── product-sidebar.tsx
│   └── agent-state-badge.tsx
├── data/
│   └── products.json
├── agent/
│   ├── package.json
│   ├── tsconfig.json
│   ├── main.ts
│   ├── ecommerce-agent.ts
│   ├── prompt.ts
│   ├── runtime-paths.ts
│   ├── catalog.ts
│   └── tools/
│       ├── search-products.ts
│       └── get-product-details.ts
├── tests/
│   └── product-catalog.test.ts
└── verify/
    ├── token-endpoint.hurl
    ├── agent-worker-smoke.md
    └── browser-smoke.md
```

## Environment Variable Plan
### Local secret files
- Keep the existing root `.env` **local-only and uncommitted**.
- Do **not** describe `.env` as tracked or required to be committed.
- Add a committed `.env.example` with placeholders only, never real values.

### Variables to document in `.env.example`
- `LIVEKIT_URL=`
- `LIVEKIT_API_KEY=`
- `LIVEKIT_API_SECRET=`
- `LIVEKIT_AGENT_NAME=ecommerce-agent`
- `NEXT_PUBLIC_APP_NAME=LiveKit Ecommerce Voice Demo`

### Server-side only / server-owned config
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `LIVEKIT_URL`
- `LIVEKIT_AGENT_NAME` (server-owned config; pass the resolved string into client props instead of exposing a second public env var)

### Client-safe
- Only values intentionally prefixed with `NEXT_PUBLIC_*`.
- Serializable props passed from Next.js server components into client components.

### Env handling rationale
- Next.js App Router route handlers and server components can read `process.env.*` server-side.
- Server components can pass serializable props to client components.
- Only `NEXT_PUBLIC_*` variables are bundled to browser code.
- Therefore the browser should receive only the short-lived participant token from `/api/token` plus non-secret props like the resolved agent name, never raw LiveKit secrets.

### Single env-source contract for both packages
- **Source of truth**: keep the existing repo-root `.env` as the only local credential file for MVP.
- **Canonical agent name**: `LIVEKIT_AGENT_NAME` is the single source of truth for agent dispatch. Do **not** add a second public env var or leave a hardcoded client literal in the UI.
- **Root Next.js app**: relies on Next.js's normal root-project `.env*` loading behavior for server-side code such as `app/page.tsx` and `app/api/token/route.ts`; the server component passes the canonical agent name into the client UI as a prop.
- **Token endpoint**: accepts the standard LiveKit schema but narrows the effective MVP behavior; if `room_config` includes agent dispatch information, the endpoint must normalize/override the effective agent name to `LIVEKIT_AGENT_NAME` before calling the token builder and reject unsupported `room_config` keys with 4xx.
- **Standalone worker**: `agent/main.ts` must call `dotenv.config({ path: <absolute path to repo-root .env> })` during bootstrap, instead of relying on the process working directory or on `agent/.env` / `.env.local`, and must set `ServerOptions.agentName` from `process.env.LIVEKIT_AGENT_NAME`.
- **Stable path rule**: add a tiny `agent/runtime-paths.ts` helper that resolves the nearest `agent/package.json` as the agent package root, then resolves the repo root as its parent directory. Both the env path and catalog path should come from that helper.
- **Direct CLI commands**: `npm --prefix agent run dev`, `npm --prefix agent run build`, and `npm --prefix agent run start` must all preserve this contract because `agent/main.ts` loads the repo-root `.env` itself.
- **PM2 commands (if used)**: PM2 should run the same package scripts (`--cwd ./agent -- run dev` or `--cwd ./agent -- run start`) and must not introduce a second env file via `agent/.env`, `.env.local`, or an alternate `--env-file`.
- **MVP exclusion**: do not create or document an `agent/.env`, `agent/.env.local`, copied env artifact in `agent/dist`, or `NEXT_PUBLIC_LIVEKIT_AGENT_NAME`.

## Prerequisites for this MVP
### Required
1. **Node.js >= 20**
2. **npm** (bundled with Node)
3. **hurl** for API boundary verification
4. **agent-browser** for browser-level verification

### Optional / recommended
- **PM2**: recommended named-process option when running both services together, but **not required** for MVP validation because direct CLI commands remain first-class.
- **LiveKit CLI**: optional only if later cloud deployment or playground-specific flows are added; not required for the local MVP described in this plan.
- **Docker**: not required because this MVP intentionally uses no Dockerized services.

### Required binary checks
- `node --version`
- `npm --version`
- `hurl --version`
- `agent-browser --version`
- `pm2 --version` *(only if using the optional PM2 flow)*

## Runtime / build contract
### Root web package
The root `package.json` owns only the Next.js app.

Planned commands:
- `npm run dev` → start the local Next.js dev server
- `npm run build` → build the Next.js app
- `npm run start` → start the built Next.js app

### Standalone `agent/` package
The `agent/` directory gets its own `package.json` and `tsconfig.json`.

Concrete worker bootstrap contract (chosen path):
- Follow the documented **LiveKit Node voice quickstart TypeScript path** inside `agent/`, not the full starter repo.
- Use the quickstart-style STT-LLM-TTS dependency set for MVP worker bootstrap:
  - `@livekit/agents@1.x`
  - `@livekit/agents-plugin-silero@1.x`
  - `@livekit/agents-plugin-livekit@1.x`
  - `@livekit/noise-cancellation-node@0.x`
  - `dotenv`
  - plus local TypeScript tooling (`typescript`, `tsx`)
- Because this plan keeps the quickstart plugins for VAD / turn detection / noise cancellation, the worker package must also expose the documented one-time model bootstrap:
  - `npm --prefix agent run download-files`

Planned scripts:
- `npm --prefix agent run dev` → `tsx main.ts dev`
- `npm --prefix agent run build` → `tsc -p tsconfig.json`
- `npm --prefix agent run start` → `node dist/main.js start`
- `npm --prefix agent run download-files` → `npm run build && node dist/main.js download-files`

Runtime note:
- `agent/tsconfig.json` should compile into `agent/dist/` so `start` and `download-files` target the same stable artifact path.
- `build` only compiles the worker; it must not create a second env file or copy `data/products.json`.
- `dev`, `start`, and `download-files` all execute `agent/main.ts` / `dist/main.js`, which is why the explicit repo-root `.env` load and `ServerOptions.agentName` wiring must live in worker bootstrap code.

### Why this avoids Next.js config clashes
- Next.js continues to use the root app config and root `tsconfig.json`.
- The worker uses `agent/package.json` plus `agent/tsconfig.json`, so Node-targeted module/output settings stay isolated from the web app.
- This is simpler than introducing a workspace while still making the independent worker contract explicit.

## MVP Agent Behavior Plan
### Catalog source
Use a **static JSON catalog** in `data/products.json` containing roughly 8-12 fake but believable ecommerce products, such as:
- headphones / earbuds
- smart speakers
- webcams / microphones
- laptop accessories

Each item should include only fields needed for the demo:
- `sku`
- `name`
- `category`
- `price`
- `shortDescription`
- `features[]`
- `stockStatus`
- `shippingSummary`
- `returnPolicySummary`
- `tags[]`

### Shared catalog loading contract
- `data/products.json` at the **repo root** is the single source of truth for both the web app and the worker.
- The worker must not rely on `process.cwd()` or on `../data/products.json` relative guesses from whichever directory the operator launched.
- Instead, `agent/catalog.ts` should use the same `agent/runtime-paths.ts` helper described above:
  1. find the agent package root from the current module location,
  2. resolve the repo root as `dirname(agentPackageRoot)`,
  3. resolve the catalog path as `<repoRoot>/data/products.json`.
- This rule must work unchanged in both modes:
  - **dev**: `agent/main.ts` / `agent/catalog.ts`
  - **built**: `agent/dist/main.js` / `agent/dist/catalog.js`
- Do **not** copy the catalog into `agent/dist`; the built worker should continue reading the repo-root JSON file at runtime.
- Fail fast on startup if the resolved catalog file is missing or invalid JSON, and log the resolved absolute path plus loaded product count for operator debugging.

### Tool / function-calling plan
For MVP, keep tools minimal:
1. `searchProducts(query, category?, maxPrice?)`
   - Returns a short list of matching products.
2. `getProductDetails(sku)`
   - Returns authoritative details for one product.

Do **not** add cart/order/payment tools in MVP.

### Persona / system prompt
The agent should sound like:
- friendly ecommerce sales + support representative
- concise, voice-friendly, and helpful
- transparent that it is a demo assistant
- grounded in catalog facts only

Prompt rules:
- prefer short spoken turns (1-3 short sentences)
- ask one follow-up question at a time
- never invent product specs, pricing, or policy terms
- if information is missing, say so plainly
- never claim checkout/order placement capability

### Guardrails
- Only answer with catalog/policy information available in local data.
- Refuse payment collection or order execution.
- Do not store personal data beyond transient room conversation context.
- If a user asks for unsupported actions, explain the limitation and offer product guidance instead.

### Sample demo flows
1. **Discovery**: “I need noise-cancelling headphones under $200.”
2. **Comparison**: “Compare Product A and Product B for remote work.”
3. **Support/policy**: “How fast is shipping, and what is the return window?”
4. **Recommendation**: “I’m shopping for a gift for someone who works from home.”

## Frontend Plan
### Core UI
Use LiveKit’s React/Next.js path and Agents UI components for the main experience:
- Session connect/disconnect controls
- Transcript/chat display via `AgentChatTranscript`
- Agent state indicator (connecting/listening/thinking/speaking/disconnected/failed)
- Featured product cards/sidebar

### Recommended screen structure
- **Main column**: agent status, connect control, transcript/chat area
- **Right sidebar**: 4-6 featured products with price/category and suggested prompts
- **Top section**: small explainer banner that this is a local LiveKit ecommerce voice demo

### Transcript/chat details
- `AgentChatTranscript` should be the primary conversation panel.
- Add a lightweight text-input path or prompt chips for deterministic browser testing, even though the product is voice-first.
- That typed path must use the documented LiveKit text-stream flow: send frontend text through `room.localParticipant.sendText(..., { topic: 'lk.chat' })` (or an equivalent session wrapper around that exact API/topic).
- Do **not** create a separate frontend-only chat store or parallel custom messaging mechanism; typed input and voice transcriptions must converge in the same LiveKit conversation history so `AgentChatTranscript` shows one timeline.
- Reason: typed input makes `agent-browser` verification more reliable than microphone automation alone while preserving the real agent path.

### Session / token flow
- Client creates a `TokenSource.endpoint('/api/token')`.
- `app/page.tsx` reads `process.env.LIVEKIT_AGENT_NAME` server-side and passes the resolved value into the client UI as a prop.
- Client creates a Session with `agentName` from that server-provided prop, not from a hardcoded string or a second `NEXT_PUBLIC_*` env var.
- Wrap the app area in `AgentSessionProvider` so `AgentChatTranscript` and control components work automatically.
- Prefer explicit connect/disconnect actions instead of auto-connecting on page load.

### Agents UI integration contract
- Choose the **local/generated component** path, not an undocumented global import.
- `AgentSessionProvider` enters the repo through the documented Agents UI Shadcn installation flow:
  1. `npx shadcn@latest init`
  2. `npx shadcn@latest registry add @agents-ui`
  3. `npx shadcn@latest add @agents-ui/agent-session-provider`
  4. `npx shadcn@latest add @agents-ui/agent-chat-transcript`
- Those commands generate local source files under `components/agents-ui/`.
- Keep MVP customization thin:
  - `components/agents-ui/agent-session-provider.tsx` and `components/agents-ui/agent-chat-transcript.tsx` stay generated/local.
  - `components/session-panel.tsx` remains our small custom connect/disconnect wrapper.
  - `components/transcript-panel.tsx` remains our thin local wrapper around the generated `AgentChatTranscript`.
- This avoids guessing about package-level exports while still keeping the UI minimal and editable.

### Product cards recommendation
Recommended for MVP: **yes, but static only**.
- They improve demo clarity.
- They make the empty state useful before the user speaks.
- They provide deterministic sample prompts for browser smoke tests.

Do **not** add dynamic agent-to-sidebar synchronization in MVP; use transcript + static cards only.

## Backend Plan
### Token endpoint responsibilities
`app/api/token/route.ts` should:
- accept LiveKit’s standard POST JSON schema, but enforce a narrower deterministic MVP policy.
- treat `room_name` as optional and apply the deterministic server-side default room name `demoVoice-room` when omitted.
- accept `participant_name` as an optional display-name hint.
- treat `participant_identity` as server-owned in MVP: always generate the effective identity server-side and do not trust arbitrary client-provided identity values.
- treat `participant_metadata` and `participant_attributes` as out of scope for MVP and reject them with 4xx instead of silently expanding scope.
- accept only the minimum `room_config` subset required for Session-based agent dispatch, normalize/override the effective agent name to canonical `LIVEKIT_AGENT_NAME`, and reject unsupported `room_config` keys with 4xx.
- create a short-lived participant token with room join permission.
- return HTTP 201 with:
  - `server_url`
  - `participant_token`

### `/api/token` exposure rule
- In this MVP, `/api/token` is for the **local same-origin web app only**.
- Treat it as **localhost/dev-only** unless a real authentication layer is later added.
- Do **not** describe it as production-safe or publicly exposable in the MVP.
- If the app is ever exposed beyond local development, add request authentication first (for example, session/JWT/header validation) before allowing public token generation.

### Agent runtime responsibilities
`agent/main.ts` + `agent/ecommerce-agent.ts` should:
- load the repo-root `.env` explicitly through `dotenv.config({ path: <resolved repo-root .env> })`
- require `LIVEKIT_AGENT_NAME` during bootstrap and wire it into `ServerOptions.agentName` for explicit dispatch
- resolve `data/products.json` through `agent/runtime-paths.ts` / `agent/catalog.ts`, not from `cwd`
- start the LiveKit agent worker in local dev mode
- initialize the voice session

## Verification Strategy (AI-native workflow)
### Required binary checks
Before implementation verification:
- `command -v node >/dev/null || echo "Install Node.js >= 20 before runtime verification"`
- `command -v hurl >/dev/null || echo "Install hurl before API verification"`
- `command -v agent-browser >/dev/null || echo "Install agent-browser before UI verification"`
- `command -v pm2 >/dev/null || echo "Install PM2 only if you want the optional named-process flow"`

### Runtime management
Direct commands (first-class MVP flow):
- `npm run dev`
- `npm --prefix agent run download-files`
- `npm --prefix agent run dev`
- `npm --prefix agent run build`
- `npm --prefix agent run start`

PM2 equivalents (recommended when running both services together, but optional):
- `pm2 start npm --name demoVoice-web -- run dev`
- `pm2 start npm --name demoVoice-agent --cwd ./agent -- run dev`
- `pm2 start npm --name demoVoice-agent-prod --cwd ./agent -- run start`
- `pm2 logs demoVoice-web --lines 50 --nostream`
- `pm2 logs demoVoice-agent --lines 50 --nostream`

### API verification
- Add `verify/token-endpoint.hurl` to POST to `/api/token` and assert:
  - HTTP 201
  - JSON includes `server_url`
  - JSON includes `participant_token`
  - omitted `room_name` is accepted and falls back to `demoVoice-room`
  - `participant_metadata` and `participant_attributes` are rejected with 4xx in MVP
  - unsupported `room_config` keys are rejected with 4xx
- Also verify via `curl -sSf` as a fast readiness check.
- README and verify docs must state that this token path is localhost/dev-only for the MVP and that the endpoint normalizes agent dispatch to the canonical `LIVEKIT_AGENT_NAME`.

### Standalone worker verification gate (required before full UI integration)
Add `verify/agent-worker-smoke.md` and require it to document this exact gate:
1. Start the web app with the minimal session/connect shell already added in earlier phases.
2. Start the worker independently with `npm --prefix agent run dev` (or the PM2 equivalent).
3. Confirm worker readiness from logs via the explicit planned readiness log emitted by our code path (not by assuming undocumented framework log strings).
4. Open `http://localhost:3000` and connect using the minimal session panel from Phase 3.
5. Verify the first-connect greeting behavior before any full transcript/sidebar polish work continues.
6. Record the expected evidence in `verify/agent-worker-smoke.md`:
    - command used to start the worker
    - proof that the worker loaded env from the repo-root `.env` contract (for example, the documented bootstrap log, never the secret values)
    - resolved absolute catalog path and product count
    - readiness log marker observed
    - first connect succeeded
    - greeting was heard or surfaced in the UI/transcript path
    - any fallback typed-input prompt used for deterministic verification

This gate must pass before Phase 6 begins.

### UI verification
Use `agent-browser` against the running dev server:
1. `agent-browser open http://localhost:3000`
2. `agent-browser snapshot -i`
3. Verify connect controls and transcript container render.
4. Use prompt chips or typed text input to trigger a deterministic conversation through the documented LiveKit `lk.chat` path.
5. Re-snapshot after connection and after each DOM-changing action.
6. Save a screenshot as visual proof.

### Unit-test boundary
The only new language-specific test recommended for MVP is a **pure unit test for catalog data/search behavior** in `tests/product-catalog.test.ts`.

Do **not** add framework-specific API or UI integration tests. Use `.hurl`, process logs, `curl`, and `agent-browser` instead.

## Phased Plan

---

## Phase 1: Bootstrap repo and runtime boundaries
**Owner**: @implementer (platform/bootstrap)
**Dependencies**: None
**Complexity**: MEDIUM

### Tasks
- [ ] Create root `package.json`, root `tsconfig.json`, and minimal Next.js bootstrap files.
- [ ] Create `agent/package.json` and `agent/tsconfig.json` as an explicitly separate worker runtime.
- [ ] Add `.gitignore` and `.env.example` with placeholder values only.
- [ ] Add `README.md` with Node version requirement, exact worker bootstrap/install commands, direct runtime commands, and PM2 as the recommended-but-optional named-process flow.
- [ ] Document the single env-source contract: repo-root `.env` is the only local credential file, and the worker explicitly loads it from `agent/main.ts`.
- [ ] Add `LIVEKIT_AGENT_NAME` to `.env.example` and document that the operator-local root `.env` must define it before runtime verification.
- [ ] Document that local Node 23 is acceptable to attempt but Node 20 LTS is the compatibility fallback.

### Acceptance Criteria
- [ ] The repo has an explicit root web package and a separate `agent/` package.
- [ ] The worker dev/build/start/download-files commands are documented independently from the web app.
- [ ] Docs no longer imply a second worker-only env file.
- [ ] `.env.example` exists and contains placeholders, not secrets.
- [ ] The plan/documentation no longer imply `.env` is tracked.

---

## Phase 2: Create the Next.js app shell
**Owner**: @implementer (frontend)
**Dependencies**: Phase 1
**Complexity**: MEDIUM

### Tasks
- [ ] Create `app/layout.tsx` and `app/page.tsx`.
- [ ] Create `components/demo-shell.tsx` as the top-level page composition.
- [ ] Render a static empty-state layout with transcript area, control area, and product sidebar placeholders.
- [ ] Read `LIVEKIT_AGENT_NAME` in `app/page.tsx` as a server component concern and pass it into the client shell as a prop; do **not** add a `NEXT_PUBLIC_LIVEKIT_AGENT_NAME` or hardcoded client fallback.
- [ ] Add a simple page render that can be verified by browser and `curl`.

### Acceptance Criteria
- [ ] The home page renders without LiveKit session wiring yet.
- [ ] The empty state communicates what the demo does.
- [ ] The page structure matches the planned transcript + sidebar layout.
- [ ] The client shell receives the canonical agent name from a server component prop, not from a public env var or hardcoded literal.

---

## Phase 3: Implement the token endpoint and minimal session wiring
**Owner**: @implementer (backend/frontend integration)
**Dependencies**: Phase 2
**Complexity**: MEDIUM

### Tasks
- [ ] Create `app/api/token/route.ts` using the standard LiveKit endpoint contract plus the narrowed MVP request policy.
- [ ] Create the minimal Session + `TokenSource.endpoint('/api/token')` wiring for explicit connect/disconnect using the canonical agent name prop from Phase 2.
- [ ] Create `components/session-panel.tsx` for connect/disconnect behavior.
- [ ] Ensure LiveKit secrets stay server-only and that `LIVEKIT_AGENT_NAME` remains server-owned config passed into the client as a prop rather than as a public env var.
- [ ] Add `verify/token-endpoint.hurl` for boundary-level token verification, including 4xx cases for disallowed fields.
- [ ] Document in `README.md` that `/api/token` is localhost/dev-only in MVP unless auth is later added, and list the accepted/ignored/rejected input fields.

### Acceptance Criteria
- [ ] `POST /api/token` returns HTTP 201 with `server_url` and `participant_token`.
- [ ] Session creation points at the canonical `LIVEKIT_AGENT_NAME` value passed from server components, not a hardcoded client string.
- [ ] Omitted `room_name` falls back to `demoVoice-room`; `participant_name` is accepted; `participant_identity` is always generated server-side; `participant_metadata` and `participant_attributes` are rejected with 4xx in MVP.
- [ ] Unsupported `room_config` keys are rejected with 4xx, and the effective agent dispatch name is normalized to the same canonical `LIVEKIT_AGENT_NAME` used by the frontend and worker.
- [ ] The browser no longer needs any secret env vars.
- [ ] The docs explicitly state `/api/token` is not production-safe/public in MVP.

---

## Phase 4: Add the catalog source and pure lookup logic
**Owner**: @implementer (domain logic)
**Dependencies**: Phase 3
**Complexity**: LOW

### Tasks
- [ ] Create `data/products.json` with a compact, curated demo catalog.
- [ ] Create `agent/runtime-paths.ts` and `agent/catalog.ts` so the worker resolves the repo root and `data/products.json` without relying on `cwd`.
- [ ] Create the smallest useful read-only catalog loading and filtering helpers.
- [ ] Add `tests/product-catalog.test.ts` for pure catalog/search behavior only.
- [ ] Keep the data model shared through the JSON file; do not add a database or external product service.

### Acceptance Criteria
- [ ] Catalog data is sufficient for recommendation, comparison, and policy Q&A demos.
- [ ] Search logic is deterministic and unit-tested.
- [ ] The worker reads the same repo-root `data/products.json` in both dev and built modes.
- [ ] No catalog copy is introduced under `agent/dist`.
- [ ] No database or external product service is introduced.

---

## Phase 5: Implement the agent worker and pass the standalone smoke gate
**Owner**: @implementer (agent runtime)
**Dependencies**: Phase 4
**Complexity**: HIGH

### Tasks
- [ ] Create `agent/prompt.ts` with the ecommerce sales/support persona and guardrails.
- [ ] Create `agent/tools/search-products.ts` and `agent/tools/get-product-details.ts` using the minimal LiveKit tool-calling pattern.
- [ ] Create `agent/ecommerce-agent.ts` to register instructions and tools.
- [ ] Create `agent/main.ts` to run the worker in local dev mode and production mode, with explicit repo-root `.env` loading via `dotenv` and `ServerOptions.agentName` sourced from `LIVEKIT_AGENT_NAME`.
- [ ] Add explicit readiness/session/greeting/tool/failure logs for operator inspection.
- [ ] Add `verify/agent-worker-smoke.md` with the exact standalone worker verification steps and expected evidence.
- [ ] Verify the worker can run independently with `npm --prefix agent run dev`, can bootstrap model files with `npm --prefix agent run download-files`, and can build/start independently with `npm --prefix agent run build && npm --prefix agent run start`.

### Acceptance Criteria
- [ ] The worker starts independently from the web app.
- [ ] Worker bootstrap uses the repo-root `.env` contract in both direct-command and optional PM2 flows.
- [ ] `ServerOptions.agentName` uses the same canonical `LIVEKIT_AGENT_NAME` value as the frontend session and token endpoint dispatch logic.
- [ ] A deliberate readiness marker is visible in worker logs after startup.
- [ ] Worker logs expose the resolved catalog path and loaded product count without exposing secrets.
- [ ] First connect succeeds through the Phase 3 session shell.
- [ ] The greeting behavior is verified before Phase 6 starts.
- [ ] Tool calls are limited to lookup tasks; no cart/payment actions exist.

---

## Phase 6: Wire the realtime UI components
**Owner**: @implementer (frontend/livekit UI)
**Dependencies**: Phase 5
**Complexity**: MEDIUM

### Tasks
- [ ] Generate `components/agents-ui/agent-session-provider.tsx` and `components/agents-ui/agent-chat-transcript.tsx` through the documented Shadcn + Agents UI flow.
- [ ] Create `components/transcript-panel.tsx` around `AgentChatTranscript`.
- [ ] Create `components/agent-state-badge.tsx` to display connection/agent states.
- [ ] Create `components/product-sidebar.tsx` using the static catalog data.
- [ ] Update `components/demo-shell.tsx` to compose the connected session, transcript, controls, and sidebar.
- [ ] Add prompt chips or a typed-input fallback for deterministic browser testing that sends messages through the LiveKit `lk.chat` text stream path rather than a parallel custom chat mechanism.

### Acceptance Criteria
- [ ] `AgentSessionProvider` exists as a local/generated file under `components/agents-ui/`.
- [ ] Transcript updates in realtime during voice turns and typed `lk.chat` messages in the same conversation history.
- [ ] The user can see whether the agent is connecting, listening, thinking, speaking, disconnected, or failed.
- [ ] Featured products are visible before a conversation begins.
- [ ] Browser verification can be driven without microphone automation alone because the typed path exercises the same LiveKit conversation surface shown by `AgentChatTranscript`.

---

## Phase 7: End-to-end runtime verification and operator polish
**Owner**: @implementer (verification/runtime)
**Dependencies**: Phase 6
**Complexity**: MEDIUM

### Tasks
- [ ] Start the web app and agent with direct commands as the baseline MVP flow, or with PM2 if named processes are preferred.
- [ ] Verify the token endpoint with `hurl` and `curl`.
- [ ] Verify the web UI using `agent-browser` snapshots and screenshots.
- [ ] Add `verify/browser-smoke.md` documenting the exact browser smoke flow, including the typed `lk.chat` fallback path.
- [ ] Update `README.md` with startup, verification, teardown, localhost-only token endpoint warnings, and PM2 as the recommended-but-optional multi-process runner.

### Acceptance Criteria
- [ ] Operator can start both processes and confirm readiness without reading source code.
- [ ] The browser smoke test produces transcript evidence of a successful product conversation.
- [ ] The verification path uses universal/system-level checks instead of framework integration tests.
- [ ] The docs consistently describe `/api/token` as localhost/dev-only until auth exists.
- [ ] The runtime docs keep direct CLI commands first-class while offering PM2 as the recommended named-process option.

## Deliverables
| Phase | Files Created/Modified |
|-------|------------------------|
| Phase 1 | `package.json`, `tsconfig.json`, `agent/package.json`, `agent/tsconfig.json`, `.env.example`, `README.md`, `.gitignore` |
| Phase 2 | `app/layout.tsx`, `app/page.tsx`, `components/demo-shell.tsx` |
| Phase 3 | `app/api/token/route.ts`, `components/session-panel.tsx`, `verify/token-endpoint.hurl`, `README.md` |
| Phase 4 | `data/products.json`, `agent/runtime-paths.ts`, `agent/catalog.ts`, catalog helpers, `tests/product-catalog.test.ts` |
| Phase 5 | `agent/main.ts`, `agent/ecommerce-agent.ts`, `agent/prompt.ts`, `agent/tools/*.ts`, `verify/agent-worker-smoke.md` |
| Phase 6 | `components/agents-ui/*.tsx`, `components/transcript-panel.tsx`, `components/agent-state-badge.tsx`, `components/product-sidebar.tsx`, `components/demo-shell.tsx` |
| Phase 7 | `README.md`, `verify/browser-smoke.md` |

## Review Gates
| Gate | After Phase | Focus Area |
|------|-------------|------------|
| **Gate 1** | Phase 3 | Secret handling, canonical agent-name contract, narrowed token endpoint policy, localhost-only warning, 201 response shape |
| **Gate 2** | Phase 5 | Standalone worker env/catalog contract, `ServerOptions.agentName`, readiness logging, quickstart bootstrap scripts, first-connect greeting verification |
| **Gate 3** | Phase 6 | Generated Agents UI files, provider wiring, `lk.chat` typed-input path, transcript rendering |
| **Gate 4** | Phase 7 | AI-native verification completeness (`hurl`, direct CLI or PM2 logs, `agent-browser`) |

## Verified Facts vs Unverified Assumptions
| Item | Verified at | Evidence / Note |
|------|------------|-----------------|
| Repo currently contains `.env` and this plan file | `<repo-root>` shell file scan | ✅ `find . -maxdepth 2 -type f -not -path '*/.git/*'` returned `./.env` and `./docs/livekit-ecommerce-voice-demo.plan.md` |
| Repo has no commits yet and no tracked files | `<repo-root>` git status | ✅ `git status --short --branch` returned `## No commits yet on main`, with only untracked `.env` and `docs/` |
| Local root `.env` currently contains only LiveKit URL/key/secret | `.env:1-3` | ✅ `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are present locally |
| `LIVEKIT_AGENT_NAME` is not currently present in the local root `.env` | `.env:1-3` | ✅ Missing today; Phase 1 must add it to `.env.example` and the operator-local root `.env` before runtime verification |
| LiveKit React starter is built with Next.js and Agents UI | LiveKit docs `/frontends/start/starter-apps/react` | ✅ Verified: “A full-featured React voice agent starter app built with Next.js and Agents UI” |
| Session API handles token fetch, connect, dispatch, and cleanup | LiveKit docs `/frontends/build/sessions:13-30` | ✅ Verified in session lifecycle docs |
| Session APIs accept agent name as a runtime option | LiveKit docs `/frontends/build/sessions:27-29,64-66,152-156` | ✅ Verified: create a session with options including `agentName`, then `session.start()` fetches a token, connects, and dispatches the agent |
| `AgentSessionProvider` is required for Agents UI components like `AgentChatTranscript` | LiveKit docs `/frontends/build/sessions:140-158` | ✅ Verified in “Using AgentSessionProvider” section |
| `AgentChatTranscript` renders both speech transcriptions and text messages | LiveKit docs `/frontends/agents-ui/chat` | ✅ Verified in `AgentChatTranscript` overview |
| LiveKit agent text input uses the `lk.chat` text-stream topic | LiveKit docs `/agents/multimodality/text:154-170` | ✅ Verified: frontend sends typed input with `room.localParticipant.sendText(..., { topic: 'lk.chat' })` |
| `AgentChatTranscript` integrates with LiveKit text streams automatically inside `AgentSessionProvider` | LiveKit docs `/frontends/agents-ui/chat` | ✅ Verified: same transcript surface receives realtime text streams without separate manual state |
| Agents UI components are installed through Shadcn CLI and land in `components/agents-ui` | LiveKit docs `/frontends/agents-ui` | ✅ Verified: `npx shadcn@latest init`, `registry add @agents-ui`, `add @agents-ui/{component-name}`; docs say generated files live in `components/agents-ui` |
| `AgentSessionProvider` has a documented install command and local file path | LiveKit docs `/reference/components/agents-ui/component/agent-session-provider` | ✅ Verified: install via `pnpm dlx shadcn@latest add @agents-ui/agent-session-provider`; usage example imports from `@/components/agents-ui/agent-session-provider` |
| Standard endpoint token contract is POST JSON returning HTTP 201 with `{ server_url, participant_token }` | LiveKit docs `/frontends/build/authentication/endpoint:17-43` | ✅ Verified in response format and Node example |
| Token endpoints may reject configurable fields with 4xx when a field should not be client-configurable | LiveKit docs `/frontends/build/authentication/endpoint:24-35` | ✅ Verified: docs say accept optional fields, but return a corresponding 4xx if a field should not be configurable |
| `room_config` carries Session API agent dispatch data and should go to the token builder | LiveKit docs `/frontends/build/authentication/endpoint:31-35` | ✅ Verified in agent dispatch note |
| Node agent servers expose `ServerOptions.agentName` for explicit dispatch | LiveKit docs `/agents/server/options` | ✅ Verified in Node `ServerOptions` example (`agentName: 'my-agent'`) |
| LiveKit Agents for Node.js requires Node.js >= 20 | LiveKit docs `/agents/start/voice-ai-quickstart` | ✅ Verified |
| LiveKit Node voice quickstart documents `dotenv` and a Node `main.ts` bootstrap that calls `dotenv.config(...)` | LiveKit docs `/agents/start/voice-ai-quickstart` | ✅ Verified in Node TypeScript example |
| LiveKit Node voice quickstart documents `dev`, `build`, `start`, and `download-files` scripts for the STT-LLM-TTS worker path | LiveKit docs `/agents/start/voice-ai-quickstart` | ✅ Verified: `tsx main.ts dev`, `tsc`, `node main.js start`, and `node main.js download-files` are documented |
| Local Node runtime is currently `v23.11.0` | `<repo-root>` shell | ✅ `node -v` returned `v23.11.0` |
| Next.js server components can pass serializable props to client components | Context7 `/vercel/next.js` | ✅ Verified in Server/Client Components docs |
| Next.js App Router can read `process.env.*` server-side at runtime | Context7 `/vercel/next.js` | ✅ Verified via App Router env examples |
| Only `NEXT_PUBLIC_*` variables are exposed to browser bundles in Next.js | Context7 `/vercel/next.js` | ✅ Verified in environment variable docs |
| Next.js automatically loads root-project `.env*` files into `process.env` | Context7 `/vercel/next.js` | ✅ Verified in environment variable loading docs |
| `dotenv.config({ path })` supports explicitly loading a non-default env file path | Context7 `/motdotla/dotenv` | ✅ Verified; default is `process.cwd()/.env`, so explicit `path` is the correct way to load repo-root `.env` from a subpackage |
| PM2 provides an optional named-process manager flow (`pm2 start`, `pm2 stop`, `pm2 logs`) | Context7 `/unitech/pm2` | ✅ Verified as process-manager commands; this plan still keeps direct CLI commands first-class for MVP |
| Existing code path traces | repo inspection | ✅ No app code exists yet, so there are no current function signatures/callers to trace |
| Existing test/build artifact coverage state | repo inspection | ✅ No tests or orphaned build artifacts exist yet |
| Local `.env` credentials are valid and can join rooms | — | ⚠️ ASSUMED but bounded: must be resolved by Phase 3 token smoke test and Phase 5 first-connect gate |
| Local Node 23 will install/run chosen dependency versions cleanly | — | ⚠️ ASSUMED but bounded: attempt on Node 23 first; fallback is Node 20 LTS before any architecture change |
| Browser microphone permissions will be reliable in the operator environment | — | ⚠️ ASSUMED but low-risk: typed `lk.chat` input remains the required deterministic verification path |
| `/api/token` can be exposed beyond localhost without auth | LiveKit docs `/frontends/build/authentication/endpoint:11-14` | ❌ NOT ALLOWED by this plan; docs require custom authentication for a secure/public endpoint, so MVP keeps it localhost/dev-only |
| Enum/constant completeness in repo code | — | ✅ N/A currently; no repo enums/constants exist yet |
| Schema/model field existence in repo code | — | ✅ N/A currently; all models/types are to be created from scratch |
| Framework routing constraints in repo code | — | ✅ N/A currently; no existing router/graph/state-machine edges exist |

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LiveKit credentials or project config are invalid | MEDIUM | HIGH | Verify `/api/token` immediately in Phase 3 and first room join/greeting in Phase 5 |
| Node 23 compatibility causes install/runtime issues | MEDIUM | MEDIUM | Treat Node 20 LTS as the first rollback path before changing package layout or agent language |
| Voice interaction is flaky due to mic/browser permissions | MEDIUM | MEDIUM | Ship typed `lk.chat` fallback and prompt chips for deterministic demo/testing on the same LiveKit transcript path |
| Agent hallucinates unsupported product details | MEDIUM | HIGH | Keep catalog/tool surface tiny; prompt explicitly forbids fabrication |
| Token endpoint is mistaken for a public production endpoint | LOW | HIGH | Repeat localhost/dev-only warning in plan, README, and verify docs until auth is added |
| Separate web/worker processes become confusing to operate | MEDIUM | MEDIUM | Keep runtime contract explicit with separate package commands; make direct CLI first-class and PM2 the recommended named-process option |

## Rollback / Iteration Notes
- If Node 23 causes dependency or runtime instability, standardize on **Node 20 LTS** first.
- If tool-calling adds too much friction, fallback to a **single catalog lookup utility** before adding richer tool surfaces.
- If dynamic product sidebar interaction slows delivery, keep the sidebar completely static for MVP.
- If full voice verification is unreliable in automation, keep voice for humans and use the typed `lk.chat` path as the official automated smoke path.
- If the Node worker proves untenable even on Node 20, the next fallback is a Python agent worker while preserving the same Next.js frontend and token endpoint.

## Notes
- No database.
- No Docker.
- No user auth system in MVP.
- `/api/token` is localhost/dev-only until auth exists.
- No payment or order mutation flows.
- Keep the product catalog local and deterministic.
- Prefer the smallest useful prompt and smallest useful tool surface.

## Decision Log
| Decision | Chosen | Rejected | Rationale | Evidence |
|----------|--------|----------|-----------|---------|
| Overall stack | Root Next.js app + separate `agent/` Node worker | Separate API service + worker | Next.js can host the token endpoint; only the worker needs to be a separate long-lived process | LiveKit auth/session docs + current blank repo state |
| Package model | Two-package repo without workspace | Single shared package or full workspace setup | Explicit worker isolation matters more than workspace tooling in a blank MVP repo | Analyzer requirement + Node worker build/runtime boundary |
| Agent language | Node.js | Python | Same language family as the frontend reduces setup overhead while staying on a documented LiveKit path | LiveKit quickstart documents Node agents |
| Product data source | Static JSON | Database / CMS / Shopify | MVP only needs deterministic demo data; DB would be unnecessary complexity | Repo is empty; scope excludes DB |
| Token strategy | Standard endpoint token generation with a narrowed MVP request allowlist | Sandbox token server for final MVP | User asked for a proper backend; endpoint flow keeps secrets server-side while preserving deterministic local behavior | LiveKit endpoint auth docs + this plan's MVP scope limits |
| Token endpoint exposure | Localhost/dev-only until auth exists | Public unauthenticated endpoint | LiveKit docs explicitly require auth for a secure/public endpoint | LiveKit endpoint auth docs |
| Canonical agent-name contract | Root `LIVEKIT_AGENT_NAME`, passed from server components to the client, normalized in `/api/token`, and reused in `ServerOptions.agentName` | Hardcoded frontend string or second `NEXT_PUBLIC_*` env var | Eliminates drift across frontend, token dispatch, and worker registration | LiveKit Session/auth docs + LiveKit ServerOptions docs + Next.js server/client env docs |
| UI transcript strategy | `AgentChatTranscript` fed by LiveKit text streams, including typed `lk.chat` input | Custom transcript rendering or parallel chat state | Keeps voice and typed testing on the same documented conversation path | LiveKit text/transcriptions docs + Agents UI chat docs |
| Process management | Direct CLI first-class, PM2 recommended when named processes help | PM2 mandatory prerequisite | Keeps MVP runnable with minimal tooling while still documenting the better multi-process operator flow | AI-native workflow guidance + PM2 docs |

## Handoff for Implementation
1. Implement Phase 1 first and make the separate `agent/` runtime boundary explicit before writing agent logic.
2. Do not expose `LIVEKIT_API_KEY` or `LIVEKIT_API_SECRET` to client code.
3. Treat `/api/token` as localhost/dev-only until real request auth is implemented.
4. Keep all new integration verification in `.hurl`, process-log checks, and `agent-browser` flows.
5. Keep the catalog and tools intentionally tiny until the first end-to-end flow works.
