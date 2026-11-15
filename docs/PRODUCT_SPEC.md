# Quantum Quest product spec (concept)

## Summary
Quantum Quest is a compact interactive game that helps newcomers learn QoreChain testnet basics through guided missions and one real QoreX hybrid-signed transaction.

## Player promise
In a few minutes, a player can connect QoreX, identify the testnet and wallet address, review a native transaction, approve it in QoreX, and independently inspect the chain's hybrid-signature verdict. Game progress or badges must not be described as on-chain unless a real on-chain implementation exists and is verified.

## Intended audience
Hackathon participants and QoreChain newcomers who want a hands-on introduction to QoreX, Diana testnet, and hybrid signing.

## Candidate mission flow
1. **Connect:** connect QoreX and show the selected network and shortened public address.
2. **Find Diana:** teach the player to recognize `qorechain-diana` and explain why wrong-network writes are blocked.
3. **Review the transaction:** explain the message, memo, and expected fee before the wallet prompt.
4. **Sign a real testnet action:** request one minimal, clearly explained native-lane action through QoreX `signAndBroadcast`; the QoreX approval is mandatory.
5. **Verify:** query the transaction from Diana REST and check its hash, result code, PQC signature extension, and `pqc_hybrid_verify` status.
6. **Finish:** unlock a local/shareable progress badge derived from the verified receipt. Be clear if the badge itself is not stored on-chain.

The exact transaction type, message, and memo are undecided and must be validated with current QoreChain docs and an explicit user-approved testnet transaction before implementation is considered complete. No transaction should be submitted automatically.

## Track requirements
- Scaffold with `create-qorechain-dapp`.
- Connect QoreX.
- Deploy on testnet (clarify whether organizers mean the web app or a smart contract).
- Complete one hybrid-signed transaction and independently read it back.
- Keep the demo understandable in three minutes.

## User-facing truth and privacy
- Testnet only; clearly show `qorechain-diana` before any write.
- A verified transaction proves that an address submitted a transaction; it does not prove a human identity or a physical-world achievement.
- QoreChain transaction data and memos are public and durable. Do not place names or personal data in a memo.
- Explain any token amount and fee before QoreX approval.
- Never ask for a seed phrase or private key.

## Open product decisions
1. Does “deploy on testnet” mean app deployment, contract deployment, or both?
2. What quest action is meaningful, safe, and readable in QoreX's native signing approval?
3. Should score/progress remain local and receipt-derived, or should the game deploy a Solidity contract?
4. If a scoreboard contract is required, what supported EVM signer path is acceptable alongside QoreX?
5. Which active chain data proves the transaction and hybrid verdict for the chosen message?
