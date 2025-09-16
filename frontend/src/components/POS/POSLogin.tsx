import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './POSLogin.css'

const POSLogin: React.FC = () => {
  const [email, setEmail] = useState('test@pos.com')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Inserisci email e password')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      // TEMPORARY: Bypass per testing POS quando Supabase non è disponibile
      if (email === 'test@pos.com' && password === 'password123') {
        console.log('🚀 POS Demo Mode - Bypass login attivo')
        setError('')
        // Simula user loggato creando oggetto mock
        const mockUser = { email: 'test@pos.com', id: 'demo-user' }
        // Salva temporaneamente in localStorage
        localStorage.setItem('pos-demo-user', JSON.stringify(mockUser))
        window.location.reload() // Ricarica per attivare il bypass
        return
      }
      
      await signIn(email, password)
      // Il login andrà automaticamente al POS interface
    } catch (error: any) {
      setError('Supabase non raggiungibile - Usa test@pos.com per demo')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pos-login-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>📧 Email Azienda</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="es. pizzeria@example.com"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>🔒 Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password azienda"
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className={`login-button ${loading ? 'loading' : ''}`}
        >
          {loading ? '⏳ Accesso...' : '🚀 Accedi al POS'}
        </button>
      </form>

      <div className="login-help">
        <p>💡 Usa le credenziali create nel wizard aziendale</p>
        <p>🔧 Ogni POS è dedicato alla sua azienda</p>
      </div>
    </div>
  )
}

export default POSLogin