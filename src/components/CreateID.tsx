import { useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle, Loader, ShieldCheck, Sparkles } from 'lucide-react'
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { useAppSettings } from '../context/AppSettings'
import { useToast } from '../context/ToastContext'
import { getWalletAddress, sameAddress } from '../lib/aptos'
import { createExpirationMicros, formatShelbyErrorMessage, getIdentityBlobName, SHELBY_BLOB_EXPIRATION_DAYS } from '../lib/shelby'
import { uploadShelbyBlobsWithWallet } from '../lib/shelbyWrite'
import { ensureWalletMatchesAppNetwork, getTransactionErrorMessage, isWalletRejectedError } from '../lib/transactions'

type Status = 'idle' | 'uploading' | 'success' | 'error'
type Category = 'art' | 'music' | 'writing' | 'video' | 'creator'

interface CreateIDProps {
  walletAddress: string | null
  setCurrentPage: (page: 'home' | 'profile' | 'create' | 'dashboard' | 'gallery') => void
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'writing', label: 'Writing' },
  { value: 'video', label: 'Video' },
  { value: 'creator', label: 'Creator' },
]

export default function CreateID({ walletAddress, setCurrentPage }: CreateIDProps) {
  const { networkConfig, networkKey } = useAppSettings()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')
  const [category, setCategory] = useState<Category>('creator')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { notify } = useToast()
  const { account, network, signTransaction } = useAptosWallet()
  const connectedAddress = getWalletAddress(account)

  const handleMint = async () => {
    if (!walletAddress || !connectedAddress || !signTransaction) return
    if (!sameAddress(connectedAddress, walletAddress)) {
      setStatus('error')
      setErrorMsg('Wallet mismatch. Connect the same wallet you want to mint for.')
      notify({
        tone: 'error',
        title: 'Wallet mismatch',
        description: 'Connect the same wallet you want to mint for.',
      })
      return
    }
    if (!displayName.trim()) return

    setStatus('uploading')
    setErrorMsg('')

    const identity = {
      version: '1.0',
      displayName: displayName.trim(),
      bio: bio.trim(),
      category,
      twitter: twitter.replace('@', '').trim(),
      address: walletAddress,
      createdAt: new Date().toISOString(),
    }

    try {
      await ensureWalletMatchesAppNetwork({
        walletNetwork: network,
        networkKey,
        notify,
      })

      const result = await uploadShelbyBlobsWithWallet({
        walletAddress,
        signTransaction,
        blobs: [
          {
            blobName: getIdentityBlobName(walletAddress),
            blobData: new TextEncoder().encode(JSON.stringify(identity)),
          },
        ],
        expirationMicros: createExpirationMicros(SHELBY_BLOB_EXPIRATION_DAYS),
        networkKey,
      })

      setStatus('success')
      notify({
        tone: 'success',
        title: 'ShelbyID minted',
        description:
          result.registrationStatus === 'registered'
            ? `Identity created successfully on ${networkConfig.label}.`
            : `Identity updated on ${networkConfig.label}. No wallet approval was needed because the blob was already registered.`,
      })
    } catch (err) {
      setStatus('error')
      const message = isWalletRejectedError(err)
        ? getTransactionErrorMessage(err, 'Mint ShelbyID', networkKey)
        : formatShelbyErrorMessage(err, networkKey)
      setErrorMsg(message)
      notify({
        tone: 'error',
        title: 'Mint failed',
        description: message,
      })
    }
  }

  const initials = displayName ? displayName[0].toUpperCase() : walletAddress ? walletAddress[2].toUpperCase() : '?'
  const shortAddr = walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : ''

  if (!walletAddress) {
    return (
      <div className="premium-shell flex items-center justify-center">
        <div className="max-w-sm w-full premium-surface premium-surface--padded">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
            <AlertCircle size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <p className="font-bold mb-2" style={{ color: 'var(--text-primary)', fontSize: '16px', letterSpacing: '-0.02em' }}>
            Wallet not connected
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Connect your Aptos wallet to mint your ShelbyID.
          </p>
          <button onClick={() => setCurrentPage('home')} className="btn-pink px-6 py-2.5 rounded-full text-sm font-semibold">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="premium-shell flex items-center justify-center">
        <div className="max-w-sm w-full premium-surface premium-surface--padded text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-fade-up" style={{ background: 'var(--success-dim)', border: '1px solid var(--success-border)' }}>
            <CheckCircle size={26} style={{ color: 'var(--success)' }} />
          </div>
          <h2 className="animate-fade-up delay-1" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Identity minted.
          </h2>
          <p className="text-sm mb-8 animate-fade-up delay-2" style={{ color: 'var(--text-secondary)' }}>
            Your ShelbyID is now live on {networkConfig.label} through Shelby Protocol.
          </p>
          <div className="flex gap-3 justify-center animate-fade-up delay-3">
            <button onClick={() => setCurrentPage('profile')} className="btn-pink px-6 py-2.5 rounded-full text-sm font-semibold">
              View Profile
            </button>
            <button onClick={() => setCurrentPage('dashboard')} className="btn-ghost px-6 py-2.5 rounded-full text-sm">
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-shell">
      <div className="premium-frame">
        <section className="premium-hero animate-fade-up">
          <div className="premium-hero__grid">
            <div>
              <span className="premium-kicker">Create ShelbyID</span>
              <h1 className="premium-title premium-title--wide">Publish a public identity that feels clear, wallet-linked, and worth trusting.</h1>
              <p className="premium-copy">
                ShelbyID should feel less like filling a profile form and more like publishing a wallet-linked calling card. The record is stored on {networkConfig.label}, and the metadata is ready to travel with your work.
              </p>
              <div className="premium-meta-row">
                <span className="premium-chip premium-chip--accent">
                  <ShieldCheck size={13} /> Readable record
                </span>
                <span className="premium-chip">
                  <Sparkles size={13} /> Curated identity layer
                </span>
                <span className="premium-chip">{networkConfig.label}</span>
              </div>
            </div>
            <div className="premium-aside-card">
              <span className="premium-aside-card__eyebrow">Why this matters</span>
              <h2 className="premium-aside-card__title">People should understand who you are before they scroll.</h2>
              <p className="premium-aside-card__copy">
                A good ShelbyID gives collectors, collaborators, and peers a fast signal. It pairs a stable address with a clear name, category, and a registration record linking the identity metadata to Shelby storage.
              </p>
              <div className="muted-dot-list">
                <span>Stored on Shelby</span>
                <span>Portable metadata</span>
                <span>Wallet-signed</span>
              </div>
            </div>
          </div>
        </section>

        <section className="premium-grid animate-fade-up delay-1">
          <div className="premium-surface premium-surface--padded">
            <div className="premium-section-head">
              <div>
                <p className="section-kicker">Identity Draft</p>
                <h2>Author the record</h2>
              </div>
                <p>Keep it concise. This should read like a high-signal signature, not a noisy social bio.</p>
            </div>

            <div className="premium-form">
              <div className="premium-form__block">
                <label className="premium-form__label">
                  Display Name <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. jea.creator"
                  className="input-field w-full px-4 py-3 rounded-2xl text-sm"
                />
              </div>

              <div className="premium-form__block">
                <label className="premium-form__label">Short Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Explain your practice, medium, or what makes your work legible."
                  rows={4}
                  className="input-field w-full px-4 py-3 rounded-2xl text-sm resize-none"
                />
              </div>

              <div className="premium-form__block">
                <label className="premium-form__label">Twitter Handle</label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@username"
                  className="input-field w-full px-4 py-3 rounded-2xl text-sm"
                />
              </div>

              <div className="premium-form__block">
                <label className="premium-form__label">Category</label>
                <div className="category-pills">
                  {CATEGORIES.map((entry) => (
                    <button key={entry.value} onClick={() => setCategory(entry.value)} className={`category-pill ${category === entry.value ? 'category-pill--active' : ''}`}>
                      {entry.label}
                    </button>
                  ))}
                </div>
              </div>

              {status === 'error' && (
                <div className="premium-surface premium-surface--padded" style={{ background: 'color-mix(in oklch, var(--danger) 8%, var(--bg-elevated))' }}>
                  <div className="flex items-start gap-3 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{errorMsg || "We couldn't mint your ID. Please try again."}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="editorial-stack">
            <div className="curation-panel">
              <span className="premium-aside-card__eyebrow">Live preview</span>
              <div className="identity-stage">
                <div className="identity-stage__avatar">{initials}</div>
                <div>
                  <h2 className="identity-stage__title">{displayName || 'your_name'}</h2>
                  <p className="identity-stage__sub">{shortAddr}</p>
                </div>
              </div>
              <div className="action-row">
                <span className="premium-chip premium-chip--accent">{category}</span>
                <span className="premium-chip">
                  <CheckCircle size={12} /> wallet-linked
                </span>
              </div>
              <p className="premium-aside-card__copy">{bio || networkConfig.tagline}</p>
            </div>

            <div className="premium-surface premium-surface--padded">
              <div className="editorial-stack">
                <div>
                  <p className="section-kicker">Mint checklist</p>
                  <div className="muted-dot-list" style={{ marginTop: '10px' }}>
                    <span>Right wallet connected</span>
                    <span>Network matches the app</span>
                    <span>Name is ready to share</span>
                  </div>
                </div>
                <button
                  onClick={handleMint}
                  disabled={!displayName.trim() || status === 'uploading'}
                  className="btn-pink w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontSize: '15px' }}
                >
                  {status === 'uploading' ? (
                    <>
                      <Loader size={15} className="animate-spin" /> Minting...
                    </>
                  ) : (
                    <>
                      Mint ShelbyID <ArrowRight size={15} />
                    </>
                  )}
                </button>
                <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Free to mint. Stored on Shelby Protocol. Ready on {networkConfig.label}.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
