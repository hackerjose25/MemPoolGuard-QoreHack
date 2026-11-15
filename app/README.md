# Quantum Queue app

The Vite + React + TypeScript front end for Quantum Queue. It uses the QoreChain SDK 0.14 line and QoreX integration types 0.1.0. The current screen connects to QoreX's native provider on the Diana testnet and checks for the native `signAndBroadcast` capability. If QoreX is not injected, a local QR modal opens with the app URL and the steps for opening it inside QoreX's dApp browser. Phone scanning requires a public HTTPS deployment; localhost links only work on the computer that runs the dev server.

## Start

From this directory, install dependencies and start the Vite dev server:

```sh
pnpm install
pnpm dev
```

Use Node.js 20 or later. Keep QoreX on `qorechain-diana` (testnet). No private key or recovery phrase is requested by the app.

## Current limits

The QR contains only the current app URL. It does not use QoreX's Dashboard-only `qorex://connect` pairing flow. On mobile, the site must be opened from QoreX's dApp browser for the wallet provider to be injected. The event registry is not implemented or deployed. Event creation is intentionally disabled. A connected wallet does not mean an event or check-in has been written on-chain. The next implementation step is a minimal native-lane event registry and its QoreX transaction/readback flow.
