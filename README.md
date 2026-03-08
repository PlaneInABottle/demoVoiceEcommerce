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
```

The worker explicitly loads the repo-root `.env` from `agent/main.ts`.

## Optional PM2 flow

Direct CLI commands remain first-class. PM2 is recommended only if named process management helps:

```bash
pm2 start npm --name demo-voice-web -- run dev
pm2 start npm --name demo-voice-agent --cwd ./agent -- run dev
pm2 logs demo-voice-web --lines 50 --nostream
pm2 logs demo-voice-agent --lines 50 --nostream
pm2 delete demo-voice-web
pm2 delete demo-voice-agent
```

## MVP boundaries

- In scope: local voice demo, static catalog, transcript UI, typed fallback, grounded shipping/return/warranty guidance, local token endpoint
- Out of scope: DB, auth system, payments, carts, order mutation flows, analytics, Dockerized infra, public deployment hardening

## `/api/token` policy

- `POST /api/token` is localhost/dev-only in this MVP and is **not** production-safe.
- Accepted:
  - `room_name` (optional; defaults to `demoVoice-room`)
  - `participant_name` (optional display-name hint)
- Ignored/normalized:
  - `participant_identity` is always generated server-side
  - `room_config.agents[0].agent_name` is normalized to `LIVEKIT_AGENT_NAME`
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

2. Build the worker and download model files:

   ```bash
   npm --prefix agent run build
   npm --prefix agent run download-files
   ```

3. Start both processes with direct CLI commands:

    ```bash
    npm run dev
    npm --prefix agent run dev
    ```

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
  npm --prefix agent run dev
  ```

  Confirm the logs include:
  - `[worker] readiness:bootstrap-complete`
  - `[worker] catalog:loaded count=...`
  - `[worker] session:started`
  - `[worker] greeting:start ...`

- Browser smoke:

  See `verify/browser-smoke.md`. The typed fallback must use LiveKit text streams on topic `lk.chat`.

## Teardown

Direct CLI:

```bash
# Stop the running terminal processes with Ctrl+C
```

Optional PM2:

```bash
pm2 delete demo-voice-web
pm2 delete demo-voice-agent
```
