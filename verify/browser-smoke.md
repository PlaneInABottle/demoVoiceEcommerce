# Browser smoke verification

1. Start the web app:

   ```bash
   npm run start
   ```

2. Start the worker:

   ```bash
   npm --prefix agent run dev
   ```

3. Open the app and confirm the UI renders:

   ```bash
   agent-browser open http://localhost:3000
   agent-browser snapshot -s body
   ```

4. Connect the session from the UI and wait for the worker greeting.
5. Use one of the typed prompt chips or the text box. The typed fallback must travel through LiveKit text streams on topic `lk.chat`.
6. Confirm:
   - the transcript panel renders the typed prompt in the shared conversation history
   - the worker logs show `job:accepted`, `session:started`, and the greeting log
   - the featured products sidebar is visible before and during the conversation

If browser automation drops the session before the greeting completes, repeat the same flow in a persistent or headed `agent-browser` session so the connection remains open long enough to capture the transcript.
