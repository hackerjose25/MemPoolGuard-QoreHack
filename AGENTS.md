# Project agent instructions

## Current project
Mempool Guard is a post-quantum validator arcade game on the QoreChain Diana testnet, built for the Quantum Pass track. The app lives in `quest/`. See `README.md` and `docs/DECISIONS.md`.

## Constraints
- Use `create-qorechain-dapp` packages and current official QoreChain docs, and verify APIs against the installed package versions.
- Testnet only. Show the active network and block writes on the wrong network.
- Never request or store seed phrases or private keys, and never commit secrets. Keys stay in QoreX.
- A wallet proves that an address submitted a transaction. It does not prove a human identity. Replay proves that a score matches the moves, not that a human played them.
- Public chain data is public and durable. Never put personal data in memos.
- Show wallet approval, submission, confirmation and failure as distinct states.
- Before displaying "verified", check the chain ID, the transaction hash, the expected message, the PQC signature extension, the chain verification event and the replayed score. Fail closed.
- QoreX's EVM provider is read-only. Don't imply that QoreX signs EVM contract calls.
- Keep mobile and accessibility support, fee disclosures and public-data notices.
- Update the docs and build log only with observed work and test results.
- Don't deploy, submit transactions or push unless the user asks.
