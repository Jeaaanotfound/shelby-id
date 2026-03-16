import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Profile from './components/Profile'
import CreateID from './components/CreateID'

type Page = 'home' | 'profile' | 'create'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [profileAddress, setProfileAddress] = useState<string | null>(null)

  const viewProfile = (address: string) => {
    setProfileAddress(address)
    setCurrentPage('profile')
  }

  const handleSetPage = (page: Page) => {
    if (page === 'home') setProfileAddress(null)
    setCurrentPage(page)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--dark)' }}>
      <div className="scanline" />
      <Header
        currentPage={currentPage}
        setCurrentPage={handleSetPage}
        walletAddress={walletAddress}
        setWalletAddress={setWalletAddress}
      />
      <main>
        {currentPage === 'home' && (
          <Hero
            setCurrentPage={handleSetPage}
            viewProfile={viewProfile}
          />
        )}
        {currentPage === 'profile' && (
          <Profile
            walletAddress={profileAddress || walletAddress}
          />
        )}
        {currentPage === 'create' && (
          <CreateID
            walletAddress={walletAddress}
            setCurrentPage={handleSetPage}
          />
        )}
      </main>
    </div>
  )
}

export default App
