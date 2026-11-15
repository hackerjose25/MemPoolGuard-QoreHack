# Quantum Quest technical plan (pre-implementation)

## Current status
Idea selected; implementation intentionally cleared for a Claude handoff. No app source, contract, deployment, wallet action, or testnet transaction remains in the working tree.

## Proposed direction
- Scaffold a small web app with the official `create-qorechain-dapp` kit.
- Use QoreX's native provider for connection and the supported `signAndBroadcast` path for the single required hybrid-signed action.
- Fetch the committed transaction from Diana's public REST API; validate chain identity, transaction hash, successful result, expected message/memo, PQC signature extension, and `pqc_hybrid_verify` result.
- Use mission screens to explain the user action before QoreX approval and to interpret chain evidence afterwards.
- Derive unlocked progress from independently verified transaction evidence; do not treat local state as chain proof.
- Deploy the app to a public HTTPS host for the demo. Determine separately whether the track requires a smart contract deployed on Diana.

## Contract/deployment decision gate
QoreChain's current public docs indicate the EVM lane is the practical custom-contract path. The EVM lane requires a registered post-quantum key and open EVM authorization window; an EVM signer such as Foundry/Hardhat/MetaMask then submits the EVM transaction. Current QoreX extension EVM provider methods are read-only. QoreX native `signAndBroadcast` is the hybrid-signed transaction path, but it does not itself sign EVM contract calls. Keep these transaction types distinct in product copy and receipts.

Before choosing a scoreboard contract:
1. Confirm what “deploy on testnet” means in the actual Quantum Pass rules.
2. Review the current `create-qorechain-dapp` templates and official EVM authorization-window helpers.
3. Decide whether a second EVM signer is acceptable. Never ask the user to paste a recovery phrase/private key into the app.
4. If contract deployment is not essential, prefer a contractless demo that still has a useful game loop and a real QoreX hybrid transaction.

## Candidate safe transaction
A minimal self-directed native action with a short quest identifier in the memo is a candidate, not yet approved or validated. Confirm message semantics, minimum amount, fee, memo length, and QoreX decoder support before implementation. Ask the user to approve any live testnet transaction; do not use hidden or automatic writes.

## Verification requirements
- Confirm active chain ID `qorechain-diana` from the REST endpoint.
- Fetch transaction by returned hash and compare canonical hash and expected message.
- Require result code 0, `PQCHybridSignature` extension with an ML-DSA-87 signature, and chain `pqc_hybrid_verify` status `verified`.
- Distinguish submitted, pending, confirmed, rejected, and failed.
- Fail closed when the API is unavailable or fields are inconsistent.
- Record only observed transaction hashes and evidence after a real run; never add mock on-chain proof.

## Official starting references
- [Quantum Pass / Build Before Q-Day overview](https://docs.qorechain.io/build-before-qday/overview/)
- [Chain Developer Kit and templates](https://docs.qorechain.io/developer-tools/chain-dev-sdk/)
- [QoreX hybrid transaction example](https://docs.qorechain.io/build-before-qday/workshop-1/apps/hybrid-inspector/)
- [QoreChain EVM deployment guide](https://docs.qorechain.io/getting-started/deploy-in-5-minutes/)
- [QoreX browser extension API and limits](https://docs.qorechain.io/qorex/browser-extension/)
