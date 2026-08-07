import { ShelbyClient } from '@shelby-protocol/sdk/browser'
import { DEFAULT_NETWORK_KEY, type AppNetworkKey, getNetworkConfig } from './aptos'

const LEGACY_API_KEY = import.meta.env.VITE_SHELBY_API_KEY as string | undefined
const NETWORK_API_KEYS: Partial<Record<AppNetworkKey, string | undefined>> = {
  shelbynet:
    (import.meta.env.VITE_SHELBY_SHELBYNET_API_KEY as string | undefined) ??
    LEGACY_API_KEY,
}

export const SHELBY_NAMESPACE = 'shelbyid'
export const IDENTITY_BLOB_FILE = 'identity.json'
export const AVATAR_BLOB_FILE = 'avatar'
export const SHELBY_BLOB_EXPIRATION_DAYS = 365

const RESERVED_BLOB_FILES = new Set([IDENTITY_BLOB_FILE, AVATAR_BLOB_FILE])

if (import.meta.env.DEV) {
  Object.entries(NETWORK_API_KEYS).forEach(([networkKey, apiKey]) => {
    console.log(
      `[ShelbyID] ${networkKey} API Key:`,
      apiKey ? `${apiKey.slice(0, 8)}...` : 'NOT FOUND - requests will be anonymous'
    )
  })
}

export function getShelbyApiKey(networkKey: AppNetworkKey): string | undefined {
  return NETWORK_API_KEYS[networkKey]
}

export function createShelbyClient(networkKey: AppNetworkKey): ShelbyClient {
  const networkConfig = getNetworkConfig(networkKey)
  const apiKey = getShelbyApiKey(networkKey)

  return new ShelbyClient({
    network: networkConfig.aptosNetwork,
    indexer: { baseUrl: networkConfig.shelbyIndexerBase },
    ...(apiKey ? { apiKey } : {}),
  })
}

export function getShelbyApiBase(networkKey: AppNetworkKey = DEFAULT_NETWORK_KEY): string {
  return getNetworkConfig(networkKey).shelbyApiBase
}

export function getShelbyRpcBase(networkKey: AppNetworkKey = DEFAULT_NETWORK_KEY): string {
  return getNetworkConfig(networkKey).shelbyRpcBase
}

export function createExpirationMicros(days: number): number {
  return Date.now() * 1000 + days * 24 * 60 * 60 * 1_000_000
}

export function sanitizeBlobSegment(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return cleaned || 'file'
}

export function buildBlobName(walletAddress: string, fileName: string): string {
  return `${SHELBY_NAMESPACE}/${walletAddress}/${sanitizeBlobSegment(fileName)}`
}

export function getIdentityBlobName(walletAddress: string): string {
  return buildBlobName(walletAddress, IDENTITY_BLOB_FILE)
}

export function getAvatarBlobName(walletAddress: string): string {
  return buildBlobName(walletAddress, AVATAR_BLOB_FILE)
}

export function getBlobReadUrl(
  account: string,
  blobName: string,
  networkKey: AppNetworkKey = DEFAULT_NETWORK_KEY
): string {
  return `${getShelbyRpcBase(networkKey)}/v1/blobs/${account}/${blobName}`
}

export function getPublicBlobUrl(
  blobName: string,
  networkKey: AppNetworkKey = DEFAULT_NETWORK_KEY
): string {
  return `${getShelbyApiBase(networkKey)}/shelby/blobs/${blobName}`
}

export function formatShelbyErrorMessage(error: unknown, networkKey: AppNetworkKey): string {
  const fallback = error instanceof Error ? error.message : 'Unexpected Shelby error.'
  const normalized = fallback.toLowerCase()
  const networkLabel = getNetworkConfig(networkKey).label

  if (normalized.includes('api key not found') || normalized.includes('unauthorized') || normalized.includes('"code":"401"')) {
    return `Shelby ${networkLabel} API key is missing or invalid. Set a valid VITE_SHELBY_SHELBYNET_API_KEY in your .env and restart the app.`
  }

  if (
    normalized.includes('status: 500') ||
    normalized.includes('internal server error') ||
    normalized.includes('bad gateway') ||
    normalized.includes('service unavailable')
  ) {
    if (networkKey === 'shelbynet') {
      return 'ShelbyNet write service returned 500. The blob may not have been persisted. Try again later.'
    }

    return `${networkLabel} write service returned 500. The blob may not have been persisted. Try again later.`
  }

  if (normalized.includes('does not exist') && normalized.includes('upload id')) {
    return `Shelby ${networkLabel} closed the upload session before the write could be confirmed. This usually points to a network-side finalize issue. Try again shortly.`
  }

  return fallback
}

export function isReservedBlobPath(blobName: string): boolean {
  const fileName = blobName.split('/').pop()?.toLowerCase()
  return !!fileName && RESERVED_BLOB_FILES.has(fileName)
}
