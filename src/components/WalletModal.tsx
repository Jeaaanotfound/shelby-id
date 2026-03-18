import { useEffect } from 'react'
import { X, Download, Wallet } from 'lucide-react'
import { useWallet as useAptosWallet, groupAndSortWallets } from '@aptos-labs/wallet-adapter-react'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { wallets = [], notDetectedWallets = [], connect, connected } = useAptosWallet()

  // Tutup modal saat wallet berhasil konek
  useEffect(() => {
    if (connected) onClose()
  }, [connected, onClose])

  // Tutup dengan Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!isOpen) return null

  const { availableWallets, installableWallets } = groupAndSortWallets([
    ...wallets,
    ...notDetectedWallets,
  ])

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName as any)
    } catch (err) {
      console.error('Connect failed:', err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,10,10,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'var(--dark-2)',
          border: '1px solid rgba(45,212,191,0.15)',
          boxShadow: '0 0 60px rgba(45,212,191,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(45,212,191,0.08)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.2)' }}
            >
              <Wallet size={13} style={{ color: 'var(--teal)' }} />
            </div>
            <div>
              <p className="text-sm font-bold mono">connect_wallet</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Aptos Testnet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* Installed wallets */}
          {availableWallets.length > 0 && (
            <div>
              <p className="text-xs mono mb-2" style={{ color: 'var(--muted)' }}>
                // installed
              </p>
              <div className="space-y-2">
                {availableWallets.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                    style={{
                      background: 'var(--dark-3)',
                      border: '1px solid rgba(45,212,191,0.06)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(45,212,191,0.25)'
                      e.currentTarget.style.background = 'rgba(45,212,191,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(45,212,191,0.06)'
                      e.currentTarget.style.background = 'var(--dark-3)'
                    }}
                  >
                    {wallet.icon ? (
                      <img
                        src={wallet.icon}
                        alt={wallet.name}
                        className="w-8 h-8 rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--teal-dim)' }}
                      >
                        <Wallet size={14} style={{ color: 'var(--teal)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mono">{wallet.name}</p>
                      <p className="text-xs" style={{ color: '#4ade80' }}>Installed</p>
                    </div>
                    <div
                      className="text-xs mono px-2 py-1 rounded"
                      style={{ background: 'var(--teal-dim)', color: 'var(--teal)' }}
                    >
                      connect →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Not installed wallets */}
          {installableWallets.length > 0 && (
            <div>
              <p className="text-xs mono mb-2" style={{ color: 'var(--muted)' }}>
                // not installed
              </p>
              <div className="space-y-2">
                {installableWallets.map((wallet) => (
                  <a
                    key={wallet.name}
                    href={wallet.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: 'var(--dark-3)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
                    }}
                  >
                    {wallet.icon ? (
                      <img
                        src={wallet.icon}
                        alt={wallet.name}
                        className="w-8 h-8 rounded-lg flex-shrink-0"
                        style={{ opacity: 0.5 }}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--dark-4)', opacity: 0.5 }}
                      >
                        <Wallet size={14} style={{ color: 'var(--muted)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {wallet.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>Not installed</p>
                    </div>
                    <div
                      className="flex items-center gap-1 text-xs mono px-2 py-1 rounded"
                      style={{ background: 'var(--dark-4)', color: 'var(--muted)' }}
                    >
                      <Download size={10} /> install
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Empty */}
          {availableWallets.length === 0 && installableWallets.length === 0 && (
            <div className="text-center py-6">
              <p className="text-xs mono" style={{ color: 'var(--muted)' }}>
                // no_wallets_detected
              </p>
              <a
                href="https://petra.app/"
                target="_blank"
                rel="noreferrer"
                className="btn-teal inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-xs"
              >
                <Download size={12} /> install_petra
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 text-center"
          style={{ borderTop: '1px solid rgba(45,212,191,0.06)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Powered by{' '}
            <span style={{ color: 'rgba(45,212,191,0.4)' }}>Shelby Protocol × Aptos</span>
          </p>
        </div>
      </div>
    </div>
  )
}
