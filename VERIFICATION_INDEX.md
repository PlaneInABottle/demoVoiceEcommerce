# Runtime Verification Index

## Start here

1. [VERIFICATION_RESULT.md](./VERIFICATION_RESULT.md) — concise approval summary
2. [verify/BROWSER_VERIFICATION_REPORT.md](./verify/BROWSER_VERIFICATION_REPORT.md) — Phase 4
   browser/state-transition proof
3. [verify/browser-smoke.md](./verify/browser-smoke.md) — reproducible smoke checklist for the
   refreshed UI
4. [verify/agent-worker-smoke.md](./verify/agent-worker-smoke.md) — canonical worker gate for any
   browser connect/greeting rerun
5. [verify/RUNTIME_VERIFICATION_SUMMARY.txt](./verify/RUNTIME_VERIFICATION_SUMMARY.txt) —
   supporting runtime/build packet

## Primary Phase 4 artifacts

- `verify/artifacts/phase4-retry-commands.txt` — exact command transcript from the successful retry
- `verify/artifacts/phase4-retry-home.png` — split-shell homepage before connect
- `verify/artifacts/phase4-retry-connected.png` — connected state with live mic published
- `verify/artifacts/phase4-retry-muted.png` — mute proof (`Live microphone off`)
- `verify/artifacts/phase4-retry-unmuted.png` — unmute proof (`Live microphone on`)
- `verify/artifacts/phase4-retry-after-prompt.png` — right pane showing `Agent state Thinking`
- `verify/artifacts/phase4-retry-after-response.png` — response-in-flight proof with `Agent state Speaking`
- `verify/artifacts/phase4-retry-disconnected.png` — disconnected terminal state
- `verify/artifacts/phase4-retry-connected-snapshot.txt` — connect refs/state text
- `verify/artifacts/phase4-retry-muted-snapshot.txt` — mute refs/state text
- `verify/artifacts/phase4-retry-unmuted-snapshot.txt` — unmute refs/state text
- `verify/artifacts/phase4-retry-after-prompt-snapshot.txt` — thinking-state refs/state text
- `verify/artifacts/phase4-retry-after-response-snapshot.txt` — speaking-state refs/state text
- `verify/artifacts/phase4-retry-disconnected-snapshot.txt` — disconnect refs/state text
- `verify/artifacts/phase4-retry-agent-log-after-connect.txt` — worker-side connect/greeting proof
- `verify/artifacts/phase4-retry-agent-log-after-prompt.txt` — worker-side typed prompt + grounding proof

## Refreshed compatibility artifacts

- `verify/artifacts/browser-smoke-home.png`
- `verify/artifacts/browser-smoke-connected.png`
- `verify/artifacts/browser-smoke-transcript.png`
- `verify/artifacts/browser-smoke-transcript.txt`

These were refreshed to remove stale pre-refresh layout evidence from the top-level repository
packet.

## Verification status

| Component | Status | Notes |
|-----------|--------|-------|
| `npm test` | ✅ PASS | existing repository test suite remains green |
| `npm run build` | ✅ PASS | existing production build proof remains in the packet |
| `npm --prefix agent run build` | ✅ PASS | worker build proof remains in the packet |
| Browser connect | ✅ PASS | connected UI shows live session + published microphone track |
| Browser mute | ✅ PASS | right pane switches to `Live microphone off` |
| Browser unmute | ✅ PASS | right pane returns to `Live microphone on` |
| Agent visible-state reaction | ✅ PASS | `Thinking`, `Speaking`, and `Disconnected` captured in the agent pane |
| Browser disconnect | ✅ PASS | `Session outcome Ended` captured after disconnect |
| Worker/browser cross-check | ✅ PASS | worker logs match connect, greeting, prompt, and grounded search behavior |

## Reproduction sketch

```bash
npm run dev
npm --prefix agent run dev

agent-browser --session-name phase4-retry \
  --executable-path '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --args '--use-fake-ui-for-media-stream,--use-fake-device-for-media-stream,--autoplay-policy=no-user-gesture-required' \
  open http://localhost:3000
agent-browser --session-name phase4-retry snapshot -i
```

Any browser proof that claims connect, greeting, mute/unmute, typed-response, or disconnect
behavior still requires the separate worker process in addition to the web app. For the canonical
worker gate, use [`verify/agent-worker-smoke.md`](./verify/agent-worker-smoke.md).
