# Runtime Verification Index

## Start here

1. [VERIFICATION_RESULT.md](./VERIFICATION_RESULT.md) — concise approval summary
2. [verify/RUNTIME_VERIFICATION_SUMMARY.txt](./verify/RUNTIME_VERIFICATION_SUMMARY.txt) — detailed runtime proof
3. [verify/BROWSER_VERIFICATION_REPORT.md](./verify/BROWSER_VERIFICATION_REPORT.md) — browser-focused walkthrough

## Primary artifacts

- `verify/artifacts/production-room-names.txt` — proves the homepage generates a fresh room name per production request
- `verify/artifacts/agent-worker-cycle.log` — clean worker-cycle excerpt from the successful typed-only proof
- `verify/artifacts/browser-smoke-home.png` — homepage before connect
- `verify/artifacts/browser-smoke-connected.png` — connected state after greeting
- `verify/artifacts/browser-smoke-transcript.png` — transcript after typed fallback turn
- `verify/artifacts/browser-smoke-transcript.txt` — text transcript excerpt

## Verification status

| Component | Status | Notes |
|-----------|--------|-------|
| `npm test` | ✅ PASS | 13 tests passing |
| `npm run build` | ✅ PASS | Next.js build marks `/` as dynamic |
| `npm --prefix agent run build` | ✅ PASS | Node worker build passes |
| Production room-name proof | ✅ PASS | two `next start` requests produced distinct room IDs |
| Browser connect + greeting | ✅ PASS | greeting visible in transcript |
| Typed `lk.chat` fallback | ✅ PASS | typed shopper message and grounded reply both captured |
| Worker proof log | ✅ PASS | refreshed clean excerpt ends with normal session close |

## Coherent current story

- The homepage is intentionally dynamic in production so room IDs are not frozen at build time.
- The app stack under verification is **Next.js web + Node/TypeScript LiveKit worker**.
- The approved typed-only verification path succeeds under the refreshed evidence set.
- The earlier top-level “blocked by latency” story is obsolete and has been removed from this packet.

## Reproduction sketch

```bash
npm test
npm run build
npm --prefix agent run build

pm2 start npm --name demoVoice-web --cwd /Users/Y_ALTAY1/Documents/demoVoice -- run start
curl http://localhost:3000
curl http://localhost:3000

agent-browser --session-name demoVoiceProofProd open http://localhost:3000
agent-browser --session-name demoVoiceProofProd snapshot -i
```
