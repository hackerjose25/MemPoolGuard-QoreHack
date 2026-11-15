# Decision record

## D-001 — Original idea: Quantum Queue
- Date: 2026-11-15
- Status: Superseded before implementation
- Decision: Initially proposed a testnet event check-in app.
- Reason: A check-in receipt is an understandable on-chain use case.
- Consequence: Replaced with D-005 after checking current testnet deployment and QoreX write limitations.

## D-002 — Minimize personal data
- Date: 2026-11-15
- Status: Accepted
- Decision: Do not collect identities or publish names, filenames or file contents.
- Reason: Public chain records are durable and inspectable.
- Consequence: The app records only a SHA-256 digest and the chain records the submitting address.

## D-003 — Verify the hybrid signature on chain
- Date: 2026-11-15
- Status: Accepted
- Decision: Do not call a transaction hybrid-verified based only on a wallet response; require the chain transaction record, PQC extension and verification event.
- Reason: The app must show independent evidence from Diana testnet.
- Consequence: Fail closed when fresh chain evidence is unavailable or inconsistent.

## D-004 — Use QoreX native signing
- Date: 2026-11-15
- Status: Accepted
- Decision: Use QoreX's native `signAndBroadcast` path for hybrid-signed actions.
- Reason: Current QoreX EVM methods are read-only; the native lane is the supported dApp path that adds the ML-DSA-87 layer.
- Consequence: Keep transaction creation in the wallet's supported signing flow and verify `shielded` plus fresh chain readback.

## D-005 — Pivot to ProofStamp
- Date: 2026-11-15
- Status: Accepted
- Decision: Replace the event check-in app with ProofStamp, a local file-fingerprint and public testnet timestamp tool using QoreX native transactions.
- Reason: Diana testnet blocks uploads of user CosmWasm code and current QoreX EVM signing is unavailable. QoreX's documented native `signAndBroadcast` path supports a real hybrid-signed transaction and chain readback without custom contract deployment or another wallet.
- Consequence: The app records a SHA-256 digest in a transaction memo. The memo and address are public and durable. The receipt proves only that the address recorded that digest by the transaction's block time; it does not prove authorship, truth, or earlier file existence.

## D-006 — Use an exact, low-value self-transfer as the proof transaction
- Date: 2026-11-15
- Status: Accepted, subject to live testnet confirmation
- Decision: Submit a 1 uqor `MsgSend` from the connected address to itself with memo `QPROOF/1:<sha256-hex>`.
- Reason: This uses a supported, wallet-decodable native message and leaves the digest available in public chain data, while the token amount returns to the sender. The network fee remains payable.
- Consequence: Display the 1 uqor amount and fee before wallet approval, and do not call this a no-cost transaction. If the chain rejects self-send, stop and choose another supported transaction shape rather than showing a local fixture as proof.
