# Submission draft: Mempool Guard

**Project name:** Mempool Guard
**Category / track:** Quantum Pass
**Live demo:** https://mempool-guard.vercel.app/
**Repository:** https://github.com/hackerjose25/MemPoolGuard-QoreHack
**Featured image:** docs/featured.png
**Demo video:** https://youtu.be/ZPW_kj11_s8
**License:** MIT

## Tagline (one line)
A post-quantum validator arcade game: reject forged transactions, approve real hybrid-signed ones, then sign your run with QoreX on Diana.

## Short description
Q-Day is here, and forged transactions are flooding the mempool. You are the last validator standing. Packets arrive on a shrinking timer, and you approve or reject each one by checking what QoreChain itself checks: the chain ID, the ML-DSA-87 signature, the secp256k1 signature, the fee floor, and whether the body hash matches the signed hash. When your shift ends, QoreX hybrid-signs your run (secp256k1 + ML-DSA-87) and broadcasts it to the Diana testnet. A public leaderboard replays every run from chain data to confirm its score. There is no smart contract.

## How it uses QoreChain
- Scaffolded with `create-qorechain-dapp@0.14.0` (`fullstack-web`, testnet) and uses `@qorechain/sdk` 0.14.0.
- Connects to QoreX through `window.qorex.native` (`enable`, `getKey`, `signAndBroadcast`).
- Submits one hybrid-signed transaction per run: a 1 uqor `MsgSend` to a keyless scoreboard address, with the memo `mg1:<seedHeight>:<moves>:<score>`.
- Each deck is seeded from the hash of the latest Diana block, so it can't be predicted in advance and anyone can reproduce it.
- The leaderboard reads runs back from Diana REST and fails closed. A run counts only with code 0, a 4,627-byte ML-DSA-87 signature, `pqc_hybrid_verify = verified`, a seed block no more than 60 minutes old, and a replayed score equal to the claimed score.

## On-chain evidence (Diana)
- Player: `qor1zheh9tukxvvmgvvjd3lq2fehd68h7av6ss3vz4`
- Scoreboard (keyless): `qor1mvtlqsty0aw70cj2zgu3y32hsza0pwnm898m5q`
- Tx `2A65CCDD709784B2A7B75E3CF8E14C13D1E4F270277489BB16378A46C488DD48`: block 10,153,126, 1,300 points, replay-verified
- Tx `A44D2B462BE9B3C887D4C3D35B2271201587AB5805909EA2902FC795595FD0BE`: block 10,152,719, 550 points

## Honest limits
Replay proves that a score matches the signed moves on a real, recent block. It does not prove that a human played them. The chain proves which address signed a run, not who owns that address. This runs on the testnet only, and the app never asks for keys or seed phrases.

## AI usage
Disclosed in AI_USAGE.md.
