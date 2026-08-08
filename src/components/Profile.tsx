import { ExternalLink, Copy, Share2, Twitter, Music, Image, FileText, Video, CheckCircle, AlertCircle, Camera, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useAccountBlobs } from '@shelby-protocol/react'
import type { FullObjectMetadata } from '@shelby-protocol/sdk/browser'
import { useAppSettings } from '../context/AppSettings'
import {
  getAptosAccountExplorerUrl,
  getAptosTransactionExplorerUrl,
  getShelbyBlobExplorerUrl,
  getShelbyExplorerUrl,
  getWalletAddress,
  isValidAptosAddress,
  sameAddress,
} from '../lib/aptos'
import { getAvatarBlobName, getIdentityBlobName, isReservedBlobPath } from '../lib/shelby'
import { useIdentity } from '../hooks/useIdentity'
import { useBlobActivities } from '../hooks/useBlobActivities'
import { ProfileSkeleton } from './Skeleton'
import { useAvatar } from '../hooks/useAvatar'
import AvatarPicker from './AvatarPicker'
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'

interface ProfileProps {
  walletAddress: string | null
  setCurrentPage: (page: 'home' | 'profile' | 'create' | 'dashboard' | 'gallery') => void
}

type ShelbyBlob = FullObjectMetadata

function getBlobName(blob: ShelbyBlob): string {
  return blob.blobNameSuffix ?? String(blob.name) ?? ''
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(micros: number): string {
  return new Date(micros / 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(micros: number): string {
  return new Date(micros / 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatCommitment(root: Uint8Array): string {
  const hex = Array.from(root, (byte) => byte.toString(16).padStart(2, '0')).join('')
  if (!hex) return 'Unavailable'
  return `0x${hex.slice(0, 18)}...${hex.slice(-10)}`
}

function getBlobStatus(blob: ShelbyBlob | undefined): string {
  if (!blob) return 'Not indexed'
  if (blob.isDeleted) return 'Deleted'
  return blob.isWritten ? 'Written' : 'Registered'
}

function VerificationRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="verification-row">
      <p className="verification-row__label">{label}</p>
      <div className="verification-row__value-wrap">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="verification-row__value verification-row__value--link">
            <span>{value}</span> <ExternalLink size={12} />
          </a>
        ) : (
          <p className="verification-row__value">{value}</p>
        )}
      </div>
    </div>
  )
}

function getFileType(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image'
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return 'music'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video'
  return 'doc'
}

function getFileIcon(name: string): React.ElementType {
  const type = getFileType(name)
  const icons = { image: Image, music: Music, video: Video, doc: FileText }
  return icons[type as keyof typeof icons]
}

function getFileColor(name: string) {
  const type = getFileType(name)
  const colors = { image: 'var(--cat-image)', music: 'var(--cat-music)', video: 'var(--cat-video)', doc: 'var(--cat-doc)' }
  return colors[type as keyof typeof colors]
}

function getFileBgColor(name: string) {
  const type = getFileType(name)
  const colors = { image: 'var(--cat-image-bg)', music: 'var(--cat-music-bg)', video: 'var(--cat-video-bg)', doc: 'var(--cat-doc-bg)' }
  return colors[type as keyof typeof colors]
}

export default function Profile({ walletAddress, setCurrentPage }: ProfileProps) {
  const { networkConfig, networkKey, shelbyClient } = useAppSettings()
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)

  const { account } = useAptosWallet()
  const connectedAddress = getWalletAddress(account)
  const isOwner = sameAddress(connectedAddress, walletAddress)

  const { data: identity, isLoading: identityLoading, notFound } = useIdentity(walletAddress)
  const { avatarUrl, refetch: refetchAvatar } = useAvatar(walletAddress)

  const { data: rawBlobs, isLoading: blobsLoading } = useAccountBlobs({
    client: shelbyClient,
    account: walletAddress ?? '',
    enabled: !!walletAddress && isValidAptosAddress(walletAddress),
  })

  const blobs: ShelbyBlob[] = rawBlobs ?? []
  const isLoading = identityLoading || blobsLoading
  const works = blobs.filter((blob) => !isReservedBlobPath(getBlobName(blob)))
  const totalStorage = works.reduce((acc, b) => acc + b.size, 0)
  const identityBlob = walletAddress
    ? blobs.find((blob) => getBlobName(blob) === getIdentityBlobName(walletAddress))
    : undefined
  const avatarBlob = walletAddress
    ? blobs.find((blob) => getBlobName(blob) === getAvatarBlobName(walletAddress))
    : undefined
  const { activities, isLoading: activitiesLoading } = useBlobActivities({
    client: shelbyClient,
    blobNames: blobs.map((blob) => String(blob.name)),
    enabled: !!walletAddress && isValidAptosAddress(walletAddress),
  })
  const identityActivity = identityBlob ? activities[String(identityBlob.name)] : null

  const copyAddress = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareProfile = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('profile', walletAddress ?? '')
    navigator.clipboard.writeText(url.toString())
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  if (!walletAddress) {
    return (
      <div className="premium-shell flex items-center justify-center">
        <div className="max-w-md w-full premium-surface premium-surface--padded">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
            <AlertCircle size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-[11px] font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>profile</p>
          <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '16px' }}>
            No wallet
            <br />
            connected.
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '36px' }}>
            Connect your wallet to view your profile, or search for any address from the header.
          </p>
          <button onClick={() => setCurrentPage('home')} className="btn-pink px-6 py-3 rounded-full text-sm font-semibold">Connect Wallet</button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (notFound || !identity) {
    return (
      <div className="premium-shell flex items-center justify-center">
        <div className="text-center max-w-sm premium-surface premium-surface--padded">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <AlertCircle size={22} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)', fontSize: '15px' }}>No ShelbyID found</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)} has not minted a ShelbyID yet.
          </p>
          {isOwner ? (
            <button onClick={() => setCurrentPage('create')} className="btn-pink px-6 py-2.5 rounded-full text-sm font-semibold inline-block">
              Mint ShelbyID
            </button>
          ) : (
            <button onClick={() => setCurrentPage('home')} className="btn-ghost px-6 py-2.5 rounded-full text-sm inline-block">
              Back Home
            </button>
          )}
        </div>
      </div>
    )
  }

  const initials = identity.displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      <div className="premium-shell">
        <div className="premium-frame">
          <section className="premium-hero animate-fade-up">
            <div className="premium-hero__grid">
              <div>
              <span className="premium-kicker">Identity Dossier</span>
              <h1 className="premium-title premium-title--wide">{identity.displayName}</h1>
                <p className="premium-copy">{identity.bio || 'A Shelby-backed identity with a portable archive of published work.'}</p>
                <div className="premium-meta-row">
                  <span className="premium-chip premium-chip--accent">
                    <CheckCircle size={12} /> wallet-linked
                  </span>
                  <span className="premium-chip">{identity.category}</span>
                  <span className="premium-chip">{networkConfig.label}</span>
                </div>
              </div>
              <div className="curation-panel">
                <div className="identity-stage">
                  <div className="identity-stage__avatar" style={{ padding: 0 }}>
                    {avatarUrl ? <img src={avatarUrl} alt={identity.displayName ?? 'avatar'} className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div>
                    <h2 className="identity-stage__title">{identity.displayName}</h2>
                    <p className="identity-stage__sub">{walletAddress.slice(0, 12)}...{walletAddress.slice(-8)}</p>
                  </div>
                </div>
                <div className="action-row">
                  <button onClick={copyAddress} className="btn-ghost px-4 py-3 rounded-full text-sm inline-flex items-center gap-2">
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy address'}
                  </button>
                  <button onClick={shareProfile} className="btn-ghost px-4 py-3 rounded-full text-sm inline-flex items-center gap-2">
                    <Share2 size={14} /> {linkCopied ? 'Copied' : 'Share'}
                  </button>
                  {isOwner && (
                    <button onClick={() => setAvatarPickerOpen(true)} className="btn-pink px-4 py-3 rounded-full text-sm inline-flex items-center gap-2">
                      <Camera size={14} /> Avatar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="premium-metrics animate-fade-up delay-1">
            {[
              { label: 'works', value: works.length.toString(), meta: 'published files' },
              { label: 'storage', value: formatBytes(totalStorage), meta: 'occupied on Shelby' },
              { label: 'network', value: networkConfig.label, meta: networkConfig.badge },
            ].map((item) => (
              <article key={item.label} className="premium-metric">
                <p className="premium-metric__label">{item.label}</p>
                <p className="premium-metric__value">{item.value}</p>
                <p className="premium-metric__meta">{item.meta}</p>
              </article>
            ))}
          </section>

          <section className="premium-surface premium-surface--padded animate-fade-up delay-2">
            <div className="premium-section-head">
              <div>
                <p className="section-kicker">Verification record</p>
                <h2>What this profile is backed by</h2>
              </div>
              <p>Read-only metadata from Aptos and ShelbyNet.</p>
            </div>
            <div className="verification-grid">
              <VerificationRow label="Account" value={walletAddress} href={getAptosAccountExplorerUrl(walletAddress, networkKey)} />
              <VerificationRow label="Network" value={networkConfig.label} />
              <VerificationRow label="Identity blob" value={identityBlob ? getBlobName(identityBlob) : 'Not indexed'} href={identityBlob ? getShelbyBlobExplorerUrl(walletAddress, getBlobName(identityBlob), networkKey) : undefined} />
              <VerificationRow label="Blob status" value={getBlobStatus(identityBlob)} />
              <VerificationRow label="Expires" value={identityBlob ? formatDateTime(identityBlob.expirationMicros) : 'Not indexed'} />
              <VerificationRow label="Blob commitment" value={identityBlob ? formatCommitment(identityBlob.blobMerkleRoot) : 'Unavailable'} />
              <VerificationRow
                label="Registration transaction"
                value={identityActivity?.transactionHash ?? (activitiesLoading ? 'Indexing activity...' : 'Not indexed')}
                href={identityActivity?.transactionHash ? getAptosTransactionExplorerUrl(identityActivity.transactionHash, networkKey) : undefined}
              />
              <VerificationRow label="Avatar blob" value={avatarBlob ? getBlobStatus(avatarBlob) : 'Not uploaded'} />
            </div>
          </section>

          <section className="premium-grid animate-fade-up delay-2">
            <div className="premium-surface premium-surface--padded">
                <div className="premium-section-head">
                  <div>
                    <p className="section-kicker">Public archive</p>
                    <h2>Published works</h2>
                  </div>
                <p>Everything below reads like a clean portfolio inventory.</p>
              </div>

              {works.length === 0 ? (
                <div className="premium-surface premium-surface--padded" style={{ background: 'color-mix(in oklch, var(--bg-elevated) 92%, transparent)' }}>
                  <p className="empty-state-title">No public works yet</p>
                  <p className="empty-state-subtitle">This profile has not uploaded any portfolio files.</p>
                </div>
              ) : (
                <div className="editorial-stack">
                  <div className="premium-surface premium-surface--padded" style={{ background: 'color-mix(in oklch, var(--bg-elevated) 94%, transparent)' }}>
                    <p className="section-kicker">Profile note</p>
                    <p className="premium-copy" style={{ marginTop: '10px', fontSize: '14px' }}>
                      {identity.bio || `${identity.displayName} is using ShelbyID as a clear, wallet-linked identity layer for publishing work.`}
                    </p>
                  </div>
                  {works.map((blob) => {
                    const name = getBlobName(blob)
                    const FileIcon = getFileIcon(name)
                    return (
                      <div key={name} className="editorial-row">
                        <div className="editorial-row__icon" style={{ background: getFileBgColor(name) }}>
                          <FileIcon size={15} style={{ color: getFileColor(name) }} />
                        </div>
                        <div className="editorial-row__meta">
                          <p className="editorial-row__title">{name.split('/').pop()}</p>
                          <p className="editorial-row__sub">
                            {blob.size ? formatBytes(blob.size) : ''}
                            {blob.creationMicros ? ` / ${formatDate(blob.creationMicros)}` : ''}
                            {blob.expirationMicros ? ` / expires ${formatDate(blob.expirationMicros)}` : ''}
                            {blob.isWritten ? ' / stored' : ''}
                          </p>
                        </div>
                        <a href={getShelbyBlobExplorerUrl(walletAddress, name, networkKey)} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-2 rounded-full text-xs inline-flex items-center gap-1.5">
                          View <ExternalLink size={12} />
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="editorial-stack">
              <div className="premium-surface premium-surface--padded">
                <div className="premium-section-head">
                  <div>
                    <p className="section-kicker">Presence</p>
                    <h2>Connected links</h2>
                  </div>
                </div>
                <div className="editorial-stack">
                  {identity.twitter && (
                    <a href={`https://x.com/${identity.twitter}`} target="_blank" rel="noopener noreferrer" className="editorial-row">
                      <div className="editorial-row__meta">
                        <p className="editorial-row__title">@{identity.twitter}</p>
                        <p className="editorial-row__sub">Twitter / X profile</p>
                      </div>
                      <Twitter size={14} style={{ color: 'var(--text-muted)' }} />
                    </a>
                  )}
                  <a href={getAptosAccountExplorerUrl(walletAddress, networkKey)} target="_blank" rel="noopener noreferrer" className="editorial-row">
                    <div className="editorial-row__meta">
                      <p className="editorial-row__title">{networkConfig.label} account</p>
                      <p className="editorial-row__sub">Open on Aptos explorer</p>
                    </div>
                    <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
                  </a>
                  <a href={getShelbyExplorerUrl(networkKey)} target="_blank" rel="noopener noreferrer" className="editorial-row">
                    <div className="editorial-row__meta">
                      <p className="editorial-row__title">Shelby Explorer</p>
                      <p className="editorial-row__sub">Network and blob inspection</p>
                    </div>
                    <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
                  </a>
                </div>
              </div>

              <div className="premium-surface premium-surface--padded">
                <div className="premium-section-head">
                  <div>
                    <p className="section-kicker">Signal quality</p>
                    <h2>Identity posture</h2>
                  </div>
                </div>
                <div className="editorial-stack">
                  <div className="premium-surface premium-surface--padded" style={{ background: 'color-mix(in oklch, var(--bg-elevated) 94%, transparent)' }}>
                    <div className="muted-dot-list">
                      <span>{identity.category}</span>
                      <span>{works.length} archive items</span>
                      <span>{networkConfig.label}</span>
                    </div>
                  </div>
                  <button onClick={() => setCurrentPage('gallery')} className="editorial-row text-left">
                      <div className="editorial-row__meta">
                        <p className="editorial-row__title">Open gallery</p>
                        <p className="editorial-row__sub">View the full public archive in gallery mode.</p>
                      </div>
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {avatarPickerOpen && walletAddress && (
        <AvatarPicker
          walletAddress={walletAddress}
          currentAvatarUrl={avatarUrl}
          onClose={() => setAvatarPickerOpen(false)}
          onSuccess={() => {
            refetchAvatar()
          }}
        />
      )}
    </>
  )
}
