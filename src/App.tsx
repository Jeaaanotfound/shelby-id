import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Profile from './components/Profile'
import CreateID from './components/CreateID'
import Dashboard from './components/Dashboard'
import Gallery from './components/Gallery'

type Page = 'home' | 'profile' | 'create' | 'dashboard' | 'gallery'

function getAddressFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('profile') ?? params.get('gallery') ?? null
}

function App() {
  const urlAddress  = getAddressFromUrl()
  const initialPage: Page = urlAddress
    ? (window.location.search.includes('gallery') ? 'gallery' : 'profile')
    : 'home'

  const [currentPage, setCurrentPage]       = useState<Page>(initialPage)
  const [walletAddress, setWalletAddress]   = useState<string | null>(null)
  const [profileAddress, setProfileAddress] = useState<string | null>(urlAddress)

  useEffect(() => {
    if (currentPage === 'profile' && profileAddress) {
      const url = new URL(window.location.href)
      url.searchParams.set('profile', profileAddress)
      window.history.replaceState({}, '', url.toString())
    } else if (currentPage === 'gallery' && walletAddress) {
      const url = new URL(window.location.href)
      url.searchParams.set('gallery', walletAddress)
      window.history.replaceState({}, '', url.toString())
    } else {
      const url = new URL(window.location.href)
      url.search = ''
      window.history.replaceState({}, '', url.toString())
    }
  }, [currentPage, profileAddress, walletAddress])

  const viewProfile = (address: string) => {
    setProfileAddress(address)
    setCurrentPage('profile')
  }

  const handleSetPage = (page: Page) => {
    if (page === 'home') setProfileAddress(null)
    setCurrentPage(page)
  }

  return (
    <div className="min-h-screen relative" style={{ background: '#0a0010' }}>
      {/* Mesh gradient layers */}
      <div className="mesh-blob-1" />
      <div className="mesh-blob-2" />
      <div className="mesh-blob-3" />
      <div className="mesh-blob-4" />
      <div className="mesh-vignette" />
      <div className="scanline" />

      <Header
        currentPage={currentPage}
        setCurrentPage={handleSetPage}
        walletAddress={walletAddress}
        setWalletAddress={setWalletAddress}
      />
      <main className="relative z-10">
        {currentPage === 'home'      && <Hero setCurrentPage={handleSetPage} viewProfile={viewProfile} />}
        {currentPage === 'profile'   && <Profile walletAddress={profileAddress || walletAddress} />}
        {currentPage === 'create'    && <CreateID walletAddress={walletAddress} setCurrentPage={handleSetPage} />}
        {currentPage === 'dashboard' && <Dashboard walletAddress={walletAddress} setCurrentPage={handleSetPage} />}
        {currentPage === 'gallery'   && <Gallery walletAddress={walletAddress} setCurrentPage={handleSetPage} />}
      </main>
    </div>
  )
}

export default App
