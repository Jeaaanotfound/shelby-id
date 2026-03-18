# ShelbyID

**Decentralized identity and portfolio layer for creators**, built on ShelbyServers and Aptos blockchain.

Live Demo: https://shelby-id.vercel.app

---

## What is ShelbyID?

ShelbyID gives every creator a permanent, on-chain identity. One link that proves:

- **Who you are** verified Aptos wallet identity
- **What you've made** all works stored on Shelby Protocol
- **Who owns it** cryptographic proof, forever on-chain

No platform can take it down. No algorithm can bury it.

---

## Features

- **Mint your ShelbyID** create your decentralized identity on Aptos
- **Creator portfolio** showcase all your works stored on Shelby
- **Personal dashboard** manage uploads, track storage, view file breakdown
- **Public gallery** share your works publicly with per-file public/private control
- **Shareable profile link** one permanent link tied to your wallet address
- **Verified badge** on-chain proof of identity
- **Multi-wallet support** connect with any AIP-62 compatible Aptos wallet

---

## Tech Stack

- React + TypeScript + Vite
- Shelby Protocol SDK (`@shelby-protocol/sdk` + `@shelby-protocol/react`)
- Aptos TypeScript SDK (`@aptos-labs/ts-sdk`)
- Aptos Wallet Adapter (`@aptos-labs/wallet-adapter-react`)
- TanStack React Query
- Tailwind CSS
- Network: Aptos Testnet

---

## Getting Started

```bash
git clone https://github.com/Jeaaanotfound/shelby-id
cd shelby-id
npm install --legacy-peer-deps
npm run dev
```

Create a `.env` file in the root directory:

```
VITE_SHELBY_API_KEY=aptoslabs_xxxxx
```

---

## Use Cases

- Creator portfolios
- On-chain identity verification
- Permanent public creative profiles
- Work ownership proof

---

## References

- [Shelby Docs](https://docs.shelby.xyz)
- [Aptos Explorer](https://explorer.aptoslabs.com)
- [Shelby Explorer](https://explorer.shelby.xyz)

---

## License

MIT
