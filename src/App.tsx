import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Profile from './components/Profile'
import CreateID from './components/CreateID'

type Page = 'home' | 'profile' | 'create'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  return (
    <div className="min-h-screen" style={{ background: 'var(--dark)' }}>
      <div className="scanline" />
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        walletAddress={walletAddress}
        setWalletAddress={setWalletAddress}
      />
      <main>
        {currentPage === 'home' && <Hero setCurrentPage={setCurrentPage} walletAddress={walletAddress} />}
        {currentPage === 'profile' && <Profile walletAddress={walletAddress} />}
        {currentPage === 'create' && <CreateID walletAddress={walletAddress} setCurrentPage={setCurrentPage} />}
      </main>
    </div>
  )
}

export default App
