import { useState, useEffect, useCallback } from 'react'
import { Menu, X } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import WalletModal from './WalletModal'

type Page = 'home' | 'profile' | 'create' | 'dashboard' | 'gallery'

interface HeaderProps {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  walletAddress: string | null
  setWalletAddress: (address: string | null) => void
}

const navItems: { page: Page; label: string }[] = [
  { page: 'home',      label: 'Home'      },
  { page: 'dashboard', label: 'Dashboard' },
  { page: 'gallery',   label: 'Gallery'   },
  { page: 'profile',   label: 'Profile'   },
  { page: 'create',    label: 'Create ID' },
]

function OrbitLogo({ size = 28 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width={size} height={size} style={{ flexShrink: 0 }}>
      <ellipse cx="40" cy="40" rx="36" ry="15" fill="none" stroke="#ff69b0" strokeWidth="1.2" opacity="0.25"/>
      <ellipse cx="40" cy="40" rx="15" ry="36" fill="none" stroke="#ff69b0" strokeWidth="1.2" opacity="0.25"/>
      <ellipse cx="40" cy="40" rx="36" ry="15" fill="none" stroke="#ff69b0" strokeWidth="1.2" opacity="0.2" transform="rotate(60 40 40)"/>
      <circle cx="40" cy="40" r="14" fill="#0a0010" stroke="#ff69b0" strokeWidth="1.5"/>
      <text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="700" fill="#ff69b0" fontFamily="Space Mono, monospace">S</text>
      <circle cx="40" cy="4"  r="4"   fill="#ff69b0"/>
      <circle cx="76" cy="40" r="3"   fill="#ff69b0" opacity="0.5"/>
      <circle cx="16" cy="62" r="2.5" fill="#ff69b0" opacity="0.4"/>
    </svg>
  )
}

export default function Header({ currentPage, setCurrentPage, setWalletAddress }: HeaderProps) {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const { address, shortAddress, connected, disconnect } = useWallet()

  const syncAddress = useCallback(() => { setWalletAddress(address) }, [address, setWalletAddress])
  useEffect(() => { syncAddress() }, [syncAddress])

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(10,0,16,0.65)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <button onClick={() => setCurrentPage('home')} className="flex items-center gap-2.5">
            <OrbitLogo size={28} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>
              ShelbyID
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(({ page, label }) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '13px',
                  fontWeight: currentPage === page ? 600 : 400,
                  color: currentPage === page ? 'white' : 'rgba(255,255,255,0.4)',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => { if (currentPage !== page) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)' }}
                onMouseLeave={e => { if (currentPage !== page) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {connected && address ? (
              <button
                onClick={disconnect}
                className="flex items-center gap-2"
                style={{
                  background: 'rgba(255,105,176,0.1)',
                  border: '1px solid rgba(255,105,176,0.25)',
                  color: 'var(--pink)',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '11px',
                  padding: '7px 16px',
                  borderRadius: '99px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,105,176,0.18)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,105,176,0.1)'}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                {shortAddress}
              </button>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  border: '1px solid rgba(255,255,255,0.22)',
                  color: 'white',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  padding: '7px 18px',
                  borderRadius: '99px',
                  background: 'transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,105,176,0.4)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--pink)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.22)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
                }}
              >
                Connect Wallet
              </button>
            )}

            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden px-6 py-4 flex flex-col gap-4"
            style={{ background: 'rgba(10,0,16,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            {navItems.map(({ page, label }) => (
              <button
                key={page}
                onClick={() => { setCurrentPage(page); setMenuOpen(false) }}
                className="text-left"
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '14px',
                  fontWeight: currentPage === page ? 600 : 400,
                  color: currentPage === page ? 'white' : 'rgba(255,255,255,0.4)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      <WalletModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
