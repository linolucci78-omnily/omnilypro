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

  const primaryColor = organization?.primary_color || '#dc2626'

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
      if (!data.success) throw new Error('Errore durante l\\'attivazione')

      setSuccess(true)

      setTimeout(() => {
        navigate(`/${slug}/login`)
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Errore durante l\\'attivazione')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e5e7eb',
            borderTopColor: primaryColor,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
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
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#dc2626' }}>
            Link non valido
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </p>
          <button
            onClick={() => navigate(`/${slug}/login`)}
            style={{
              padding: '0.75rem 1.5rem',
              background: primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              width: '100%'
            }}
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
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#10b981' }}>
            Account Attivato
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Il tuo account è stato attivato con successo.
          </p>
          <div style={{
            padding: '0.75rem',
            background: '#f0fdf4',
            borderRadius: '0.375rem',
            border: '1px solid #86efac'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#166534' }}>
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
      background: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '440px'
      }}>
        {/* Logo Section */}
        {organization?.logo_url && (
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <img
              src={organization.logo_url}
              alt={organization.name}
              style={{ maxWidth: '120px', height: 'auto' }}
            />
          </div>
        )}

        {/* Main Card */}
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '0.25rem',
              color: '#111827'
            }}>
              Attivazione Account
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Benvenuto <strong style={{ color: '#111827' }}>{customer?.name}</strong>
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Imposta una password per accedere al tuo account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email (disabled) */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151'
              }}>
                Email
              </label>
              <input
                type="email"
                value={customer?.email || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  background: '#f9fafb',
                  color: '#6b7280'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151'
              }}>
                Password
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
                    padding: '0.625rem 2.5rem 0.625rem 0.75rem',
                    border: `1px solid ${password ? passwordStrength.color : '#d1d5db'}`,
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontWeight: 500,
                    padding: '0.25rem 0.5rem'
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div style={{ marginTop: '0.375rem' }}>
                  <div style={{
                    height: '3px',
                    background: '#e5e7eb',
                    borderRadius: '1.5px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${passwordStrength.strength}%`,
                      background: passwordStrength.color,
                      transition: 'all 0.3s'
                    }}></div>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: passwordStrength.color,
                    marginTop: '0.25rem',
                    fontWeight: 500
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
                marginBottom: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151'
              }}>
                Conferma Password
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
                    padding: '0.625rem 2.5rem 0.625rem 0.75rem',
                    border: `1px solid ${confirmPassword && confirmPassword !== password ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontWeight: 500,
                    padding: '0.25rem 0.5rem'
                  }}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                  Le password non corrispondono
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '0.75rem',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                border: '1px solid #fecaca'
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || password !== confirmPassword || password.length < 6}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: (submitting || password !== confirmPassword || password.length < 6)
                  ? '#d1d5db'
                  : primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: (submitting || password !== confirmPassword || password.length < 6) ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Attivazione in corso...' : 'Attiva Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
