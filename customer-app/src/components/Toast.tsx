import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[10000] animate-slide-up">
      <div
        className={`
          flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border-2
          ${
            type === 'success'
              ? 'bg-green-50 border-green-500 text-green-900'
              : 'bg-red-50 border-red-500 text-red-900'
          }
        `}
        style={{
          minWidth: '280px',
          maxWidth: '90vw'
        }}
      >
        {type === 'success' ? (
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" strokeWidth={2.5} />
        ) : (
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" strokeWidth={2.5} />
        )}

        <p className="font-semibold text-base flex-1">{message}</p>

        <button
          onClick={onClose}
          className={`
            p-1 rounded-lg transition-colors flex-shrink-0
            ${type === 'success' ? 'hover:bg-green-200' : 'hover:bg-red-200'}
          `}
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
