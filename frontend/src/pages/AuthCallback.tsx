import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (data.session) {
          setStatus('success')
          setMessage('Account confermato con successo!')

          // Controlla se l'utente ha già un'organizzazione
          const { data: orgData } = await supabase
            .from('organization_users')
            .select('organization_id')
            .eq('user_id', data.session.user.id)
            .limit(1)
            .maybeSingle()

          // Reindirizza dopo 2 secondi mantenendo i parametri POS
          setTimeout(() => {
            const searchParams = window.location.search
            // Se non ha organizzazioni, vai all'onboarding
            if (!orgData) {
              navigate(`/onboarding${searchParams}`)
            } else {
              navigate(`/dashboard${searchParams}`)
            }
          }, 2000)
        } else {
          // Prova a gestire il callback URL
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')

          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })

            if (setSessionError) {
              throw setSessionError
            }

            setStatus('success')
            setMessage('Account confermato con successo!')

            setTimeout(() => {
              const searchParams = window.location.search
              navigate(`/dashboard${searchParams}`)
            }, 2000)
          } else {
            throw new Error('Token di conferma non valido')
          }
        }
      } catch (error: any) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage(error.message || 'Errore durante la conferma dell\'account')

        // Reindirizza al login dopo 3 secondi
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '1rem',
      padding: '2rem'
    }}>
      {status === 'loading' && (
        <>
          <Loader size={48} className="animate-spin" />
          <h2>Conferma account in corso...</h2>
          <p>Attendere prego...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle size={48} style={{ color: '#10b981' }} />
          <h2 style={{ color: '#10b981' }}>Conferma completata!</h2>
          <p>{message}</p>
          <p>Verrai reindirizzato alla dashboard...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle size={48} style={{ color: '#ef4444' }} />
          <h2 style={{ color: '#ef4444' }}>Errore di conferma</h2>
          <p>{message}</p>
          <p>Verrai reindirizzato al login...</p>
        </>
      )}
    </div>
  )
}

export default AuthCallback