import { Grid, List, Share2, Upload, Image, Music, FileText, Video, Eye, EyeOff, X, ChevronLeft, ChevronRight, Loader, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAccountBlobs } from '@shelby-protocol/react'
import type { BlobMetadata } from '@shelby-protocol/sdk/browser'
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { useAppSettings } from '../context/AppSettings'
import { useToast } from '../context/ToastContext'
import { getWalletAddress, isValidAptosAddress, sameAddress } from '../lib/aptos'
import { buildBlobName, createExpirationMicros, formatShelbyErrorMessage, getBlobReadUrl, isReservedBlobPath } from '../lib/shelby'
import { uploadShelbyBlobsWithWallet, type UploadProgressUpdate } from '../lib/shelbyWrite'
import { ensureWalletMatchesAppNetwork, getTransactionErrorMessage, isWalletRejectedError } from '../lib/transactions'
import { useIdentity } from '../hooks/useIdentity'
import { useAvatar } from '../hooks/useAvatar'

interface GalleryProps {
  walletAddress: string | null
}

type ShelbyBlob = BlobMetadata
type Filter = 'all' | 'image' | 'music' | 'video' | 'doc'
type ViewMode = 'grid' | 'list'
type UploadCardTone = 'active' | 'success' | 'error'

interface UploadCardState {
  progress: number
  stage: string
  tone: UploadCardTone
  detail?: string
}

function getBlobName(blob: ShelbyBlob): string {
  return blob.blobNameSuffix ?? String(blob.name) ?? ''
}

function formatBytes(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(micros?: number): string {
  if (!micros) return ''
  return new Date(micros / 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getFileType(name: string): Filter {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image'
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return 'music'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video'
  return 'doc'
}

function FileIcon({ name, size = 16 }: { name: string; size?: number }) {
  const type = getFileType(name)
  const icons: Record<Filter, React.ElementType> = { all: FileText, image: Image, music: Music, video: Video, doc: FileText }
  const Icon = icons[type]
  const colors: Record<Filter, string> = { all: 'var(--cat-image)', image: 'var(--cat-image)', music: 'var(--cat-music)', video: 'var(--cat-video)', doc: 'var(--cat-doc)' }
  return <Icon size={size} style={{ color: colors[type] }} />
}

function FileThumbnail({ account, blob }: { account: string; blob: ShelbyBlob }) {
  const { networkKey } = useAppSettings()
  const [imgFailed, setImgFailed] = useState(false)
  const name = getBlobName(blob)
  const type = getFileType(name)

  if (type === 'image' && !imgFailed) {
    const blobUrl = `${getBlobReadUrl(account, name, networkKey)}?t=${blob.creationMicros ?? Date.now()}`
    return <img src={blobUrl} alt={name} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={() => setImgFailed(true)} />
  }

  const bgColors: Record<Filter, string> = {
    all: 'var(--cat-image-bg)',
    image: 'var(--cat-image-bg)',
    music: 'var(--cat-music-bg)',
    video: 'var(--cat-video-bg)',
    doc: 'var(--cat-doc-bg)',
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4" style={{ background: bgColors[type] }}>
      <FileIcon name={name} size={28} />
      <p className="text-xs text-center break-all font-mono line-clamp-2" style={{ color: 'var(--muted)' }}>
        {name.split('/').pop()}
      </p>
    </div>
  )
}

export default function Gallery({ walletAddress }: GalleryProps) {
  const { networkConfig, networkKey, shelbyClient } = useAppSettings()
  const { notify } = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [visibility, setVisibility] = useState<Record<string, boolean>>({})
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadCardState>>({})
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

  const allBlobs: ShelbyBlob[] = (rawBlobs ?? []).filter((blob) => !isReservedBlobPath(getBlobName(blob)))
  const filtered = filter === 'all' ? allBlobs : allBlobs.filter((blob) => getFileType(getBlobName(blob)) === filter)

  const counts: Record<Filter, number> = {
    all: allBlobs.length,
    image: allBlobs.filter((blob) => getFileType(getBlobName(blob)) === 'image').length,
    music: allBlobs.filter((blob) => getFileType(getBlobName(blob)) === 'music').length,
    video: allBlobs.filter((blob) => getFileType(getBlobName(blob)) === 'video').length,
    doc: allBlobs.filter((blob) => getFileType(getBlobName(blob)) === 'doc').length,
  }

  const toggleVisibility = (name: string) => {
    setVisibility((current) => ({ ...current, [name]: !current[name] }))
  }

  const updateUploadCard = (fileName: string, next: Partial<UploadCardState>) => {
    setUploadProgress((current) => {
      const existing = current[fileName] ?? {
        progress: 0,
        stage: 'Preparing upload',
        tone: 'active' as UploadCardTone,
      }

      return {
        ...current,
        [fileName]: {
          ...existing,
          ...next,
        },
      }
    })
  }

  const removeUploadCards = (fileNames: string[]) => {
    setUploadProgress((current) => {
      const next = { ...current }
      fileNames.forEach((fileName) => {
        delete next[fileName]
      })
      return next
    })
  }

  const formatUploadStage = ({ stage, detail }: UploadProgressUpdate) => {
    const base =
      {
        awaiting_wallet: 'Waiting for wallet approval',
        registering: 'Registering blob onchain',
        uploading: 'Uploading to Shelby',
        finalizing: 'Finalizing upload',
        verifying: 'Checking write status',
        done: 'Stored on network',
      }[stage] ?? 'Processing upload'

    return detail ? `${base}. ${detail}` : base
  }

  const shareGallery = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('gallery', walletAddress ?? '')
    url.searchParams.set('network', networkKey)
    navigator.clipboard.writeText(url.toString())
    setLinkCopied(true)
    notify({
      tone: 'success',
      title: 'Gallery link copied',
      description: `Shareable ${networkConfig.label} gallery link copied to clipboard.`,
    })
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || !walletAddress || !connectedAddress || !signTransaction) return
    if (!sameAddress(connectedAddress, walletAddress)) {
      notify({
        tone: 'error',
        title: 'Wallet mismatch',
        description: 'Connect the same wallet that owns this gallery before uploading.',
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
      updateUploadCard(file.name, {
        progress: 12,
        stage: 'Preparing file',
        tone: 'active',
      })
    })

    try {
      const preparedBlobs = await Promise.all(
        fileList.map(async (file) => ({
          fileName: file.name,
          blobName: buildBlobName(walletAddress, file.name),
          blobData: new Uint8Array(await file.arrayBuffer()),
        }))
      )

      const blobNameToFileName = new Map(preparedBlobs.map(({ blobName, fileName }) => [blobName, fileName]))

      preparedBlobs.forEach(({ fileName }) => {
        updateUploadCard(fileName, {
          progress: 28,
          stage: 'Preparing upload payload',
          tone: 'active',
        })
      })

      const result = await uploadShelbyBlobsWithWallet({
        client: shelbyClient,
        walletAddress,
        signTransaction,
        blobs: preparedBlobs.map(({ blobName, blobData }) => ({ blobName, blobData })),
        expirationMicros: expiry,
        networkKey,
        onProgress: (update) => {
          const fileName = blobNameToFileName.get(update.blobName)
          if (!fileName) return

          updateUploadCard(fileName, {
            progress: update.progress,
            stage: formatUploadStage(update),
            tone: update.stage === 'done' ? 'success' : 'active',
          })
        },
      })

      preparedBlobs.forEach(({ fileName }) => {
        updateUploadCard(fileName, {
          progress: 100,
          stage:
            result.registrationStatus === 'registered'
              ? 'Stored successfully'
              : 'Updated successfully. Blob was already registered.',
          tone: 'success',
        })
      })

      notify({
        tone: 'success',
        title: 'Gallery upload complete',
        description:
          result.registrationStatus === 'registered'
            ? `${preparedBlobs.length} file${preparedBlobs.length > 1 ? 's' : ''} stored on ${networkConfig.label}.`
            : `Files were updated on ${networkConfig.label}. No wallet approval was needed because the blobs were already registered.`,
      })

      window.setTimeout(() => {
        removeUploadCards(preparedBlobs.map(({ fileName }) => fileName))
        refetch()
      }, 1500)
    } catch (error) {
      const description = isWalletRejectedError(error)
        ? getTransactionErrorMessage(error, 'Upload work', networkKey)
        : formatShelbyErrorMessage(error, networkKey)

      fileList.forEach((file) => {
        updateUploadCard(file.name, {
          progress: Math.max(uploadProgress[file.name]?.progress ?? 0, 18),
          stage: 'Upload failed',
          detail: description,
          tone: 'error',
        })
      })

      notify({
        tone: 'error',
        title: 'Gallery upload failed',
        description,
      })

      window.setTimeout(() => {
        removeUploadCards(fileList.map((file) => file.name))
      }, 7000)
    }
  }

  const isOwner = !!walletAddress && sameAddress(connectedAddress, walletAddress)
  const initials = identity?.displayName?.[0]?.toUpperCase() ?? walletAddress?.[2]?.toUpperCase() ?? '?'
  const publicCount = allBlobs.filter((blob) => visibility[getBlobName(blob)] !== false).length
  const privateCount = allBlobs.length - publicCount

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'image', label: 'Image' },
    { key: 'music', label: 'Music' },
    { key: 'video', label: 'Video' },
    { key: 'doc', label: 'Doc' },
  ]

  return (
    <div className="premium-shell">
      <div className="premium-frame">
        <section className="premium-hero animate-fade-up">
          <div className="premium-hero__grid">
            <div>
              <span className="premium-kicker">Gallery Floor</span>
              <h1 className="premium-title premium-title--wide">Present files like a curated archive, not a random bucket of blobs.</h1>
              <p className="premium-copy">
                Shelby storage may be technical under the hood, but the surface should feel considered. This gallery shows what is public, what is private, and what is worth sharing.
              </p>
              <div className="premium-meta-row">
                <span className="premium-chip premium-chip--accent">{networkConfig.label}</span>
                <span className="premium-chip">{counts.all} works</span>
                <span className="premium-chip">{publicCount} public / {privateCount} private</span>
              </div>
            </div>
            <div className="curation-panel">
              <div className="identity-stage">
                <div className="identity-stage__avatar" style={{ padding: 0 }}>
                  {avatarUrl ? <img src={avatarUrl} alt={identity?.displayName ?? 'avatar'} className="w-full h-full object-cover" /> : initials}
                </div>
                <div>
                  <h2 className="identity-stage__title">{identity?.displayName ?? 'anonymous'}</h2>
                  <p className="identity-stage__sub">A Shelby-backed media shelf that is ready to be shared.</p>
                </div>
              </div>
              <div className="muted-dot-list">
                <span>{counts.image} image</span>
                <span>{counts.video} video</span>
                <span>{counts.music} audio</span>
              </div>
              <div className="action-row">
                {isOwner && (
                  <>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => handleUpload(event.target.files)} />
                    <button onClick={() => fileInputRef.current?.click()} className="btn-pink px-5 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2">
                      <Upload size={14} /> Upload
                    </button>
                  </>
                )}
                <button onClick={shareGallery} className="btn-ghost px-5 py-3 rounded-full text-sm inline-flex items-center gap-2">
                  <Share2 size={14} /> {linkCopied ? 'Copied' : 'Share'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="premium-metrics animate-fade-up delay-1">
          {[
            { label: 'all works', value: counts.all.toString(), meta: 'files visible in archive' },
            { label: 'public', value: publicCount.toString(), meta: 'share-ready surfaces' },
            { label: 'private', value: privateCount.toString(), meta: 'hidden from view' },
            { label: 'focus', value: filter.toUpperCase(), meta: 'current curation mode' },
          ].map((item) => (
            <article key={item.label} className="premium-metric">
              <p className="premium-metric__label">{item.label}</p>
              <p className="premium-metric__value">{item.value}</p>
              <p className="premium-metric__meta">{item.meta}</p>
            </article>
          ))}
        </section>

        {Object.entries(uploadProgress).length > 0 && (
          <div className="upload-progress-stack animate-fade-up delay-1">
            {Object.entries(uploadProgress).map(([name, status]) => (
              <div key={name} className={`upload-progress-card upload-progress-card--${status.tone}`}>
                <div className="upload-progress-card__icon">
                  {status.tone === 'error' ? (
                    <AlertCircle size={14} style={{ color: 'var(--danger)' }} />
                  ) : status.tone === 'success' ? (
                    <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                  ) : (
                    <Loader size={14} className="animate-spin flex-shrink-0" style={{ color: 'var(--pink)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                    {name}
                  </p>
                  <p className="upload-progress-card__stage">{status.stage}</p>
                  {status.detail && <p className="upload-progress-card__detail">{status.detail}</p>}
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--track)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${status.progress}%`,
                        background: status.tone === 'error' ? 'var(--danger)' : status.tone === 'success' ? 'var(--success)' : 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="toolbar-band animate-fade-up delay-1">
          <div className="toolbar-group">
            {filters.map((entry) => (
              <button key={entry.key} onClick={() => setFilter(entry.key)} className={`toolbar-chip ${filter === entry.key ? 'toolbar-chip--active' : ''}`}>
                {entry.label} ({counts[entry.key]})
              </button>
            ))}
          </div>
          <div className="toolbar-group">
            <button onClick={() => setViewMode('grid')} className={`toolbar-chip ${viewMode === 'grid' ? 'toolbar-chip--active' : ''}`}>
              <Grid size={14} /> Grid
            </button>
            <button onClick={() => setViewMode('list')} className={`toolbar-chip ${viewMode === 'list' ? 'toolbar-chip--active' : ''}`}>
              <List size={14} /> List
            </button>
          </div>
        </section>

        <section className="animate-fade-up delay-2">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--pink)', borderTopColor: 'transparent' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="premium-surface premium-surface--padded">
              <p className="empty-state-title">No files found</p>
              <p className="empty-state-subtitle">
                {filter === 'all' ? 'Upload a file to start building your gallery.' : `No ${filter} files match this view.`}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="gallery-grid-premium">
              {filtered.map((blob, index) => {
                const name = getBlobName(blob)
                const isPublic = visibility[name] !== false
                return (
                  <article key={name} className={`gallery-card-premium ${index === 0 ? 'gallery-card-premium--featured' : ''}`}>
                    <div className="gallery-card-premium__media" onClick={() => setLightbox(index)}>
                      <FileThumbnail account={walletAddress!} blob={blob} />
                    </div>
                    <div className="gallery-card-premium__body">
                      <div className="gallery-card-premium__header">
                        <div>
                          <p className="gallery-card-premium__title">{name.split('/').pop()}</p>
                          <p className="gallery-card-premium__meta">
                            {formatBytes(blob.size ?? 0)}
                            {blob.creationMicros ? ` / ${formatDate(blob.creationMicros)}` : ''}
                          </p>
                        </div>
                        <button onClick={() => toggleVisibility(name)} className="btn-ghost px-3 py-2 rounded-full text-xs inline-flex items-center gap-1.5">
                          {isPublic ? <Eye size={12} /> : <EyeOff size={12} />}
                          {isPublic ? 'Public' : 'Private'}
                        </button>
                      </div>
                      <div className="muted-dot-list">
                        <span>{getFileType(name)}</span>
                        <span>{index === 0 ? 'featured surface' : 'archive object'}</span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="editorial-stack">
              {filtered.map((blob, index) => {
                const name = getBlobName(blob)
                const isPublic = visibility[name] !== false
                return (
                  <div key={`${name}-${index}`} className="editorial-row cursor-pointer" onClick={() => setLightbox(index)}>
                    <div className="editorial-row__icon" style={{ background: `var(--cat-${getFileType(name)}-bg, var(--cat-image-bg))` }}>
                      <FileIcon name={name} size={15} />
                    </div>
                    <div className="editorial-row__meta">
                      <p className="editorial-row__title">{name.split('/').pop()}</p>
                      <p className="editorial-row__sub">
                        {formatBytes(blob.size ?? 0)}
                        {blob.creationMicros ? ` / ${formatDate(blob.creationMicros)}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleVisibility(name)
                      }}
                      className="btn-ghost px-3 py-2 rounded-full text-xs inline-flex items-center gap-1.5"
                    >
                      {isPublic ? <Eye size={12} /> : <EyeOff size={12} />}
                      {isPublic ? 'Public' : 'Private'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {lightbox !== null && filtered[lightbox] && (
          <div className="lightbox-shell" onClick={() => setLightbox(null)}>
            <button className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full" style={{ background: 'oklch(100% 0 0 / 0.1)', backdropFilter: 'blur(8px)' }} onClick={() => setLightbox(null)} aria-label="Close lightbox">
              <X size={18} className="text-white" />
            </button>
            {lightbox > 0 && (
              <button className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full" style={{ background: 'oklch(100% 0 0 / 0.1)', backdropFilter: 'blur(8px)' }} onClick={(event) => { event.stopPropagation(); setLightbox((current) => (current ?? 1) - 1) }} aria-label="Previous">
                <ChevronLeft size={20} className="text-white" />
              </button>
            )}
            {lightbox < filtered.length - 1 && (
              <button className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full" style={{ background: 'oklch(100% 0 0 / 0.1)', backdropFilter: 'blur(8px)' }} onClick={(event) => { event.stopPropagation(); setLightbox((current) => (current ?? 0) + 1) }} aria-label="Next">
                <ChevronRight size={20} className="text-white" />
              </button>
            )}
            <div className="lightbox-media" onClick={(event) => event.stopPropagation()}>
              <FileThumbnail account={walletAddress!} blob={filtered[lightbox]} />
            </div>
            <div className="lightbox-meta" onClick={(event) => event.stopPropagation()}>
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{getBlobName(filtered[lightbox]).split('/').pop()}</p>
                <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                  {formatBytes(filtered[lightbox].size ?? 0)}
                  {filtered[lightbox].creationMicros ? ` / ${formatDate(filtered[lightbox].creationMicros)}` : ''}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full pill-soft" style={{ color: visibility[getBlobName(filtered[lightbox])] !== false ? 'var(--success)' : 'var(--text-muted)' }}>
                {visibility[getBlobName(filtered[lightbox])] !== false ? 'public' : 'private'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
