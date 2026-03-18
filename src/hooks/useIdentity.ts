import { useState, useEffect } from 'react'

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

const SHELBY_RPC = 'https://api.testnet.shelby.xyz/shelby'
const API_KEY = import.meta.env.VITE_SHELBY_API_KEY as string | undefined

export function useIdentity(walletAddress: string | null): IdentityState {
  const [state, setState] = useState<IdentityState>({
    data: null,
    isLoading: false,
    isError: false,
    notFound: false,
    error: null,
  })

  useEffect(() => {
    if (!walletAddress) {
      setState({ data: null, isLoading: false, isError: false, notFound: false, error: null })
      return
    }

    // AbortController supaya fetch dibatalkan kalau component unmount / walletAddress berubah
    const controller = new AbortController()

    const url = `${SHELBY_RPC}/v1/blobs/${walletAddress}/shelbyid/${walletAddress}/identity.json`

    setState(prev => ({ ...prev, isLoading: true, isError: false, notFound: false, error: null }))

    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`

    fetch(url, { headers, signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) {
          setState({ data: null, isLoading: false, isError: false, notFound: true, error: null })
          return
        }
        if (!res.ok) throw new Error(`Shelby RPC error: ${res.status} ${res.statusText}`)
        const text = await res.text()
        const parsed = JSON.parse(text) as Identity
        setState({ data: parsed, isLoading: false, isError: false, notFound: false, error: null })
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return // ignore cancelled requests
        console.error('[useIdentity] fetch failed:', err)
        setState({ data: null, isLoading: false, isError: true, notFound: false, error: err.message })
      })

    return () => controller.abort()
  }, [walletAddress]) // hanya re-fetch kalau walletAddress berubah

  return state
}
