# ShelbyID Product Soul

## Purpose

ShelbyID gives Shelby storage a usable public surface for creators: wallet-linked identity, profile metadata, avatar, and a curated gallery of ShelbyNet work.

Shelby is the storage and Aptos-backed infrastructure layer. ShelbyID is the presentation and identity layer built on top of it.

## Product Position

ShelbyID should feel like a serious creator product, not a blockchain demo and not an infrastructure dashboard.

The product should communicate:

- wallet association without making legal or absolute ownership claims;
- network-backed storage without promising permanence;
- technical credibility without forcing users to understand RPCs or upload sessions;
- a profile that is easy to read, share, and verify.

## Design Direction

- Dark-first, editorial, gallery-like, and restrained.
- Premium through composition, typography, spacing, and useful hierarchy.
- Warm off-white text, muted surfaces, precise borders, and controlled coral/pink accents.
- Avoid neon overload, generic glassmorphism, excessive gradients, dashboard clutter, and AI-generated startup language.
- Present a file as a work or archive object, not just a blob.
- Use motion to clarify loading, upload progress, success, failure, and navigation.
- Treat mobile behavior as part of the product, not a later patch.

## Voice

Write like a product team that understands creators and infrastructure.

- Direct, calm, specific, and human.
- Prefer `Upload to Shelby` over `Initiate decentralized data persistence.`
- Prefer `Your wallet is on the wrong network` over `Network mismatch detected.`
- Prefer `ShelbyNet write service returned 500` over a vague `Something went wrong.`
- Do not use hype such as `revolutionary`, `world-changing`, `forever`, `unstoppable`, or `the future` without evidence.
- Do not call a prototype production-ready without runtime evidence.

## UX Rules

- Always tell the user what is happening during a transaction or upload.
- Distinguish wallet rejection, wrong network, API authentication failure, missing blob, and Shelby service failure.
- Keep failed upload status visible long enough to understand the reason.
- Do not spam reads after a server-side failure.
- Use ShelbyNet consistently across client, wallet checks, reads, writes, API keys, explorer links, and share URLs.
- If a blob already exists and no wallet approval is required, explain why.
- Do not present a local UI toggle as real privacy or access control.

## Technical Honesty

- A successful Aptos registration does not automatically prove that the blob is readable from the RPC.
- A `500` from a Shelby write or finalize endpoint is an unconfirmed service-side failure.
- A `404` after a failed write means persistence was not confirmed; it does not prove the UI is wrong.
- `VITE_*` API keys are browser-visible client keys. Never put admin secrets in them.
- Expiration is part of the storage contract. The UI and documentation must not imply that current blobs are permanent.
