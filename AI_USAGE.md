# AI usage

Mempool Guard was built AI-natively. **Claude Code** (Anthropic, model Claude Opus 5.5) worked as the implementation agent inside VS Code, and a human directed it, tested it on real hardware and with a real wallet, and made every product and release decision. This file records how the work was divided. Measured results are in [docs/BUILD_LOG.md](docs/BUILD_LOG.md).

## Workflow

1. **Ideation (2026-11-16).** Earlier concepts were rejected by the human: an event check-in app, a file-stamping app ("ProofStamp"), and a guided quiz-style demo. The human pasted the official Quantum Pass bounty text and asked for ideas that would make "a real game". Claude proposed four concepts and recommended Mempool Guard. The human approved it.
2. **Feasibility first.** Before writing code, Claude checked the official docs and the live Diana REST API:
   - It confirmed that QoreX's `window.qorex.native.signAndBroadcast` is the hybrid-signing path and that the EVM provider is read-only, so the build has no contract.
   - It checked the scaffold version on npm.
   - It confirmed that transactions can be searched by `transfer.recipient`, which makes a contractless leaderboard possible.
   - It measured how much block history the node keeps (about 1.36 million blocks), which tells you how long runs stay replayable.
   - It measured the block time (about 1.4 s).
3. **Scaffold.** `create-qorechain-dapp@0.14.0 --template fullstack-web --network testnet`.
4. **Implementation by Claude, with the human steering.** The work was done in short loops of build → automated test → screenshot → fix.
5. **Human testing on real hardware.** The human ran the app locally and with QoreX, reported problems from screenshots, and requested design changes.
6. **Release.** At the human's request, Claude committed and pushed. The human deployed to Vercel, and Claude then checked the live site with a scripted browser.

## What the AI generated

- **The game design:** 8 forgery types that mirror QoreChain's real checks, 4 threat levels, scoring with combos and shields, and timing.
- **The game engine** (`quest/src/game/engine.ts`): deterministic and seeded by the Diana block hash, with replay, the memo format, and the anti-cheat rules.
- **The chain layer** (`quest/src/chain.ts`): Diana REST reads, hybrid-signature checks, run verification that fails closed, the leaderboard query, and the live feed.
- **The QoreX integration** (`quest/src/qorex.ts`): capability detection, `signAndBroadcast`, and a hand-written `MsgSend` protobuf encoder that tests showed to be byte-identical to `cosmjs-types`.
- **The whole UI:** lobby, play screen, results and submission flow, leaderboard, transaction inspector, synthesized sound effects, the auto-fit play layout, and mobile and reduced-motion support.
- **Tests and tooling:** engine unit checks, checks against live Diana, synthetic cheat attempts (an inflated score, a swapped seed, a different signer), and Playwright playthroughs at three screen sizes. These test scripts ran from a scratch folder and are not part of the repo.
- **Assets and docs:** the featured image (built from a real screenshot of the live site), the README, the decision record, the build log and this file.

## What the human contributed

- **Choosing the track and judging the concept.** The human rejected three weaker ideas and picked Mempool Guard.
- **The quality bar.** The human asked for a "professional and dynamic" UI that "should not look simple".
- **Design direction from hands-on testing.** For example, the human asked that the play area "fit in a single frame, not scrolling", which led to the auto-scaling play layout.
- **Finding bugs.** The human reported a black screen on first load. The cause was a `useEffect` that returned the Promise from `window.scrollTo`, which crashed React. It was fixed and an error boundary was added.
- **Real on-chain runs.** The human installed QoreX, funded the account from the faucet, played, and **personally approved both hybrid-signed transactions** in the wallet. The AI never had access to keys.
- **Deployment and releases.** The human set up the Vercel deployment and authorized every push.

## Errors the AI made and how they were caught

| Issue | Caught by | Fix |
|---|---|---|
| The feedback step showed the next card instead of the judged one | An AI Playwright screenshot review | Render the judged card during feedback |
| A black screen, from the `scrollTo` Promise returned as effect cleanup | **A human report** | Put the call in a block-bodied effect and add an error boundary |
| Mobile horizontal overflow | An AI screenshot at 390px | Add `min-width: 0` guards to the grid layout |
| Numbers rendered in the system locale (`1,01,52,194`) | An AI screenshot review | Format with `en-US` |
| The old Vercel config pointed at the removed `app/` folder | AI review of the deploy | Add a root `vercel.json` that builds `quest/` |

## Guardrails followed

- The app never requests or stores seed phrases or private keys, and every signature happens in QoreX after the human approves it.
- It runs on the testnet only, and writes are blocked unless the live chain ID is `qorechain-diana`.
- Docs record only observed results. Nothing about the transactions was fabricated or mocked. The mocked-wallet tests were used only to show that verification fails closed.
