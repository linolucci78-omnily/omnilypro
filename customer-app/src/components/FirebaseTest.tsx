/**
 * Firebase Test Component
 * Componente temporaneo per testare la configurazione Firebase
 */

import { useState } from 'react'
import { notificationService } from '../services/notificationService'
import { useAuth } from '../contexts/AuthContext'

export default function FirebaseTest() {
  const { customer } = useAuth()
  const [status, setStatus] = useState<string>('Non testato')
  const [token, setToken] = useState<string>('')
  const [error, setError] = useState<string>('')

  const testFirebaseConfig = () => {
    setStatus('Verifica configurazione...')
    setError('')

    // Verifica variabili ambiente
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    }

    if (!config.apiKey || !config.projectId || !config.vapidKey) {
      setError('❌ Variabili Firebase mancanti nel .env')
      setStatus('Errore configurazione')
      return
    }

    if (config.vapidKey === 'PLACEHOLDER_VAPID_KEY') {
      setError('❌ VAPID key non configurata')
      setStatus('Errore configurazione')
      return
    }

    setStatus('✅ Configurazione Firebase OK!')
  }

  const testNotificationSupport = () => {
    setStatus('Verifica supporto browser...')

    const isSupported = notificationService.isSupported()

    if (!isSupported) {
      setError('❌ Browser non supporta notifiche push')
      setStatus('Browser non supportato')
      return
    }

    setStatus('✅ Browser supporta notifiche push!')
  }

  const requestPermission = async () => {
    setStatus('Richiesta permesso...')
    setError('')

    try {
      const permission = await notificationService.requestPermission()

      if (permission === 'granted') {
        setStatus('✅ Permesso concesso!')
      } else if (permission === 'denied') {
        setError('❌ Permesso negato')
        setStatus('Permesso negato')
      } else {
        setError('⚠️ Permesso in attesa')
        setStatus('Permesso in attesa')
      }
    } catch (err: any) {
      setError(`❌ Errore: ${err.message}`)
      setStatus('Errore')
    }
  }

  const registerDevice = async () => {
    setStatus('Registrazione device...')
    setError('')
    setToken('')

    if (!customer) {
      setError('❌ Nessun customer autenticato')
      setStatus('Errore')
      return
    }

    try {
      const result = await notificationService.registerDevice(customer.id, customer.organization_id)

      if (result.success && result.token) {
        setStatus('✅ Device registrato!')
        setToken(result.token.substring(0, 50) + '...')
      } else {
        const errorMsg = typeof result.error === 'object'
          ? JSON.stringify(result.error, null, 2)
          : result.error
        setError(`❌ Errore: ${errorMsg}`)
        setStatus('Errore registrazione')
      }
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err, null, 2)
      console.error('❌ Error details:', err)
      setError(`❌ Errore: ${errorMsg}`)
      setStatus('Errore')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #dc2626',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
      maxWidth: '400px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#dc2626', fontSize: '1.1rem' }}>
        🔥 Firebase Test
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button
          onClick={testFirebaseConfig}
          style={{
            padding: '10px 15px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          1. Test Config Firebase
        </button>

        <button
          onClick={testNotificationSupport}
          style={{
            padding: '10px 15px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          2. Test Supporto Browser
        </button>

        <button
          onClick={requestPermission}
          style={{
            padding: '10px 15px',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          3. Richiedi Permesso
        </button>

        <button
          onClick={registerDevice}
          style={{
            padding: '10px 15px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          4. Registra Device
        </button>
      </div>

      {/* Status */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: '#f3f4f6',
        borderRadius: '8px',
        fontSize: '0.85rem'
      }}>
        <strong>Status:</strong> {status}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: '#fee2e2',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#991b1b'
        }}>
          {error}
        </div>
      )}

      {/* Token */}
      {token && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: '#d1fae5',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#065f46',
          wordBreak: 'break-all'
        }}>
          <strong>Token FCM:</strong> {token}
        </div>
      )}
    </div>
  )
}
