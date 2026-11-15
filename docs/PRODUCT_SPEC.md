# Product specification

## Summary
**ProofStamp** fingerprints a file locally and writes its SHA-256 digest into a hybrid-signed QoreChain testnet transaction. Anyone can re-query the chain to verify the transaction and compare the digest with a file.

## Promise and limits
ProofStamp shows that a QoreChain address recorded a particular digest no later than the transaction's block time. It does not prove who created the file, that the file is true, or that a file existed before the transaction. The file never leaves the browser; only its digest and the submitting public address are recorded on the public chain.

## User stories
1. A user connects QoreX on Diana testnet.
2. The user selects a file; the browser calculates SHA-256 locally.
3. The user sees exactly what will be written and approves a tiny self-transfer plus network fee in QoreX.
4. The app shows submitted and confirmed states separately.
5. The app reads the transaction from testnet and verifies its memo, hash, sender, hybrid-signature extension, and chain verification event.
6. Anyone can paste a transaction hash and independently query the same chain record; optionally compare a local file to its on-chain digest.

## Functional requirements
### Wallet and network
- Connect/disconnect QoreX using the installed native provider and `signAndBroadcast` capability.
- On mobile, show a QR that opens the app URL and explain that connection must be approved inside QoreX's dApp browser. Mark localhost links unavailable to other devices.
- Show Diana testnet and shortened address.
- Block writes if QoreX is on the wrong network; do not request or retain key material.

### File proof
- Hash selected file with Web Crypto SHA-256 in-browser; never upload the file.
- Record only a versioned proof tag plus the 64-character digest in the transaction memo. Do not publish filename, contents, or personal metadata.
- Submit a 1 uqor self-transfer using the supported QoreX native transaction path; the QoreX approval displays the network fee. The token amount returns to the same address; the network fee is separate.
- Distinguish wallet approval, transaction submission, chain confirmation, and verification.
- Verify against fresh Diana REST data. Require matching chain ID, returned transaction hash, successful result code, exact proof memo, expected self-transfer, `PQCHybridSignature` with a 4,627-byte ML-DSA-87 signature, and `pqc_hybrid_verify` status `verified` for the sender.
- Fail closed on wrong network, rejected signature, missing transaction, unavailable API, invalid memo, or missing/inconsistent signature evidence.

## Non-functional requirements
- Responsive and accessible desktop/mobile UI.
- Explain that the wallet address proves submission only and that chain records are public and durable.
- No seed phrases, filenames, file bytes, identities, or private metadata on-chain.
- Keep REST reads on the testnet endpoint and configure a same-origin proxy for local development and Vercel.

## MVP acceptance checklist
- [x] Generated from `create-qorechain-dapp` and connected to QoreX native provider.
- [ ] Hash a selected file locally and show the resulting digest.
- [ ] Submit a real QoreX hybrid-signed testnet transaction containing the digest.
- [ ] Independently read back and verify the hash, transaction and hybrid-signature evidence.
- [ ] Public Vercel deployment and public repo instructions.
- [ ] Handle wrong network, rejected signature, pending confirmation and chain/API failure.
- [ ] Record a real transaction hash and evidence after a user-signed testnet run; no placeholder evidence.

## Three-minute demo
1. Explain the narrow promise and public-data limits.
2. Connect QoreX on Diana testnet and choose a harmless sample file.
3. Show its local SHA-256 digest and approve the clearly described transaction in QoreX.
4. Show chain confirmation, the hybrid verdict, and the receipt.
5. Verify the receipt again from fresh chain data and compare the same file.
