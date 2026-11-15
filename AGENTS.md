# Agent instructions for Quantum Queue

## Goal
Build a small, polished QoreChain testnet event check-in app. Organizers create and open events; attendees check in with QoreX; the app reads the receipt back from chain data.

## Product constraints
- Keep the release within Quantum Pass scope and make the core flow demoable in three minutes.
- The required happy path must be real on testnet: QoreX connection, deployment, hybrid-signed transaction, and chain readback.
- Never show mock/local data as on-chain proof. Label development fixtures clearly.
- A wallet proves an address submitted a transaction, not a human identity or physical presence.
- Public-chain records are public and durable. Do not call attendance private.
- Never request or store seed phrases/private keys. Never commit secrets or `.env` files.
- Testnet only. Make the active network visible and guard write actions against wrong network.

## Implementation practices
- Follow the generated `create-qorechain-dapp` structure and current official QoreChain docs. Verify SDK APIs against installed versions; do not invent method names.
- Keep keys in QoreX / supported signing flows.
- Represent submission and confirmation as separate UI states. Handle pending, confirmed, rejected, and failed states.
- Enforce organizer permissions and duplicate/closed-event rejection on-chain, not only in the UI.
- Validate chain ID, contract address, and retrieved receipt before displaying “verified.” Fail closed if RPC data is unavailable or inconsistent.
- Keep mobile and accessible layouts; explain signatures, fees, and public data in plain language.
- Document environment variables in `.env.example` with safe sample values.
- Run focused tests/build checks for implemented contract and app changes; report only observed results.

## Documentation ownership
- `README.md`: overview and actual setup instructions.
- `docs/PRODUCT_SPEC.md`: user needs and acceptance criteria.
- `docs/TECHNICAL_PLAN.md`: architecture, risks, and open decisions.
- `docs/DECISIONS.md`: material choices with rationale.
- `docs/BUILD_LOG.md`: append dated entries with actual changes/evidence; never backdate or imply unfinished work passed.
- `AI_USAGE.md`: accurate AI assistance and human verification disclosure.
- Update documentation when packages, routes, contract addresses, commands, or transaction flow change.

## Feature completion checklist
1. Behavior matches the product spec.
2. Wrong-network, loading, rejected-signature, and chain/API failure states are handled.
3. Claimed on-chain data is independently queryable on testnet.
4. Relevant checks were actually run; report real outcomes.
5. README and build log reflect the delivered state.
