# Agent worker smoke verification

1. Ensure the repo-root `.env` contains `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_AGENT_NAME`.
2. Build worker assets:

   ```bash
   npm --prefix agent run build
   ```

3. Download model files:

   ```bash
   npm --prefix agent run download-files
   ```

4. Start the worker in dev mode:

   ```bash
   npm --prefix agent run dev
   ```

5. Confirm the bootstrap logs contain:
   - `[worker] bootstrap:env ...`
   - `[worker] bootstrap:catalog ...` (save the resolved absolute catalog path)
   - `[worker] bootstrap:catalog_count ...` (save the product count)
   - `[worker] bootstrap:agent_name ...`
   - `[worker] readiness:bootstrap-complete`
   - `[worker] prewarm:ready`

6. Connect from the web app and confirm the worker logs show:
   - `job:accepted`
   - `session:started`
   - an initial greeting after the participant joins
   - at least one transcript or speech event after a typed `lk.chat` message is sent from the browser flow

7. Record the evidence in your notes:
   - resolved `.env` path from `bootstrap:env`
   - resolved catalog path from `bootstrap:catalog`
   - catalog count from `bootstrap:catalog_count`
   - canonical agent name from `bootstrap:agent_name`

This smoke path is the baseline CLI flow. PM2 remains optional; direct CLI remains first-class.
