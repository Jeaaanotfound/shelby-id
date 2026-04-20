import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

export interface ToastInput {
  title: string
  description?: string
  tone?: ToastTone
  durationMs?: number
}

interface ToastRecord extends ToastInput {
  id: number
  tone: ToastTone
}

interface ToastContextValue {
  notify: (toast: ToastInput) => void
}

const TOAST_DURATION_MS = 4200
const ToastContext = createContext<ToastContextValue | null>(null)

function getToastIcon(tone: ToastTone) {
  if (tone === 'success') return CheckCircle2
  if (tone === 'error') return AlertCircle
  if (tone === 'warning') return TriangleAlert
  return Info
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextIdRef = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    ({ tone = 'info', durationMs = TOAST_DURATION_MS, ...toast }: ToastInput) => {
      const id = nextIdRef.current++
      setToasts((current) => [...current, { id, tone, durationMs, ...toast }])
      window.setTimeout(() => dismiss(id), durationMs)
    },
    [dismiss]
  )

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const Icon = getToastIcon(toast.tone)

          return (
            <div key={toast.id} className={`toast-card toast-card--${toast.tone}`}>
              <div className="toast-card__icon">
                <Icon size={16} />
              </div>
              <div className="toast-card__content">
                <p className="toast-card__title">{toast.title}</p>
                {toast.description && <p className="toast-card__description">{toast.description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(toast.id)} className="toast-card__close" aria-label="Dismiss notification">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }

  return context
}
