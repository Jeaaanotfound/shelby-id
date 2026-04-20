import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppSettings } from '../context/AppSettings'
import { isValidAptosAddress, type AppNetworkKey } from '../lib/aptos'
import { getAvatarBlobName, getBlobReadUrl, getShelbyApiKey } from '../lib/shelby'

const AVATAR_MISS_TTL_MS = 60_000
const avatarMissCache = new Map<string, number>()

function getAvatarCacheKey(walletAddress: string, networkKey: AppNetworkKey): string {
  return `${networkKey}:${walletAddress.toLowerCase()}`
}

export function getAvatarUrl(
  walletAddress: string,
  networkKey: AppNetworkKey,
  cacheBust?: number
): string {
  const url = getBlobReadUrl(walletAddress, getAvatarBlobName(walletAddress), networkKey)
  return cacheBust ? `${url}?t=${cacheBust}` : url
}

export function useAvatar(walletAddress: string | null) {
  const { networkKey } = useAppSettings()
  const [hasAvatar, setHasAvatar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  const check = useCallback(async (force = false) => {
    if (!walletAddress || !isValidAptosAddress(walletAddress)) {
      revokeObjectUrl()
      setHasAvatar(false)
      setAvatarUrl(null)
      return
    }

    const cacheKey = getAvatarCacheKey(walletAddress, networkKey)
    const lastMissAt = avatarMissCache.get(cacheKey)
    if (!force && lastMissAt && Date.now() - lastMissAt < AVATAR_MISS_TTL_MS) {
      revokeObjectUrl()
      setHasAvatar(false)
      setAvatarUrl(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const url = getAvatarUrl(walletAddress, networkKey, force ? Date.now() : undefined)
      const headers: Record<string, string> = {}
      const apiKey = getShelbyApiKey(networkKey)
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`

      const res = await fetch(url, { headers })
      if (res.ok) {
        const blob = await res.blob()
        avatarMissCache.delete(cacheKey)
        revokeObjectUrl()
        const objectUrl = URL.createObjectURL(blob)
        objectUrlRef.current = objectUrl
        setAvatarUrl(objectUrl)
        setHasAvatar(true)
      } else {
        if (res.status === 404) {
          avatarMissCache.set(cacheKey, Date.now())
        }
        revokeObjectUrl()
        setHasAvatar(false)
        setAvatarUrl(null)
      }
    } catch {
      revokeObjectUrl()
      setHasAvatar(false)
      setAvatarUrl(null)
    } finally {
      setLoading(false)
    }
  }, [networkKey, revokeObjectUrl, walletAddress])

  useEffect(() => {
    check()
    return () => revokeObjectUrl()
  }, [check, revokeObjectUrl])

  return {
    hasAvatar,
    avatarUrl,
    loading,
    refetch: () => check(true),
  }
}
