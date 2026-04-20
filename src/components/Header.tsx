import { useState, useEffect, useCallback } from 'react'
import { Menu, Moon, SunMedium, X } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { useAppSettings } from '../context/AppSettings'
import { WALLET_MODAL_REOPEN_STORAGE_KEY } from '../context/WalletRuntime'
import WalletModal from './WalletModal'
import BrandLogo from './BrandLogo'
import type { AppNetworkKey } from '../lib/aptos'

type Page = 'home' | 'profile' | 'create' | 'dashboard' | 'gallery'

interface HeaderProps {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  setWalletAddress: (address: string | null) => void
}

const navItems: { page: Page; label: string }[] = [
  { page: 'home', label: 'Home' },
  { page: 'dashboard', label: 'Workspace' },
  { page: 'gallery', label: 'Gallery' },
  { page: 'profile', label: 'Profile' },
  { page: 'create', label: 'Mint' },
]

const networkButtons: { key: AppNetworkKey; label: string }[] = [
  { key: 'shelbynet', label: 'ShelbyNet' },
  { key: 'testnet', label: 'Testnet' },
]

export default function Header({ currentPage, setCurrentPage, setWalletAddress }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const { address, shortAddress, connected, disconnect } = useWallet()
  const { networkConfig, networkKey, setNetworkKey, theme, toggleTheme } = useAppSettings()

  const syncAddress = useCallback(() => {
    setWalletAddress(address)
  }, [address, setWalletAddress])

  useEffect(() => {
    syncAddress()
  }, [syncAddress])

  useEffect(() => {
    if (window.sessionStorage.getItem(WALLET_MODAL_REOPEN_STORAGE_KEY) !== '1') return

    window.sessionStorage.removeItem(WALLET_MODAL_REOPEN_STORAGE_KEY)
    setModalOpen(true)
  }, [])

  const renderNetworkSwitch = (compact = false) => (
    <div className={`network-switch ${compact ? 'w-full' : ''}`}>
      {networkButtons.map((entry) => (
        <button
          key={entry.key}
          type="button"
          onClick={() => setNetworkKey(entry.key)}
          className={`network-switch__button ${networkKey === entry.key ? 'network-switch__button-active' : ''}`}
        >
          {entry.label}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 header-shell">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-20 flex items-center justify-between gap-4">
            <button onClick={() => setCurrentPage('home')} className="flex items-center gap-3 text-left">
              <BrandLogo size={30} />
            </button>

            <nav className="hidden lg:flex items-center gap-7">
              {navItems.map(({ page, label }) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`nav-button ${currentPage === page ? 'nav-button-active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {renderNetworkSwitch()}

              <button type="button" onClick={toggleTheme} className="control-button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <SunMedium size={16} /> : <Moon size={16} />}
              </button>

              <div className="network-pill">
                <span className="network-pill__dot" />
                <div>
                  <p className="network-pill__label">{networkConfig.label}</p>
                  <p className="network-pill__sub">{networkConfig.badge}</p>
                </div>
              </div>

              {connected && address ? (
                <button onClick={disconnect} className="wallet-chip">
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                  {shortAddress}
                </button>
              ) : (
                <button onClick={() => setModalOpen(true)} className="btn-ghost px-4 py-2.5 rounded-full text-sm font-medium">
                  Connect Wallet
                </button>
              )}

              <button className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button type="button" onClick={toggleTheme} className="control-button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <SunMedium size={16} /> : <Moon size={16} />}
              </button>
              <button className="w-11 h-11 flex items-center justify-center rounded-xl control-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="md:hidden pb-4">
              <div className="mobile-menu">
                <div className="mobile-menu__section">
                  <p className="mobile-menu__label">Network</p>
                  {renderNetworkSwitch(true)}
                  <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {networkConfig.note}
                  </p>
                </div>

                <div className="mobile-menu__section">
                  <p className="mobile-menu__label">Navigate</p>
                  <div className="space-y-2">
                    {navItems.map(({ page, label }) => (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page)
                          setMenuOpen(false)
                        }}
                        className={`mobile-nav-button ${currentPage === page ? 'mobile-nav-button-active' : ''}`}
                      >
                        <span>{label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{currentPage === page ? 'live' : 'open'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mobile-menu__section">
                  <p className="mobile-menu__label">Wallet</p>
                  {connected && address ? (
                    <button onClick={disconnect} className="wallet-chip w-full justify-center">
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                      {shortAddress}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setModalOpen(true)
                        setMenuOpen(false)
                      }}
                      className="btn-pink w-full py-3 rounded-full text-sm font-semibold"
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <WalletModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
