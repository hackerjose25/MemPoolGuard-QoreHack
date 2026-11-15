# Quantum Quest

**A short game that teaches QoreChain by doing.**

Quantum Quest is the selected concept for the Quantum Pass track. Players complete a few short missions about QoreChain and post-quantum signing, connect QoreX on Diana testnet, approve one real hybrid-signed native transaction, and inspect the receipt from chain data.

## Current status

This repository is documentation-only while the idea is being shaped for a Claude handoff. The previous event check-in and ProofStamp app source/configuration have been removed from the working tree. No Quantum Quest code, contract, testnet deployment, wallet transaction, or game score system exists yet.

## Handoff

Start with [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md), which describes the game loop, track requirements, constraints, technical risks, and questions to research before implementation.

## Track fit

- Original small game/app concept.
- Planned scaffold: `create-qorechain-dapp`.
- QoreX connects the player to QoreChain Diana testnet.
- A mission culminates in one real hybrid-signed native-lane transaction.
- The app independently reads the transaction and chain signature-verification result.
- A public app deployment and, if required by the organizers, a testnet smart-contract deployment remain future decisions/work.

## Important limit

The current QoreX browser extension can connect dApps and sign native-lane transactions with a hybrid signature. Its EVM provider is currently read-only. A deployed Solidity scoreboard or other contract would need a supported EVM transaction path, including an open EVM authorization window and an EVM signer. Confirm whether the track requires contract deployment before designing that feature. Do not claim an EVM contract transaction itself carries the native hybrid signature.

## Documents

- [Claude handoff](CLAUDE_HANDOFF.md)
- [Product spec](docs/PRODUCT_SPEC.md)
- [Technical plan](docs/TECHNICAL_PLAN.md)
- [Decision record](docs/DECISIONS.md)
- [Build log](docs/BUILD_LOG.md)
- [AI usage](AI_USAGE.md)
