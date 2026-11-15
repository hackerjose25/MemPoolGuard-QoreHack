# Quantum Queue

**Post-quantum event check-in with a receipt anyone can verify.**

Quantum Queue is a small QoreChain testnet web app for event check-in. An organizer creates an event and opens a check-in window. An attendee connects QoreX, checks in, and receives a receipt tied to a transaction on QoreChain. The app reads the receipt back from the chain so it can be verified without relying on a screenshot.

> Status: app starter and first QoreX connection screen are in progress. No contract is deployed and no transaction or receipt has been verified yet.

## Why this project

Quantum Queue is designed for Quantum Pass: build with `create-qorechain-dapp`, connect QoreX, deploy on testnet, and complete a hybrid-signed transaction. Check-in gives that transaction a clear user-facing purpose.

## MVP flow

1. Organizer connects QoreX and creates an event.
2. Organizer opens check-in.
3. Attendee connects QoreX and checks in once.
4. App shows a receipt with event ID, shortened wallet address, transaction hash, confirmation, and signature verdict when available.
5. Anyone can verify the receipt by looking up the transaction on-chain.

## MVP scope

- Responsive web app; event creation and open/close controls.
- QoreX connection with visible account and testnet state.
- One check-in per address per event.
- Testnet deployment and a demonstrated hybrid-signed transaction.
- On-chain receipt lookup, explorer link, and clear pending/confirmed/rejected/error states.

## Out of scope

No identity/KYC, private attendance, email collection, NFTs, tokens, rewards, multi-chain support, ticket sales, or recurring events. A wallet address proves an on-chain action; it does not prove a person's real-world identity. Public chain data is public and durable.

## Submission checklist

The current Quantum Pass page calls for an original small app/tool/game/bot, `create-qorechain-dapp`, QoreX, testnet deployment, and one hybrid-signed transaction. The rules also list a public GitHub repository, README, MIT or Apache-2.0 license, cover image, video up to three minutes, and testnet address. Check the live site for current rules and dates.

## Documentation

- [Product specification](docs/PRODUCT_SPEC.md)
- [Technical plan](docs/TECHNICAL_PLAN.md)
- [Build history](docs/BUILD_LOG.md)
- [Decision record](docs/DECISIONS.md)
- [AI usage log](AI_USAGE.md)
- [Agent instructions](AGENTS.md)

## Run the app

The generated Vite app lives in `app/`. Use Node.js 20 or newer and install dependencies from that directory:

```sh
cd app
pnpm install
pnpm dev
```

The first screen connects through QoreX's native provider on `qorechain-diana`. If QoreX is not injected, Connect QoreX shows a QR for the app URL and guides the attendee to open that URL in QoreX's dApp browser. Phone scanning requires the app to be hosted at a public HTTPS address; a local `localhost` preview cannot be opened by another device. Keep QoreX set to testnet. Event creation remains disabled until the event registry contract is implemented and deployed. Do not treat this starter screen as evidence of an on-chain event or receipt.

## Project layout

```text
AGENTS.md  AI_USAGE.md  LICENSE  README.md
app/                    # generated starter app
contracts/              # contract and deployment scripts
docs/                   # specifications and project history
```

The app is generated from the official scaffold; contract sources and deployment scripts will be added under `contracts/` when the registry implementation is selected.

## Status

| Milestone | Status |
|---|---|
| Track requirements and product plan | Done |
| App scaffold | Generated with `create-qorechain-dapp@0.14.0` (`fullstack-web`) |
| QoreX integration | Native testnet connection screen started; hybrid transaction not yet submitted |
| Contract and testnet deployment | Not started |
| Hybrid-signed transaction and readback | Not started |
| Demo and submission materials | Not started |

## Official links

- [Quantum Pass track](https://build.qorechain.io/)
- [Start here](https://build.qorechain.io/start)
- [Kits](https://build.qorechain.io/kits)
- [Rules](https://build.qorechain.io/rules)
- [Technical overview](https://docs.qorechain.io/build-before-qday/overview/)
