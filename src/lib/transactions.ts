import { Network } from '@aptos-labs/ts-sdk'
import type { WalletContextState } from '@aptos-labs/wallet-adapter-react'
import { getNetworkConfig, type AppNetworkKey } from './aptos'

type WalletNetworkLike = WalletContextState['network']
type WalletChangeNetworkFn = WalletContextState['changeNetwork'] | null | undefined

interface EnsureWalletNetworkParams {
  walletNetwork: WalletNetworkLike
  changeNetwork: WalletChangeNetworkFn
  networkKey: AppNetworkKey
  notify: (input: { title: string; description?: string; tone?: 'success' | 'error' | 'warning' | 'info' }) => void
}

export function getWalletNetworkName(walletNetwork: WalletNetworkLike): Network | null {
  return walletNetwork?.name ?? null
}

function normalizeUrl(url: string | undefined): string {
  return (url ?? '').trim().toLowerCase()
}

function resolveWalletNetworkKey(walletNetwork: WalletNetworkLike): AppNetworkKey | null {
  const networkName = walletNetwork?.name
  const networkUrl = normalizeUrl(walletNetwork?.url)

  if (networkName === Network.SHELBYNET) return 'shelbynet'
  if (networkName === Network.TESTNET) return 'testnet'

  if (networkUrl.includes('api.shelbynet.shelby.xyz')) return 'shelbynet'
  if (networkUrl.includes('api.testnet.aptoslabs.com') || networkUrl.includes('api.testnet.shelby.xyz')) return 'testnet'

  return null
}

function getWalletNetworkLabel(walletNetwork: WalletNetworkLike): string {
  const resolved = resolveWalletNetworkKey(walletNetwork)

  if (resolved) {
    return getNetworkConfig(resolved).label
  }

  const networkName = getWalletNetworkName(walletNetwork)
  if (networkName) {
    return String(networkName)
  }

  return 'unknown network'
}

export function isWalletRejectedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  return (
    message.includes('rejected') ||
    message.includes('declined') ||
    message.includes('denied') ||
    message.includes('cancelled') ||
    message.includes('canceled') ||
    message.includes('user response status rejected') ||
    message.includes('4001')
  )
}

export async function ensureWalletMatchesAppNetwork({
  walletNetwork,
  networkKey,
  notify,
}: EnsureWalletNetworkParams) {
  const targetNetwork = getNetworkConfig(networkKey)
  const resolvedWalletNetworkKey = resolveWalletNetworkKey(walletNetwork)

  if (!walletNetwork || !getWalletNetworkName(walletNetwork)) {
    return
  }

  if (resolvedWalletNetworkKey === networkKey) {
    return
  }

  if (!resolvedWalletNetworkKey) {
    return
  }

  const currentLabel = getWalletNetworkLabel(walletNetwork)

  notify({
    tone: 'warning',
    title: 'Wrong wallet network',
    description: `Your wallet is on ${currentLabel}. Switch to ${targetNetwork.label} before continuing.`,
  })

  throw new Error(`Switch your wallet to ${targetNetwork.label} and try again.`)
}

export function getTransactionErrorMessage(error: unknown, actionLabel: string, networkKey: AppNetworkKey): string {
  if (isWalletRejectedError(error)) {
    return `${actionLabel} was declined in your wallet.`
  }

  const fallback = error instanceof Error ? error.message : `Something went wrong while trying to ${actionLabel.toLowerCase()}.`
  const networkLabel = getNetworkConfig(networkKey).label

  if (fallback.toLowerCase().includes('network')) {
    return fallback
  }

  return `${fallback}${fallback.endsWith('.') ? '' : '.'} Active network: ${networkLabel}.`
}
