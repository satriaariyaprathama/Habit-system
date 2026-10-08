import { createContext, useCallback, useContext, useState, ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  notify: (message: string, tone?: Toast['tone']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`rounded-sm border px-4 py-2 text-sm shadow-none animate-toast-in ${
              t.tone === 'error'
                ? 'border-clay-500/40 bg-clay-100 text-clay-500'
                : t.tone === 'info'
                  ? 'border-line bg-paper text-ink-soft'
                  : 'border-moss-500/40 bg-moss-50 text-moss-700'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
