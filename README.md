# ProofStamp

**A file fingerprint, timestamped by a hybrid-signed QoreChain transaction.**

ProofStamp computes a file's SHA-256 digest locally in your browser and records that digest in a QoreX-signed transaction on the QoreChain Diana testnet. It then reads the receipt back from chain data so anyone can verify the digest and the hybrid-signature verdict.

> The file never leaves your browser. The digest, transaction memo, wallet address and transaction are public and durable. A receipt shows that an address recorded a digest by a block time; it does not prove who created the file, whether its contents are true, or that it existed earlier.

## Run locally

Use Node.js 20+ and pnpm. In `app/`:

```sh
pnpm install
pnpm dev
```

Open the local URL in the same desktop browser where QoreX is installed. Unlock QoreX and switch it to **Diana testnet**. If prompted, approve the site's connection. The app never asks for a recovery phrase or private key.

The REST API is proxied through `/lcd` in Vite because the public testnet REST endpoint does not send browser CORS headers. `QORE_REST_PROXY_TARGET` defaults to `https://api-testnet.qore.host` in `.env.example`.

## Record a proof

1. Connect QoreX and choose a file. The app hashes it in the browser; it does not upload the file.
2. Check the SHA-256 digest and the explanation of the public memo.
3. Click **Record hybrid-signed proof**. QoreX shows the transaction and fee; approve only if the details look right.
4. The app queries Diana testnet and shows a verified receipt only if it finds the matching memo, transaction, 4,627-byte ML-DSA-87 signature and `pqc_hybrid_verify` status `verified`.
5. To verify later, paste the transaction hash. Optionally select the original file to compare its locally computed digest with the on-chain digest.

The transaction is a 1 uqor self-transfer. The amount returns to the same address; network fees still apply. The chain record is public and permanent.

## Vercel

Set the Vercel project **Root Directory** to `app`. Vercel builds with `pnpm build`; the included `app/vercel.json` forwards `/lcd/*` reads to the Diana REST endpoint. No private environment variables are required. The app needs a public HTTPS URL for mobile use inside QoreX.

## Current status

The interface and native transaction/readback path are implemented in source. A real proof requires an unlocked Diana testnet QoreX account with test QOR. No live transaction or public deployment has been performed yet; do not treat a local preview as chain evidence.

See [product spec](docs/PRODUCT_SPEC.md), [technical plan](docs/TECHNICAL_PLAN.md), [decisions](docs/DECISIONS.md), [build log](docs/BUILD_LOG.md), and [AI usage](AI_USAGE.md).
