# AI usage log

The hackathon lists an AI-Native award and asks for an `AI_USAGE.md` describing the workflow, generated work, and human contribution. Keep this accurate; do not claim review or verification that did not happen.

## Workflow
- AI tools used: Codex for project review, starter integration, UI implementation, and documentation updates.
- Human review: inspect generated code and docs, check APIs against official QoreChain documentation, and run the relevant checks/deployment.
- Human contributions: record product choices, manual review, integration decisions, and observed testnet verification as they occur.

## Entries
### 2026-11-15 — Planning documents
- AI assistance: drafted the initial README, product specification, technical plan, build log, decision record, and agent instructions from the user's concept and published track details.
- Human contribution: user selected Quantum Queue and asked for build documentation.
- Verification: implementation has not started; no contract, transaction, test, or deployment has been verified.

### 2026-11-15 — Starter and app shell
- AI assistance: generated the official `fullstack-web` starter, built the first responsive app shell and QoreX native-provider connection state, and updated project setup and architecture documentation.
- Human contribution: user supplied the project requirements and asked to begin implementation after reviewing the folder and QoreChain kits.
- Verification: TypeScript check and Vite production build completed successfully. No wallet approval, testnet transaction, contract deployment, or chain receipt was verified.

### 2026-11-15 — Mobile QoreX handoff
- AI assistance: added a locally rendered QR modal for the app URL, local-preview reachability warning, copy-link control, and guidance for completing wallet approval inside QoreX's dApp browser. Updated product and technical documentation to describe the supported mobile flow accurately.
- Human contribution: user approved the supported QR-to-app handoff after the direct Dashboard pairing limitation was explained.
- Verification: TypeScript check and Vite production build passed. No live phone handoff or wallet approval was tested.

### 2026-11-15 — Product pivot to ProofStamp
- AI assistance: after reviewing current QoreX and Diana testnet support, identified that the event contract flow was not viable with custom CosmWasm uploads disabled and QoreX EVM signing unavailable. Replaced the unfinished event app with a local-file-hash timestamp app using QoreX's documented native signing path. Updated app code and product documentation.
- Human contribution: user directed the project to pivot to another idea after the event creation limitation was explained.
- Verification: `npm run build` passed and the local UI was visually reviewed. No live wallet approval, self-send acceptance, signature readback or deployment has been performed.
