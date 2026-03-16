import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'

export function useWallet() {
  const {
    account,
    connected,
    connecting,
    wallets = [],
    connect,
    disconnect,
  } = useAptosWallet()

  const address = connected && account
    ? account.address.toString()
    : null

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null

  // Filter hanya wallet yang sudah ter-install di browser
  const installedWallets = wallets.filter(
    (w) => (w as any).readyState === 'Installed'
  )
  const hasInstalled = installedWallets.length > 0

  const handleConnect = async () => {
    if (!hasInstalled) {
      window.open('https://petra.app/', '_blank')
      return
    }
    try {
      await connect(installedWallets[0].name)
    } catch (err) {
      console.error('Connect failed:', err)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (err) {
      console.error('Disconnect failed:', err)
    }
  }

  return {
    address,
    shortAddress,
    isConnecting: connecting,
    installed: hasInstalled,
    connected,
    connect: handleConnect,
    disconnect: handleDisconnect,
  }
}
