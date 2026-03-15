import { ExternalLink, Copy, Twitter, Music, Image, FileText, Video, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface ProfileProps {
  walletAddress: string | null
}

const mockWorks = [
  { id: '1', name: 'artwork-001.jpg', category: 'art', size: '3.2 MB', date: '2026-03-13' },
  { id: '2', name: 'track-demo.mp3', category: 'music', size: '7.8 MB', date: '2026-03-12' },
  { id: '3', name: 'essay-draft.txt', category: 'writing', size: '24 KB', date: '2026-03-11' },
]

const categoryIcons: Record<string, React.ElementType> = {
  art: Image, music: Music, writing: FileText, video: Video,
}

const categoryColors: Record<string, string> = {
  art: '#2dd4bf', music: '#818cf8', writing: '#fb923c', video: '#f472b6',
}

export default function Profile({ walletAddress }: ProfileProps) {
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!walletAddress) return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm mono mb-2" style={{ color: 'var(--teal)' }}>$ error: wallet_not_connected</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Connect your wallet to view your ShelbyID profile.</p>
      </div>
    </div>
  )

  return (
    <div className="pt-24 min-h-screen max-w-2xl mx-auto px-6 pb-32">
      {/* Profile Card */}
      <div className="card rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.2)' }}>
            <span className="text-2xl font-bold mono" style={{ color: 'var(--teal)' }}>J</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold mono">jea.creator</h2>
              <span className="text-xs mono px-2 py-0.5 rounded"
                style={{ background: 'var(--teal-dim)', color: 'var(--teal)', border: '1px solid rgba(45,212,191,0.2)' }}>
                verified
              </span>
            </div>
            <button onClick={copyAddress}
              className="flex items-center gap-1.5 text-xs mono transition-colors"
              style={{ color: copied ? 'var(--teal)' : 'var(--muted)' }}>
              {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
              {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}
            </button>
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Independent creator building at the intersection of art and Web3.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <a href="https://twitter.com" target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs mono"
                style={{ color: 'var(--muted)' }}>
                <Twitter size={10} /> @jea
              </a>
              <a href={`https://explorer.aptoslabs.com/account/${walletAddress}?network=testnet`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs mono"
                style={{ color: 'var(--muted)' }}>
                <ExternalLink size={10} /> aptos_explorer
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'works', value: mockWorks.length },
          { label: 'storage', value: '11 MB' },
          { label: 'network', value: 'testnet' },
        ].map(s => (
          <div key={s.label} className="card rounded-xl p-4 text-center">
            <p className="text-lg font-bold mono" style={{ color: 'var(--teal)' }}>{s.value}</p>
            <p className="text-xs mono mt-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Works */}
      <div>
        <p className="text-xs mono mb-3" style={{ color: 'var(--muted)' }}>$ ls ./works</p>
        <div className="space-y-2">
          {mockWorks.map(work => {
            const Icon = categoryIcons[work.category] || FileText
            const color = categoryColors[work.category] || 'var(--teal)'
            return (
              <div key={work.id} className="card rounded-xl p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mono truncate">{work.name}</p>
                  <p className="text-xs mono" style={{ color: 'var(--muted)' }}>{work.size} · {work.date}</p>
                </div>
                <ExternalLink size={12} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
