# Decision record

## D-001: Build a real game, Mempool Guard
- Date: 2026-11-16
- Decision: Build a timed validator game in which players judge transaction packets against QoreChain's real checks: chain ID, ML-DSA-87 signature, secp256k1 signature, fee floor, and body hash versus signed hash.
- Reason: The game mechanic is the lesson. Players learn what hybrid verification checks by doing those checks themselves.

## D-002: No smart contract; leaderboard verified by replay
- Date: 2026-11-16
- Decision: Runs are submitted as a QoreX native `MsgSend` of 1 uqor to a keyless scoreboard address. The memo carries the seed height, the moves and the score. The leaderboard queries `transfer.recipient` and replays each run.
- Reason: QoreX's EVM provider is read-only, so a Solidity scoreboard would need a second EVM signer and an authorization window. Deterministic replay gives a verifiable leaderboard while keeping the single native hybrid-signed transaction.
- Consequence: Scores can't be invented, because a claimed score must equal the replayed score. Replay doesn't prove a human played. The UI says so.

## D-003: Seed from a live Diana block
- Date: 2026-11-16
- Decision: The deck seed is the hash of the latest Diana block when the shift starts. The seed block must be no more than 60 minutes older than the submitted transaction.
- Reason: The deck can't be predicted before the block exists, anyone can reproduce it from chain data, and old seeds can't be farmed indefinitely.

## D-004: Keyless scoreboard address
- Date: 2026-11-16
- Decision: The scoreboard address is `qor1mvtlqsty0aw70cj2zgu3y32hsza0pwnm898m5q`, the first 20 bytes of `sha256("quantum-quest/mempool-guard/scoreboard/v1")`.
- Reason: No operator account is needed and nobody holds its key. It can be overridden with `VITE_SCOREBOARD_ADDRESS`.

## D-005: Evidence-based chain claims; fail closed
- Date: 2026-11-16
- Decision: A run shows as "verified" only after fresh chain reads confirm all of the following: code 0, a 64 B classical signature, a 4,627 B `PQCHybridSignature`, `pqc_hybrid_verify = verified`, the exact message and amount, the signer, seed freshness, and replay. API errors never count as a pass.
- Consequence: The UI keeps wallet approval, submission, verification and failure as separate states.

## D-006: Keys stay in QoreX
- Date: 2026-11-16
- Decision: Only QoreX native `signAndBroadcast` is used. The app never requests or stores seed phrases or private keys, and writes are blocked unless the live chain ID is `qorechain-diana`.
