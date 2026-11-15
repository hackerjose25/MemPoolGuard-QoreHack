# Mempool Guard

**A post-quantum validator arcade game on the QoreChain Diana testnet.** Built for the *Build Before Q-Day* Quantum Pass track.

> Q-Day is here. Forged transactions are flooding the mempool, and you are the last validator standing.

Transaction packets arrive on a shrinking timer. Swipe or press ←/→ to **reject the forgeries** and **approve the real hybrid-signed transactions**. To decide, you check what QoreChain itself checks: the chain ID, the ML-DSA-87 signature, the secp256k1 signature, the fee floor, and whether the body hash matches the signed hash. When the shift ends, **QoreX hybrid-signs your run** and sends it to Diana, and a public leaderboard **replays every run from chain data** to verify its score. There is no smart contract.

## Highlights

- **A real game loop.** A shift has 40 packets over 4 threat levels, with 8 attack types, ×5 combos and 3 shields. A briefing introduces each new threat, the timer gets shorter as you go, and a debrief afterwards explains each mistake.
- **Seeded by the chain.** Each deck is generated from the hash of the latest Diana block, so it can't be predicted in advance and anyone can reproduce it.
- **One hybrid-signed transaction.** QoreX `signAndBroadcast` signs the run with secp256k1 + ML-DSA-87. The transaction is a 1 uqor `MsgSend` to a keyless scoreboard address, with the memo `mg1:<seedHeight>:<moves>:<score>`.
- **A leaderboard you can verify, with no contract.** The game reads every run back from Diana REST and checks the following: code 0, a 4,627-byte ML-DSA-87 signature, `pqc_hybrid_verify = verified`, a real seed block no more than 60 minutes old, and that **replaying the moves reproduces the claimed score**. If any check fails, the run doesn't count.
- **Live chain data.** The lobby streams real hybrid-verified Diana transactions. Click any of them to inspect it with the same checks the game teaches.
- **Polished across devices.** The play screen fits a single viewport on desktop, laptop and phone. There are touch swipes, keyboard controls, synthesized sound effects, and support for reduced-motion settings.

## Track requirements

| Requirement | How it's met |
|---|---|
| Small original app or game | Mempool Guard, an original arcade game about post-quantum transaction validation |
| Use `create-qorechain-dapp` | Scaffolded with `create-qorechain-dapp@0.14.0 --template fullstack-web --network testnet` |
| Connect QoreX | Uses `window.qorex.native` (`enable`/`getKey`), feature-detected via `capabilities` |
| Deploy on testnet | Runs against Diana (`qorechain-diana`). The web app deploys to Vercel from `quest/` |
| One hybrid-signed transaction | The run submission goes through QoreX `signAndBroadcast` and is read back and verified from chain data |

## Quick start

```bash
cd quest
pnpm install
pnpm dev      # http://localhost:5173
```

You can play without a wallet. To submit a run on-chain you need the QoreX extension (version 0.3.5 or later) set to Diana, plus test QOR from the [faucet](https://dashboard.qorechain.io/faucet). For architecture, verification rules and deployment, see [quest/README.md](quest/README.md).

## Honest limits

- Replay proves that a score matches the signed moves on a real, recent block. It does not prove that a human played them.
- The chain proves which address signed a run, not who owns that address.
- Run memos are public and permanent, so never put personal data in them.
- This runs on the testnet only. The app never asks for seed phrases or private keys.

## Repository

| Path | Contents |
|---|---|
| [quest/](quest/) | The app (React + Vite + TypeScript) |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture decisions |
| [docs/BUILD_LOG.md](docs/BUILD_LOG.md) | Observed build and test evidence |
| [AI_USAGE.md](AI_USAGE.md) | AI-assistance disclosure |
