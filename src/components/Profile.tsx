import {
  ExternalLink, Copy, Share2, Twitter,
  Music, Image, FileText, Video,
  CheckCircle, AlertCircle,
} from 'lucide-react'
import { useState } from 'react'
import { useAccountBlobs } from '@shelby-protocol/react'
import { shelbyClient } from '../lib/shelby'
import { useIdentity } from '../hooks/useIdentity'
import { ProfileSkeleton } from './Skeleton'

interface ProfileProps { walletAddress: string | null }

interface ShelbyBlob {
  blobName?: string; name?: string; blobNameSuffix?: string
  size?: number; creationMicros?: number; isWritten?: boolean
}

const categoryIcons: Record<string, React.ElementType> = {
  art: Image, music: Music, writing: FileText, video: Video,
}
const categoryColors: Record<string, string> = {
  art: '#2dd4bf', music: '#818cf8', writing: '#fb923c', video: '#f472b6',
}

function guessCat(name: string) {
  const l = name.toLowerCase()
  if (l.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/)) return 'art'
  if (l.match(/\.(mp3|wav|flac|aac|ogg)$/))           return 'music'
  if (l.match(/\.(mp4|mov|avi|mkv|webm)$/))           return 'video'
  return 'writing'
}
function fmtBytes(b: number) {
  if (b === 0) return '0 B'
  if (b < 1024) return `${b} B`
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`
  return `${(b/1024/1024).toFixed(1)} MB`
}
function fmtDate(m: number) { return new Date(m/1000).toISOString().split('T')[0] }
function getBlobName(b: ShelbyBlob) { return b.blobName ?? b.name ?? b.blobNameSuffix ?? '' }

export default function Profile({ walletAddress }: ProfileProps) {
  const [copied, setCopied]           = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  const { data: identity, isLoading: idLoading, notFound: idNotFound } = useIdentity(walletAddress)
  const { data: raw, isLoading: bLoading, isError, error, refetch } =
    useAccountBlobs({ client: shelbyClient, account: walletAddress ?? '', enabled: !!walletAddress } as any)

  const blobs: ShelbyBlob[] = (raw as ShelbyBlob[] | undefined) ?? []
  const works = blobs.filter(b => !getBlobName(b).includes('identity.json'))
  const totalStorage = fmtBytes(works.reduce((a, b) => a + (b.size ?? 0), 0))

  if (!walletAddress) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--dark-3)', border: '1px solid rgba(45,212,191,0.1)' }}>
          <AlertCircle size={24} style={{ color: 'var(--muted)' }} />
        </div>
        <p className="text-sm mono mb-1" style={{ color: 'var(--teal)' }}>$ wallet_not_connected</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Connect your wallet to view profile.</p>
      </div>
    </div>
  )

  if (idLoading || bLoading) return <ProfileSkeleton />

  if (isError) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <AlertCircle size={22} className="mx-auto mb-3" style={{ color: '#f87171' }} />
        <p className="text-xs mono mb-2" style={{ color: '#f87171' }}>$ fetch_failed</p>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>{(error as Error)?.message}</p>
        <button onClick={() => refetch()} className="btn-outline text-xs mono px-4 py-2 rounded-lg">retry_</button>
      </div>
    </div>
  )

  const displayName = identity?.displayName ?? 'anonymous'
  const initial = displayName.charAt(0).toUpperCase()
  const hasIdentity = !!identity && !idNotFound

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 pb-24">

        {idNotFound && (
          <div className="mt-6 mb-4 p-3 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.18)' }}>
            <AlertCircle size={13} style={{ color: '#fb923c', flexShrink: 0 }} />
            <p className="text-xs mono" style={{ color: '#fb923c' }}>
              no_shelby_id_found: this wallet hasn't minted a ShelbyID yet
            </p>
          </div>
        )}

        {/* Profile card */}
        <div className="animate-fade-up delay-1 mt-6 rounded-2xl overflow-hidden"
          style={{ background: 'var(--dark-2)', border: '1px solid rgba(45,212,191,0.12)' }}>
          {/* Banner */}
          <div className="h-14 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a1a1f 0%, #141418 50%, rgba(45,212,191,0.12) 100%)' }}>
            </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-8 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mono"
                style={{
                  background: 'linear-gradient(135deg, var(--dark-3) 0%, rgba(255,105,176,0.1) 100%)',
                  border: '2px solid rgba(255,105,176,0.25)',
                  color: 'var(--teal)',
                  boxShadow: '0 4px 20px rgba(255,105,176,0.1)',
                }}>
                {initial}
              </div>
              <button onClick={() => {
                const url = `${window.location.origin}?profile=${walletAddress}`
                navigator.clipboard.writeText(url)
                setCopiedShare(true)
                setTimeout(() => setCopiedShare(false), 2000)
              }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs mono transition-all"
                style={{
                  background: copiedShare ? 'var(--teal-dim)' : 'var(--dark-3)',
                  border: `1px solid ${copiedShare ? 'rgba(45,212,191,0.3)' : 'rgba(45,212,191,0.1)'}`,
                  color: copiedShare ? 'var(--teal)' : 'var(--muted)',
                }}>
                {copiedShare ? <CheckCircle size={11} /> : <Share2 size={11} />}
                {copiedShare ? 'copied!' : 'share_profile'}
              </button>
            </div>

            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-bold mono">{displayName}</h2>
              {hasIdentity && (
                <span className="text-xs mono px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--teal-dim)', color: 'var(--teal)', border: '1px solid rgba(45,212,191,0.2)' }}>
                  ✓ verified
                </span>
              )}
              {identity?.category && (
                <span className="text-xs mono px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--dark-3)', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {identity.category}
                </span>
              )}
            </div>

            <button onClick={copyAddress}
              className="flex items-center gap-1.5 text-xs mono mb-3 transition-colors"
              style={{ color: copied ? 'var(--teal)' : 'var(--muted)' }}>
              {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
              {walletAddress.slice(0, 12)}...{walletAddress.slice(-8)}
            </button>

            {identity?.bio && (
              <p className="text-sm mb-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {identity.bio}
              </p>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              {identity?.twitter && (
                <a href={`https://twitter.com/${identity.twitter.replace('@','')}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs mono transition-colors"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color='var(--teal)')}
                  onMouseLeave={e => (e.currentTarget.style.color='var(--muted)')}>
                  <Twitter size={11}/> {identity.twitter}
                </a>
              )}
              <a href={`https://explorer.aptoslabs.com/account/${walletAddress}?network=testnet`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs mono transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color='var(--teal)')}
                onMouseLeave={e => (e.currentTarget.style.color='var(--muted)')}>
                <ExternalLink size={11}/> aptos
              </a>
              <a href="https://explorer.shelby.xyz/testnet"
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs mono transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color='var(--teal)')}
                onMouseLeave={e => (e.currentTarget.style.color='var(--muted)')}>
                <ExternalLink size={11}/> shelby
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="animate-fade-up delay-2 grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'blobs',   value: blobs.length.toString() },
            { label: 'storage', value: totalStorage },
            { label: 'network', value: 'testnet' },
          ].map(s => (
            <div key={s.label} className="card-stat rounded-xl p-4 text-center">
              <p className="text-lg font-bold mono" style={{ color: 'var(--teal)' }}>{s.value}</p>
              <p className="text-xs mono mt-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Works */}
        <div className="animate-fade-up delay-3 mt-6">
          <p className="text-xs mono mb-3" style={{ color: 'var(--muted)' }}>
            $ ls ./blobs <span style={{ color: 'rgba(255,255,255,0.2)' }}>({works.length} files)</span>
          </p>
          {works.length === 0 ? (
            <div className="rounded-2xl p-10 text-center"
              style={{ border: '1px dashed rgba(45,212,191,0.12)', background: 'rgba(45,212,191,0.02)' }}>
              <p className="text-xs mono mb-1" style={{ color: 'var(--muted)' }}>// no_blobs_found</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>Upload your first work to see it here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {works.map((blob, i) => {
                const blobName  = getBlobName(blob)
                const shortName = blobName.split('/').pop() || blobName
                const cat   = guessCat(shortName)
                const Icon  = categoryIcons[cat] || FileText
                const color = categoryColors[cat] || 'var(--teal)'
                return (
                  <div key={blobName || i} className="card rounded-xl p-4 flex items-center gap-4" style={{ cursor: "pointer", transition: "all 0.2s ease" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,105,176,0.28)"; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.borderColor = ""; }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm mono truncate">{shortName}</p>
                      <p className="text-xs mono mt-0.5" style={{ color: 'var(--muted)' }}>
                        {blob.size != null ? fmtBytes(blob.size) : '—'} ·{' '}
                        {blob.creationMicros != null ? fmtDate(blob.creationMicros) : '—'} ·{' '}
                        <span style={{ color: blob.isWritten ? '#4ade80' : '#fb923c' }}>
                          {blob.isWritten ? 'stored' : 'pending'}
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
    </div>
  )

  function copyAddress() {
    navigator.clipboard.writeText(walletAddress!)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
}
