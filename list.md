# ShelbyID Review Checklist

Last updated: 2026-08-08

Use this checklist before asking Shelby to review the repository. Do not mark an item complete without testing the deployed ShelbyNet app.

## P0 - Required Before Review

- [ ] Replace unsupported claims such as `permanent`, `cannot be deleted`, `cannot be altered`, and absolute `ownership proof`.
- [ ] Use `wallet-linked identity`, `onchain blob registration`, and `cryptographic blob commitments` in product copy.
- [ ] Decide the expiration policy for identity, avatar, and portfolio files.
- [x] New identity, avatar, and portfolio writes use a documented 365-day expiration policy. Existing blobs may retain their original expiry.
- [x] Display blob expiration dates in the Profile UI.
- [x] Add a Profile verification panel.
- [ ] Show wallet address, ShelbyNet, blob name, blob type, status, registration transaction, expiration, and commitment reference.
- [ ] Add direct Aptos Explorer and Shelby Explorer links.
- [ ] Make upload success depend on confirmed `written` status, not only an HTTP response.
- [ ] Keep the gallery honest: no UI control may claim private access unless privacy is persisted and enforced.
- [ ] Keep ShelbyNet service errors visible and actionable.

## P1 - Strongly Recommended

- [x] Add an APT balance preflight before registration transactions.
- [x] Add a ShelbyUSD/storage balance preflight before blob uploads.
- [ ] Explain funding requirements before signing.
- [ ] Show the registration transaction hash after success.
- [ ] Add retry only for known transient failures.
- [ ] Stop polling after repeated service failures.
- [ ] Add a retry action for failed uploads.
- [ ] Add renewal handling before expiration.
- [ ] Add clear empty states for accounts without an identity or portfolio files.
- [ ] Confirm every explorer URL resolves to ShelbyNet.
- [ ] Add a short explanation of how identity, registration, and blob verification work.

## P2 - Product Polish

- [ ] Add a short demo video showing mint, upload, verification, and share.
- [ ] Add screenshots for Home, Mint, Workspace, Gallery, and Profile to the README.
- [ ] Add a small architecture diagram to the README.
- [ ] Add troubleshooting for wallet detection, API keys, wrong network, and service failures.
- [ ] Complete mobile QA for wallet and upload flows.
- [ ] Check keyboard navigation, focus states, image alt text, and button labels.
- [ ] Check loading, success, rejection, and failure states visually.
- [ ] Remove API key prefix logs from production builds.

## ShelbyNet Test Matrix

### Wallet

- [ ] Wallet is detected on first load.
- [ ] Wallet reconnect works after refresh.
- [ ] A wallet on a deprecated or unsupported network is blocked with a clear ShelbyNet message.
- [ ] Rejected transactions produce a rejection notification.

### Identity

- [ ] Mint a new ShelbyID on ShelbyNet.
- [ ] Reopen the profile after refresh.
- [ ] Read identity metadata from the correct ShelbyNet blob.
- [ ] Open the identity blob in Shelby Explorer.
- [ ] Confirm the Aptos registration transaction in Aptos Explorer.

### Avatar

- [ ] Upload a new avatar on ShelbyNet.
- [ ] Avatar appears after refresh.
- [ ] Missing avatar shows a clean fallback.
- [ ] Avatar read errors do not spam the console.

### Portfolio Files

- [ ] Upload a small image.
- [ ] Upload an image around 1 MB.
- [ ] Upload a file larger than 1 MB.
- [ ] Upload multiple files.
- [ ] Upload a file whose blob is already registered.
- [ ] Confirm every upload stage is visible.
- [ ] Confirm a failed upload stays visible with the reason.
- [ ] Confirm the blob is readable before showing success.
- [ ] Open each file through the ShelbyNet Explorer link.

### Vercel

- [ ] `VITE_SHELBY_SHELBYNET_API_KEY` is set for the deployment environment.
- [ ] `VITE_APTOS_SHELBYNET_API_KEY` is set when available.
- [ ] Environment variables are client/browser keys, not admin secrets.
- [ ] A fresh deployment was created after changing environment variables.
- [ ] `npm run build` passes in Vercel.
- [ ] Production URL loads without a blank screen.
- [ ] Production wallet, mint, upload, read, and explorer flows pass.

## Submission Copy Rules

Use:

- `wallet-linked creator identity`
- `onchain blob registration`
- `cryptographic blob commitments`
- `ShelbyNet-backed storage`
- `shareable profile and gallery`
- `working prototype deployed on Vercel`

Avoid until technically verified:

- `permanent`
- `indestructible`
- `cannot be deleted`
- `cannot be altered`
- `proves authorship`
- `cryptographic receipt` when no receipt is exposed or verifiable in the app
- `mainnet-ready` without mainnet testing

## Final Sign-off

- [ ] Code review complete.
- [ ] ShelbyNet runtime matrix complete.
- [ ] README matches actual behavior.
- [ ] Submission text matches actual behavior.
- [ ] No API keys are committed.
- [ ] Vercel deployment is green.
- [ ] Source and deployment links are correct.
- [ ] Known limitations are documented honestly.
