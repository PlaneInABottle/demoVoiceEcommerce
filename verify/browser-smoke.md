# Browser smoke verification

1. Start the current local runtime before any browser claims:

   ```bash
    npm run dev
    VOICE_PIPELINE_MODE=realtime OPENAI_API_KEY=<real-key> npm --prefix agent run dev
    ```

   Rollback verification should repeat the same flow with `VOICE_PIPELINE_MODE=chained npm --prefix agent run dev` after running `npm --prefix agent run download-files`.

   Browser proof for connect, greeting, mute/unmute, typed chat, and disconnect is only valid
   when the separate agent worker is running alongside the web app.

2. Launch `agent-browser` with Chrome fake-media flags so the live microphone path is testable in
   automation:

   ```bash
   agent-browser --session-name phase4-retry \
     --executable-path '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
     --args '--use-fake-ui-for-media-stream,--use-fake-device-for-media-stream,--autoplay-policy=no-user-gesture-required' \
     open http://localhost:3000
   agent-browser --session-name phase4-retry snapshot -i
   ```

3. Confirm the refreshed split shell before connecting:
   - the left conversation pane contains the intro copy, shared transcript, prompt chips, and typed
     `lk.chat` composer
   - the right agent pane contains the canonical agent card, visible agent-state text, microphone
     controls, and disconnect control
   - the primary interaction area does **not** show the old featured-products sidebar
   - capture `verify/artifacts/phase4-retry-home.png`

4. Connect with the microphone enabled, then re-snapshot after the greeting lands:
   - confirm the session shows `Connected`
   - confirm the agent pane reports a live state such as `Listening` or `Speaking`
   - confirm `Microphone track: published to the LiveKit session`
   - capture `verify/artifacts/phase4-retry-connected.png`
   - supporting refs/state text are in `verify/artifacts/phase4-retry-connected-snapshot.txt`

5. Verify microphone mute:
   - click the microphone control while connected
   - re-run `agent-browser ... snapshot -i`
   - confirm the agent pane changes to `Microphone Live microphone off`
   - confirm the button label flips to `Turn microphone on`
   - capture `verify/artifacts/phase4-retry-muted.png`
   - supporting refs are in `verify/artifacts/phase4-retry-muted-snapshot.txt`

6. Verify microphone unmute:
   - click the microphone control again
   - re-run `agent-browser ... snapshot -i`
   - confirm the agent pane changes back to `Microphone Live microphone on`
   - confirm the button label returns to `Mute microphone`
   - capture `verify/artifacts/phase4-retry-unmuted.png`
   - supporting refs are in `verify/artifacts/phase4-retry-unmuted-snapshot.txt`

7. Verify visible agent-state reactions during a typed prompt:
   - click the first prompt chip (`I need noise-cancelling headphones under $200.`)
   - re-snapshot while the answer is in flight
   - confirm the right pane shows `Agent state Thinking`
   - capture `verify/artifacts/phase4-retry-after-prompt.png`
   - after the reply starts streaming, confirm the right pane shows `Agent state Speaking`
   - capture `verify/artifacts/phase4-retry-after-response.png`

8. Verify disconnect:
   - click `Disconnect`
   - re-run `agent-browser ... snapshot -i`
   - confirm the right pane shows `Agent state Disconnected`
   - confirm `Session outcome Ended`
   - capture `verify/artifacts/phase4-retry-disconnected.png`
   - supporting refs are in `verify/artifacts/phase4-retry-disconnected-snapshot.txt`

9. Cross-check worker/runtime evidence for the same session:
   - `verify/artifacts/phase4-retry-agent-log-after-connect.txt`
   - `verify/artifacts/phase4-retry-agent-log-after-prompt.txt`
   - `verify/artifacts/phase4-retry-commands.txt`

10. Refreshed compatibility artifacts for the repository packet:
    - `verify/artifacts/browser-smoke-home.png`
    - `verify/artifacts/browser-smoke-connected.png`
    - `verify/artifacts/browser-smoke-transcript.png`
    - `verify/artifacts/browser-smoke-transcript.txt`
