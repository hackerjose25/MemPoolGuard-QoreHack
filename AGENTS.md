# Agent instructions for ProofStamp

## Goal
Build a small, polished QoreChain Diana testnet app that fingerprints a file locally, records its SHA-256 digest in a QoreX hybrid-signed native transaction, and independently verifies that receipt from chain data.

## Product constraints
- Keep the release within Quantum Pass scope and make the core flow demoable in three minutes.
- The required happy path must be real on testnet: QoreX connection, public app deployment, hybrid-signed transaction, and fresh chain readback.
- Never show mock/local data as on-chain proof. Label development fixtures clearly.
- A wallet proves an address submitted a transaction, not file authorship, human identity, or when the file was created.
- Public-chain records are public and durable. Never call the proof private or imply that the file itself is uploaded.
- Never request or store seed phrases/private keys. Never commit secrets or `.env` files.
- Testnet only. Make the active network visible and guard writes against the wrong network.
- Store only a SHA-256 digest in the transaction memo; do not put filenames or file contents on-chain.

## Implementation practices
- Follow the generated `create-qorechain-dapp` structure and current official QoreChain docs. Verify SDK APIs against installed versions; do not invent method names.
- Keep keys in QoreX / supported signing flows. Use `signAndBroadcast` for native-lane writes.
- Represent submission and confirmation as separate UI states. Handle pending, confirmed, rejected, and failed states.
- Validate the chain ID, transaction hash, expected message/memo, hybrid signature extension, and `pqc_hybrid_verify` result before displaying “verified.” Fail closed if RPC data is unavailable or inconsistent.
- Keep mobile and accessible layouts; explain signatures, fees, and public data in plain language.
- Document environment variables in `.env.example` with safe sample values.
- Run focused checks for implemented app changes and report only observed results.

## Documentation ownership
- `README.md`: overview and actual setup instructions.
- `docs/PRODUCT_SPEC.md`: user needs and acceptance criteria.
- `docs/TECHNICAL_PLAN.md`: architecture, risks, and open decisions.
- `docs/DECISIONS.md`: material choices with rationale.
- `docs/BUILD_LOG.md`: append dated entries with actual changes/evidence; never backdate or imply unfinished work passed.
- `AI_USAGE.md`: accurate AI assistance and human verification disclosure.
- Update documentation when packages, routes, chain endpoints, commands, or transaction flow change.
