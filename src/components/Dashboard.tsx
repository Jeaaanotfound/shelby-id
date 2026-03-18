import { useState, useCallback } from 'react'
import {
  Upload, FileText, Image, Music, Video,
  User, HardDrive, Database, ExternalLink,
  Loader, AlertCircle, Plus, CheckCircle,
} from 'lucide-react'
import { useAccountBlobs, useUploadBlobs } from '@shelby-protocol/react'
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { AccountAddress } from '@aptos-labs/ts-sdk'
import { shelbyClient } from '../lib/shelby'
import { useIdentity } from '../hooks/useIdentity'
import { DashboardSkeleton } from './Skeleton'

type Page = 'home' | 'profile' | 'create' | 'dashboard' | 'gallery'

interface DashboardProps {
  walletAddress: string | null
  setCurrentPage: (page: Page) => void
}

interface ShelbyBlob {
  blobName?: string; name?: string; blobNameSuffix?: string
  size?: number; creationMicros?: number; isWritten?: boolean
}

function getBlobName(b: ShelbyBlob) { return b.blobName ?? b.name ?? b.blobNameSuffix ?? '' }
function fmtBytes(b: number) {
  if (b === 0) return '0 B'
  if (b < 1024) return `${b} B`
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`
  return `${(b/1024/1024).toFixed(1)} MB`
}
function fmtDate(m: number) {
  return new Date(m/1000).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}
function getFileType(name: string): 'image'|'music'|'video'|'doc' {
  const l = name.toLowerCase()
  if (l.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/)) return 'image'
  if (l.match(/\.(mp3|wav|flac|aac|ogg)$/))           return 'music'
  if (l.match(/\.(mp4|mov|avi|mkv|webm)$/))           return 'video'
  return 'doc'
}

const typeConfig = {
  image: { icon: Image,    color: '#2dd4bf', label: 'Images'    },
  music: { icon: Music,    color: '#818cf8', label: 'Audio'     },
  video: { icon: Video,    color: '#f472b6', label: 'Video'     },
  doc:   { icon: FileText, color: '#fb923c', label: 'Documents' },
}

export default function Dashboard({ walletAddress, setCurrentPage }: DashboardProps) {
  const [uploadSuccess, setUploadSuccess]   = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadError, setUploadError]       = useState('')
  const [dragOver, setDragOver]             = useState(false)

  const { account, signAndSubmitTransaction } = useAptosWallet()
  const { data: identity } = useIdentity(walletAddress)

  const { data: rawBlobs, isLoading, refetch } =
    useAccountBlobs({ client: shelbyClient, account: walletAddress ?? '', enabled: !!walletAddress } as any)

  const blobs: ShelbyBlob[] = (rawBlobs as ShelbyBlob[] | undefined) ?? []
  const uploadBlobs = useUploadBlobs({ client: shelbyClient })
  const works = blobs.filter(b => !getBlobName(b).includes('identity.json'))
  const totalStorage = works.reduce((a, b) => a + (b.size ?? 0), 0)
  const recentWorks = [...works].sort((a,b) => (b.creationMicros??0) - (a.creationMicros??0)).slice(0,5)
  const typeCounts = works.reduce((acc, b) => {
    const t = getFileType(getBlobName(b).split('/').pop() ?? '')
    acc[t] = (acc[t] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !account || !signAndSubmitTransaction || !walletAddress) return
    setUploadError('')
    setUploadSuccess(false)
    const fileArray = Array.from(files)
    const initProg: Record<string, number> = {}
    fileArray.forEach(f => { initProg[f.name] = 0 })
    setUploadProgress(initProg)

    const blobsToUpload = await Promise.all(
      fileArray.map(async (file, idx) => {
        const data = new Uint8Array(await file.arrayBuffer())
        setUploadProgress(prev => ({ ...prev, [file.name]: 25 + (idx * 5) }))
        return { blobName: `shelbyid/${walletAddress}/works/${file.name}`, blobData: data }
      })
    )
    fileArray.forEach(f => setUploadProgress(prev => ({ ...prev, [f.name]: 50 })))

    uploadBlobs.mutate(
      {
        signer: { account: AccountAddress.from(account.address), signAndSubmitTransaction },
        blobs: blobsToUpload,
        expirationMicros: Date.now() * 1000 + 365 * 24 * 60 * 60 * 1_000_000,
      },
      {
        onSuccess: () => {
          fileArray.forEach(f => setUploadProgress(prev => ({ ...prev, [f.name]: 100 })))
          setUploadSuccess(true)
          setTimeout(() => { setUploadSuccess(false); setUploadProgress({}); refetch() }, 2500)
        },
        onError: (err: Error) => { setUploadError(err.message || 'Upload failed'); setUploadProgress({}) },
      }
    )
  }, [account, signAndSubmitTransaction, walletAddress, uploadBlobs, refetch])

  if (!walletAddress) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm mono mb-1" style={{ color: 'var(--teal)' }}>$ wallet_not_connected</p>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Connect your wallet to view dashboard.</p>
        <button onClick={() => setCurrentPage('home')} className="btn-teal px-4 py-2 rounded-lg text-xs">go_home →</button>
      </div>
    </div>
  )

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
              <span style={{ color: 'var(--teal)' }}>~/</span>dashboard
            </h1>
            <p className="text-xs mono mt-1" style={{ color: 'var(--muted)' }}>
              {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}
            </p>
          </div>
          <label className="btn-teal flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs cursor-pointer"
            style={{ opacity: uploadBlobs.isPending ? 0.6 : 1 }}>
            {uploadBlobs.isPending
              ? <><Loader size={12} className="animate-spin"/> uploading...</>
              : uploadSuccess
              ? <><CheckCircle size={12}/> uploaded!</>
              : <><Plus size={12}/> upload_work</>
            }
            <input type="file" multiple className="hidden"
              onChange={e => handleFiles(e.target.files)} disabled={uploadBlobs.isPending}/>
          </label>
        </div>

        {/* Upload error */}
        {uploadError && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <AlertCircle size={13} style={{ color: '#f87171' }}/>
            <p className="text-xs mono" style={{ color: '#f87171' }}>{uploadError}</p>
          </div>
        )}

        {/* Progress bars */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-4 p-4 rounded-xl space-y-3"
            style={{ background: 'var(--dark-2)', border: '1px solid rgba(45,212,191,0.1)' }}>
            <p className="text-xs mono mb-2" style={{ color: 'var(--muted)' }}>// uploading_to_shelby</p>
            {Object.entries(uploadProgress).map(([fileName, pct]) => (
              <div key={fileName}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs mono truncate" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '80%' }}>
                    {fileName}
                  </p>
                  <p className="text-xs mono" style={{ color: 'var(--teal)' }}>{pct}%</p>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--dark-4)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: pct === 100 ? '#4ade80' : 'linear-gradient(90deg, var(--teal), var(--teal-light))',
                    }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Row */}
        <div className="animate-fade-up delay-1 grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Database,   label: 'total_works',   value: works.length.toString(), sub: 'blobs on shelby',  color: 'var(--teal)' },
            { icon: HardDrive,  label: 'storage_used',  value: fmtBytes(totalStorage),  sub: 'across all files', color: 'var(--teal)' },
            { icon: User,       label: 'shelby_id',     value: identity ? 'active' : 'not minted', sub: identity?.category ?? 'no category', color: identity ? 'var(--teal)' : '#fb923c' },
            { icon: CheckCircle,label: 'network',       value: 'testnet',                sub: 'aptos + shelby',  color: 'var(--teal)' },
          ].map(s => (
            <div key={s.label} className="card-stat rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs mono" style={{ color: 'var(--muted)' }}>{s.label}</p>
                <s.icon size={13} style={{ color: s.color, opacity: 0.5 }}/>
              </div>
              <p className="text-xl font-bold mono" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="animate-fade-up delay-2 grid md:grid-cols-3 gap-4">
          {/* Recent works */}
          <div className="md:col-span-2">
            <p className="text-xs mono mb-3" style={{ color: 'var(--muted)' }}>$ recent_works</p>

            {/* Drop zone */}
            <label
              className="block mb-3 rounded-xl border-2 border-dashed transition-all cursor-pointer py-5"
              style={{
                borderColor: dragOver ? 'var(--teal)' : 'rgba(45,212,191,0.12)',
                background: dragOver ? 'rgba(45,212,191,0.04)' : 'transparent',
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}>
              <input type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)}/>
              <div className="flex items-center justify-center gap-2">
                <Upload size={14} style={{ color: 'var(--teal)', opacity: 0.5 }}/>
                <p className="text-xs mono" style={{ color: 'var(--muted)' }}>drag files here or click to upload</p>
              </div>
            </label>

            {recentWorks.length === 0 ? (
              <div className="rounded-2xl p-8 text-center"
                style={{ border: '1px dashed rgba(45,212,191,0.1)', background: 'rgba(45,212,191,0.02)' }}>
                <p className="text-xs mono mb-1" style={{ color: 'var(--muted)' }}>// no_works_yet</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Upload your first work above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentWorks.map((blob, i) => {
                  const fullName  = getBlobName(blob)
                  const shortName = fullName.split('/').pop() ?? fullName
                  const type = getFileType(shortName)
                  const cfg  = typeConfig[type]
                  const Icon = cfg.icon
                  return (
                    <div key={fullName || i} className="card rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}20` }}>
                        <Icon size={14} style={{ color: cfg.color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm mono truncate">{shortName}</p>
                        <p className="text-xs mono mt-0.5" style={{ color: 'var(--muted)' }}>
                          {blob.size != null ? fmtBytes(blob.size) : '—'} · {blob.creationMicros != null ? fmtDate(blob.creationMicros) : '—'} ·{' '}
                          <span style={{ color: blob.isWritten ? '#4ade80' : '#fb923c' }}>
                            {blob.isWritten ? 'stored' : 'pending'}
                          </span>
                        </p>
                      </div>
                      <ExternalLink size={11} style={{ color: 'var(--muted)', flexShrink: 0 }}/>
                    </div>
                  )
                })}
                {works.length > 5 && (
                  <button onClick={() => setCurrentPage('profile')}
                    className="w-full text-xs mono py-2 rounded-xl transition-colors"
                    style={{ color: 'var(--teal)', background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.1)' }}>
                    view all {works.length} works →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Identity card */}
            <div className="card rounded-xl p-4">
              <p className="text-xs mono mb-3" style={{ color: 'var(--muted)' }}>$ identity</p>
              {identity ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold mono"
                    style={{ background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.2)', color: 'var(--teal)' }}>
                    {identity.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold mono truncate">{identity.displayName}</p>
                    <p className="text-xs mono" style={{ color: 'var(--muted)' }}>[{identity.category}]</p>
                    {identity.bio && (
                      <p className="text-xs mt-1 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{identity.bio}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs mono mb-3" style={{ color: 'var(--muted)' }}>no_identity_found</p>
                  <button onClick={() => setCurrentPage('create')}
                    className="btn-teal text-xs px-3 py-1.5 rounded-lg">mint_id →</button>
                </div>
              )}
            </div>

            {/* File types */}
            <div className="card rounded-xl p-4">
              <p className="text-xs mono mb-3" style={{ color: 'var(--muted)' }}>$ file_types</p>
              {works.length === 0 ? (
                <p className="text-xs mono text-center py-2" style={{ color: 'rgba(255,255,255,0.15)' }}>// empty</p>
              ) : (
                <div className="space-y-3">
                  {(Object.keys(typeConfig) as (keyof typeof typeConfig)[]).map(type => {
                    const cfg   = typeConfig[type]
                    const count = typeCounts[type] ?? 0
                    const pct   = works.length > 0 ? (count / works.length) * 100 : 0
                    const Icon  = cfg.icon
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Icon size={11} style={{ color: cfg.color }}/>
                            <span className="text-xs mono" style={{ color: 'rgba(255,255,255,0.45)' }}>{cfg.label}</span>
                          </div>
                          <span className="text-xs mono" style={{ color: cfg.color }}>{count}</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--dark-4)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: cfg.color, opacity: 0.65 }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="card rounded-xl p-4">
              <p className="text-xs mono mb-3" style={{ color: 'var(--muted)' }}>$ quick_links</p>
              <div className="space-y-1">
                {[
                  { label: 'view_profile →',    action: () => setCurrentPage('profile') },
                  { label: 'open_gallery →',    action: () => setCurrentPage('gallery') },
                  { label: 'aptos_explorer',     href: `https://explorer.aptoslabs.com/account/${walletAddress}?network=testnet` },
                  { label: 'shelby_explorer',    href: 'https://explorer.shelby.xyz/testnet' },
                ].map(link => (
                  link.href ? (
                    <a key={link.label} href={link.href} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between w-full text-xs mono py-1.5 px-2 rounded-lg transition-colors"
                      style={{ color: 'var(--muted)' }}
                      onMouseEnter={e => (e.currentTarget.style.color='var(--teal)')}
                      onMouseLeave={e => (e.currentTarget.style.color='var(--muted)')}>
                      {link.label} <ExternalLink size={10}/>
                    </a>
                  ) : (
                    <button key={link.label} onClick={link.action}
                      className="flex items-center w-full text-xs mono py-1.5 px-2 rounded-lg transition-colors"
                      style={{ color: 'var(--muted)' }}
                      onMouseEnter={e => (e.currentTarget.style.color='var(--teal)')}
                      onMouseLeave={e => (e.currentTarget.style.color='var(--muted)')}>
                      {link.label}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
