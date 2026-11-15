# Mempool Guard · Quantum Quest

A fast arcade game on the QoreChain **Diana testnet**, built for the Quantum Pass track.

> Q-Day is here. Forged transactions are flooding the mempool, and you are the last validator standing.

Transaction packets fly in on a timer. Approve the real hybrid-signed ones and reject the forgeries. To decide, you check what QoreChain itself checks: the chain ID, the ML-DSA-87 signature, the secp256k1 signature, the fee floor, and whether the body hash matches the signed hash. A shift has 40 packets over 4 threat levels, with 8 attack types and combo multipliers. Three breaches and the network falls.

When the shift ends, **QoreX hybrid-signs your run** and sends it to Diana. A public leaderboard replays every run from chain data to verify its score. There is no smart contract.

## How the on-chain part works

| Step | What happens |
|---|---|
| Seed | The deck is generated from the hash of the **latest Diana block** when you press Start. The same block always gives the same deck, and nobody can predict it in advance. |
| Play | The game runs as a pure function of `(seed, moves)`. Moves are `A` (approve), `R` (reject) or `T` (timeout). |
| Submit | QoreX `signAndBroadcast` sends a bank `MsgSend` of **1 uqor** to the keyless scoreboard address. The memo is `mg1:<seedHeight>:<moves>:<score>`, at most about 60 bytes. The transaction is signed with secp256k1 + ML-DSA-87. |
| Verify | The app fetches the transaction fresh from Diana REST and checks the following: code 0, a 64 B classical signature, a 4,627 B `PQCHybridSignature`, `pqc_hybrid_verify = verified`, the exact message and amount, the signer, a seed block that exists on Diana and was produced no more than 60 minutes before submission, and that **replaying the moves reproduces the claimed score**. If anything fails, the run is not verified. |
| Leaderboard | It queries `transfer.recipient='<scoreboard>'` and runs the same checks on every row. Rows that fail verification are hidden and counted. |

The **scoreboard address** is `qor1mvtlqsty0aw70cj2zgu3y32hsza0pwnm898m5q`. It is the first 20 bytes of `sha256("quantum-quest/mempool-guard/scoreboard/v1")`, so nobody holds its key. You can override it with `VITE_SCOREBOARD_ADDRESS`.

**What this does and doesn't prove:** replay proves that the score matches the signed moves for a real, recent block. It does not prove that a human played them. The chain proves which address signed the run, not who owns that address.

## Run locally

```bash
pnpm install
pnpm dev         # Vite proxies /lcd → https://api-testnet.qore.host (the REST API sends no CORS headers)
pnpm build
```

You can play without a wallet. To submit a run, you need the QoreX extension (version 0.3.5 or later) set to Diana, plus test QOR from https://dashboard.qorechain.io/faucet. Your first native send also registers your ML-DSA key, which costs about 0.09 QOR.

Controls: `←`/`R` rejects, `→`/`A` approves, `Space` continues after a briefing. On touch screens, swipe the card. Sound can be muted from the top bar.

## Deploy (Vercel)

Set the project root to `quest/`, the build command to `pnpm build`, and the output directory to `dist`. `vercel.json` rewrites `/lcd/*` to Diana REST.

## Stack

- Scaffolded with `create-qorechain-dapp@0.14.0 --template fullstack-web --network testnet`.
- `@qorechain/sdk` 0.14.0 is loaded only when the player connects, to validate the address, which keeps the initial bundle at about 60 KB gzipped.
- QoreX is used through `window.qorex.native`, feature-detected via `capabilities`.
- React 18, Vite 5 and TypeScript, with no UI libraries. Sound effects are synthesized with WebAudio.

| File | Role |
|---|---|
| `src/game/engine.ts` | Deterministic deck, rules, scoring, replay, memo codec |
| `src/chain.ts` | Diana REST reads, hybrid checks, run verification, leaderboard |
| `src/qorex.ts` | QoreX connect and sign; `MsgSend` protobuf encoder (byte-identical to `cosmjs-types`) |
| `src/views/*` | Lobby (live hybrid feed), Play, Results and submission, Leaderboard |
