import { useState } from 'react'
import { CheckCircle, Loader, AlertCircle, User, ExternalLink, Sparkles } from 'lucide-react'
import { useUploadBlobs } from '@shelby-protocol/react'
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { AccountAddress } from '@aptos-labs/ts-sdk'
import { shelbyClient } from '../lib/shelby'

type Page = 'home' | 'profile' | 'create' | 'dashboard' | 'gallery'

interface CreateIDProps {
  walletAddress: string | null
  setCurrentPage: (page: Page) => void
}

type Status = 'idle' | 'creating' | 'success' | 'error'

const categories = [
  { id: 'creator',  emoji: '✦', label: 'creator'  },
  { id: 'artist',   emoji: '◈', label: 'artist'   },
  { id: 'musician', emoji: '♪', label: 'musician' },
  { id: 'dev',      emoji: '⌥', label: 'dev'      },
]

export default function CreateID({ walletAddress, setCurrentPage }: CreateIDProps) {
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio]                 = useState('')
  const [category, setCategory]       = useState('creator')
  const [twitter, setTwitter]         = useState('')
  const [status, setStatus]           = useState<Status>('idle')
  const [errorMsg, setErrorMsg]       = useState('')

  const { account, signAndSubmitTransaction } = useAptosWallet()
  const uploadBlobs = useUploadBlobs({ client: shelbyClient })

  const handleCreate = async () => {
    if (!walletAddress || !displayName || !account || !signAndSubmitTransaction) return
    setStatus('creating')
    setErrorMsg('')

    const identity = {
      version: '1.0',
      displayName,
      bio,
      category,
      twitter: twitter.startsWith('@') ? twitter : twitter ? `@${twitter}` : '',
      address: walletAddress,
      createdAt: new Date().toISOString(),
    }

    const encoder  = new TextEncoder()
    const blobData = encoder.encode(JSON.stringify(identity, null, 2))
    const blobName = `shelbyid/${walletAddress}/identity.json`
    const expirationMicros = Date.now() * 1000 + 365 * 24 * 60 * 60 * 1_000_000

    uploadBlobs.mutate(
      {
        signer: { account: AccountAddress.from(account.address), signAndSubmitTransaction },
        blobs: [{ blobName, blobData }],
        expirationMicros,
      },
      {
        onSuccess: () => setStatus('success'),
        onError: (error: Error) => {
          setErrorMsg(error?.message || 'Upload failed. Please try again.')
          setStatus('error')
        },
      }
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (status === 'success') return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Animated checkmark */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'var(--teal-dim)', animationDuration: '1.5s' }} />
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.3)' }}>
            <CheckCircle size={32} style={{ color: 'var(--teal)' }} />
          </div>
        </div>

        <h2 className="text-2xl font-bold mono mb-2">identity_created</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
          Your ShelbyID is now live, stored on ShelbyServers and anchored on Aptos.
        </p>

        <div className="p-4 rounded-xl mb-4 text-left"
          style={{ background: 'var(--dark-3)', border: '1px solid rgba(45,212,191,0.1)' }}>
          <p className="text-xs mono mb-1" style={{ color: 'var(--muted)' }}>BLOB_PATH</p>
          <p className="text-xs mono break-all" style={{ color: 'var(--teal)' }}>
            shelbyid/{walletAddress}/identity.json
          </p>
        </div>

        <a href="https://explorer.shelby.xyz/testnet" target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-1 text-xs mono mb-6"
          style={{ color: 'var(--muted)' }}>
          <ExternalLink size={10} /> view on shelby explorer
        </a>

        <button onClick={() => setCurrentPage('profile')}
          className="btn-teal w-full py-3.5 rounded-xl text-sm">
          view_my_profile →
        </button>
      </div>
    </div>
  )

  // ── Main Form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-start justify-center px-6 pt-24 pb-24">
      <div className="w-full max-w-lg">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} style={{ color: 'var(--teal)' }} />
            <p className="text-xs mono" style={{ color: 'var(--teal)' }}>$ create_shelby_id</p>
          </div>
          <h1 className="text-3xl font-bold">
            Mint Your <span style={{ color: 'var(--teal)' }}>Identity</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Permanent, verifiable, on-chain.
          </p>
        </div>

        {/* Wallet warning */}
        {!walletAddress && (
          <div className="mb-5 p-4 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.15)' }}>
            <AlertCircle size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
            <p className="text-xs mono" style={{ color: 'rgba(255,255,255,0.5)' }}>connect_wallet_required</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && errorMsg && (
          <div className="mb-5 p-4 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
            <p className="text-xs mono" style={{ color: '#f87171' }}>{errorMsg}</p>
          </div>
        )}

        {/* Avatar preview card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl mb-5"
          style={{ background: 'var(--dark-2)', border: '1px solid rgba(45,212,191,0.1)' }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--dark-4) 0%, rgba(45,212,191,0.15) 100%)',
              border: '1px solid rgba(45,212,191,0.25)',
            }}>
            <User size={22} style={{ color: 'var(--teal)' }} />
          </div>
          <div>
            <p className="text-sm font-bold mono" style={{ color: displayName ? 'white' : 'var(--muted)' }}>
              {displayName || 'your_name'}
            </p>
            <p className="text-xs mono mt-0.5" style={{ color: 'var(--muted)' }}>
              {walletAddress ? `${walletAddress.slice(0, 10)}...` : '0x???'}
            </p>
            <p className="text-xs mono mt-0.5" style={{ color: 'var(--teal)', opacity: 0.7 }}>
              [{category}]
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Display name */}
          <div>
            <label className="block text-xs mono mb-2 flex items-center gap-1"
              style={{ color: 'var(--muted)' }}>
              DISPLAY_NAME
              <span style={{ color: 'var(--teal)' }}>*</span>
            </label>
            <input className="input-field w-full px-4 py-3 rounded-xl text-sm"
              placeholder="e.g. jea.creator"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)} />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs mono mb-2" style={{ color: 'var(--muted)' }}>BIO</label>
            <textarea className="input-field w-full px-4 py-3 rounded-xl text-sm resize-none"
              placeholder="What do you create?"
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)} />
          </div>

          {/* Twitter */}
          <div>
            <label className="block text-xs mono mb-2" style={{ color: 'var(--muted)' }}>TWITTER</label>
            <input className="input-field w-full px-4 py-3 rounded-xl text-sm"
              placeholder="@username"
              value={twitter}
              onChange={e => setTwitter(e.target.value)} />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs mono mb-2" style={{ color: 'var(--muted)' }}>CATEGORY</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className="py-2.5 rounded-xl text-xs mono transition-all flex flex-col items-center gap-1"
                  style={{
                    background: category === cat.id ? 'var(--teal)' : 'var(--dark-3)',
                    color: category === cat.id ? '#040909' : 'var(--muted)',
                    border: '1px solid',
                    borderColor: category === cat.id ? 'var(--teal)' : 'rgba(255,255,255,0.06)',
                    fontWeight: category === cat.id ? 700 : 400,
                  }}>
                  <span style={{ fontSize: '14px' }}>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="p-3 rounded-xl"
            style={{ background: 'var(--dark-3)', border: '1px solid rgba(45,212,191,0.08)' }}>
            <p className="text-xs mono" style={{ color: 'var(--muted)' }}>
              // identity stored as JSON blob on ShelbyServers
            </p>
            <p className="text-xs mono mt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>
              shelbyid/{walletAddress?.slice(0, 10) ?? '0x???'}…/identity.json
            </p>
          </div>

          {/* Submit */}
          <button onClick={handleCreate}
            disabled={!displayName || !walletAddress || status === 'creating' || uploadBlobs.isPending}
            className="w-full btn-teal py-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            {status === 'creating' || uploadBlobs.isPending
              ? <><Loader size={14} className="animate-spin" /> uploading_to_shelby...</>
              : <>mint_shelby_id →</>
            }
          </button>

          <p className="text-xs text-center mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
            anchored on aptos · stored on ShelbyServers · 365 day expiry
          </p>
        </div>
      </div>
    </div>
  )
}
