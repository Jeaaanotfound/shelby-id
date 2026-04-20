import { useCallback, useEffect, useMemo, useState } from 'react'
import { X, Download, RefreshCcw, Wallet } from 'lucide-react'
import { useWallet as useAptosWallet, groupAndSortWallets } from '@aptos-labs/wallet-adapter-react'
import { useAppSettings } from '../context/AppSettings'
import { useWalletRuntime, WALLET_MODAL_REOPEN_STORAGE_KEY } from '../context/WalletRuntime'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { networkConfig } = useAppSettings()
  const { refreshWalletDetection } = useWalletRuntime()
  const { wallets = [], notDetectedWallets = [], connect, connected } = useAptosWallet()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const walletOptions = useMemo(() => [...wallets, ...notDetectedWallets], [notDetectedWallets, wallets])
  const { aptosConnectWallets, availableWallets, installableWallets } = groupAndSortWallets(walletOptions)

  useEffect(() => {
    if (connected) onClose()
  }, [connected, onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName as any)
    } catch (err) {
      console.error('Connect failed:', err)
    }
  }

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    window.sessionStorage.setItem(WALLET_MODAL_REOPEN_STORAGE_KEY, '1')
    refreshWalletDetection()
  }, [refreshWalletDetection])

  useEffect(() => {
    if (!isRefreshing) return

    const timeoutId = window.setTimeout(() => {
      setIsRefreshing(false)
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [isRefreshing])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(5,10,10,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden animate-scale-up"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent-border)',
          boxShadow: '0 0 56px oklch(67% 0.21 348 / 0.07)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
              <Wallet size={13} style={{ color: 'var(--pink)' }} />
            </div>
            <div>
              <p className="text-sm font-bold">Connect wallet</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {networkConfig.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
            aria-label="Close wallet modal"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ background: 'color-mix(in oklch, var(--bg-elevated) 90%, transparent)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Wallet not showing up?
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Refresh detection after the extension finishes loading into the page.
              </p>
            </div>
            <button type="button" onClick={handleRefresh} className="btn-ghost inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium" disabled={isRefreshing}>
              <RefreshCcw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing' : 'Refresh'}
            </button>
          </div>

          {aptosConnectWallets.length > 0 && (
            <div>
              <p className="text-xs mono mb-2" style={{ color: 'var(--muted)' }}>Aptos Connect</p>
              <div className="space-y-2">
                {aptosConnectWallets.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-border)'
                      e.currentTarget.style.background = 'var(--accent-subtle)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)'
                      e.currentTarget.style.background = 'var(--bg-elevated)'
                    }}
                  >
                    {wallet.icon ? (
                      <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded-lg flex-shrink-0" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--pink-dim)' }}>
                        <Wallet size={14} style={{ color: 'var(--pink)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mono">{wallet.name}</p>
                      <p className="text-xs" style={{ color: '#f9a8d4' }}>Use your Aptos account</p>
                    </div>
                    <div className="text-xs mono px-2 py-1 rounded" style={{ background: 'var(--pink-dim)', color: 'var(--pink)' }}>
                      connect
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableWallets.length > 0 && (
            <div>
              <p className="text-xs mono mb-2" style={{ color: 'var(--muted)' }}>Installed wallets</p>
              <div className="space-y-2">
                {availableWallets.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-border)'
                      e.currentTarget.style.background = 'var(--accent-subtle)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)'
                      e.currentTarget.style.background = 'var(--bg-elevated)'
                    }}
                  >
                    {wallet.icon ? (
                      <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded-lg flex-shrink-0" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--pink-dim)' }}>
                        <Wallet size={14} style={{ color: 'var(--pink)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mono">{wallet.name}</p>
                      <p className="text-xs" style={{ color: '#4ade80' }}>Ready to connect</p>
                    </div>
                    <div className="text-xs mono px-2 py-1 rounded" style={{ background: 'var(--pink-dim)', color: 'var(--pink)' }}>
                      connect
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {installableWallets.length > 0 && (
            <div>
              <p className="text-xs mono mb-2" style={{ color: 'var(--muted)' }}>Available to install</p>
              <div className="space-y-2">
                {installableWallets.map((wallet) => (
                  <a
                    key={wallet.name}
                    href={wallet.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{ background: 'var(--dark-3)', border: '1px solid var(--border-subtle)', display: 'flex' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-mid)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)'
                    }}
                  >
                    {wallet.icon ? (
                      <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded-lg flex-shrink-0" loading="lazy" decoding="async" style={{ opacity: 0.5 }} />
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--dark-4)', opacity: 0.5 }}>
                        <Wallet size={14} style={{ color: 'var(--muted)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mono" style={{ color: 'var(--text-muted)' }}>
                        {wallet.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>Install this wallet first</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs mono px-2 py-1 rounded" style={{ background: 'var(--dark-4)', color: 'var(--muted)' }}>
                      <Download size={10} /> install
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {aptosConnectWallets.length === 0 && availableWallets.length === 0 && installableWallets.length === 0 && (
            <div className="text-center py-6">
              <p className="text-xs mono" style={{ color: 'var(--muted)' }}>No wallets detected</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Open this app in a desktop browser with an Aptos wallet enabled.
              </p>
              <a href="https://petra.app/" target="_blank" rel="noreferrer" className="btn-teal inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-xs">
                <Download size={12} /> Install Petra
              </a>
            </div>
          )}
        </div>

        <div className="px-5 py-3 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Built with <span style={{ color: 'var(--accent)', opacity: 0.6 }}>Shelby Protocol x Aptos</span>
          </p>
        </div>
      </div>
    </div>
  )
}
