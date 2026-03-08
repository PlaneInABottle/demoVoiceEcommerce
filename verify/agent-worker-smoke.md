# Agent worker smoke verification

This document mirrors the approved standalone worker gate step-for-step.

1. Start the web app with the minimal session/connect shell already added in earlier phases.

   ```bash
   npm run dev
   ```

   PM2 equivalent:

   ```bash
   pm2 start npm --name demoVoice-web -- run dev
   ```

2. Start the worker independently.

   ```bash
   npm --prefix agent run dev
   ```

   PM2 equivalent:

   ```bash
   pm2 start npm --name demoVoice-agent --cwd ./agent -- run dev
   ```

3. Confirm worker readiness from the explicit planned logs emitted by this repo:
   - `[worker] bootstrap:env ...`
   - `[worker] bootstrap:catalog ...`
   - `[worker] bootstrap:catalog_count ...`
   - `[worker] bootstrap:agent_name ...`
   - `[worker] readiness:bootstrap-complete`
   - `[worker] prewarm:ready`

4. Open `http://localhost:3000` and connect using the session panel from the web app.

5. Verify the first-connect greeting behavior before proceeding:
   - the first connect succeeds
   - the worker logs show `job:accepted`
   - the worker logs show `session:started`
   - the worker logs show `greeting:start`
   - the greeting is heard or appears in the shared transcript UI before any typed prompt is sent

6. If typed fallback is needed for deterministic verification after the greeting:
   - use the prompt chips or the typed input labeled `Typed fallback (lk.chat)`
   - capture the exact typed prompt that was used
   - confirm the shopper message appears in the transcript
   - confirm the worker logs show a transcript or speech event from the same verification cycle

7. Record the required evidence items in your notes or verification report:
   - command used to start the worker
   - proof that the worker loaded env from the repo-root `.env` contract (the `bootstrap:env` log, never secret values)
   - resolved absolute catalog path from `bootstrap:catalog`
   - catalog count from `bootstrap:catalog_count`
   - canonical agent name from `bootstrap:agent_name`
   - readiness log marker observed
   - proof that the first connect succeeded
   - proof that the greeting was heard or surfaced in the UI/transcript path
   - any typed fallback prompt used for deterministic verification

8. Clean up the runtime after verification:

   ```bash
   pm2 delete demoVoice-web
   pm2 delete demoVoice-agent
   ```

Direct CLI remains first-class. PM2 is optional, but operator-facing runtime names must stay on the approved `demoVoice-*` convention.
