import { useState } from 'react'
import { CheckCircle, Loader, AlertCircle, User, ExternalLink } from 'lucide-react'
import { useUploadBlobs } from '@shelby-protocol/react'
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { AccountAddress } from '@aptos-labs/ts-sdk'
import { shelbyClient } from '../lib/shelby'

type Page = 'home' | 'profile' | 'create'

interface CreateIDProps {
  walletAddress: string | null
  setCurrentPage: (page: Page) => void
}

type Status = 'idle' | 'creating' | 'success' | 'error'

export default function CreateID({ walletAddress, setCurrentPage }: CreateIDProps) {
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [category, setCategory] = useState('creator')
  const [twitter, setTwitter] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [txHash, setTxHash] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { account, signAndSubmitTransaction } = useAptosWallet()

  const uploadBlobs = useUploadBlobs({
    client: shelbyClient,
    onSuccess: () => {
      setStatus('success')
    },
    onError: (error) => {
      console.error('Upload error:', error)
      setErrorMsg(error?.message || 'Upload failed. Please try again.')
      setStatus('error')
    },
  })

  const handleCreate = async () => {
    if (!walletAddress || !displayName || !account || !signAndSubmitTransaction) return

    setStatus('creating')
    setErrorMsg('')

    // Build identity JSON yang akan di-store di Shelby
    const identity = {
      version: '1.0',
      displayName,
      bio,
      category,
      twitter: twitter.startsWith('@') ? twitter : twitter ? `@${twitter}` : '',
      address: walletAddress,
      createdAt: new Date().toISOString(),
    }

    const encoder = new TextEncoder()
    const blobData = encoder.encode(JSON.stringify(identity, null, 2))

    // Nama blob = identity file berdasarkan address
    const blobName = `shelbyid/${walletAddress}/identity.json`

    // Expiration 365 hari dalam mikrodetik
    const expirationMicros = Date.now() * 1000 + 365 * 24 * 60 * 60 * 1_000_000

    uploadBlobs.mutate(
      {
        signer: {
          account: AccountAddress.from(account.address),
          signAndSubmitTransaction,
        },
        blobs: [{ blobName, blobData }],
        expirationMicros,
      },
      {
        onSuccess: () => {
          // Buat pseudo tx hash dari address + timestamp untuk ditampilkan
          const pseudoHash =
            '0x' +
            Array.from(walletAddress + Date.now().toString())
              .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
              .join('')
              .slice(0, 64)
          setTxHash(pseudoHash)
          setStatus('success')
        },
      }
    )
  }

  // ─── Success State ───────────────────────────────────────────────────────────
  if (status === 'success') return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-6">
      <div className="card rounded-2xl p-10 text-center max-w-md w-full">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--teal-dim)' }}
        >
          <CheckCircle size={28} style={{ color: 'var(--teal)' }} />
        </div>
        <h2 className="text-xl font-bold mono mb-2">identity_created.tx</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Your ShelbyID is now live — stored on ShelbyServers &amp; anchored on Aptos.
        </p>

        {txHash && (
          <div className="p-3 rounded-lg mb-3 text-left" style={{ background: 'var(--dark-3)' }}>
            <p className="text-xs mono mb-1" style={{ color: 'var(--muted)' }}>SHELBY_BLOB</p>
            <p className="text-xs mono break-all" style={{ color: 'var(--teal)' }}>
              shelbyid/{walletAddress}/identity.json
            </p>
          </div>
        )}

        <a
          href={`https://explorer.shelby.xyz/testnet`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1 text-xs mono mb-6"
          style={{ color: 'var(--muted)' }}
        >
          <ExternalLink size={10} /> view on shelby explorer
        </a>

        <button
          onClick={() => setCurrentPage('profile')}
          className="btn-teal w-full py-3 rounded-lg text-sm"
        >
          view_my_profile →
        </button>
      </div>
    </div>
  )

  // ─── Main Form ───────────────────────────────────────────────────────────────
  return (
    <div className="pt-24 min-h-screen max-w-lg mx-auto px-6 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mono mb-2">
          <span style={{ color: 'var(--teal)' }}>$</span> create_shelby_id
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Mint your decentralized identity on Aptos.
        </p>
      </div>

      {/* Wallet warning */}
      {!walletAddress && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.15)' }}
        >
          <AlertCircle size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
          <p className="text-xs mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
            connect_wallet_required
          </p>
        </div>
      )}

      {/* Error message */}
      {status === 'error' && errorMsg && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
          <p className="text-xs mono" style={{ color: '#f87171' }}>{errorMsg}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Avatar preview */}
        <div
          className="flex items-center gap-4 p-4 rounded-xl"
          style={{ background: 'var(--dark-2)', border: '1px solid rgba(45,212,191,0.08)' }}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.2)' }}
          >
            <User size={24} style={{ color: 'var(--teal)' }} />
          </div>
          <div>
            <p className="text-sm font-bold mono">{displayName || 'your_name'}</p>
            <p className="text-xs mono mt-0.5" style={{ color: 'var(--muted)' }}>
              {walletAddress ? `${walletAddress.slice(0, 10)}...` : '0x???'}
            </p>
            <p className="text-xs mono mt-0.5" style={{ color: 'var(--muted)' }}>
              [{category}]
            </p>
          </div>
        </div>

        {/* Form fields */}
        {[
          {
            label: 'DISPLAY_NAME *',
            value: displayName,
            setter: setDisplayName,
            placeholder: 'e.g. jea.creator',
          },
          {
            label: 'BIO',
            value: bio,
            setter: setBio,
            placeholder: 'What do you create?',
          },
          {
            label: 'TWITTER',
            value: twitter,
            setter: setTwitter,
            placeholder: '@username',
          },
        ].map(({ label, value, setter, placeholder }) => (
          <div key={label}>
            <label className="block text-xs mono mb-1.5" style={{ color: 'var(--muted)' }}>
              {label}
            </label>
            <input
              className="input-field w-full px-4 py-3 rounded-xl text-sm"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setter(e.target.value)}
            />
          </div>
        ))}

        {/* Category selector */}
        <div>
          <label className="block text-xs mono mb-1.5" style={{ color: 'var(--muted)' }}>
            CATEGORY
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['creator', 'artist', 'musician', 'dev'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="py-2 rounded-lg text-xs mono transition-all"
                style={{
                  background: category === cat ? 'var(--teal)' : 'var(--dark-3)',
                  color: category === cat ? '#050a0a' : 'var(--muted)',
                  border: '1px solid',
                  borderColor: category === cat ? 'var(--teal)' : 'transparent',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Info box */}
        <div
          className="p-3 rounded-lg"
          style={{ background: 'var(--dark-3)', border: '1px solid rgba(45,212,191,0.08)' }}
        >
          <p className="text-xs mono" style={{ color: 'var(--muted)' }}>
            // identity stored as JSON blob on ShelbyServers
          </p>
          <p className="text-xs mono mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            shelbyid/{walletAddress?.slice(0, 10) ?? '0x???'}…/identity.json
          </p>
        </div>

        {/* Submit button */}
        <button
          onClick={handleCreate}
          disabled={!displayName || !walletAddress || status === 'creating' || uploadBlobs.isPending}
          className="w-full btn-teal py-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === 'creating' || uploadBlobs.isPending ? (
            <>
              <Loader size={14} className="animate-spin" /> uploading_to_shelby...
            </>
          ) : (
            <>mint_shelby_id →</>
          )}
        </button>

        <p className="text-xs text-center mono" style={{ color: 'var(--muted)' }}>
          identity anchored on aptos · stored on ShelbyServers · 365 day expiry
        </p>
      </div>
    </div>
  )
}
