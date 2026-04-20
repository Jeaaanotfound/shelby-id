# ShelbyID

ShelbyID is a creator identity layer built on Shelby Protocol and Aptos. It turns a wallet into a public profile, a shareable archive, and a cleaner way to present work stored on Shelby.

![ShelbyID product preview](docs/images/shelbyid-app.png)

Live: [shelby-id.vercel.app](https://shelby-id.vercel.app/)  
Repo: [Jeaaanotfound/shelby-id](https://github.com/Jeaaanotfound/shelby-id)

## What ShelbyID does

ShelbyID gives creators a durable public surface on top of decentralized storage.

- Mint a Shelby-backed identity tied to an Aptos wallet
- Upload media to Shelby and keep it organized as a real profile, not a raw blob list
- Publish a shareable gallery with profile metadata, avatar, and archived work
- Switch between ShelbyNet and Testnet from the same app
- Present onchain work in a way that feels usable to communities, collaborators, and collectors

## Why it exists

Shelby storage is strong infrastructure, but most people do not want to interact with infrastructure directly. ShelbyID gives that storage a front door: identity, presentation, and a public link that feels intentional.

## Product surfaces

- Home: a premium landing surface that explains the identity layer
- Mint: create a ShelbyID profile and store identity metadata on Shelby
- Workspace: upload and manage creator files
- Gallery: present public work through a cleaner archival view
- Profile: show identity, avatar, and creator metadata in one place

## Stack

- React
- TypeScript
- Vite
- Aptos TypeScript SDK
- Aptos Wallet Adapter
- Shelby Protocol SDK and React hooks
- TanStack Query
- Vercel

## Networks

- ShelbyNet
- Aptos Testnet

ShelbyID is network-aware, including explorer links, storage reads, wallet flows, and per-network API key handling.

## Local development

```bash
git clone https://github.com/Jeaaanotfound/shelby-id
cd shelby-id
npm install
npm run dev
```

Create a `.env` file in the project root:

```env
VITE_SHELBY_TESTNET_API_KEY=
VITE_SHELBY_SHELBYNET_API_KEY=
VITE_APTOS_TESTNET_API_KEY=
VITE_APTOS_SHELBYNET_API_KEY=
```

If you only have Shelby API keys, the app can still use those without the Aptos-specific ones.

## Deployment

For Vercel:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Production Branch: `main`

Environment variables:

- `VITE_SHELBY_TESTNET_API_KEY`
- `VITE_SHELBY_SHELBYNET_API_KEY`
- `VITE_APTOS_TESTNET_API_KEY`
- `VITE_APTOS_SHELBYNET_API_KEY`

## References

- [Shelby Docs](https://docs.shelby.xyz)
- [Shelby Explorer](https://explorer.shelby.xyz)
- [Aptos Docs](https://aptos.dev)

## License

MIT
