# Project agent instructions

## Current project
Quantum Quest is a concept-only QoreChain Diana testnet onboarding mini-game. The previous Quantum Queue and ProofStamp application source has been removed. Do not restore either product concept unless the user explicitly changes direction.

## Current phase
Brainstorming / handoff only. Do not implement code, install packages, deploy, submit transactions, or push changes unless the user explicitly asks. The user plans to give `CLAUDE_HANDOFF.md` to Claude.

## Product concept
Teach QoreChain and post-quantum signing through a short sequence of interactive missions. A player connects QoreX, learns to identify the Diana testnet, completes one real hybrid-signed native-lane transaction, and verifies its receipt from fresh chain data. A game badge or score must be labeled as app/game progress unless and until its on-chain storage is implemented and verified.

## Required constraints if implementation is later authorized
- Use `create-qorechain-dapp` and current official QoreChain docs; verify APIs against installed package versions.
- Testnet only. Make the active network visible and block writes on the wrong network.
- Never request or store seed phrases/private keys, never commit secrets, and keep keys in QoreX / supported signing flows.
- A wallet proves an address submitted a transaction, not a human identity or physical-world action.
- Public-chain data is public and durable.
- Show wallet approval, submission, confirmation, and failure as distinct states.
- Verify chain ID, transaction hash, expected message, PQC signature extension, and chain verification event before displaying a verified result. Fail closed on API errors or mismatched data.
- A custom EVM contract uses the EVM authorization-window flow and an EVM signer. Current QoreX extension EVM methods are read-only; do not imply QoreX itself signs EVM contract calls. Verify current testnet contract deployment limits before choosing a contract architecture.
- Keep mobile/accessibility needs, fee disclosures, and clear public-data notices in scope.
- Update docs and build log only with observed work and test results.
