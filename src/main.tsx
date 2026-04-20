import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react'
import './index.css'
import App from './App.tsx'
import { AppSettingsProvider, useAppSettings } from './context/AppSettings'
import { ToastProvider } from './context/ToastContext'
import { WalletRuntimeProvider, useWalletRuntime } from './context/WalletRuntime'
import { getAptosApiKey } from './lib/aptos'

function RuntimeProviders() {
  const { networkConfig, networkKey } = useAppSettings()
  const { walletRuntimeVersion } = useWalletRuntime()

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
        },
      }),
    [networkKey]
  )

  const aptosApiKeys = useMemo(
    () => ({
      testnet: getAptosApiKey('testnet'),
      shelbynet: getAptosApiKey('shelbynet'),
    }),
    []
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        key={`${networkKey}-${walletRuntimeVersion}`}
        autoConnect
        dappConfig={{
          network: networkConfig.aptosNetwork,
          aptosApiKeys,
        }}
        onError={(error) => console.error('[Wallet]', error)}
      >
        <App key={networkKey} />
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <WalletRuntimeProvider>
        <AppSettingsProvider>
          <RuntimeProviders />
        </AppSettingsProvider>
      </WalletRuntimeProvider>
    </ToastProvider>
  </StrictMode>,
)
