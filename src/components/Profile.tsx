import { ExternalLink, Copy, Twitter, Music, Image, FileText, Video, CheckCircle, Loader, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAccountBlobs } from '@shelby-protocol/react'
import { shelbyClient } from '../lib/shelby'

interface ProfileProps {
  walletAddress: string | null
}

const categoryIcons: Record<string, React.ElementType> = {
  art: Image,
  music: Music,
  writing: FileText,
  video: Video,
}

const categoryColors: Record<string, string> = {
  art: '#2dd4bf',
  music: '#818cf8',
  writing: '#fb923c',
  video: '#f472b6',
}

// Helper: tebak kategori dari nama blob
function guessCategoryFromName(name: string): string {
  const lower = name.toLowerCase()
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/)) return 'art'
  if (lower.match(/\.(mp3|wav|flac|aac|ogg)$/)) return 'music'
  if (lower.match(/\.(mp4|mov|avi|mkv|webm)$/)) return 'video'
  if (lower.match(/\.(txt|md|pdf|doc|docx)$/)) return 'writing'
  return 'writing'
}

// Helper: format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Helper: format date dari microseconds
function formatDate(micros: number): string {
  return new Date(micros / 1000).toISOString().split('T')[0]
}

// Helper: extract total storage dari blobs
function calcTotalStorage(blobs: any[]): string {
  const total = blobs.reduce((acc, b) => acc + (b.size || 0), 0)
  return formatBytes(total)
}

// Parse identity.json dari blob list kalau ada
function extractIdentity(blobs: any[]): {
  displayName: string
  bio: string
  twitter: string
  category: string
} | null {
  const identityBlob = blobs.find((b) =>
    (b.name || b.blobNameSuffix || '').includes('identity.json')
  )
  if (!identityBlob) return null

  // Nama saja kita return, data JSON perlu fetch terpisah
  // Untuk sementara return placeholder dari nama blob
  return {
    displayName: 'creator',
    bio: '',
    twitter: '',
    category: 'creator',
  }
}

export default function Profile({ walletAddress }: ProfileProps) {
  const [copied, setCopied] = useState(false)
  const [identity, setIdentity] = useState<{
    displayName: string
    bio: string
    twitter: string
    category: string
  } | null>(null)

  // Fetch blobs dari Shelby network
  const {
    data: blobs,
    isLoading,
    isError,
    error,
    refetch,
  } = useAccountBlobs({
    client: shelbyClient,
    account: walletAddress ?? '',
    enabled: !!walletAddress,
  } as any)

  // Extract identity dari blobs kalau ada
  useEffect(() => {
    if (blobs && blobs.length > 0) {
      const extracted = extractIdentity(blobs)
      if (extracted) setIdentity(extracted)
    }
  }, [blobs])

  const copyAddress = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filter blob yang bukan identity.json (tampilkan sebagai "works")
  const works = (blobs ?? []).filter(
    (b: any) => !(b.name || b.blobNameSuffix || '').includes('identity.json')
  )

  // ─── Wallet not connected ────────────────────────────────────────────────────
  if (!walletAddress) return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm mono mb-2" style={{ color: 'var(--teal)' }}>
          $ error: wallet_not_connected
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Connect your wallet to view your ShelbyID profile.
        </p>
      </div>
    </div>
  )

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <Loader size={20} className="animate-spin mx-auto mb-3" style={{ color: 'var(--teal)' }} />
        <p className="text-xs mono" style={{ color: 'var(--muted)' }}>
          fetching_blobs_from_shelby...
        </p>
      </div>
    </div>
  )

  // ─── Error ───────────────────────────────────────────────────────────────────
  if (isError) return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <AlertCircle size={20} className="mx-auto mb-3" style={{ color: '#f87171' }} />
        <p className="text-sm mono mb-2" style={{ color: '#f87171' }}>
          $ error: fetch_failed
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
          {(error as any)?.message || 'Could not fetch blobs from Shelby network.'}
        </p>
        <button onClick={() => refetch()} className="btn-outline text-xs mono px-4 py-2 rounded-lg">
          retry_
        </button>
      </div>
    </div>
  )

  // ─── Main Profile ────────────────────────────────────────────────────────────
  const displayName = identity?.displayName ?? 'anonymous'
  const initial = displayName.charAt(0).toUpperCase()
  const totalStorage = calcTotalStorage(blobs ?? [])

  return (
    <div className="pt-24 min-h-screen max-w-2xl mx-auto px-6 pb-32">

      {/* Profile Card */}
      <div className="card rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.2)' }}
          >
            <span className="text-2xl font-bold mono" style={{ color: 'var(--teal)' }}>
              {initial}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold mono">{displayName}</h2>
              {(blobs ?? []).length > 0 && (
                <span
                  className="text-xs mono px-2 py-0.5 rounded"
                  style={{
                    background: 'var(--teal-dim)',
                    color: 'var(--teal)',
                    border: '1px solid rgba(45,212,191,0.2)',
                  }}
                >
                  verified
                </span>
              )}
            </div>

            <button
              onClick={copyAddress}
              className="flex items-center gap-1.5 text-xs mono transition-colors"
              style={{ color: copied ? 'var(--teal)' : 'var(--muted)' }}
            >
              {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
              {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}
            </button>

            {identity?.bio && (
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {identity.bio}
              </p>
            )}

            <div className="flex items-center gap-3 mt-3">
              {identity?.twitter && (
                <a
                  href={`https://twitter.com/${identity.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs mono"
                  style={{ color: 'var(--muted)' }}
                >
                  <Twitter size={10} /> {identity.twitter}
                </a>
              )}
              <a
                href={`https://explorer.aptoslabs.com/account/${walletAddress}?network=testnet`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs mono"
                style={{ color: 'var(--muted)' }}
              >
                <ExternalLink size={10} /> aptos_explorer
              </a>
              <a
                href={`https://explorer.shelby.xyz/testnet`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs mono"
                style={{ color: 'var(--muted)' }}
              >
                <ExternalLink size={10} /> shelby_explorer
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'blobs', value: (blobs ?? []).length },
          { label: 'storage', value: totalStorage },
          { label: 'network', value: 'testnet' },
        ].map((s) => (
          <div key={s.label} className="card rounded-xl p-4 text-center">
            <p className="text-lg font-bold mono" style={{ color: 'var(--teal)' }}>
              {s.value}
            </p>
            <p className="text-xs mono mt-1" style={{ color: 'var(--muted)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Works / Blobs */}
      <div>
        <p className="text-xs mono mb-3" style={{ color: 'var(--muted)' }}>
          $ ls ./blobs ({works.length} files)
        </p>

        {works.length === 0 ? (
          <div
            className="card rounded-xl p-8 text-center"
            style={{ border: '1px dashed rgba(45,212,191,0.15)' }}
          >
            <p className="text-xs mono" style={{ color: 'var(--muted)' }}>
              // no_blobs_found
            </p>
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Upload your first work to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {works.map((blob: any, i: number) => {
              const blobName = blob.name || blob.blobNameSuffix || `blob_${i}`
              const shortName = blobName.split('/').pop() || blobName
              const cat = guessCategoryFromName(shortName)
              const Icon = categoryIcons[cat] || FileText
              const color = categoryColors[cat] || 'var(--teal)'

              return (
                <div key={blob.name || i} className="card rounded-xl p-4 flex items-center gap-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mono truncate">{shortName}</p>
                    <p className="text-xs mono" style={{ color: 'var(--muted)' }}>
                      {blob.size ? formatBytes(blob.size) : '—'} ·{' '}
                      {blob.creationMicros ? formatDate(blob.creationMicros) : '—'} ·{' '}
                      <span style={{ color: blob.isWritten ? '#4ade80' : '#fb923c' }}>
                        {blob.isWritten ? 'written' : 'pending'}
                      </span>
                    </p>
                  </div>
                  <ExternalLink size={12} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
