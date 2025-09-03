import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const { user, signIn, signUp, signInWithGoogle } = useAuth()
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
      if (isSignUp) {
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

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      setMessage(`❌ Errore Google Login: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Link to="/" className="login-logo">
            🚀 <span>OMNILY PRO</span>
          </Link>
          <h1>{isSignUp ? 'Registrati' : 'Accedi'}</h1>
          <p>Benvenuto nella piattaforma SaaS multi-tenant</p>
        </div>

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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="La tua password"
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? '🔄 Elaborazione...' : (isSignUp ? '📝 Registrati' : '🔑 Accedi')}
          </button>

          <div className="auth-divider">
            <span>oppure</span>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="btn btn-google btn-full"
          >
            🌐 Continua con Google
          </button>

          {message && (
            <div className={`auth-message ${message.includes('❌') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="auth-switch">
            {isSignUp ? (
              <p>
                Hai già un account? {' '}
                <button 
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="link-button"
                >
                  Accedi qui
                </button>
              </p>
            ) : (
              <p>
                Non hai un account? {' '}
                <button 
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="link-button"
                >
                  Registrati qui
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login