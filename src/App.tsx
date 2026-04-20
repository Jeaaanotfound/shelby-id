import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Profile from './components/Profile'
import CreateID from './components/CreateID'
import Dashboard from './components/Dashboard'
import Gallery from './components/Gallery'
import { useAppSettings } from './context/AppSettings'
import { DEFAULT_NETWORK_KEY } from './lib/aptos'

type Page = 'home' | 'profile' | 'create' | 'dashboard' | 'gallery'

function getAddressFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('profile') ?? params.get('gallery') ?? null
}

function App() {
  const { networkKey } = useAppSettings()
  const urlAddress  = getAddressFromUrl()
  const initialPage: Page = urlAddress
    ? (window.location.search.includes('gallery') ? 'gallery' : 'profile')
    : 'home'

  const [currentPage, setCurrentPage]       = useState<Page>(initialPage)
  const [walletAddress, setWalletAddress]   = useState<string | null>(null)
  const [profileAddress, setProfileAddress] = useState<string | null>(urlAddress)

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete('profile')
    url.searchParams.delete('gallery')

    if (networkKey !== DEFAULT_NETWORK_KEY) {
      url.searchParams.set('network', networkKey)
    } else {
      url.searchParams.delete('network')
    }

    if (currentPage === 'profile' && profileAddress) {
      url.searchParams.set('profile', profileAddress)
    } else if (currentPage === 'gallery' && walletAddress) {
      url.searchParams.set('gallery', walletAddress)
    }

    window.history.replaceState({}, '', url.toString())
  }, [currentPage, networkKey, profileAddress, walletAddress])

  const viewProfile = (address: string) => {
    setProfileAddress(address)
    setCurrentPage('profile')
  }

  const handleSetPage = (page: Page) => {
    if (page === 'home') setProfileAddress(null)
    setCurrentPage(page)
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--app-bg)' }}>
      <Header
        currentPage={currentPage}
        setCurrentPage={handleSetPage}
        setWalletAddress={setWalletAddress}
      />
      <main className="relative z-10">
        {currentPage === 'home'      && <Hero setCurrentPage={handleSetPage} viewProfile={viewProfile} />}
        {currentPage === 'profile'   && <Profile walletAddress={profileAddress || walletAddress} setCurrentPage={handleSetPage} />}
        {currentPage === 'create'    && <CreateID walletAddress={walletAddress} setCurrentPage={handleSetPage} />}
        {currentPage === 'dashboard' && <Dashboard walletAddress={walletAddress} setCurrentPage={handleSetPage} />}
        {currentPage === 'gallery'   && <Gallery walletAddress={walletAddress} />}
      </main>
    </div>
  )
}

export default App
