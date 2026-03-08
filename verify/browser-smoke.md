# Browser smoke verification

1. Start the web app with direct CLI commands for local verification:

   ```bash
   npm run dev
   npm --prefix agent run dev
   ```

2. Open the app and inspect the initial interactive DOM:

   ```bash
   agent-browser open http://localhost:3000
   agent-browser snapshot -i
   ```

3. Confirm the page shows:
   - the canonical agent card
   - the session controls panel
   - the featured products sidebar with grounded shipping and returns/warranty details

4. Capture a baseline screenshot:

   ```bash
   mkdir -p verify/artifacts
   agent-browser screenshot verify/artifacts/browser-smoke-home.png
   ```

5. Use the current snapshot refs to either:
   - keep **Enable microphone when connecting** checked and connect for the live voice-capable path, or
   - uncheck it first for deterministic typed-only verification.

   Always re-run `agent-browser snapshot -i` after any DOM change before clicking the next control.

6. After connecting:
   - wait for the UI to settle
   - run `agent-browser snapshot -i` again
   - confirm the typed prompt chips or text box become enabled only after the greeting transcript arrives
   - confirm the microphone status text changes and the microphone toggle button is visible
   - capture a second screenshot, for example `verify/artifacts/browser-smoke-connected.png`

7. Send a typed prompt through the `lk.chat` path using a prompt chip or the text box, then:
   - wait for the transcript to update
   - re-run `agent-browser snapshot -i`
   - confirm the shopper message appears in the shared transcript
   - save a transcript proof screenshot such as `verify/artifacts/browser-smoke-transcript.png`

8. Cross-check the worker logs while the browser session is connected. Capture evidence for:
   - `job:accepted`
   - `session:started`
   - `greeting:start`
   - a typed `lk.chat` transcript event

9. If automation loses the session before the greeting completes, repeat the same flow in a persistent or headed session:

   ```bash
   agent-browser --session-name demo-voice --headed open http://localhost:3000
   agent-browser --session-name demo-voice snapshot -i
   ```

   Re-snapshot after every navigation, permission prompt, or transcript update.
