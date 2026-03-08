# LiveKit Ecommerce Voice Demo

Minimal MVP for a local ecommerce voice assistant built with a root Next.js app and a separate `agent/` LiveKit worker.

## Requirements

- Node.js `>=20` (`23.x` can be attempted locally; fall back to Node 20 LTS if compatibility issues appear)
- npm
- `agent-browser`
- `hurl` for the planned token-endpoint verification flow
- Optional: `pm2` for named-process management

## Project layout

- Root package: Next.js web app
- `agent/`: standalone LiveKit worker package
- `data/products.json`: shared static catalog source
- `verify/`: operator verification artifacts

## Environment

- Keep the existing repo-root `.env` local-only and uncommitted.
- `.env.example` contains placeholders only.
- The repo-root `.env` is the only local credential source for MVP.
- `LIVEKIT_AGENT_NAME` is the canonical agent dispatch name shared by the web app, `/api/token`, and the worker.
- `VOICE_PIPELINE_MODE` controls the worker rollout path and defaults to `chained`.
- `OPENAI_API_KEY` is required only when `VOICE_PIPELINE_MODE=realtime`.
- Do **not** create `agent/.env`, `agent/.env.local`, or `NEXT_PUBLIC_LIVEKIT_AGENT_NAME`.

## Install

```bash
npm install
npm --prefix agent install
```

## Web app commands

```bash
npm run dev
npm run build
npm run start   # run only after npm run build
```

## Worker commands

```bash
npm --prefix agent run dev
npm --prefix agent run build
npm --prefix agent run start
npm --prefix agent run download-files
npm --prefix agent test
```

The worker explicitly loads the repo-root `.env` from `agent/main.ts`.

### Worker pipeline modes

- `VOICE_PIPELINE_MODE=chained` keeps the current Deepgram + Gemini + Cartesia flow and remains the rollback path.
- `VOICE_PIPELINE_MODE=realtime` switches the worker to `@livekit/agents-plugin-openai` with `openai.realtime.RealtimeModel`.
- The realtime rollout uses `voice: 'marin'` with documented `server_vad` settings.
- Realtime mode fails fast during bootstrap if `OPENAI_API_KEY` is missing.

## Optional PM2 flow

Direct CLI commands remain first-class. PM2 is recommended only if named process management helps:

```bash
pm2 start npm --name demoVoice-web -- run dev
pm2 start npm --name demoVoice-agent --cwd ./agent -- run dev
pm2 logs demoVoice-web --lines 50 --nostream
pm2 logs demoVoice-agent --lines 50 --nostream
pm2 delete demoVoice-web
pm2 delete demoVoice-agent
```

## MVP boundaries

- In scope: local voice demo, static catalog, transcript UI, typed fallback, grounded shipping/return/warranty guidance, local token endpoint
- Out of scope: DB, auth system, payments, carts, order mutation flows, analytics, Dockerized infra, public deployment hardening

## `/api/token` policy

- `POST /api/token` is localhost/dev-only in this MVP and is **not** production-safe.
- Loopback-only hosts are restricted to `localhost`, `127.0.0.1`, and IPv6 loopback (`::1` / `[::1]`).
- Accepted:
  - `room_name` (optional; defaults to `demoVoice-room`)
  - `participant_name` (optional display-name hint)
- Ignored/normalized:
  - `participant_identity` is always generated server-side
  - `room_config.agents[0].agent_name` is normalized to `LIVEKIT_AGENT_NAME`
- Passed through when provided:
  - `room_config.agents[0].metadata`
- Rejected with 4xx:
  - `participant_metadata`
  - `participant_attributes`
  - unsupported `room_config` keys

## Startup

1. Install dependencies:

   ```bash
   npm install
   npm --prefix agent install
   ```

2. Build the worker and install/download the dependencies required for your selected mode:

   ```bash
    npm --prefix agent run build
    npm --prefix agent run download-files
    ```

   `download-files` remains required for chained mode and rollback readiness because the Silero-backed path is still preserved.

3. Start both processes with direct CLI commands:

     ```bash
     npm run dev
     npm --prefix agent run dev
     ```

   To activate realtime mode, add `VOICE_PIPELINE_MODE=realtime` and provide `OPENAI_API_KEY` in the repo-root `.env` before starting the worker.

    For a production-style local check, build the web app first and then use `npm run start`:

    ```bash
    npm run build
    npm run start
    ```

## Verification

- App build:

  ```bash
  npm run build
  ```

- Catalog unit test:

  ```bash
  npm test
  ```

- Token endpoint:

  ```bash
  HURL_VARIABLE_canonical_agent="$LIVEKIT_AGENT_NAME" hurl --test verify/token-endpoint.hurl
  curl -sSf -H 'Content-Type: application/json' -d '{}' http://localhost:3000/api/token
  ```

- Worker smoke:

  ```bash
  npm --prefix agent run build
  VOICE_PIPELINE_MODE=chained npm --prefix agent run dev
  VOICE_PIPELINE_MODE=realtime OPENAI_API_KEY=placeholder npm --prefix agent run dev
  ```

  Confirm the logs include:
  - `[worker] readiness:bootstrap-complete`
  - `[worker] bootstrap:pipeline_mode ...`
  - `[worker] catalog:loaded count=...`
  - `[worker] session:started`
  - `[worker] greeting:start ...`

  Realtime runtime parity beyond placeholder bootstrap remains blocked until a real `OPENAI_API_KEY` is available.

- Browser smoke:

  See `verify/browser-smoke.md`. The typed fallback must use LiveKit text streams on topic `lk.chat`.
  The homepage is explicitly request-time dynamic (`export const dynamic = 'force-dynamic'`), so `next build && next start` generates a fresh `demoVoice-room-<uuid>` on every page request. Generic callers that omit `room_name` still receive the deterministic `demoVoice-room` default from `/api/token`.

## Teardown

## Rollback

- Set `VOICE_PIPELINE_MODE=chained` in the repo-root `.env`.
- Restart the worker.
- Keep `@livekit/agents-plugin-silero` installed and keep using `npm --prefix agent run download-files` so chained mode remains runnable on a fresh environment.

Direct CLI:

```bash
# Stop the running terminal processes with Ctrl+C
```

Optional PM2:

```bash
pm2 delete demoVoice-web
pm2 delete demoVoice-agent
```
