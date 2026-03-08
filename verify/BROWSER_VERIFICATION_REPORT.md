# Browser Verification Report

**Date:** 2026-03-08  
**Environment:** `/Users/Y_ALTAY1/Documents/demoVoice`  
**Status:** PASS

## Scope

This refreshed report replaces the earlier stale partial-pass story. The current browser proof was
re-run against a production-style web server (`next build && next start`) on `http://localhost:3000`
with the approved typed-only fallback flow. That proof requires the separate agent worker; browser
connect/greeting claims are not reproducible from the web process alone.

## Commands used

```bash
pm2 start npm --name demoVoice-web --cwd /Users/Y_ALTAY1/Documents/demoVoice -- run start
pm2 start npm --name demoVoice-agent --cwd /Users/Y_ALTAY1/Documents/demoVoice/agent -- run start

agent-browser --session-name demoVoiceProofProd open http://localhost:3000
agent-browser --session-name demoVoiceProofProd snapshot -i
agent-browser --session-name demoVoiceProofProd uncheck @e5
agent-browser --session-name demoVoiceProofProd click @e6
agent-browser --session-name demoVoiceProofProd click @e1
agent-browser --session-name demoVoiceProofProd click @e8
```

For the canonical worker gate, including the direct CLI reproduction path
(`npm --prefix agent run dev`) and PM2-optional operator commands, see
`verify/agent-worker-smoke.md`.

## Browser artifacts

- `verify/artifacts/browser-smoke-home.png`
- `verify/artifacts/browser-smoke-connected.png`
- `verify/artifacts/browser-smoke-transcript.png`
- `verify/artifacts/browser-smoke-transcript.txt`
- `verify/artifacts/production-room-names.txt`

## Observed behavior

1. The homepage rendered with the canonical agent card and the expected session controls.
2. A production `next start` run produced a fresh room name on each page request:

   ```text
   demoVoice-room-b1c3c54f-dda3-4c8e-9b51-13c486bf06d2
   demoVoice-room-ad1e5cf0-2ea5-4a31-8b49-8d80efc86e55
   ```

3. After connecting typed-only, the greeting appeared in the transcript and the typed controls became enabled.
4. Clicking the first prompt chip sent the approved `lk.chat` fallback message and produced a grounded reply.

## Transcript excerpt

From `verify/artifacts/browser-smoke-transcript.txt`:

```text
Agent
4:49:15 PM
Hello! I'm your local shopping assistant. I can help you discover products, compare features, and answer specific questions about shipping, returns, or warranties based on our catalog. How can I help you find what you're looking for today?

Demo shopper
4:49:28 PM
I need noise-cancelling headphones under $200.

Agent
4:49:32 PM
I couldn't find any noise-cancelling headphones under $200 in our current catalog.
```

## Conclusion

The production browser path is currently working for the approvable MVP flow:

- homepage room generation is request-time dynamic under `next start`
- the session connects successfully from the production web app
- the greeting transcript appears
- the typed `lk.chat` fallback remains functional
- the refreshed proof artifacts match the current implementation
