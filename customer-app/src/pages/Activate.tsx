import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useOrganization } from '../contexts/OrganizationContext'

export default function Activate() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { organization } = useOrganization()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [customer, setCustomer] = useState<any>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (token) {
      verifyToken()
    } else {
      setError('Token di attivazione mancante')
      setLoading(false)
    }
  }, [token])

  const verifyToken = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('activation_token', token)
        .eq('is_activated', false)
        .single()

      if (error || !data) {
        setError('Token non valido o già utilizzato')
        return
      }

      setCustomer(data)
    } catch (err: any) {
      setError('Errore durante la verifica del token')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: '', color: 'transparent' }
    if (pwd.length < 6) return { strength: 33, label: 'Debole', color: '#ef4444' }
    if (pwd.length < 10) return { strength: 66, label: 'Media', color: '#f59e0b' }
    return { strength: 100, label: 'Forte', color: '#10b981' }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri')
      return
    }

    if (password !== confirmPassword) {
      setError('Le password non corrispondono')
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase.functions.invoke('activate-customer', {
        body: { token, password }
      })

      if (error) throw new Error(error.message)
      if (data.error) throw new Error(data.error)
      if (!data.success) throw new Error('Errore durante l\'attivazione')

      setSuccess(true)

      setTimeout(() => {
        navigate(`/${slug}/login`)
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Errore durante l\'attivazione')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '6px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }}></div>
          <p style={{ color: 'white', fontSize: '1.125rem', fontWeight: 500 }}>
            Verifica in corso...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !customer) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#dc2626' }}>
            Link non valido
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: 1.6 }}>
            {error}
          </p>
          <button
            onClick={() => navigate(`/${slug}/login`)}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              width: '100%',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Vai al Login
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.5s ease-out'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            animation: 'bounceIn 0.6s ease-out'
          }}>
            ✅
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#10b981' }}>
            Account Attivato!
          </h2>
          <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
            Perfetto! Ora puoi accedere con le tue credenziali.
          </p>
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#f0fdf4',
            borderRadius: '0.75rem',
            border: '1px solid #86efac'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#166534' }}>
              Reindirizzamento al login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main activation form
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '440px',
        animation: 'slideUp 0.5s ease-out'
      }}>
        {/* Logo Section */}
        {organization?.logo_url && (
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem',
            background: 'white',
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <img
              src={organization.logo_url}
              alt={organization.name}
              style={{ maxWidth: '140px', height: 'auto' }}
            />
          </div>
        )}

        {/* Main Card */}
        <div style={{
          background: 'white',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔐</div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Attiva il tuo Account
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
              Ciao <strong style={{ color: '#111827' }}>{customer?.name}</strong>! 👋
              <br />
              Imposta una password sicura per iniziare
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email (disabled) */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                📧 Email
              </label>
              <input
                type="email"
                value={customer?.email || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  background: '#f9fafb',
                  color: '#6b7280',
                  fontWeight: 500
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                🔒 Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minimo 6 caratteri"
                  style={{
                    width: '100%',
                    padding: '0.875rem 3rem 0.875rem 1rem',
                    border: `2px solid ${password ? passwordStrength.color : '#e5e7eb'}`,
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = password ? passwordStrength.color : '#e5e7eb'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{
                    height: '4px',
                    background: '#e5e7eb',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${passwordStrength.strength}%`,
                      background: passwordStrength.color,
                      transition: 'all 0.3s',
                      borderRadius: '2px'
                    }}></div>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: passwordStrength.color,
                    marginTop: '0.25rem',
                    fontWeight: 600
                  }}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                🔐 Conferma Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Ripeti la password"
                  style={{
                    width: '100%',
                    padding: '0.875rem 3rem 0.875rem 1rem',
                    border: `2px solid ${confirmPassword && confirmPassword !== password ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = confirmPassword && confirmPassword !== password ? '#ef4444' : '#e5e7eb'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem'
                  }}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', fontWeight: 600 }}>
                  Le password non corrispondono
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '1rem',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                border: '1px solid #fecaca'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || password !== confirmPassword}
              style={{
                width: '100%',
                padding: '1rem',
                background: submitting || password !== confirmPassword
                  ? '#d1d5db'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1.0625rem',
                fontWeight: 700,
                cursor: submitting || password !== confirmPassword ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: submitting || password !== confirmPassword ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOver={(e) => {
                if (!submitting && password === confirmPassword) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                }
              }}
              onMouseOut={(e) => {
                if (!submitting && password === confirmPassword) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              {submitting ? '⏳ Attivazione in corso...' : '✨ Attiva Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
