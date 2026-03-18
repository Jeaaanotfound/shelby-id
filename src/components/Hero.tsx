import { ArrowRight, Search } from 'lucide-react'
import { useState } from 'react'

type Page = 'home' | 'profile' | 'create' | 'dashboard' | 'gallery'

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
    <div className="pt-14 min-h-screen flex flex-col items-center justify-center px-6 text-center">

      {/* Badge */}
      <div
        className="animate-fade-up delay-1 inline-flex items-center gap-2 mb-8"
        style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--pink)' }} />
        Built on Shelby
      </div>

      {/* Headline — Outfit bukan Space Mono */}
      <h1
        className="animate-fade-up delay-2"
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: 'clamp(36px, 6vw, 68px)',
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          color: 'white',
          marginBottom: '20px',
          maxWidth: '720px',
        }}
      >
        Your Identity,{' '}
        <span style={{ color: 'rgba(255,255,255,0.28)' }}>Permanently</span>{' '}
        <span style={{ color: 'var(--pink)' }}>On-Chain.</span>
      </h1>

      {/* Subheadline */}
      <p
        className="animate-fade-up delay-3"
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '16px',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.8,
          maxWidth: '460px',
          marginBottom: '36px',
        }}
      >
        A permanent, verifiable identity page for creators,{' '}
        <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>powered by ShelbyServers.</span>{' '}
        Your portfolio, your proof, forever.
      </p>

      {/* CTA Buttons */}
      <div className="animate-fade-up delay-3 flex flex-col sm:flex-row items-center gap-3 mb-10">
        <button
          onClick={() => setCurrentPage('create')}
          className="flex items-center gap-2"
          style={{
            background: 'var(--pink)',
            color: '#0a0010',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            fontWeight: 700,
            padding: '13px 28px',
            borderRadius: '99px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(255,105,176,0.3)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = ''
          }}
        >
          Create My ShelbyID <ArrowRight size={16} />
        </button>

        <button
          onClick={() => setCurrentPage('profile')}
          style={{
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            fontWeight: 400,
            padding: '13px 28px',
            borderRadius: '99px',
            background: 'transparent',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,105,176,0.35)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--pink)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'
          }}
        >
          Explore Profiles
        </button>
      </div>

      {/* Search bar */}
      <div
        className="animate-fade-up delay-4 flex gap-2 w-full"
        style={{ maxWidth: '480px', marginBottom: '60px' }}
      >
        <div
          className="flex-1 flex items-center gap-2 px-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '99px',
          }}
        >
          <Search size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          <input
            className="flex-1 py-3 text-sm bg-transparent outline-none"
            style={{ fontFamily: 'Outfit, sans-serif', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}
            placeholder="0x... lookup any wallet address"
            value={searchAddress}
            onChange={e => setSearchAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          style={{
            background: 'rgba(255,105,176,0.12)',
            border: '1px solid rgba(255,105,176,0.25)',
            color: 'var(--pink)',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            padding: '0 20px',
            borderRadius: '99px',
            transition: 'all 0.2s',
          }}
        >
          Search
        </button>
      </div>

      {/* Why section */}
      <div className="animate-fade-up delay-4 w-full" style={{ maxWidth: '800px' }}>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '32px' }}>
          Why ShelbyID
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              title: 'On-Chain Proof',
              desc: 'Every ShelbyID is anchored on Aptos blockchain. Cryptographic proof that this identity belongs to you, forever.',
            },
            {
              title: 'ShelbyServers-Powered',
              desc: 'Your portfolio stored on ShelbyServers with sub-second read access from anywhere in the world.',
            },
            {
              title: 'Permanent Link',
              desc: 'One link for your entire creative identity. Share it anywhere, it will always resolve to your on-chain profile.',
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
                padding: '20px',
                backdropFilter: 'blur(12px)',
                textAlign: 'left',
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,105,176,0.2)')}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)')}
            >
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, fontWeight: 300 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: '48px',
            padding: '40px',
            borderRadius: '16px',
            background: 'rgba(255,105,176,0.04)',
            border: '1px solid rgba(255,105,176,0.1)',
            marginBottom: '48px',
          }}
        >
          <p style={{ fontSize: '11px', color: 'rgba(255,105,176,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Ready to start
          </p>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '20px' }}>
            Claim your on-chain identity today.
          </h3>
          <button
            onClick={() => setCurrentPage('create')}
            className="flex items-center gap-2 mx-auto"
            style={{
              background: 'var(--pink)',
              color: '#0a0010',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              fontWeight: 700,
              padding: '13px 28px',
              borderRadius: '99px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(255,105,176,0.3)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = ''
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = ''
            }}
          >
            Mint ShelbyID → <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
