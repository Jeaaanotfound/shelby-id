import { AccountAddress, Network } from '@aptos-labs/ts-sdk'
import type { WalletContextState } from '@aptos-labs/wallet-adapter-react'

export type AppNetworkKey = 'shelbynet' | 'testnet'

export interface AppNetworkConfig {
  key: AppNetworkKey
  label: string
  badge: string
  tagline: string
  note: string
  aptosNetwork: Network.TESTNET | Network.SHELBYNET | Network.LOCAL
  aptosApiBase: string
  shelbyApiBase: string
  shelbyRpcBase: string
  shelbyExplorerBase: string
}

export const DEFAULT_NETWORK_KEY: AppNetworkKey = 'shelbynet'

const LEGACY_APTOS_API_KEY = import.meta.env.VITE_APTOS_API_KEY as string | undefined
const LEGACY_SHELBY_API_KEY = import.meta.env.VITE_SHELBY_API_KEY as string | undefined

export const APP_NETWORKS: Record<AppNetworkKey, AppNetworkConfig> = {
  shelbynet: {
    key: 'shelbynet',
    label: 'ShelbyNet',
    badge: 'builder network',
    tagline: 'Fast iteration lane for the Shelby community.',
    note: 'ShelbyNet is a developer network and may reset periodically.',
    aptosNetwork: Network.SHELBYNET,
    aptosApiBase: 'https://api.shelbynet.shelby.xyz/v1',
    shelbyApiBase: 'https://api.shelbynet.shelby.xyz',
    shelbyRpcBase: 'https://api.shelbynet.shelby.xyz/shelby',
    shelbyExplorerBase: 'https://explorer.shelby.xyz/shelbynet',
  },
  testnet: {
    key: 'testnet',
    label: 'Testnet',
    badge: 'stable sandbox',
    tagline: 'Safer testing with the public Aptos testnet surface.',
    note: 'Best for broader compatibility checks before mainnet work.',
    aptosNetwork: Network.TESTNET,
    aptosApiBase: 'https://api.testnet.aptoslabs.com/v1',
    shelbyApiBase: 'https://api.testnet.shelby.xyz',
    shelbyRpcBase: 'https://api.testnet.shelby.xyz/shelby',
    shelbyExplorerBase: 'https://explorer.shelby.xyz/testnet',
  },
}

export function isAppNetworkKey(value: string | null | undefined): value is AppNetworkKey {
  return value === 'shelbynet' || value === 'testnet'
}

export function getNetworkConfig(networkKey: AppNetworkKey): AppNetworkConfig {
  return APP_NETWORKS[networkKey]
}

export function getAptosApiKey(networkKey: AppNetworkKey): string | undefined {
  if (networkKey === 'shelbynet') {
    return (
      (import.meta.env.VITE_APTOS_SHELBYNET_API_KEY as string | undefined) ??
      (import.meta.env.VITE_SHELBY_SHELBYNET_API_KEY as string | undefined) ??
      LEGACY_APTOS_API_KEY ??
      LEGACY_SHELBY_API_KEY
    )
  }

  return (
    (import.meta.env.VITE_APTOS_TESTNET_API_KEY as string | undefined) ??
    (import.meta.env.VITE_SHELBY_TESTNET_API_KEY as string | undefined) ??
    LEGACY_APTOS_API_KEY ??
    LEGACY_SHELBY_API_KEY
  )
}

export function getAptosAccountExplorerUrl(address: string, networkKey: AppNetworkKey): string {
  return `https://explorer.aptoslabs.com/account/${normalizeAddress(address)}?network=${networkKey}`
}

export function getShelbyExplorerUrl(networkKey: AppNetworkKey): string {
  return getNetworkConfig(networkKey).shelbyExplorerBase
}

export function getShelbyAccountExplorerUrl(address: string, networkKey: AppNetworkKey): string {
  return `${getShelbyExplorerUrl(networkKey)}/account/${normalizeAddress(address)}`
}

export function getShelbyBlobExplorerUrl(
  address: string,
  blobName: string,
  networkKey: AppNetworkKey
): string {
  return `${getShelbyExplorerUrl(networkKey)}/blobs/${normalizeAddress(address)}?blobName=${encodeURIComponent(blobName)}`
}

type WalletAccountLike =
  | WalletContextState['account']
  | { address?: string | { toString(): string } | null }
  | null
  | undefined

type WalletSignerFn = WalletContextState['signAndSubmitTransaction'] | null | undefined

export function getWalletAddress(account: WalletAccountLike): string | null {
  if (!account || !('address' in account) || !account.address) return null
  return account.address.toString()
}

export function normalizeAddress(address: string): string {
  return AccountAddress.from(address.trim()).toString()
}

export function isValidAptosAddress(address: string): boolean {
  try {
    normalizeAddress(address)
    return true
  } catch {
    return false
  }
}

export function sameAddress(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false

  try {
    return normalizeAddress(left) === normalizeAddress(right)
  } catch {
    return left.trim().toLowerCase() === right.trim().toLowerCase()
  }
}

export function createWalletAdapterSigner(
  account: WalletAccountLike,
  signAndSubmitTransaction: WalletSignerFn
) {
  const address = getWalletAddress(account)

  if (!address || !signAndSubmitTransaction) {
    return null
  }

  return {
    account: address,
    signAndSubmitTransaction,
  }
}
