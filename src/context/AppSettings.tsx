import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { createShelbyClient } from '../lib/shelby'
import {
  DEFAULT_NETWORK_KEY,
  getNetworkConfig,
  type AppNetworkConfig,
  type AppNetworkKey,
} from '../lib/aptos'

export type AppTheme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'shelbyid.theme'

interface AppSettingsContextValue {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  toggleTheme: () => void
  networkKey: AppNetworkKey
  networkConfig: AppNetworkConfig
  shelbyClient: ReturnType<typeof createShelbyClient>
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null)

function getInitialTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark'

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'dark'
}

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme)
  const networkKey: AppNetworkKey = DEFAULT_NETWORK_KEY

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const networkConfig = useMemo(() => getNetworkConfig(networkKey), [networkKey])
  const shelbyClient = useMemo(
    () => createShelbyClient(networkKey),
    [networkKey]
  )

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
      networkKey,
      networkConfig,
      shelbyClient,
    }),
    [theme, networkKey, networkConfig, shelbyClient]
  )

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext)

  if (!context) {
    throw new Error('useAppSettings must be used inside AppSettingsProvider')
  }

  return context
}
