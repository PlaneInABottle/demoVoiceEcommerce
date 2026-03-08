# Browser Verification Report

**Date:** 2026-03-08  
**Environment:** `/Users/Y_ALTAY1/Documents/demoVoice`  
**Status:** PASS

## Verification cycle

This report replaces the earlier overstated partial-pass report. The evidence below comes from one successful runtime cycle with:

- web app running at `http://localhost:3000`
- worker running directly with `npm --prefix agent run dev`
- browser automation through `agent-browser --session-name demoVoiceProof3`

## Commands used

```bash
pm2 start npm --name demoVoice-web -- run dev
npm --prefix agent run dev

agent-browser --session-name demoVoiceProof3 open http://localhost:3000
agent-browser --session-name demoVoiceProof3 snapshot -i
agent-browser --session-name demoVoiceProof3 uncheck @e5
agent-browser --session-name demoVoiceProof3 click @e6
agent-browser --session-name demoVoiceProof3 click @e1
```

## Browser evidence captured

Artifacts:

- `verify/artifacts/browser-smoke-home.png`
- `verify/artifacts/browser-smoke-connected.png`
- `verify/artifacts/browser-smoke-transcript.png`
- `verify/artifacts/browser-smoke-transcript.txt`

Observed in the successful cycle:

1. The page loaded with the canonical agent card and the expected controls.
2. After connecting typed-only, the first greeting appeared in the shared transcript.
3. The typed prompt chips became enabled only after that greeting arrived.
4. The typed fallback prompt used was:

   ```text
   I need noise-cancelling headphones under $200.
   ```

5. The transcript then showed all of the following in the same cycle:
   - the first agent greeting
   - the shopper typed `lk.chat` message
   - a follow-up agent reply

Excerpt from `verify/artifacts/browser-smoke-transcript.txt`:

```text
Agent
4:29:33 PM
Hello! I'm your local shopping assistant. I can help you discover products, compare

Demo shopper
4:29:38 PM
I need noise-cancelling headphones under $200.

Agent
4:29:42 PM
I'd be happy to
```

The same DOM snapshot also showed that the chips and Send control were enabled after the greeting:

```text
"chips":[false,false,false]
```

## Conclusion

The runtime browser path is working end-to-end for the approved typed fallback flow:

- greeting transcript appears
- typed controls enable after the greeting
- one typed `lk.chat` prompt is accepted
- the typed prompt and agent response both appear in the shared transcript
