import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

export const WALLET_MODAL_REOPEN_STORAGE_KEY = 'shelbyid.walletModalReopen'

interface WalletRuntimeContextValue {
  walletRuntimeVersion: number
  refreshWalletDetection: () => void
}

const WalletRuntimeContext = createContext<WalletRuntimeContextValue | null>(null)

export function WalletRuntimeProvider({ children }: PropsWithChildren) {
  const [walletRuntimeVersion, setWalletRuntimeVersion] = useState(0)

  const refreshWalletDetection = useCallback(() => {
    setWalletRuntimeVersion((value) => value + 1)
  }, [])

  const value = useMemo(
    () => ({
      walletRuntimeVersion,
      refreshWalletDetection,
    }),
    [refreshWalletDetection, walletRuntimeVersion]
  )

  return <WalletRuntimeContext.Provider value={value}>{children}</WalletRuntimeContext.Provider>
}

export function useWalletRuntime() {
  const context = useContext(WalletRuntimeContext)

  if (!context) {
    throw new Error('useWalletRuntime must be used inside WalletRuntimeProvider')
  }

  return context
}
