import { Upload, Image, Music, FileText, Video, ExternalLink, Loader, AlertCircle, Camera, ArrowRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAccountBlobs } from '@shelby-protocol/react'
import type { BlobMetadata } from '@shelby-protocol/sdk/browser'
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { useAppSettings } from '../context/AppSettings'
import { useToast } from '../context/ToastContext'
import {
  getAptosAccountExplorerUrl,
  getShelbyBlobExplorerUrl,
  getShelbyExplorerUrl,
  getWalletAddress,
  isValidAptosAddress,
  sameAddress,
} from '../lib/aptos'
import { buildBlobName, createExpirationMicros, formatShelbyErrorMessage, isReservedBlobPath } from '../lib/shelby'
import { uploadShelbyBlobsWithWallet } from '../lib/shelbyWrite'
import { ensureWalletMatchesAppNetwork, getTransactionErrorMessage, isWalletRejectedError } from '../lib/transactions'
import { useIdentity } from '../hooks/useIdentity'
import { useAvatar } from '../hooks/useAvatar'

interface DashboardProps {
  walletAddress: string | null
  setCurrentPage: (page: 'home' | 'profile' | 'create' | 'dashboard' | 'gallery') => void
}

type ShelbyBlob = BlobMetadata

function getBlobName(blob: ShelbyBlob): string {
  return blob.blobNameSuffix ?? String(blob.name) ?? ''
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(micros: number): string {
  return new Date(micros / 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getFileType(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image'
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return 'music'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video'
  return 'doc'
}

function FileTypeIcon({ name, size = 14 }: { name: string; size?: number }) {
  const type = getFileType(name)
  const colors = { image: 'var(--cat-image)', music: 'var(--cat-music)', video: 'var(--cat-video)', doc: 'var(--cat-doc)' }
  const icons = { image: Image, music: Music, video: Video, doc: FileText }
  const Icon = icons[type as keyof typeof icons]
  return <Icon size={size} style={{ color: colors[type as keyof typeof colors] }} />
}

function getFileBgColor(name: string) {
  const type = getFileType(name)
  const colors = { image: 'var(--cat-image-bg)', music: 'var(--cat-music-bg)', video: 'var(--cat-video-bg)', doc: 'var(--cat-doc-bg)' }
  return colors[type as keyof typeof colors]
}

export default function Dashboard({ walletAddress, setCurrentPage }: DashboardProps) {
  const { networkConfig, networkKey, shelbyClient } = useAppSettings()
  const { notify } = useToast()
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { account, network, signTransaction } = useAptosWallet()
  const connectedAddress = getWalletAddress(account)
  const { data: identity } = useIdentity(walletAddress)
  const { avatarUrl } = useAvatar(walletAddress)

  const { data: rawBlobs, isLoading, refetch } = useAccountBlobs({
    client: shelbyClient,
    account: walletAddress ?? '',
    enabled: !!walletAddress && isValidAptosAddress(walletAddress),
  })

  if (!walletAddress) {
    return (
      <div className="premium-shell flex items-center justify-center">
        <div className="max-w-md w-full premium-surface premium-surface--padded">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
            <AlertCircle size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-[11px] font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>
            dashboard
          </p>
          <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '16px' }}>
            Connect a wallet
            <br />
            to enter the workspace.
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '36px' }}>
            Your dashboard should feel like a clean archive of what you have published to Shelby, not a cluttered admin surface.
          </p>
          <div className="action-row">
            <button onClick={() => setCurrentPage('home')} className="btn-pink px-6 py-3 rounded-full text-sm font-semibold">
              Connect Wallet
            </button>
            <button onClick={() => setCurrentPage('home')} className="btn-ghost px-6 py-3 rounded-full text-sm">
              Back Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const blobs: ShelbyBlob[] = (rawBlobs ?? []).filter((blob) => !isReservedBlobPath(getBlobName(blob)))
  const totalStorage = blobs.reduce((total, blob) => total + blob.size, 0)
  const typeCounts = { image: 0, music: 0, video: 0, doc: 0 }
  blobs.forEach((blob) => {
    const type = getFileType(getBlobName(blob)) as keyof typeof typeCounts
    typeCounts[type]++
  })

  const handleUpload = async (files: FileList | null) => {
    if (!files || !walletAddress || !connectedAddress || !signTransaction) return
    if (!sameAddress(connectedAddress, walletAddress)) {
      notify({
        tone: 'error',
        title: 'Wallet mismatch',
        description: 'Connect the same wallet that owns this workspace before uploading.',
      })
      return
    }

    try {
      await ensureWalletMatchesAppNetwork({
        walletNetwork: network,
        changeNetwork: null,
        networkKey,
        notify,
      })
    } catch (error) {
      notify({
        tone: 'error',
        title: 'Upload blocked',
        description: getTransactionErrorMessage(error, 'Upload work', networkKey),
      })
      return
    }

    const expiry = createExpirationMicros(7)
    const fileList = Array.from(files)
    fileList.forEach((file) => {
      setUploadProgress((progress) => ({ ...progress, [file.name]: 15 }))
    })

    try {
      const preparedBlobs = await Promise.all(
        fileList.map(async (file) => ({
          fileName: file.name,
          blobName: buildBlobName(walletAddress, file.name),
          blobData: new Uint8Array(await file.arrayBuffer()),
        }))
      )

      preparedBlobs.forEach(({ fileName }) => {
        setUploadProgress((progress) => ({ ...progress, [fileName]: 50 }))
      })

      const result = await uploadShelbyBlobsWithWallet({
        client: shelbyClient,
        walletAddress,
        signTransaction,
        blobs: preparedBlobs.map(({ blobName, blobData }) => ({ blobName, blobData })),
        expirationMicros: expiry,
        networkKey,
      })

      preparedBlobs.forEach(({ fileName }) => {
        setUploadProgress((progress) => ({ ...progress, [fileName]: 100 }))
      })

      notify({
        tone: 'success',
        title: 'Upload complete',
        description:
          result.registrationStatus === 'registered'
            ? `${preparedBlobs.length} file${preparedBlobs.length > 1 ? 's' : ''} stored on ${networkConfig.label}.`
            : `Files updated on ${networkConfig.label}. No wallet approval was needed because the blobs were already registered.`,
      })

      window.setTimeout(() => {
        setUploadProgress({})
        refetch()
      }, 1500)
    } catch (error) {
      const description = isWalletRejectedError(error)
        ? getTransactionErrorMessage(error, 'Upload work', networkKey)
        : formatShelbyErrorMessage(error, networkKey)

      notify({
        tone: 'error',
        title: 'Upload failed',
        description,
      })

      setUploadProgress({})
    }
  }

  const shortAddr = `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`
  const initials = identity?.displayName?.[0]?.toUpperCase() ?? walletAddress[2].toUpperCase()

  const stats = [
    { label: 'works', value: blobs.length.toString(), meta: 'published blobs' },
    { label: 'storage', value: formatBytes(totalStorage), meta: 'total footprint' },
    { label: 'identity', value: identity ? 'active' : 'not minted', meta: identity?.category ?? 'creator' },
    { label: 'network', value: networkConfig.label, meta: networkConfig.badge },
  ]

  const typeBars = [
    { label: 'Images', count: typeCounts.image, color: 'var(--cat-image)', icon: Image },
    { label: 'Audio', count: typeCounts.music, color: 'var(--cat-music)', icon: Music },
    { label: 'Video', count: typeCounts.video, color: 'var(--cat-video)', icon: Video },
    { label: 'Documents', count: typeCounts.doc, color: 'var(--cat-doc)', icon: FileText },
  ]

  return (
    <div className="premium-shell">
      <div className="premium-frame">
        <section className="premium-hero animate-fade-up">
          <div className="premium-hero__grid">
            <div>
              <span className="premium-kicker">Creator Workspace</span>
              <h1 className="premium-title premium-title--wide">Run your Shelby archive like a working studio, not a cluttered admin panel.</h1>
              <p className="premium-copy">
                Use this space to publish work, keep identity details clean, and expose only the signals that actually matter.
              </p>
              <div className="premium-meta-row">
                <span className="premium-chip premium-chip--accent">{networkConfig.label}</span>
                <span className="premium-chip">{blobs.length} stored works</span>
                <span className="premium-chip">{formatBytes(totalStorage)} total</span>
              </div>
            </div>
            <div className="curation-panel">
              <div className="identity-stage">
                <div className="identity-stage__avatar">
                  {avatarUrl ? <img src={avatarUrl} alt={identity?.displayName ?? 'avatar'} className="w-full h-full object-cover" /> : initials}
                </div>
                <div>
                  <h2 className="identity-stage__title">{identity?.displayName ?? shortAddr}</h2>
                  <p className="identity-stage__sub">{identity?.bio ?? 'Your identity is connected and ready for publishing.'}</p>
                </div>
              </div>
              <div className="muted-dot-list">
                <span>{shortAddr}</span>
                <span>{identity?.category ?? 'identity pending'}</span>
              </div>
              <div className="action-row">
                <button onClick={() => fileInputRef.current?.click()} className="btn-pink px-5 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2">
                  <Upload size={14} /> Upload Work
                </button>
                <button onClick={() => setCurrentPage('profile')} className="btn-ghost px-5 py-3 rounded-full text-sm inline-flex items-center gap-2">
                  Profile <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="premium-metrics animate-fade-up delay-1">
          {stats.map((item) => (
            <article key={item.label} className="premium-metric">
              <p className="premium-metric__label">{item.label}</p>
              <p className="premium-metric__value">{item.value}</p>
              <p className="premium-metric__meta">{item.meta}</p>
            </article>
          ))}
        </section>

        <section className="premium-grid animate-fade-up delay-2">
          <div className="editorial-stack">
            <div className="premium-surface premium-surface--padded">
              <div className="premium-section-head">
                <div>
                  <p className="section-kicker">Publishing Desk</p>
                  <h2>Uploads and recent work</h2>
                </div>
                <p>Drop assets in, publish them to Shelby, and keep the archive orderly.</p>
              </div>

              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => handleUpload(event.target.files)} />
              <div
                className="upload-drop-zone p-6 text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  handleUpload(event.dataTransfer.files)
                }}
              >
                <Upload size={18} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Drop work here or click to upload.
                </p>
              </div>

              {Object.entries(uploadProgress).length > 0 && (
                <div className="upload-progress-stack" style={{ marginTop: '14px' }}>
                  {Object.entries(uploadProgress).map(([name, progress]) => (
                    <div key={name} className="upload-progress-card">
                      <Loader size={13} className="animate-spin flex-shrink-0" style={{ color: 'var(--pink)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                          {name}
                        </p>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--track)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progress === 100 ? 'var(--success)' : 'var(--accent)' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '18px' }}>
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="page-card px-4 py-3 flex items-center gap-3">
                        <div className="skeleton w-8 h-8 rounded-lg" />
                        <div className="flex-1">
                          <div className="skeleton h-3 w-2/5 mb-2" />
                          <div className="skeleton h-2 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : blobs.length === 0 ? (
                  <div className="premium-surface premium-surface--padded" style={{ background: 'color-mix(in oklch, var(--bg-elevated) 92%, transparent)' }}>
                  <p className="empty-state-title">Your workspace is empty</p>
                  <p className="empty-state-subtitle">Upload the first file to start building your public archive.</p>
                </div>
                ) : (
                  <div className="editorial-stack">
                    {blobs.slice(0, 6).map((blob) => {
                      const name = getBlobName(blob)
                      return (
                        <div key={name} className="editorial-row">
                          <div className="editorial-row__icon" style={{ background: getFileBgColor(name) }}>
                            <FileTypeIcon name={name} size={16} />
                          </div>
                          <div className="editorial-row__meta">
                            <p className="editorial-row__title">{name.split('/').pop()}</p>
                            <p className="editorial-row__sub">
                              {formatBytes(blob.size ?? 0)}
                              {blob.creationMicros ? ` / ${formatDate(blob.creationMicros)}` : ''}
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
            </div>
          </div>

          <div className="editorial-stack">
            <div className="premium-surface premium-surface--padded">
              <div className="premium-section-head">
                <div>
                  <p className="section-kicker">Identity Surface</p>
                  <h2>Profile posture</h2>
                </div>
                {identity && (
                  <button onClick={() => setCurrentPage('profile')} className="btn-ghost px-3 py-2 rounded-full text-xs inline-flex items-center gap-1.5">
                    <Camera size={12} /> Edit
                  </button>
                )}
              </div>
              <div className="identity-stage">
                <div className="identity-stage__avatar">
                  {avatarUrl ? <img src={avatarUrl} alt={identity?.displayName ?? 'avatar'} className="w-full h-full object-cover" /> : initials}
                </div>
                <div>
                  <h2 className="identity-stage__title">{identity?.displayName ?? 'anonymous'}</h2>
                  <p className="identity-stage__sub">{identity?.category ?? 'No ShelbyID minted yet.'}</p>
                </div>
              </div>
              {!identity && (
                <button onClick={() => setCurrentPage('create')} className="btn-pink w-full mt-4 py-3 rounded-full text-sm font-semibold">
                  Mint ShelbyID
                </button>
              )}
            </div>

            <div className="premium-surface premium-surface--padded">
              <div className="premium-section-head">
                <div>
                  <p className="section-kicker">Composition</p>
                  <h2>File mix</h2>
                </div>
              </div>
              <div className="editorial-stack">
                {typeBars.map(({ label, count, color, icon: Icon }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Icon size={13} style={{ color }} />
                        {label}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--track)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: blobs.length > 0 ? `${(count / blobs.length) * 100}%` : '0%', background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-surface premium-surface--padded">
              <div className="premium-section-head">
                <div>
                  <p className="section-kicker">Links</p>
                  <h2>External views</h2>
                </div>
              </div>
              <div className="editorial-stack">
                {[
                  { label: 'Profile', action: () => setCurrentPage('profile') },
                  { label: 'Gallery', action: () => setCurrentPage('gallery') },
                  { label: `${networkConfig.label} account`, href: getAptosAccountExplorerUrl(walletAddress, networkKey) },
                  { label: 'Shelby Explorer', href: getShelbyExplorerUrl(networkKey) },
                ].map((link) =>
                  link.href ? (
                    <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="editorial-row">
                      <div className="editorial-row__meta">
                        <p className="editorial-row__title">{link.label}</p>
                      </div>
                      <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
                    </a>
                  ) : (
                    <button key={link.label} onClick={link.action} className="editorial-row text-left">
                      <div className="editorial-row__meta">
                        <p className="editorial-row__title">{link.label}</p>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
