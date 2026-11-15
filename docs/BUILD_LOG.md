# Build log

Only observed work and test results are recorded here.

## 2026-11-16: Mempool Guard built in `quest/`
- **Scaffold:** `create-qorechain-dapp@0.14.0 --template fullstack-web --network testnet` (pnpm), with `@qorechain/sdk` 0.14.0.
- **Build:** `pnpm build` (tsc + vite) passes. The main bundle is about 60 KB gzipped, with the SDK split out and loaded when the player connects a wallet.
- **Engine tests (15/15 pass):**
  - The deck is deterministic for a given seed.
  - Every legit card passes all rules.
  - Replay scoring equals live scoring.
  - Post-game, unfinished and malformed move strings are rejected.
  - The run memo is 59 bytes or less (the limit is 256).
- **Live Diana tests (through the dev proxy) pass:**
  - Latest and historic blocks are readable. The lowest retained height observed was 8,790,799.
  - 5/5 live hybrid transactions pass the hybrid checks.
  - An unknown hash returns "pending", not "verified".
  - A non-game `MsgSend` is rejected as a run.
  - The leaderboard query works (0 entries).
- **Run verification on a real seed block:**
  - An honest run verifies.
  - An inflated score, a different seed block and a signer mismatch are all rejected.
- **Encoder:** the `MsgSend` encoder is byte-identical to `cosmjs-types` 0.11.0.
- **Browser (headless Edge + Playwright):**
  - A full playthrough has no console errors.
  - A mocked QoreX returning an unrelated real transaction hash fails closed.
  - The play screen fits without scrolling at 1900×870, 1366×650 and 390×740.
- **Fixes during testing:**
  - The feedback step showed the next card instead of the judged one.
  - A `useEffect` returned the Promise from `window.scrollTo`, which crashed the app and left a black screen. Fixed, and an error boundary was added.
- **Not yet done:** a real QoreX approval and Diana transaction (needs the user's wallet), and a public deployment.
