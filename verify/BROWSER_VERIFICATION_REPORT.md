# Browser Verification Report

**Date:** 2026-03-08  
**Environment:** `/Users/Y_ALTAY1/Documents/demoVoice`  
**Status:** PASS

## Scope

This refresh closes the remaining Phase 3 approval gap for the current split-shell UI. The browser
proof now explicitly covers:

- connect
- mute
- unmute
- disconnect
- visible agent-state reactions in the right-side agent pane

The browser proof uses the current local UI on `http://localhost:3000` plus the separate LiveKit
agent worker. The microphone-specific checks were re-run with Chrome fake-media launch flags so the
live microphone path is testable under automation.

## Commands used

```bash
pm2 start npm --name demoVoice-web --cwd /Users/Y_ALTAY1/Documents/demoVoice -- run dev
pm2 start npm --name demoVoice-agent --cwd /Users/Y_ALTAY1/Documents/demoVoice/agent -- run dev

agent-browser --session-name phase4-retry-fake-media \
  --executable-path '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --args '--use-fake-ui-for-media-stream,--use-fake-device-for-media-stream,--autoplay-policy=no-user-gesture-required' \
  open http://localhost:3000
```

The full console transcript, including the exact browser and PM2 commands captured during the
verification rerun, is stored in `verify/artifacts/phase4-retry-commands.txt`.

For the canonical worker gate, including the direct-CLI path (`npm --prefix agent run dev`) and the
PM2 operator equivalents, see `verify/agent-worker-smoke.md`.

## Browser artifacts

- `verify/artifacts/phase4-retry-home.png`
- `verify/artifacts/phase4-retry-connected.png`
- `verify/artifacts/phase4-retry-muted.png`
- `verify/artifacts/phase4-retry-unmuted.png`
- `verify/artifacts/phase4-retry-after-prompt.png`
- `verify/artifacts/phase4-retry-after-response.png`
- `verify/artifacts/phase4-retry-disconnected.png`
- `verify/artifacts/phase4-retry-connected-snapshot.txt` — supporting DOM-ref/state snapshot
- `verify/artifacts/phase4-retry-muted-snapshot.txt` — supporting DOM-ref/state snapshot
- `verify/artifacts/phase4-retry-unmuted-snapshot.txt` — supporting DOM-ref/state snapshot
- `verify/artifacts/phase4-retry-after-prompt-snapshot.txt` — supporting DOM-ref/state snapshot
- `verify/artifacts/phase4-retry-after-response-snapshot.txt` — supporting DOM-ref/state snapshot
- `verify/artifacts/phase4-retry-disconnected-snapshot.txt` — supporting DOM-ref/state snapshot
- `verify/artifacts/phase4-retry-agent-log-after-connect.txt`
- `verify/artifacts/phase4-retry-agent-log-after-prompt.txt`

The legacy `browser-smoke-*` assets were also refreshed so the repository’s older proof references
no longer point at the pre-refresh layout.

## Observed behavior

1. The homepage rendered the current split shell:
   - left conversation pane with intro copy, shared transcript, prompt chips, and typed fallback
   - right agent pane with canonical agent presence, visible state text, microphone control, and
     disconnect control
   - no featured-products sidebar occupying the primary interaction area
2. After connect, the agent pane showed a live session with:
   - `Session Connected`
   - `Microphone track: published to the LiveKit session`
   - a microphone button that exposed `Mute microphone`
3. After muting, the agent pane changed to `Microphone Live microphone off` and the button label
   changed to `Turn microphone on`.
4. After unmuting, the agent pane changed back to `Microphone Live microphone on` and the button
   label returned to `Mute microphone`.
5. Sending the first prompt chip caused a visible right-pane state transition to `Agent state
   Thinking`, followed by `Agent state Speaking` once the grounded response started streaming.
6. Disconnecting produced the expected terminal UI state:
   - `Agent state Disconnected`
   - `Session outcome Ended`
   - disabled prompt/microphone controls until reconnect

## State-transition evidence

Direct textual proof for the successful agent/microphone/state flow lives in
`verify/artifacts/phase4-retry-commands.txt`. The snapshot `.txt` files below are supporting
DOM-ref/state artifacts paired with the visible browser captures; they are not the primary textual
proof.

- **Connect / live mic on:** `phase4-retry-connected.png` (browser-visible proof) +
  `phase4-retry-connected-snapshot.txt` (supporting DOM-ref/state snapshot)
- **Mute:** `phase4-retry-muted.png` (browser-visible proof) +
  `phase4-retry-muted-snapshot.txt` (supporting DOM-ref/state snapshot)
- **Unmute:** `phase4-retry-unmuted.png` (browser-visible proof) +
  `phase4-retry-unmuted-snapshot.txt` (supporting DOM-ref/state snapshot)
- **Thinking reaction:** `phase4-retry-after-prompt.png` (browser-visible proof) +
  `phase4-retry-after-prompt-snapshot.txt` (supporting DOM-ref/state snapshot)
- **Speaking reaction:** `phase4-retry-after-response.png` (browser-visible proof) +
  `phase4-retry-after-response-snapshot.txt` (supporting DOM-ref/state snapshot)
- **Disconnect:** `phase4-retry-disconnected.png` (browser-visible proof) +
  `phase4-retry-disconnected-snapshot.txt` (supporting DOM-ref/state snapshot)

## Worker grounding checks

`verify/artifacts/phase4-retry-agent-log-after-connect.txt` and
`verify/artifacts/phase4-retry-agent-log-after-prompt.txt` capture the matching worker side:

- `job:accepted`
- `greeting:start`
- `session:started`
- `conversation:user I need noise-cancelling headphones under $200.`
- `tool:search_products query="headphones" maxPrice=200 matches=1`
- `QuietCore 200 Headphones` returned as the grounded catalog match

## Conclusion

The repository now contains explicit browser-visible proof for the refreshed UI’s connect, mute,
unmute, disconnect, and agent-state reactions. The previous approval gap was documentation/evidence
only; this refresh closes it without changing the product implementation.
