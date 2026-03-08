# Agent worker smoke verification

This is the canonical worker gate for this verification packet.

If a reproduction path claims browser connect, greeting, or typed-response proof, it must start the
worker explicitly before opening the browser. Direct CLI is first-class. PM2 is optional.

1. Start the web app.

    ```bash
    npm run dev
    ```

   PM2 equivalent:

    ```bash
    pm2 start npm --name demoVoice-web -- run dev
    ```

2. Start the worker independently in the target mode.

   Chained rollback mode:

    ```bash
    VOICE_PIPELINE_MODE=chained npm --prefix agent run dev
    ```

   Realtime mode:

    ```bash
    VOICE_PIPELINE_MODE=realtime OPENAI_API_KEY=<real-key> npm --prefix agent run dev
    ```

   Realtime bootstrap-only contract check when no real key is available yet:

    ```bash
    VOICE_PIPELINE_MODE=realtime OPENAI_API_KEY=placeholder npm --prefix agent run dev
    ```

   PM2 equivalent:

    ```bash
    pm2 start npm --name demoVoice-agent --cwd ./agent -- run dev
    ```

   Production-style artifact reruns can swap both `run dev` commands for `run start` after:

    ```bash
    npm run build
    npm --prefix agent run build
    ```

   The browser artifacts committed in this packet were captured from that production-style pair.

3. Confirm worker readiness from the explicit planned logs emitted by this repo:
   - `[worker] bootstrap:env ...`
   - `[worker] bootstrap:catalog ...`
   - `[worker] bootstrap:catalog_count ...`
   - `[worker] bootstrap:agent_name ...`
   - `[worker] bootstrap:pipeline_mode ...`
   - `[worker] readiness:bootstrap-complete`
   - chained mode: `[worker] prewarm:ready`
   - realtime mode: `[worker] prewarm:skipped pipeline_mode=realtime`

4. Open `http://localhost:3000` and connect using the session panel from the web app.

5. Verify the first-connect greeting behavior before proceeding:
   - the first connect succeeds
    - the worker logs show `job:accepted`
    - the worker logs show `session:pipeline_mode=...` or `session:pipeline_mode ...`
    - the worker logs show `session:started`
    - the worker logs show `greeting:start`
   - the greeting appears in the shared transcript UI before any typed prompt is sent
   - the browser audio status is either already ready or is explicitly unlocked with the speaker-audio CTA
   - a human local run confirms the greeting is actually audible in browser speakers/headphones before continuing

6. If typed fallback is needed for deterministic verification after the greeting:
   - use the prompt chips or the typed input labeled `Typed fallback (lk.chat)`
   - capture the exact typed prompt that was used
   - confirm the shopper message appears in the transcript
   - confirm the worker logs show a transcript or speech event from the same verification cycle
   - confirm the typed-response reply is audibly heard in the browser after audio unlock; transcript-only proof is insufficient

7. Record the required evidence items in your notes or verification report:
    - command used to start the worker
    - selected `VOICE_PIPELINE_MODE`
    - proof that the worker loaded env from the repo-root `.env` contract (the `bootstrap:env` log, never secret values)
   - resolved absolute catalog path from `bootstrap:catalog`
   - catalog count from `bootstrap:catalog_count`
   - canonical agent name from `bootstrap:agent_name`
   - readiness log marker observed
    - proof that the first connect succeeded
    - proof that the greeting surfaced in the UI/transcript path
    - proof that browser speaker playback was actually audible locally
    - any typed fallback prompt used for deterministic verification
    - for realtime mode, proof that no secret value was printed while still showing the realtime env path was active

8. Rollback check:
   - run `npm --prefix agent run download-files`
   - restart with `VOICE_PIPELINE_MODE=chained`
   - confirm the chained readiness logs still appear

9. Clean up the runtime after verification:

    ```bash
    pm2 delete demoVoice-web
    pm2 delete demoVoice-agent
    ```

   If you used direct CLI instead of PM2, stop both foreground processes with `Ctrl+C`.

Direct CLI remains first-class. PM2 is optional, but operator-facing runtime names must stay on the approved `demoVoice-*` convention.
