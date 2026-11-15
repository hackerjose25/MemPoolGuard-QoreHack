# Decision record

## D-001 — Select Quantum Quest
- Date: 2026-11-16
- Status: Accepted concept; no implementation authorized yet
- Decision: Shape a short QoreChain onboarding mini-game around guided missions and one real QoreX hybrid-signed transaction.
- Reason: It aligns with the Quantum Pass example of a mini-game and can demonstrate QoreX, Diana testnet, and independent transaction verification in a short demo.
- Consequence: Keep this repository documentation-only until the user asks to implement. Confirm whether “deploy on testnet” requires an EVM contract before fixing architecture.

## D-002 — Keep chain claims evidence-based
- Date: 2026-11-16
- Status: Accepted
- Decision: Unlock game progress only after a fresh chain query confirms the expected transaction and hybrid-signature result. Mark app-only score/badges as off-chain.
- Reason: A UI response or local fixture is not proof of chain state.
- Consequence: Show submitted and verified as separate states and fail closed when testnet data is unavailable.

## D-003 — Keep wallet secrets in wallets
- Date: 2026-11-16
- Status: Accepted
- Decision: Use QoreX native `signAndBroadcast` for the required hybrid-signed action. Never request or store a seed phrase or private key.
- Reason: QoreX creates and holds the ML-DSA-87 key needed for the native transaction.
- Consequence: If a Solidity scoreboard is required, research a supported EVM signer path separately; current QoreX EVM methods are read-only.
