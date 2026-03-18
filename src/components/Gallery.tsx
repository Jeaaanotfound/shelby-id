import { useState, useCallback } from 'react'
import {
  Grid, List, Share2, CheckCircle,
  Lock, Unlock, Image, Music, Video, FileText,
  Loader, AlertCircle, ExternalLink, Eye, EyeOff, Plus,
} from 'lucide-react'
import { useAccountBlobs, useUploadBlobs } from '@shelby-protocol/react'
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { AccountAddress } from '@aptos-labs/ts-sdk'
import { shelbyClient } from '../lib/shelby'
import { useIdentity } from '../hooks/useIdentity'

type Page = 'home' | 'profile' | 'create' | 'dashboard' | 'gallery'
type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'image' | 'music' | 'video' | 'doc'

interface GalleryProps { walletAddress: string | null; setCurrentPage: (p: Page) => void }
interface ShelbyBlob {
  blobName?: string; name?: string; blobNameSuffix?: string
  size?: number; creationMicros?: number; isWritten?: boolean
}
type VisibilityMap = Record<string, 'public' | 'private'>

const SHELBY_RPC = 'https://api.testnet.shelby.xyz/shelby'

function getBlobName(b: ShelbyBlob) { return b.blobName ?? b.name ?? b.blobNameSuffix ?? '' }
function getShortName(n: string) { return n.split('/').pop() ?? n }
function getFileType(n: string): 'image'|'music'|'video'|'doc' {
  const l = n.toLowerCase()
  if (l.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/)) return 'image'
  if (l.match(/\.(mp3|wav|flac|aac|ogg)$/))           return 'music'
  if (l.match(/\.(mp4|mov|avi|mkv|webm)$/))           return 'video'
  return 'doc'
}
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`
  return `${(b/1024/1024).toFixed(1)} MB`
}
function fmtDate(m: number) {
  return new Date(m/1000).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}

const typeConfig = {
  image: { icon: Image,    color: '#2dd4bf', label: 'Images'    },
  music: { icon: Music,    color: '#818cf8', label: 'Audio'     },
  video: { icon: Video,    color: '#f472b6', label: 'Videos'    },
  doc:   { icon: FileText, color: '#fb923c', label: 'Documents' },
}

export default function Gallery({ walletAddress, setCurrentPage }: GalleryProps) {
  const [viewMode, setViewMode]         = useState<ViewMode>('grid')
  const [filter, setFilter]             = useState<FilterType>('all')
  const [copied, setCopied]             = useState(false)
  const [visibility, setVisibility]     = useState<VisibilityMap>({})
  const [savingVis, setSavingVis]       = useState(false)
  const [selectedBlob, setSelectedBlob] = useState<ShelbyBlob | null>(null)

  const { account, signAndSubmitTransaction } = useAptosWallet()
  const { data: identity } = useIdentity(walletAddress)
  const isOwner = !!walletAddress && !!account

  const { data: raw, isLoading, isError, refetch } =
    useAccountBlobs({ client: shelbyClient, account: walletAddress ?? '', enabled: !!walletAddress } as any)

  const blobs: ShelbyBlob[] = (raw as ShelbyBlob[] | undefined) ?? []
  const uploadBlobs = useUploadBlobs({ client: shelbyClient })

  const works   = blobs.filter(b => !getBlobName(b).includes('identity.json') && !getBlobName(b).includes('gallery.json'))
  const filtered = works.filter(b => filter === 'all' || getFileType(getShortName(getBlobName(b))) === filter)
  const publicWorks = filtered.filter(b => (visibility[getBlobName(b)] ?? 'public') === 'public')
  const displayWorks = isOwner ? filtered : publicWorks

  const toggleVisibility = useCallback(async (blobName: string) => {
    if (!isOwner || !account || !signAndSubmitTransaction) return
    const next: VisibilityMap = { ...visibility, [blobName]: (visibility[blobName] ?? 'public') === 'public' ? 'private' : 'public' }
    setVisibility(next)
    setSavingVis(true)
    const blobData = new TextEncoder().encode(JSON.stringify(next, null, 2))
    uploadBlobs.mutate(
      {
        signer: { account: AccountAddress.from(account.address), signAndSubmitTransaction },
        blobs: [{ blobName: `shelbyid/${walletAddress}/gallery.json`, blobData }],
        expirationMicros: Date.now() * 1000 + 365 * 24 * 60 * 60 * 1_000_000,
      },
      { onSuccess: () => setSavingVis(false), onError: () => setSavingVis(false) }
    )
  }, [isOwner, account, signAndSubmitTransaction, visibility, walletAddress, uploadBlobs])

  const copyShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?gallery=${walletAddress}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!walletAddress) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm mono mb-1" style={{ color: 'var(--teal)' }}>$ wallet_not_connected</p>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Connect wallet to view gallery.</p>
        <button onClick={() => setCurrentPage('home')} className="btn-teal px-4 py-2 rounded-lg text-xs">go_home →</button>
      </div>
    </div>
  )

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader size={22} className="animate-spin mx-auto mb-3" style={{ color: 'var(--teal)' }}/>
        <p className="text-xs mono" style={{ color: 'var(--muted)' }}>loading_gallery...</p>
      </div>
    </div>
  )

  if (isError) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <AlertCircle size={22} className="mx-auto mb-3" style={{ color: '#f87171' }}/>
        <p className="text-xs mono mb-4" style={{ color: '#f87171' }}>fetch_failed</p>
        <button onClick={() => refetch()} className="btn-outline text-xs px-4 py-2 rounded-lg">retry_</button>
      </div>
    </div>
  )

  const displayName = identity?.displayName ?? 'anonymous'
  const initial     = displayName.charAt(0).toUpperCase()

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pb-24">

        {/* Creator banner */}
        <div className="animate-fade-up delay-1 mt-6 rounded-2xl overflow-hidden mb-6"
          style={{ background: 'var(--dark-2)', border: '1px solid rgba(45,212,191,0.12)' }}>
          <div className="h-16 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(255,105,176,0.08) 0%, rgba(120,0,180,0.06) 50%, rgba(255,105,176,0.03) 100%)' }}>
            </div>
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-6">
              <div className="flex items-end gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold mono flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--dark-3) 0%, rgba(255,105,176,0.1) 100%)',
                    border: '2px solid rgba(255,105,176,0.25)',
                    color: 'var(--teal)',
                  }}>
                  {initial}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold mono">{displayName}</h2>
                    {identity && (
                      <span className="text-xs mono px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--teal-dim)', color: 'var(--teal)', border: '1px solid rgba(45,212,191,0.2)', fontSize: '10px' }}>
                        ✓ verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {publicWorks.length} public · {works.length - publicWorks.length} private
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pb-1">
                {savingVis && (
                  <span className="text-xs mono flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                    <Loader size={10} className="animate-spin"/> saving...
                  </span>
                )}
                {isOwner && (
                  <button onClick={() => setCurrentPage('dashboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs mono"
                    style={{ background: 'var(--dark-3)', border: '1px solid rgba(45,212,191,0.1)', color: 'var(--muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color='var(--teal)')}
                    onMouseLeave={e => (e.currentTarget.style.color='var(--muted)')}>
                    <Plus size={11}/> upload
                  </button>
                )}
                <button onClick={copyShareLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs mono transition-all"
                  style={{
                    background: copied ? 'var(--teal-dim)' : 'var(--dark-3)',
                    border: `1px solid ${copied ? 'rgba(45,212,191,0.3)' : 'rgba(45,212,191,0.1)'}`,
                    color: copied ? 'var(--teal)' : 'var(--muted)',
                  }}>
                  {copied ? <CheckCircle size={11}/> : <Share2 size={11}/>}
                  {copied ? 'copied!' : 'share'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="animate-fade-up delay-2 flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {(['all','image','music','video','doc'] as FilterType[]).map(t => {
              const cfg   = t === 'all' ? null : typeConfig[t]
              const count = t === 'all' ? works.length : works.filter(b => getFileType(getShortName(getBlobName(b))) === t).length
              return (
                <button key={t} onClick={() => setFilter(t)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs mono transition-all"
                  style={{
                    background: filter === t ? 'var(--teal-dim)' : 'var(--dark-3)',
                    color: filter === t ? 'var(--teal)' : 'var(--muted)',
                    border: `1px solid ${filter === t ? 'rgba(45,212,191,0.25)' : 'transparent'}`,
                  }}>
                  {cfg && <cfg.icon size={10} style={{ color: cfg.color }}/>}
                  {t} ({count})
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-1">
            {(['grid','list'] as ViewMode[]).map(m => {
              const Icon = m === 'grid' ? Grid : List
              return (
                <button key={m} onClick={() => setViewMode(m)}
                  className="p-2 rounded-lg transition-all"
                  style={{
                    background: viewMode === m ? 'var(--teal-dim)' : 'var(--dark-3)',
                    color: viewMode === m ? 'var(--teal)' : 'var(--muted)',
                  }}>
                  <Icon size={13}/>
                </button>
              )
            })}
          </div>
        </div>

        {/* Empty state */}
        {displayWorks.length === 0 && (
          <div className="rounded-2xl p-12 text-center"
            style={{ border: '1px dashed rgba(45,212,191,0.1)', background: 'rgba(45,212,191,0.02)' }}>
            <Grid size={24} className="mx-auto mb-3" style={{ color: 'var(--muted)', opacity: 0.35 }}/>
            <p className="text-sm mono mb-1" style={{ color: 'var(--muted)' }}>
              {filter !== 'all' ? `// no_${filter}_files` : '// no_works_yet'}
            </p>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {isOwner ? 'Upload works from the dashboard.' : 'This creator has no public works yet.'}
            </p>
            {isOwner && (
              <button onClick={() => setCurrentPage('dashboard')} className="btn-teal px-4 py-2 rounded-lg text-xs">
                go_to_dashboard →
              </button>
            )}
          </div>
        )}

        {/* Grid view */}
        {viewMode === 'grid' && displayWorks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {displayWorks.map((blob, i) => {
              const fullName  = getBlobName(blob)
              const shortName = getShortName(fullName)
              const type  = getFileType(shortName)
              const cfg   = typeConfig[type]
              const Icon  = cfg.icon
              const isPrivate = (visibility[fullName] ?? 'public') === 'private'
              const blobUrl = walletAddress ? `${SHELBY_RPC}/v1/blobs/${walletAddress}/${fullName}` : ''
              return (
                <div key={fullName || i}
                  className="card rounded-xl overflow-hidden cursor-pointer group relative"
                  onClick={() => setSelectedBlob(blob)}>
                  <div className="aspect-square flex items-center justify-center relative overflow-hidden"
                    style={{ background: `${cfg.color}08` }}>
                    {type === 'image' && blobUrl ? (
                      <img src={blobUrl} alt={shortName} className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.style.display='none' }}/>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Icon size={28} style={{ color: cfg.color, opacity: 0.5 }}/>
                        <span className="text-xs mono" style={{ color: 'var(--muted)' }}>{cfg.label.toLowerCase()}</span>
                      </div>
                    )}
                    {isPrivate && (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'rgba(4,9,9,0.75)', backdropFilter: 'blur(4px)' }}>
                        <Lock size={20} style={{ color: 'var(--muted)' }}/>
                      </div>
                    )}
                    {isOwner && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => { e.stopPropagation(); toggleVisibility(fullName) }}>
                        <div className="p-1.5 rounded-lg"
                          style={{ background: 'rgba(4,9,9,0.85)', border: '1px solid rgba(45,212,191,0.2)' }}>
                          {isPrivate
                            ? <EyeOff size={12} style={{ color: '#fb923c' }}/>
                            : <Eye size={12} style={{ color: 'var(--teal)' }}/>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs mono truncate font-medium">{shortName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs mono" style={{ color: 'var(--muted)' }}>
                        {blob.size != null ? fmtBytes(blob.size) : '—'}
                      </p>
                      <span className="text-xs mono px-1.5 py-0.5 rounded-full"
                        style={{
                          background: isPrivate ? 'rgba(251,146,60,0.1)' : 'var(--teal-dim)',
                          color: isPrivate ? '#fb923c' : 'var(--teal)',
                          fontSize: '9px',
                        }}>
                        {isPrivate ? 'private' : 'public'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && displayWorks.length > 0 && (
          <div className="space-y-2">
            {displayWorks.map((blob, i) => {
              const fullName  = getBlobName(blob)
              const shortName = getShortName(fullName)
              const type  = getFileType(shortName)
              const cfg   = typeConfig[type]
              const Icon  = cfg.icon
              const isPrivate = (visibility[fullName] ?? 'public') === 'private'
              return (
                <div key={fullName || i} className="card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}20` }}>
                    <Icon size={16} style={{ color: cfg.color }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm mono truncate">{shortName}</p>
                      {isPrivate && <Lock size={10} style={{ color: '#fb923c', flexShrink: 0 }}/>}
                    </div>
                    <p className="text-xs mono mt-0.5" style={{ color: 'var(--muted)' }}>
                      {blob.size != null ? fmtBytes(blob.size) : '—'} · {blob.creationMicros != null ? fmtDate(blob.creationMicros) : '—'} ·{' '}
                      <span style={{ color: blob.isWritten ? '#4ade80' : '#fb923c' }}>
                        {blob.isWritten ? 'stored' : 'pending'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isOwner && (
                      <button onClick={() => toggleVisibility(fullName)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{
                          background: isPrivate ? 'rgba(251,146,60,0.1)' : 'var(--teal-dim)',
                          border: `1px solid ${isPrivate ? 'rgba(251,146,60,0.2)' : 'rgba(45,212,191,0.2)'}`,
                        }}>
                        {isPrivate
                          ? <EyeOff size={12} style={{ color: '#fb923c' }}/>
                          : <Eye size={12} style={{ color: 'var(--teal)' }}/>
                        }
                      </button>
                    )}
                    <ExternalLink size={12} style={{ color: 'var(--muted)' }}/>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Lightbox */}
        {selectedBlob && walletAddress && (() => {
          const fullName  = getBlobName(selectedBlob)
          const shortName = getShortName(fullName)
          const type  = getFileType(shortName)
          const cfg   = typeConfig[type]
          const Icon  = cfg.icon
          const blobUrl   = `${SHELBY_RPC}/v1/blobs/${walletAddress}/${fullName}`
          const isPrivate = (visibility[fullName] ?? 'public') === 'private'
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
              style={{ background: 'rgba(4,9,9,0.92)', backdropFilter: 'blur(16px)' }}
              onClick={() => setSelectedBlob(null)}>
              <div className="card rounded-2xl max-w-lg w-full overflow-hidden"
                style={{ border: '1px solid rgba(45,212,191,0.15)' }}
                onClick={e => e.stopPropagation()}>
                <div className="aspect-video flex items-center justify-center"
                  style={{ background: `${cfg.color}06` }}>
                  {type === 'image' ? (
                    <img src={blobUrl} alt={shortName} className="max-h-full max-w-full object-contain"/>
                  ) : type === 'video' ? (
                    <video src={blobUrl} controls className="max-h-full max-w-full"/>
                  ) : type === 'music' ? (
                    <div className="text-center p-8">
                      <Icon size={40} style={{ color: cfg.color, opacity: 0.4, margin: '0 auto 12px' }}/>
                      <audio src={blobUrl} controls className="w-full"/>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Icon size={40} style={{ color: cfg.color, opacity: 0.35, margin: '0 auto 12px' }}/>
                      <p className="text-xs mono" style={{ color: 'var(--muted)' }}>preview not available</p>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold mono truncate">{shortName}</p>
                    <span className="text-xs mono px-2 py-0.5 rounded-full ml-2 shrink-0"
                      style={{
                        background: isPrivate ? 'rgba(251,146,60,0.1)' : 'var(--teal-dim)',
                        color: isPrivate ? '#fb923c' : 'var(--teal)',
                      }}>
                      {isPrivate ? 'private' : 'public'}
                    </span>
                  </div>
                  <p className="text-xs mono" style={{ color: 'var(--muted)' }}>
                    {selectedBlob.size != null ? fmtBytes(selectedBlob.size) : '—'} ·{' '}
                    {selectedBlob.creationMicros != null ? fmtDate(selectedBlob.creationMicros) : '—'}
                  </p>
                  <div className="flex gap-2 mt-4">
                    {isOwner && (
                      <button onClick={() => toggleVisibility(fullName)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs mono transition-all"
                        style={{
                          background: isPrivate ? 'rgba(251,146,60,0.1)' : 'var(--teal-dim)',
                          color: isPrivate ? '#fb923c' : 'var(--teal)',
                          border: `1px solid ${isPrivate ? 'rgba(251,146,60,0.2)' : 'rgba(45,212,191,0.2)'}`,
                        }}>
                        {isPrivate ? <><Unlock size={11}/> make_public</> : <><Lock size={11}/> make_private</>}
                      </button>
                    )}
                    <a href={blobUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs mono"
                      style={{ background: 'var(--dark-3)', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <ExternalLink size={11}/> open_file
                    </a>
                    <button onClick={() => setSelectedBlob(null)}
                      className="ml-auto px-3 py-2 rounded-lg text-xs mono"
                      style={{ background: 'var(--dark-3)', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
