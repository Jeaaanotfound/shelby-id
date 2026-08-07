import { ArrowRight, Globe, Link as LinkIcon, Search, Shield, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useAppSettings } from '../context/AppSettings'
import { isValidAptosAddress } from '../lib/aptos'

type Page = 'home' | 'profile' | 'create' | 'dashboard' | 'gallery'

interface HeroProps {
  setCurrentPage: (page: Page) => void
  viewProfile: (address: string) => void
}

const valueCards = [
  {
    icon: Shield,
    title: 'Keep the record with your wallet',
    description: 'Your profile metadata and creator files are linked to your Aptos account and readable from ShelbyNet.',
  },
  {
    icon: Globe,
    title: 'Made to be read',
    description: 'Shelby handles distribution so your work stays fast, public, and easy to share.',
  },
  {
    icon: LinkIcon,
    title: 'One clean surface',
    description: 'A single link for your identity, your archive, and the registration records behind them.',
  },
]

export default function Hero({ setCurrentPage, viewProfile }: HeroProps) {
  const { networkConfig } = useAppSettings()
  const [searchAddress, setSearchAddress] = useState('')
  const [searchError, setSearchError] = useState('')

  const handleSearch = () => {
    const value = searchAddress.trim()
    if (!value) return

    if (!isValidAptosAddress(value)) {
      setSearchError('Enter a valid Aptos address to view a profile.')
      return
    }

    setSearchError('')
    viewProfile(value)
  }

  return (
    <div className="hero-shell">
      <section className="hero-frame">
        <div className="hero-grid">
          <div className="animate-fade-up">
            <div className="hero-badge-row">
              <span className="hero-badge hero-badge-accent">
                <Sparkles size={12} />
                Ready for the Shelby community
              </span>
              <span className="hero-badge">
                {networkConfig.label} / {networkConfig.badge}
              </span>
            </div>

            <h1 className="hero-title">
              A better public record
              <span> for serious creators.</span>
            </h1>

            <p className="hero-subtitle hero-copy">
              ShelbyID turns a wallet into a credible public profile: a wallet-linked identity layer, a shareable archive,
              and a cleaner way to present work to communities, collaborators, and collectors.
            </p>

            <div className="hero-actions animate-fade-up delay-1">
              <button
                onClick={() => setCurrentPage('create')}
                className="btn-pink flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold hover-lift"
              >
                Mint ShelbyID <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage('gallery')}
                className="btn-ghost px-6 py-3.5 rounded-full text-sm font-medium"
              >
                Browse Gallery
              </button>
            </div>

            <div className="hero-search animate-fade-up delay-2">
              <div className="hero-search__field">
                <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  className="hero-search__input"
                  placeholder="Paste an Aptos address to view a profile"
                  value={searchAddress}
                  onChange={(event) => {
                    setSearchAddress(event.target.value)
                    if (searchError) setSearchError('')
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSearch()
                  }}
                />
              </div>
              <button onClick={handleSearch} className="hero-search__button">
                Open
              </button>
            </div>

            <div className="hero-meta animate-fade-up delay-3">
              <div className="hero-metric">
                <span className="hero-metric__value">Creator-grade</span>
                <span className="hero-metric__label">identity surface</span>
              </div>
              <div className="hero-metric">
                <span className="hero-metric__value">{networkConfig.label}</span>
                <span className="hero-metric__label">current network</span>
              </div>
              <div className="hero-metric">
                <span className="hero-metric__value">Aptos + Shelby</span>
                <span className="hero-metric__label">base stack</span>
              </div>
            </div>

            {searchError && (
              <p className="text-sm mt-4 animate-fade-up" style={{ color: 'var(--danger)' }}>
                {searchError}
              </p>
            )}
          </div>

          <div className="hero-showcase animate-fade-up delay-2">
            <div className="hero-panel hero-panel-primary">
              <div className="hero-panel__header">
                <div>
                  <p className="section-kicker">Product signal</p>
                  <h2 className="hero-panel__title">Built to feel credible the first time someone opens it.</h2>
                </div>
                <span className="hero-live-pill">live</span>
              </div>

              <div className="hero-stack">
                <div className="hero-card hero-card-profile">
                  <div className="hero-card__identity">
                    <div className="hero-avatar" />
                    <div>
                      <div className="hero-line hero-line-lg" />
                      <div className="hero-line hero-line-sm" />
                    </div>
                  </div>
                  <div className="hero-stats">
                    <div className="hero-stats__item">
                      <span>Identity</span>
                      <strong>registered</strong>
                    </div>
                    <div className="hero-stats__item">
                      <span>Archive</span>
                      <strong>distributed</strong>
                    </div>
                    <div className="hero-stats__item">
                      <span>Network</span>
                      <strong>{networkConfig.label}</strong>
                    </div>
                  </div>
                </div>

                <div className="hero-card hero-card-note">
                  <p className="section-kicker">Why this matters</p>
                  <p className="hero-card-note__copy">{networkConfig.note}</p>
                </div>
              </div>
            </div>

            <div className="hero-value-grid">
              {valueCards.map(({ icon: Icon, title, description }) => (
                <article key={title} className="hero-value-card">
                  <div className="hero-value-card__icon">
                    <Icon size={16} />
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="hero-cta-band">
        <div className="hero-cta-band__content">
          <div>
            <p className="section-kicker" style={{ color: 'var(--accent)' }}>
              Put your public profile in order
            </p>
          <h2 className="hero-cta-band__title">A cleaner front door for work you want to share.</h2>
            <p className="hero-cta-band__copy">
              Start on {networkConfig.label} and give your work a surface that feels deliberate from day one.
            </p>
          </div>
          <div className="hero-cta-band__actions">
            <button onClick={() => setCurrentPage('create')} className="btn-pink px-8 py-4 rounded-full font-semibold">
              Mint ShelbyID
            </button>
            <button onClick={() => setCurrentPage('dashboard')} className="btn-ghost px-8 py-4 rounded-full text-sm font-medium">
              Open Workspace
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
