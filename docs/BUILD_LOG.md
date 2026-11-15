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
- **Real on-chain runs (submitted by the user with QoreX, read back from Diana REST):**
  - `2A65CCDD709784B2A7B75E3CF8E14C13D1E4F270277489BB16378A46C488DD48`: block 10,153,126, memo `mg1:10153067:RARARAARARARARARA:1300`, code 0, 4,627 B ML-DSA-87 signature, `pqc_hybrid_verify = verified`, fee 45,000 uqor, 167,420 gas used. It appears on the leaderboard with the replay check passing.
  - `A44D2B462BE9B3C887D4C3D35B2271201587AB5805909EA2902FC795595FD0BE`: block 10,152,719, memo `mg1:10152634:AAARAAAAAA:550`, code 0, 4,627 B signature, `verified`.
- **Deployment:** added a root `vercel.json` (it builds `quest/` and outputs `quest/dist`, with the `/lcd` proxy rewrite).
- **Live deployment verified:** https://mempool-guard.vercel.app/ returns HTTP 200 from Vercel.
  - The `/lcd` proxy returns 200, and the top bar shows the live `qorechain-diana` block height.
  - The live hybrid feed loads 7 real transactions.
  - The leaderboard shows the 1,300-point run with its replay check passing.
  - A shift starts from a live seed block, and the play screen fits a 1440×900 viewport.
  - No console errors (checked with headless Edge + Playwright).
