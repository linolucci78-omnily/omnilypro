import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './UpdatePrompt.css'

export default function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW Registered:', registration)

      // Check for updates every 60 seconds
      if (registration) {
        setInterval(() => {
          registration.update()
        }, 60000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true)
    }
  }, [needRefresh])

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
    setShowPrompt(false)
  }

  const handleUpdate = () => {
    updateServiceWorker(true)
  }

  if (!showPrompt) return null

  return (
    <div className="update-prompt-overlay">
      <div className="update-prompt">
        <div className="update-prompt-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </div>

        <h3 className="update-prompt-title">Nuova Versione Disponibile!</h3>

        <p className="update-prompt-message">
          È disponibile un aggiornamento dell'app con nuove funzionalità e miglioramenti.
        </p>

        <div className="update-prompt-buttons">
          <button
            className="update-prompt-btn update-prompt-btn-primary"
            onClick={handleUpdate}
          >
            Aggiorna Ora
          </button>
          <button
            className="update-prompt-btn update-prompt-btn-secondary"
            onClick={close}
          >
            Più Tardi
          </button>
        </div>
      </div>
    </div>
  )
}
