# Product specification

## Summary
**Quantum Queue** is a QoreChain testnet event check-in app with transaction-backed receipts anyone can verify.

## Problem and promise
Attendance is often proved with screenshots or a trusted private spreadsheet. Quantum Queue provides a receipt that can be checked against QoreChain. It proves that a particular address submitted a check-in for an event; it does not prove the address owner's identity or physical presence.

## Users
- Organizer: creates an event and controls check-in status.
- Attendee: connects QoreX and checks in while the event is open.
- Verifier: looks up the receipt using transaction/event information.

## User stories
1. Organizer creates an event with a title and stable ID.
2. Organizer opens or closes check-in.
3. Attendee sees the connected account/network and approves a check-in with QoreX.
4. Attendee sees pending, confirmed, rejected, or failed transaction status.
5. Attendee copies a receipt with event ID, address, and transaction hash.
6. Verifier re-queries the chain and checks the transaction/event relationship.
7. New users understand what the signature proves and what data is public.

## Functional requirements
### Wallet and network
- Connect/disconnect QoreX using the supported QoreChain integration.
- On mobile, show a QR that opens the app URL and explain that connection must be approved from inside QoreX's dApp browser. A local development URL must be clearly marked as unavailable to other devices.
- Show testnet and shortened address.
- Block writes on the wrong network with a clear recovery instruction.
- Never request or retain key material.

### Event lifecycle
- Create event with non-empty title and stable unique ID.
- Event has open/closed check-in status.
- Organizer-only actions are enforced by contract/module authorization.

### Check-in and receipts
- Check-in is accepted only while event is open.
- Same address cannot check in twice to one event.
- Confirmed receipt shows event, shortened address, transaction hash, block/time where available, signature verdict where available, and explorer link.
- Verification re-queries chain data; browser-supplied receipt text is never trusted by itself.

## Non-functional requirements
- Responsive mobile and desktop layout.
- Plain language around fees, signatures, confirmation, and public records.
- No names, emails, student IDs, or other personal information on-chain.
- Verification fails closed when chain data is unavailable or inconsistent.
- Record exact SDK/package versions used.

## MVP acceptance checklist
- [ ] Scaffold created with `create-qorechain-dapp`.
- [ ] QoreX connects to testnet and account/network are shown accurately.
- [ ] Event is deployed/recorded on testnet.
- [ ] Attendee checks in with QoreX and receives a real transaction receipt.
- [ ] One hybrid-signed transaction is verified/read back on-chain; document exact hash and evidence.
- [ ] Verifier retrieves a real receipt from fresh chain data.
- [ ] Wrong network, rejected signature, duplicate, closed event, and RPC failure are handled.
- [ ] Public repo, MIT/Apache-2.0 license, README, cover image, testnet address, and <=3-minute demo are ready.

## Demo outline (2–3 minutes)
1. State the problem and what a receipt proves.
2. Connect QoreX on testnet.
3. Create/open a demo event.
4. Check in and approve the wallet prompt.
5. Show confirmed receipt, hybrid signature evidence, and explorer/readback.
6. Verify the receipt independently.
7. Show duplicate or closed-event rejection.

## Not in MVP
Identity verification, private attendance, real-value ticketing, token rewards, multiple chains, and automated recurring events.
