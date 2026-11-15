# Claude handoff — Quantum Quest

## Assignment
Continue this project as **Quantum Quest**, a compact QoreChain onboarding mini-game for the Quantum Pass track. The user selected this idea after rejecting an event check-in app and a file-stamping app. Do not rebuild either old product.

Start by validating the current official track wording, `create-qorechain-dapp` kits, QoreX integration, and Diana testnet deployment/signing paths. Then propose the smallest coherent architecture that satisfies the track before writing code. The user can authorize implementation after reviewing the plan.

## Track requirements supplied by the user

| Requirement | Intent |
|---|---|
| Quantum Pass, small original app/tool/game/bot | A short, polished mini-game is in scope |
| Use `create-qorechain-dapp` | Start from a current official scaffold |
| Connect QoreX | Connect the player's QoreX wallet and show the active network/address |
| Deploy on testnet | Clarify whether this means app hosting, a contract, or both |
| Complete one hybrid-signed transaction | Use a real QoreX native-lane transaction and independently read it back |

The track's example concepts include a mini-game, PQC checker, signed certificate, and Telegram bot. The user's preferred direction is the **mini-game**.

## Product concept

Quantum Quest teaches QoreChain through a few fast, interactive missions. A player connects QoreX, learns to recognize the Diana testnet, reviews a small native transaction, approves it in QoreX, then sees the transaction's hybrid-signature evidence read back from testnet. Verified completion unlocks a quest badge or progress card.

Keep the claim narrow: the chain proves that an address submitted a transaction. It does not prove that a human completed a physical-world task. A badge/score is off-chain unless the project actually writes it to and verifies it from a deployed contract.

### Candidate 2–3 minute flow
1. **Connect** QoreX and show Diana testnet plus shortened public address.
2. **Learn** through two brief prompts about chain/network identity and hybrid signatures.
3. **Review** an explicitly described native-lane testnet transaction and expected fee.
4. **Approve** the action in QoreX; never auto-submit or bypass the wallet.
5. **Verify** the transaction from fresh chain data: chain ID, hash, success code, PQC signature extension, and `pqc_hybrid_verify` status.
6. **Unlock** a progress badge derived from that verified receipt. Label local progress as local.

The exact action, amount (if any), memo, and message encoding are undecided. Verify the message is supported and sensible before implementing. Ask the user before any live testnet transaction that spends funds.

## Architecture gate: what does “deploy on testnet” mean?

Before implementation, resolve whether the organizer requires a deployed smart contract. Do not assume that deploying the web app to Vercel alone satisfies a requirement that may mean an on-chain contract.

If a Solidity scoreboard is required, plan for two distinct transaction paths:

- QoreX native `signAndBroadcast` for the required hybrid-signed native transaction.
- A Solidity contract deployed/interacted with through a supported EVM signer (Foundry/Hardhat/MetaMask) after opening the account's EVM authorization window in QoreX.

Current QoreX documentation says its injected EVM provider answers account/network queries but does not sign or send EVM transactions. Do not present an EVM contract call as carrying the native ML-DSA signature. Determine whether the second EVM signer is acceptable and explain the setup plainly. Never request or store a seed phrase/private key. Use a throwaway testnet account only.

If the contract is optional, prefer a contractless game: deploy the app publicly, use QoreX for one real hybrid-signed native action, and derive the game's completion from independent chain readback.

## Technical constraints
- Diana testnet only (`qorechain-diana`; EVM chain ID 9800).
- Follow the latest installed SDK and official kit docs; APIs and testnet parameters can change.
- Use QoreX native `signAndBroadcast` for native hybrid transactions; feature-detect capability.
- Treat wallet submission and chain confirmation separately. Handle wrong network, rejected approval, pending/indexing delay, chain failure, and RPC outage.
- Before displaying verified: validate the expected network, requested/returned hash, successful result, expected memo/message, `PQCHybridSignature` ML-DSA-87 extension, and chain verification event.
- Public chain memos are permanent and visible. Never include personal information.
- Do not display fake transactions or local fixtures as on-chain proof.
- Keep an accessible mobile/desktop layout. For phone connection, explain that QR opens the app on the phone; it does not pair a mobile wallet to a laptop tab.
- Document setup, environment variables, package versions, commands, contract address, transaction flow, actual test results, and only real on-chain evidence.

## Research starting points
- [Quantum Pass / Build Before Q-Day overview](https://docs.qorechain.io/build-before-qday/overview/)
- [Chain Developer Kit and current templates](https://docs.qorechain.io/developer-tools/chain-dev-sdk/)
- [QoreX hybrid transaction example](https://docs.qorechain.io/build-before-qday/workshop-1/apps/hybrid-inspector/)
- [QoreChain EVM testnet deployment guide](https://docs.qorechain.io/getting-started/deploy-in-5-minutes/)
- [QoreX browser extension integration and limitations](https://docs.qorechain.io/qorex/browser-extension/)
- User-supplied kits page: [build.qorechain.io/kits](https://build.qorechain.io/kits)

## First Claude response requested

Return a short implementation plan before coding. Specifically state:
1. Whether the track requires an on-chain contract deployment or only a public app deployment.
2. Which scaffold/template and wallet path you recommend.
3. What the one hybrid-signed mission transaction will do.
4. Whether the user will need a second EVM signer.
5. Which wallet approval/deployment steps must remain manual.
