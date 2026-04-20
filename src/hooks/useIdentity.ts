import { useState, useEffect } from 'react'
import { useAppSettings } from '../context/AppSettings'
import { isValidAptosAddress } from '../lib/aptos'
import { getBlobReadUrl, getIdentityBlobName, getShelbyApiKey } from '../lib/shelby'

export interface Identity {
  version?: string
  displayName: string
  bio: string
  category: string
  twitter: string
  address: string
  createdAt?: string
}

interface IdentityState {
  data: Identity | null
  isLoading: boolean
  isError: boolean
  notFound: boolean
  error: string | null
}

export function useIdentity(walletAddress: string | null): IdentityState {
  const { networkKey } = useAppSettings()
  const [state, setState] = useState<IdentityState>({
    data: null,
    isLoading: false,
    isError: false,
    notFound: false,
    error: null,
  })

  useEffect(() => {
    if (!walletAddress || !isValidAptosAddress(walletAddress)) {
      setState({ data: null, isLoading: false, isError: false, notFound: false, error: null })
      return
    }

    const controller = new AbortController()
    const url = getBlobReadUrl(walletAddress, getIdentityBlobName(walletAddress), networkKey)

    setState((prev) => ({ ...prev, isLoading: true, isError: false, notFound: false, error: null }))

    const headers: Record<string, string> = { Accept: 'application/json' }
    const apiKey = getShelbyApiKey(networkKey)
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`

    fetch(url, { headers, signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) {
          setState({ data: null, isLoading: false, isError: false, notFound: true, error: null })
          return
        }

        if (!res.ok) {
          throw new Error(`Shelby RPC error: ${res.status} ${res.statusText}`)
        }

        const parsed = JSON.parse(await res.text()) as Identity
        setState({ data: parsed, isLoading: false, isError: false, notFound: false, error: null })
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return
        console.error('[useIdentity] fetch failed:', err)
        setState({ data: null, isLoading: false, isError: true, notFound: false, error: err.message })
      })

    return () => controller.abort()
  }, [networkKey, walletAddress])

  return state
}
