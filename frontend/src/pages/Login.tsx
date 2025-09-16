import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login')

  const { user, signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [user, navigate, location])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (authMode === 'signup') {
        await signUp(email, password)
        setMessage('✅ Registrazione completata! Controlla la tua email per confermare l\'account.')
      } else {
        await signIn(email, password)
        setMessage('✅ Login effettuato con successo!')
        // Navigation will be handled by useEffect
      }
    } catch (error) {
      setMessage(`❌ Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await resetPassword(email)
      setMessage('✅ Se l\'email è corretta, riceverai un link per il reset della password.')
    } catch (error) {
      setMessage(`❌ Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      setMessage(`❌ Errore Google Login: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    }
  }

  const getTitle = () => {
    if (authMode === 'signup') return 'Registrati'
    if (authMode === 'reset') return 'Recupera Password'
    return 'Accedi'
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Link to="/" className="login-logo">
            🚀 <span>OMNILY PRO</span>
          </Link>
          <h1>{getTitle()}</h1>
          <p>Benvenuto nella piattaforma SaaS multi-tenant</p>
        </div>

        {authMode === 'reset' ? (
          <form onSubmit={handlePasswordReset} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Invio...' : 'Invia link per il reset'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="La tua password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 3L21 21M9.9 4.24C10.5 4.07 11.2 4 12 4C16.5 4 20.4 7.22 21.54 12C21.13 13.37 20.44 14.5 19.56 15.5M14.12 14.12C13.8 14.63 13.25 15 12.6 15C11.45 15 10.5 14.05 10.5 12.9C10.5 12.25 10.87 11.7 11.38 11.38M9.9 19.76C10.5 19.93 11.2 20 12 20C7.5 20 3.6 16.78 2.46 12C3.15 10.22 4.31 8.69 5.81 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {authMode === 'login' && (
              <div className="auth-extra-links">
                <button 
                  type="button"
                  onClick={() => setAuthMode('reset')}
                  className="link-button"
                >
                  Password dimenticata?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Elaborazione...' : (authMode === 'signup' ? 'Registrati' : 'Accedi')}
            </button>

            <div className="auth-divider">
              <span>oppure</span>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="btn btn-google btn-full"
            >
              Continua con Google
            </button>
          </form>
        )}

        {message && (
          <div className={`auth-message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="auth-switch">
          {authMode === 'login' && (
            <p>
              Non hai un account? {' '}
              <button type="button" onClick={() => setAuthMode('signup')} className="link-button">
                Registrati qui
              </button>
            </p>
          )}
          {authMode === 'signup' && (
            <p>
              Hai già un account? {' '}
              <button type="button" onClick={() => setAuthMode('login')} className="link-button">
                Accedi qui
              </button>
            </p>
          )}
          {authMode === 'reset' && (
            <p>
              Tornare al? {' '}
              <button type="button" onClick={() => setAuthMode('login')} className="link-button">
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
Login