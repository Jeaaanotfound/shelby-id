import { ArrowRight, Shield, Globe, Link, Search } from 'lucide-react'
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
      {/* ── Hero Section ── */}
      <section className="relative flex items-center justify-center overflow-hidden py-28 md:py-36">

        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, var(--cyan) 0%, transparent 70%)' }} />
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
          <div className="absolute left-0 right-0 h-px opacity-20"
            style={{ background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)', animation: 'scan 4s linear infinite', top: 0 }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">

          {/* Badge */}
          <div className="animate-fade-up delay-1 inline-flex items-center gap-2 mb-8 px-4 py-2 rounded"
            style={{ background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--cyan)', animation: 'pulse-cyan 2s infinite' }} />
            <span className="text-xs" style={{ fontFamily: 'Space Mono, monospace', color: 'var(--cyan)' }}>
              ShelbyServers × Aptos — Decentralized Identity Layer
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-2 text-5xl md:text-7xl font-extrabold leading-none mb-6"
            style={{ letterSpacing: '-0.03em' }}>
            Your Identity.<br />
            <span className="glow-text cursor-blink">On-Chain.</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up delay-3 text-base md:text-lg mb-10 max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, fontWeight: 300 }}>
            A permanent, verifiable identity page for creators — powered by ShelbyServers.
            Your portfolio, your proof, forever on-chain.
          </p>

          {/* Search bar */}
          <div className="animate-fade-up delay-3 flex gap-2 max-w-lg mx-auto mb-8">
            <div className="flex-1 flex items-center gap-2 px-4 rounded-lg"
              style={{ background: 'var(--dark-3)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <Search size={14} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
              <input
                className="flex-1 py-3 text-sm bg-transparent outline-none"
                style={{ fontFamily: 'Space Mono, monospace', color: 'rgba(255,255,255,0.75)' }}
                placeholder="0x... lookup any wallet address"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button onClick={handleSearch}
              className="btn-cyan px-5 py-3 rounded-lg text-sm font-medium"
              style={{ fontFamily: 'Space Mono, monospace' }}>
              lookup_
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="animate-fade-up delay-4 flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
            <button
              onClick={() => setCurrentPage('create')}
              className="btn-cyan flex items-center gap-2 px-10 py-4 rounded-lg text-sm font-bold w-full sm:w-auto"
              style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.875rem' }}>
              Create My ShelbyID <ArrowRight size={15} />
            </button>
            <button
              onClick={() => viewProfile('0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a')}
              className="btn-outline-cyan flex items-center gap-2 px-10 py-4 rounded-lg text-sm w-full sm:w-auto"
              style={{ fontFamily: 'Space Mono, monospace' }}>
              View Demo Profile
            </button>
          </div>

          {/* Stats */}
          <div className="animate-fade-up delay-4 grid grid-cols-3 gap-6 max-w-md mx-auto">
            {[
              { value: '∞', label: 'storage_days', sub: 'permanent' },
              { value: '0', label: 'downtime', sub: 'always_on' },
              { value: '1', label: 'identity', sub: 'per_wallet' },
            ].map((s) => (
              <div key={s.label} className="text-center py-4 px-2 rounded-xl"
                style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}>
                <div className="text-3xl font-bold mb-1 glow-text"
                  style={{ fontFamily: 'Space Mono, monospace' }}>{s.value}</div>
                <div className="text-xs font-medium mb-0.5"
                  style={{ color: 'var(--cyan)', fontFamily: 'Space Mono, monospace' }}>{s.label}</div>
                <div className="text-xs"
                  style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Section ── */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="text-center mb-14">
          <p className="text-xs mb-3"
            style={{ fontFamily: 'Space Mono, monospace', color: 'var(--cyan)' }}>
            // why_shelby_id
          </p>
          <h2 className="text-3xl font-bold">
            Permanent. Verifiable. <span className="glow-text">Yours.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: Shield,
              title: 'On-Chain Proof',
              desc: 'Every ShelbyID is anchored on Aptos blockchain. Cryptographic proof that this identity belongs to you — forever.',
            },
            {
              icon: Globe,
              title: 'ShelbyServers-Powered',
              desc: 'Your portfolio stored on ShelbyServers with sub-second read access from anywhere in the world.',
            },
            {
              icon: Link,
              title: 'Permanent Link',
              desc: 'One link for your entire creative identity. Share it anywhere — it will always resolve to your on-chain profile.',
            },
          ].map((f, i) => (
            <div key={i} className="card-dark rounded-xl p-6 flex flex-col gap-4"
              style={{ border: '1px solid rgba(0,212,255,0.08)', transition: 'border-color 0.2s' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.15)' }}>
                <f.icon size={18} style={{ color: 'var(--cyan)' }} />
              </div>
              <div>
                <h3 className="font-bold mb-2 text-sm"
                  style={{ fontFamily: 'Space Mono, monospace' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center py-12 rounded-2xl"
          style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.1)' }}>
          <p className="text-xs mono mb-2" style={{ color: 'var(--cyan)' }}>// ready_to_start</p>
          <h3 className="text-xl font-bold mb-6">Claim your on-chain identity today.</h3>
          <button
            onClick={() => setCurrentPage('create')}
            className="btn-cyan inline-flex items-center gap-2 px-10 py-4 rounded-lg text-sm font-bold"
            style={{ fontFamily: 'Space Mono, monospace' }}>
            mint_shelby_id → <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </div>
  )
}
