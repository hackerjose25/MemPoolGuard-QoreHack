# Build log

Append entries as work happens. Record observed evidence, not intentions.

## 2026-11-15 — Project kickoff
- Reviewed Quantum Pass track, start guide, kits, rules, and technical overview.
- Selected Quantum Queue: QoreChain testnet event check-in with verifiable transaction receipts.
- Added initial README, product spec, technical plan, decision record, agent instructions, and AI-use template.
- Status: documentation only. No scaffold, contract, app, transaction, tests, or deployment yet.
- Follow-up: verify the exact QoreX/SDK hybrid-signature path and chain readback before committing to the final write flow.

### 2026-11-15 — Official app starter and QoreX connection shell
- Changed: generated `app/` with `create-qorechain-dapp@0.14.0 --template fullstack-web`; added a responsive Quantum Queue landing/workspace screen, Diana testnet QoreX native-provider connection, capability status, safe disabled event-creation state, package manifest/lockfile, app ignore rules, and setup notes.
- Evidence/status: TypeScript `tsc --noEmit` completed without diagnostics; Vite production build completed and emitted `app/dist/`. No QoreX wallet session, testnet transaction, contract, or chain readback was performed.
- Decisions or risks: current official QoreX docs identify `native.signAndBroadcast` as the hybrid native-lane path. EVM methods in the QoreX connector remain read-only in the current wallet release. Event actions stay disabled until an on-chain registry exists.
- Next: implement and validate the minimal event registry, then connect QoreX transaction submission to independently queried chain readback and verify the returned hybrid shield status.

### 2026-11-15 — QR handoff to QoreX mobile browser
- Changed: Connect QoreX now opens a locally generated QR for the current app URL when no QoreX provider is injected. Added copy-link control, QoreX dApp-browser instructions, and a warning when the app is on localhost or not HTTPS. Added `qrcode.react` 4.2.0.
- Evidence/status: TypeScript check passed; Vite production build passed. QR generation is local. No live phone handoff or wallet approval was tested. A phone cannot access the local development URL; QR phone use requires a public HTTPS deployment.
- Decisions or risks: QoreX's QR pairing/deep-link proof flow is Dashboard-only. This QR opens Quantum Queue; the user then opens that URL inside QoreX's dApp browser to connect. It does not pair the mobile wallet back to the desktop browser.
- Next: deploy to a public HTTPS origin before validating the QR with Google Lens and QoreX on a phone.

### 2026-11-15 — Clarify desktop QoreX connection
- Changed: the QR dialog now explains that scanning connects only the phone's page and links to the official QoreX Chrome/Edge extension for connecting the laptop tab. Added the same desktop/mobile distinction to setup and architecture notes.
- Evidence/status: `npm run build` passed (TypeScript check and Vite production build). No live browser extension connection was performed.
- Decisions or risks: the laptop connection requires QoreX's browser extension installed and unlocked in that browser; the extension must be switched to Diana testnet before testnet actions.
- Next: install the official extension on the target desktop browser and confirm that QoreX injects its native provider on the deployed app origin.

## Entry template
### YYYY-MM-DD — Short change title
- Changed:
- Evidence/status:
- Decisions or risks:
- Next:
