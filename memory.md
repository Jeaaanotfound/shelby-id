# ShelbyID Technical Memory

Last updated: 2026-08-08

## Repository

- Local workspace: `C:\Users\User\Desktop\ShelbyID`
- GitHub: `https://github.com/Jeaaanotfound/shelby-id`
- Deployment: `https://shelby-id.vercel.app`
- Branch: `main`
- Keep working in the existing repository. Do not create a replacement repository.

## Stack

- React 18, TypeScript, Vite
- `@aptos-labs/ts-sdk`
- Aptos wallet adapter
- `@shelby-protocol/sdk`
- `@shelby-protocol/react`
- TanStack Query
- Vercel

Current Shelby package versions are `@shelby-protocol/sdk@0.6.0` and `@shelby-protocol/react@4.1.0`, with `@aptos-labs/ts-sdk@5.2.1`. These versions match the current ShelbyNet indexer schema.

## Important Files

- `src/main.tsx`: providers and app bootstrap.
- `src/App.tsx`: page selection and share URL handling.
- `src/context/AppSettings.tsx`: theme, ShelbyNet config, and Shelby client.
- `src/context/ToastContext.tsx`: global notifications.
- `src/context/WalletRuntime.tsx`: wallet detection refresh behavior.
- `src/lib/aptos.ts`: ShelbyNet config, API key fallback, address normalization, explorer URLs.
- `src/lib/shelby.ts`: Shelby client, API key, blob naming, reads, and error messages.
- `src/lib/shelbyWrite.ts`: Aptos registration, signing, Shelby upload, confirmation, and progress.
- `src/lib/transactions.ts`: wrong-network, rejected-wallet, and transaction errors.
- `src/hooks/useIdentity.ts`: identity blob reads.
- `src/hooks/useAvatar.ts`: avatar blob reads and missing-avatar handling.
- `src/components/CreateID.tsx`: identity write flow.
- `src/components/AvatarPicker.tsx`: avatar write flow.
- `src/components/Dashboard.tsx`: workspace upload flow.
- `src/components/Gallery.tsx`: gallery upload, filters, progress, and explorer links.
- `src/components/Profile.tsx`: public identity/profile presentation.

## ShelbyNet Configuration

- Aptos/Shelby API base: `https://api.shelbynet.shelby.xyz`
- Shelby RPC base: `https://api.shelbynet.shelby.xyz/shelby`
- Shelby Explorer: `https://explorer.shelby.xyz/shelbynet`
- Shelby indexer: `https://api.shelbynet.shelby.xyz/v1/graphql`
- Shelby API key: `VITE_SHELBY_SHELBYNET_API_KEY`
- Aptos API key: `VITE_APTOS_SHELBYNET_API_KEY`

Deprecated network values must not be exposed as selectable app targets. The transaction guard may still identify a wallet on a deprecated network so it can show a useful wrong-network message.

## Blob Conventions

- Namespace: `shelbyid`
- Identity file: `identity.json`
- Avatar file: `avatar`
- Reserved identity/avatar paths are excluded from portfolio counts.
- Creator files are wallet-scoped and sanitized before building blob names.

## Upload Behavior

- Every upload uses the current wallet-adapter flow: one batch registration approval, Shelby v2 chunkset upload, and one `commit_object` approval per blob. This supports both new blobs and overwrites without the removed v1 multipart route.
- The registration payload uses the ShelbyNet location hint `shelbynet-1`.
- The app waits for registration and commit transaction confirmation, storage-provider acknowledgements, and Shelby coordination read-back before showing success.
- Read-back requires `isWritten`, the expected byte size, and the expected Merkle root from `coordination.getFullObjectMetadata`.
- Success notifications expose the confirmed Aptos transaction and the relevant Shelby Explorer blob link.
- New writes use `SHELBY_BLOB_EXPIRATION_DAYS` (currently 365 days) for identity, avatar, and portfolio blobs.
- Uploads check APT and ShelbyUSD balances before registration/storage writes and fail with a funding-specific message when either is zero.
- A failed commit or read-back verification is never shown as success.
- Current ShelbyNet indexer fields use `object_name`, `is_persisted`, `is_committed`, and `blob_commitment`; do not reintroduce the old `blob_name` query shape.
- Upload UI exposes preparation, wallet approval, registration, upload, finalization, verification, success, and failure.

## Common Failure Patterns

### `401 Unauthorized`

Usually means the ShelbyNet API key is missing or invalid. Check `VITE_SHELBY_SHELBYNET_API_KEY` in Vercel and redeploy after changing it.

### `404` for avatar or blob

The blob may not exist on ShelbyNet, the write may not have persisted, or the account/blob name/read URL may be wrong. Check all four together.

### `500` from a ShelbyNet write/finalize endpoint

Treat it as an unconfirmed service-side failure. Show: `ShelbyNet write service returned 500. The blob may not have been persisted. Try again later.` Do not hide the error or loop indefinitely.

### Funding preflight

Registration and storage writes require usable ShelbyNet funding. The app checks APT and ShelbyUSD first. A zero balance produces a direct funding message; a failed balance lookup remains an error and does not continue to the write.

### Vercel install/build failures

- Keep `.npmrc` with `legacy-peer-deps=true` only if dependency resolution requires it.
- Do not add Windows-only Rollup packages as top-level dependencies.
- Keep `package.json` and the lockfile aligned with published package versions.
- Keep the `aptos` compatibility package if the wallet dependency imports it during Vite bundling.

## Verification Routine

1. Run `node .\\node_modules\\typescript\\bin\\tsc -b`.
2. Run `npm.cmd run build` when the local environment permits Vite/esbuild.
3. Test the deployed ShelbyNet app after Vercel redeploys.
4. Test wallet connect, mint, avatar, small upload, approximately 1 MB upload, larger upload, refresh, explorer links, verification activity, expiry display, and funding errors.
5. Check browser Console and Network for the exact failing request.
6. Only then state whether the issue is solved.

## Git and Deployment

- Commit focused changes with a clear message.
- Push to the existing `main` branch.
- Never commit `.env` or API key values.
- Vercel uses `VITE_SHELBY_SHELBYNET_API_KEY` and optional `VITE_APTOS_SHELBYNET_API_KEY`.
- Trigger a fresh deployment after environment changes.
