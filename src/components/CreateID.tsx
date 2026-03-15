import { useState } from 'react'
import { CheckCircle, Loader, AlertCircle, User } from 'lucide-react'

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

  const handleCreate = async () => {
    if (!walletAddress || !displayName) return
    setStatus('creating')
    await new Promise(r => setTimeout(r, 2000))
    const mock = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    setTxHash(mock)
    setStatus('success')
  }

  if (status === 'success') return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-6">
      <div className="card rounded-2xl p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--teal-dim)' }}>
          <CheckCircle size={28} style={{ color: 'var(--teal)' }} />
        </div>
        <h2 className="text-xl font-bold mono mb-2">identity_created.tx</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Your ShelbyID is now live on Aptos blockchain.
        </p>
        <div className="p-3 rounded-lg mb-6 text-left" style={{ background: 'var(--dark-3)' }}>
          <p className="text-xs mono mb-1" style={{ color: 'var(--muted)' }}>TX_HASH</p>
          <p className="text-xs mono break-all" style={{ color: 'var(--teal)' }}>{txHash}</p>
        </div>
        <button onClick={() => setCurrentPage('profile')} className="btn-teal w-full py-3 rounded-lg text-sm">
          view_my_profile →
        </button>
      </div>
    </div>
  )

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

      {!walletAddress && (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.15)' }}>
          <AlertCircle size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
          <p className="text-xs mono" style={{ color: 'rgba(255,255,255,0.5)' }}>connect_wallet_required</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Avatar preview */}
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--dark-2)', border: '1px solid rgba(45,212,191,0.08)' }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.2)' }}>
            <User size={24} style={{ color: 'var(--teal)' }} />
          </div>
          <div>
            <p className="text-sm font-bold mono">{displayName || 'your_name'}</p>
            <p className="text-xs mono mt-0.5" style={{ color: 'var(--muted)' }}>
              {walletAddress ? walletAddress.slice(0, 10) + '...' : '0x???'}
            </p>
          </div>
        </div>

        {[
          { label: 'DISPLAY_NAME', value: displayName, setter: setDisplayName, placeholder: 'e.g. jea.creator', required: true },
          { label: 'BIO', value: bio, setter: setBio, placeholder: 'What do you create?', required: false },
          { label: 'TWITTER', value: twitter, setter: setTwitter, placeholder: '@username', required: false },
        ].map(({ label, value, setter, placeholder }) => (
          <div key={label}>
            <label className="block text-xs mono mb-1.5" style={{ color: 'var(--muted)' }}>{label}</label>
            <input className="input-field w-full px-4 py-3 rounded-xl text-sm"
              placeholder={placeholder} value={value}
              onChange={e => setter(e.target.value)} />
          </div>
        ))}

        {/* Category */}
        <div>
          <label className="block text-xs mono mb-1.5" style={{ color: 'var(--muted)' }}>CATEGORY</label>
          <div className="grid grid-cols-4 gap-2">
            {['creator', 'artist', 'musician', 'dev'].map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="py-2 rounded-lg text-xs mono transition-all"
                style={{
                  background: category === cat ? 'var(--teal)' : 'var(--dark-3)',
                  color: category === cat ? '#050a0a' : 'var(--muted)',
                  border: '1px solid',
                  borderColor: category === cat ? 'var(--teal)' : 'transparent',
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleCreate}
          disabled={!displayName || !walletAddress || status === 'creating'}
          className="w-full btn-teal py-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          {status === 'creating' ? (
            <><Loader size={14} className="animate-spin" /> minting_identity...</>
          ) : (
            <>mint_shelby_id →</>
          )}
        </button>

        <p className="text-xs text-center mono" style={{ color: 'var(--muted)' }}>
          identity anchored on aptos · stored on shelby protocol
        </p>
      </div>
    </div>
  )
}
