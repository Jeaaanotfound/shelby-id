import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'

export function useWallet() {
  const { account, connected, wallets = [], connect, disconnect } = useAptosWallet()

  const address = connected && account ? account.address.toString() : null
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null
  const installedWallets = wallets.filter((w) => (w as any).readyState === 'Installed')

  const handleDisconnect = async () => {
    try { await disconnect() } catch (err) { console.error('Disconnect failed:', err) }
  }

  return {
    address,
    shortAddress,
    isConnecting: false,
    installed: installedWallets.length > 0,
    connected,
    connect: async (name: string) => {
      try { await connect(name as any) } catch (err) { console.error('Connect failed:', err) }
    },
    disconnect: handleDisconnect,
  }
}
