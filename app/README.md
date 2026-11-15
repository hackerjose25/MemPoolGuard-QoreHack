# Quantum Queue app

The Vite + React + TypeScript front end for Quantum Queue. It uses the QoreChain SDK 0.14 line and QoreX integration types 0.1.0. The current screen connects to QoreX's native provider on the Diana testnet and checks for the native `signAndBroadcast` capability.

## Start

From this directory, install dependencies and start the Vite dev server:

```sh
pnpm install
pnpm dev
```

Use Node.js 20 or later. Keep QoreX on `qorechain-diana` (testnet). No private key or recovery phrase is requested by the app.

## Current limits

The event registry is not implemented or deployed. Event creation is intentionally disabled. A connected wallet does not mean an event or check-in has been written on-chain. The next implementation step is a minimal native-lane event registry and its QoreX transaction/readback flow.
