import { useState, useEffect } from 'react'
import { Wallet, Menu, X } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'

type Page = 'home' | 'profile' | 'create'

interface HeaderProps {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  walletAddress: string | null
  setWalletAddress: (address: string | null) => void
}

export default function Header({ currentPage, setCurrentPage, setWalletAddress }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { address, shortAddress, isConnecting, installed, connect, disconnect } = useWallet()

  useEffect(() => { setWalletAddress(address) }, [address])

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(5,10,10,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(45,212,191,0.08)' }}>
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <button onClick={() => setCurrentPage('home')} className="flex items-center gap-2">
          <span className="text-xs mono px-2 py-1 rounded" style={{ background: 'var(--teal-dim)', color: 'var(--teal)', border: '1px solid rgba(45,212,191,0.2)' }}>
            SID://
          </span>
          <span className="font-bold text-sm mono">ShelbyID</span>
        </button>

        <nav className="hidden md:flex items-center gap-6">
          {(['home', 'profile', 'create'] as Page[]).map((page) => (
            <button key={page} onClick={() => setCurrentPage(page)}
              className="text-xs mono uppercase tracking-widest transition-colors"
              style={{ color: currentPage === page ? 'var(--teal)' : 'var(--muted)' }}>
              {page === 'create' ? 'Create ID' : page}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {address ? (
            <button onClick={disconnect} className="btn-outline flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
              {shortAddress}
            </button>
          ) : (
            <button onClick={connect} disabled={isConnecting}
              className="btn-teal flex items-center gap-2 px-3 py-1.5 rounded-lg disabled:opacity-60">
              <Wallet size={12} />
              {isConnecting ? 'connecting...' : installed ? 'connect_wallet' : 'install_petra'}
            </button>
          )}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-6 py-4 flex flex-col gap-4" style={{ background: 'var(--dark-2)', borderTop: '1px solid rgba(45,212,191,0.08)' }}>
          {(['home', 'profile', 'create'] as Page[]).map((page) => (
            <button key={page} onClick={() => { setCurrentPage(page); setMenuOpen(false) }}
              className="text-left text-xs mono uppercase tracking-widest"
              style={{ color: currentPage === page ? 'var(--teal)' : 'var(--muted)' }}>
              {page === 'create' ? 'Create ID' : page}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
