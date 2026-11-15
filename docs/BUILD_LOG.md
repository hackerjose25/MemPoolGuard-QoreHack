# Build log

## 2026-11-16 — Cleared prior app for concept handoff
- Changed: removed tracked ProofStamp and Quantum Queue application source/configuration; replaced stale product and technical docs with the Quantum Quest concept. Added `CLAUDE_HANDOFF.md` as the intended portable brief.
- Evidence/status: documentation-only handoff prepared. No app build, contract deployment, QoreX approval, or Diana testnet transaction was performed for Quantum Quest.
- Decisions or risks: the repo history still contains earlier app commits, but the current working tree has no tracked application implementation. The live meaning of “deploy on testnet” remains an architecture decision.
- Next: use the handoff brief to validate the track interpretation and official kit path before authorizing implementation.

## 2026-11-16 — Built Mempool Guard (Quantum Quest game) in `quest/`
- Changed: scaffolded `quest/` with `create-qorechain-dapp@0.14.0 --template fullstack-web --network testnet` (pnpm). Built Mempool Guard: a deterministic, timed validator game seeded by a live Diana block hash. Runs are submitted with QoreX `signAndBroadcast` as a 1 uqor `MsgSend` to a keyless scoreboard address, with the memo `mg1:<height>:<moves>:<score>`. The leaderboard queries `transfer.recipient` and replays each run from chain data. The lobby has a live feed of real `pqc_hybrid_verify` transactions. The old `app/` folder was not touched; it still contains an untracked `.env`.
- Evidence/status:
  - Build: `pnpm build` passes (tsc + vite). The main bundle is about 60 KB gzipped, with the SDK split out and loaded on demand.
  - Engine tests (15/15 pass): the deck is deterministic per seed; legit cards satisfy every rule; replay equals live scoring; post-game, unfinished and malformed move strings are rejected; the memo is 59 bytes or less.
  - Chain tests against live Diana through the dev proxy pass: latest and historic blocks are readable (lowest retained height was 8,790,799); 5/5 live hybrid transactions pass the hybrid checks; an unknown hash returns pending (not verified); a non-game `MsgSend` is rejected as a run; the leaderboard query works (0 entries).
  - Synthetic run verification on a real seed block: an honest run verifies; an inflated score, a different seed block and a signer mismatch are all rejected.
  - The `MsgSend` encoder is byte-identical to `cosmjs-types` 0.11.0.
  - Headless Edge + Playwright: played the game end to end with no console errors. A mocked QoreX returned an unrelated real tx hash, and verification correctly failed closed. Fixed one bug this test found: the feedback step was showing the next card instead of the judged one.
- Not yet done: a real QoreX approval and Diana transaction (needs the user), a public deployment, and checking the fest Rules page for the "deploy on testnet" wording.
- Follow-up fix (same day): the user reported a black screen. Cause: a one-line effect `useEffect(() => window.scrollTo(...))` passed the Promise that `scrollTo` now returns in Chromium back to React as the effect's cleanup, which crashed the app. Fixed it and added a top-level error boundary. Re-verified: the page renders, and a full Playwright playthrough has no console errors.
