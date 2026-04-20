import { useWallet as useAptosWallet, WalletReadyState } from '@aptos-labs/wallet-adapter-react'
import { getWalletAddress } from '../lib/aptos'

export function useWallet() {
  const { account, connected, isLoading, wallets = [], notDetectedWallets = [], connect, disconnect } = useAptosWallet()

  const address = connected ? getWalletAddress(account) : null
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null
  const installedWallets = wallets.filter((wallet) => wallet.readyState === WalletReadyState.Installed)
  const walletOptionsCount = wallets.length + notDetectedWallets.length

  const handleDisconnect = async () => {
    try { await disconnect() } catch (err) { console.error('Disconnect failed:', err) }
  }

  return {
    address,
    shortAddress,
    isConnecting: isLoading,
    installed: installedWallets.length > 0,
    hasWalletOptions: walletOptionsCount > 0,
    connected,
    connect: async (name: string) => {
      try { await connect(name as any) } catch (err) { console.error('Connect failed:', err) }
    },
    disconnect: handleDisconnect,
  }
}
