# Decision record

## D-001 — Build Quantum Queue for Quantum Pass
- Date: 2026-11-15
- Status: Accepted
- Decision: Build a compact QoreChain testnet event check-in app with transaction-backed receipts.
- Reason: Clear everyday use; naturally demonstrates QoreX, testnet deployment, and chain verification.
- Consequence: Explain that an address proves an on-chain action, not a person's identity.

## D-002 — Minimize personal data
- Date: 2026-11-15
- Status: Accepted
- Decision: Use address/event ID for the MVP receipt; do not collect names, email, or student ID.
- Reason: Public chain records are durable and inspectable.
- Consequence: Tell users records are public; shorten addresses by default.

## D-003 — Verify hybrid signature path before final architecture
- Date: 2026-11-15
- Status: Open implementation gate
- Decision: Do not claim EVM contract calls are hybrid-signed without chain evidence. Verify QoreX/SDK native transaction and readback first.
- Reason: Track explicitly requires a hybrid-signed transaction; EVM and native signing paths differ.
- Consequence: Stage 0 proves the required path before the app is considered complete.

## D-004 — Use the QoreX native lane for hybrid-signed actions
- Date: 2026-11-15
- Status: Accepted
- Decision: Use QoreX's native `signAndBroadcast` path for event actions and receipt-producing writes; do not rely on the QoreX EVM connector for writes.
- Reason: Current QoreX EVM methods are read-only. The native lane is the supported path that adds and reports the hybrid signature layer.
- Consequence: Implement event state in a native-lane contract/module. Verify `shielded` plus fresh chain readback before displaying a receipt as verified.
