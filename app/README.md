# ProofStamp app

React, TypeScript and Vite client for ProofStamp. It fingerprints files locally with Web Crypto, submits the digest in a QoreX hybrid-signed Diana testnet self-transfer, and verifies receipts from fresh testnet REST data.

## Development

```sh
pnpm install
pnpm dev
```

Use Node.js 20+ and an unlocked QoreX extension in the same browser, switched to `qorechain-diana`. The app requires the native `signAndBroadcast` capability. It never requests seed phrases or private keys.

## Environment

`VITE_QORE_REST_URL` is the same-origin REST path, default `/lcd`. `QORE_REST_PROXY_TARGET` is used by the Vite development proxy and defaults to `https://api-testnet.qore.host`. `vercel.json` provides the corresponding deployed rewrite.

The transaction memo is `QPROOF/1:<sha256-hex>`. It contains no filename or file content. The self-transfer amount is 1 uqor, plus the network fee shown by QoreX.
