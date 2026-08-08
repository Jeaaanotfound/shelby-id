# ShelbyID Tasks

Last updated: 2026-08-08

## Current State

- Live app: `https://shelby-id.vercel.app`.
- Repository: `https://github.com/Jeaaanotfound/shelby-id`.
- Runtime target: ShelbyNet only.
- The app uses Aptos wallet signing for blob registration and Shelby reads/writes for identity, avatar, and portfolio files.
- Do not call the app production-ready only because the build passes. ShelbyNet runtime evidence is still required.

## Product Scope

ShelbyID is a creator-facing identity and portfolio surface. A user can connect an Aptos wallet, store identity metadata and an avatar on Shelby, upload portfolio files, and share a profile backed by a wallet address and ShelbyNet blob records.

## Completed Work

- Premium dark-first UI for Home, Mint, Workspace, Gallery, and Profile.
- Brand mark, wordmark, monochrome logo, and favicon assets.
- Aptos wallet adapter with refresh and reconnect handling.
- ShelbyNet-only network configuration, wallet checks, API keys, reads, writes, and explorer links.
- Identity metadata and avatar blob reads/writes.
- Gallery and workspace upload flows with wallet signing.
- Notifications for success, rejection, wrong network, authentication errors, and Shelby service errors.
- Upload progress stages from preparation through blob verification.
- ShelbyNet `500` errors remain visible as unconfirmed service-side failures.
- New identity, avatar, and portfolio writes use a documented 365-day blob expiration.
- Profile verification reads blob status, expiry, Merkle root, and registration activity from Shelby metadata.
- Uploads preflight APT and ShelbyUSD balances before writing.
- Upload success waits for ShelbyNet read-back metadata with `isWritten`, exact size, and matching Merkle root.
- Success notifications expose the confirmed Aptos transaction and the relevant Shelby Explorer blob link.
- ShelbyNet indexer compatibility is aligned with the current schema: SDK `0.6.0`, React bindings `4.1.0`, and `object_name`-based activity queries.
- The mint preflight no longer calls the removed legacy `blob_name` GraphQL field or the old `getBlobMetadata` helper.
- README setup and deployment documentation with product screenshot.
- Context files: `tasks.md`, `soul.md`, `memory.md`, and `list.md`.

## Next Work

1. Verify mint, avatar upload, small upload, approximately 1 MB upload, larger upload, refresh, explorer links, and funding errors on the deployed ShelbyNet app after redeploy.
2. Verify the Profile verification panel against live ShelbyNet metadata and activity responses.
3. Verify that the displayed registration activity is the correct transaction for the identity blob.
4. Add a renewal flow before the 365-day expiration window ends.
5. Confirm that all submission copy matches the actual implementation and ShelbyNet behavior.
6. Run `node .\\node_modules\\typescript\\bin\\tsc -b` and `npm.cmd run build` before every review push.
7. Check `git status`, commit only intentional files, push to the existing `main` branch, and verify the resulting Vercel deployment.

## Release Checklist

- `VITE_SHELBY_SHELBYNET_API_KEY` is set in Vercel.
- `VITE_APTOS_SHELBYNET_API_KEY` is set when available.
- All Vercel variables are browser/client keys, never admin secrets.
- Vercel Production branch is `main`.
- Build command is `npm run build`.
- Output directory is `dist`.
- A fresh deployment is created after environment changes.
- Wallet connect, mint, avatar upload, portfolio upload, reads, and explorer links are tested on the deployed URL.

## Guardrails

- Never commit `.env` or real API keys.
- Never claim permanent, censorship-proof, deletion-proof, or authorship-proof behavior without a verifiable product path and supporting protocol semantics.
- Be explicit that ShelbyNet is a builder network and may reset.
- Keep failed writes visible; never show success without a confirmed readable blob.
- Preserve the existing GitHub repository and avoid destructive Git commands.
