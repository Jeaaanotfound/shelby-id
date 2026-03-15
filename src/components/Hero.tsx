import { ArrowRight, Shield, Globe, Search } from 'lucide-react'
import { useState } from 'react'

type Page = 'home' | 'profile' | 'create'

interface HeroProps {
  setCurrentPage: (page: Page) => void
  viewProfile: (address: string) => void
}

export default function Hero({ setCurrentPage, viewProfile }: HeroProps) {
  const [searchAddress, setSearchAddress] = useState('')

  const handleSearch = () => {
    if (searchAddress.trim()) viewProfile(searchAddress.trim())
  }

  return (
    <div className="pt-16">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, var(--cyan) 0%, transparent 70%)' }} />
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
          <div className="absolute left-0 right-0 h-px opacity-20 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)', animation: 'scan 4s linear infinite', top: 0 }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="animate-fade-up delay-1 inline-flex items-center gap-2 mb-8 px-4 py-2 rounded" style={{ background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cyan)', animation: 'pulse-cyan 2s infinite' }} />
            <span className="tag" style={{ background: 'none', border: 'none', padding: 0 }}>Shelby Protocol x Aptos - Decentralized Identity Layer</span>
          </div>

          <h1 className="animate-fade-up delay-2 text-5xl md:text-7xl font-extrabold leading-none mb-6" style={{ letterSpacing: '-0.03em' }}>
            Your Identity.<br />
            <span className="glow-text cursor-blink">On-Chain.</span>
          </h1>

          <p className="animate-fade-up delay-3 text-base md:text-lg mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, fontWeight: 300 }}>
            ShelbyID gives creators a permanent, verifiable identity page powered by Shelby Protocol. Your portfolio, your proof, your way.
          </p>

          <div className="animate-fade-up delay-3 flex gap-2 max-w-lg mx-auto mb-6">
            <div className="flex-1 flex items-center gap-2 px-4 rounded" style={{ background: 'var(--dark-3)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <Search size={14} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
              <input
                className="flex-1 py-3 text-sm bg-transparent outline-none"
                style={{ fontFamily: 'Space Mono, monospace', color: 'rgba(255,255,255,0.7)' }}
                placeholder="0x... enter wallet address"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button onClick={handleSearch} className="btn-cyan px-4 py-3 rounded">lookup_</button>
          </div>

          <div className="animate-fade-up delay-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => setCurrentPage('create')} className="btn-cyan flex items-center gap-2 px-8 py-3 rounded text-sm">
              Create My ShelbyID <ArrowRight size={14} />
            </button>
            <button onClick={() => viewProfile('0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a')}
              className="btn-outline-cyan flex items-center gap-2 px-8 py-3 rounded text-sm">
              View Demo Profile
            </button>
          </div>

          <div className="animate-fade-up delay-4 mt-20 grid grid-cols-3 gap-8 max-w-sm mx-auto">
            {[{ value: '∞', label: 'permanent' }, { value: '0x', label: 'censorship' }, { value: '1', label: 'identity' }].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold mb-1 glow-text" style={{ fontFamily: 'Space Mono, monospace' }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <p className="text-xs mb-3" style={{ fontFamily: 'Space Mono, monospace', color: 'var(--cyan)' }}>// why_shelby_id</p>
          <h2 className="text-3xl font-bold">Permanent. Verifiable. <span className="glow-text">Yours.</span></h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: 'On-Chain Proof', desc: 'Every ShelbyID is anchored on Aptos blockchain. Cryptographic proof that this identity belongs to you.' },
            { icon: Globe, title: 'Shelby-Powered', desc: 'Your portfolio stored on Shelby Protocol with sub-second access from anywhere in the world.' },
            { icon: ArrowRight, title: 'Shareable Link', desc: 'One link for your entire creative identity. Share it anywhere, it will always resolve to your on-chain profile.' },
          ].map((f, i) => (
            <div key={i} className="card-dark rounded-lg p-6">
              <div className="w-10 h-10 rounded flex items-center justify-center mb-5" style={{ background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.15)' }}>
                <f.icon size={18} style={{ color: 'var(--cyan)' }} />
              </div>
              <h3 className="font-bold mb-2 text-sm" style={{ fontFamily: 'Space Mono, monospace' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
