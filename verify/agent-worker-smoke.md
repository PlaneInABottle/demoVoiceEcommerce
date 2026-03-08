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

5. Confirm the logs contain:
   - `[worker] bootstrap:catalog ...`
   - `[worker] bootstrap:catalog_count ...`
   - `[worker] readiness:bootstrap-complete`
   - `[worker] prewarm:ready`

6. Connect from the web app and confirm the worker logs show:
   - `job:accepted`
   - `session:started`
   - an initial greeting after the participant joins

This smoke path is the baseline CLI flow. PM2 remains optional.
