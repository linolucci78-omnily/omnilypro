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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.2)',
            borderTopColor: primaryColor,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9375rem', fontWeight: 500 }}>
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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }}></div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(-10px) translateX(-10px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(-30px) translateX(-15px) rotate(180deg); }
        }
        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: twinkle 3s ease-in-out infinite;
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
      `}</style>

      {/* Stars background */}
      <div className="star" style={{ width: '2px', height: '2px', top: '10%', left: '15%', animationDelay: '0s' }}></div>
      <div className="star" style={{ width: '1px', height: '1px', top: '20%', left: '25%', animationDelay: '0.5s' }}></div>
      <div className="star" style={{ width: '2px', height: '2px', top: '15%', left: '80%', animationDelay: '1s' }}></div>
      <div className="star" style={{ width: '1px', height: '1px', top: '40%', left: '10%', animationDelay: '1.5s' }}></div>
      <div className="star" style={{ width: '2px', height: '2px', top: '60%', left: '90%', animationDelay: '2s' }}></div>
      <div className="star" style={{ width: '1px', height: '1px', top: '70%', left: '20%', animationDelay: '2.5s' }}></div>
      <div className="star" style={{ width: '2px', height: '2px', top: '80%', left: '70%', animationDelay: '0.8s' }}></div>
      <div className="star" style={{ width: '1px', height: '1px', top: '30%', left: '50%', animationDelay: '1.2s' }}></div>
      <div className="star" style={{ width: '2px', height: '2px', top: '50%', left: '30%', animationDelay: '1.8s' }}></div>
      <div className="star" style={{ width: '1px', height: '1px', top: '90%', left: '60%', animationDelay: '2.3s' }}></div>
      <div className="star" style={{ width: '2px', height: '2px', top: '25%', left: '65%', animationDelay: '0.3s' }}></div>
      <div className="star" style={{ width: '1px', height: '1px', top: '45%', left: '85%', animationDelay: '1.7s' }}></div>

      {/* Floating particles */}
      <div className="particle" style={{
        width: '4px',
        height: '4px',
        background: 'rgba(59, 130, 246, 0.4)',
        top: '15%',
        left: '10%',
        animation: 'float 8s ease-in-out infinite',
        animationDelay: '0s'
      }}></div>
      <div className="particle" style={{
        width: '6px',
        height: '6px',
        background: 'rgba(99, 102, 241, 0.3)',
        top: '25%',
        left: '85%',
        animation: 'float2 10s ease-in-out infinite',
        animationDelay: '1s'
      }}></div>
      <div className="particle" style={{
        width: '3px',
        height: '3px',
        background: 'rgba(139, 92, 246, 0.5)',
        top: '60%',
        left: '15%',
        animation: 'float 12s ease-in-out infinite',
        animationDelay: '2s'
      }}></div>
      <div className="particle" style={{
        width: '5px',
        height: '5px',
        background: 'rgba(59, 130, 246, 0.35)',
        top: '70%',
        left: '75%',
        animation: 'float2 9s ease-in-out infinite',
        animationDelay: '0.5s'
      }}></div>
      <div className="particle" style={{
        width: '4px',
        height: '4px',
        background: 'rgba(96, 165, 250, 0.4)',
        top: '40%',
        left: '50%',
        animation: 'float 11s ease-in-out infinite',
        animationDelay: '1.5s'
      }}></div>
      <div className="particle" style={{
        width: '3px',
        height: '3px',
        background: 'rgba(147, 197, 253, 0.3)',
        top: '85%',
        left: '30%',
        animation: 'float2 13s ease-in-out infinite',
        animationDelay: '2.5s'
      }}></div>

      <div style={{
        width: '100%',
        maxWidth: '480px',
        animation: 'slideIn 0.4s ease-out',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo Section - Outside Card */}
        {organization?.logo_url && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '2.5rem',
            width: '100%'
          }}>
            <img
              src={organization.logo_url}
              alt={organization.name}
              style={{
                maxWidth: '180px',
                height: 'auto',
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
                display: 'block'
              }}
            />
          </div>
        )}

        {/* Main Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.75) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(59, 130, 246, 0.3)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: `0 4px 12px ${primaryColor}40`
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}>
              Attiva il tuo Account
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9375rem', lineHeight: '1.5' }}>
              Benvenuto <strong style={{ color: '#60a5fa', fontWeight: 600 }}>{customer?.name}</strong>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Imposta una password sicura per proteggere il tuo account
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
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Email
              </label>
              <input
                type="email"
                value={customer?.email || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: 'rgba(255,255,255,0.5)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
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
                    padding: '0.75rem 3rem 0.75rem 1rem',
                    border: `1px solid ${password ? passwordStrength.color : 'rgba(59, 130, 246, 0.3)'}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9375rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: 'rgba(255,255,255,0.95)',
                    outline: 'none',
                    transition: 'all 0.2s'
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
                    color: 'rgba(255,255,255,0.6)',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center'
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
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{
                    height: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${passwordStrength.strength}%`,
                      background: passwordStrength.color,
                      transition: 'all 0.3s',
                      boxShadow: `0 0 10px ${passwordStrength.color}80`
                    }}></div>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: passwordStrength.color,
                    marginTop: '0.375rem',
                    fontWeight: 600,
                    textShadow: `0 0 10px ${passwordStrength.color}40`
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
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
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
                    padding: '0.75rem 3rem 0.75rem 1rem',
                    border: `1px solid ${confirmPassword && confirmPassword !== password ? '#ef4444' : 'rgba(59, 130, 246, 0.3)'}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9375rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: 'rgba(255,255,255,0.95)',
                    outline: 'none',
                    transition: 'all 0.2s'
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
                    color: 'rgba(255,255,255,0.6)',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center'
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
                <p style={{
                  fontSize: '0.75rem',
                  color: '#f87171',
                  marginTop: '0.5rem',
                  fontWeight: 600,
                  textShadow: '0 0 10px rgba(248, 113, 113, 0.3)'
                }}>
                  Le password non corrispondono
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#fca5a5',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 500,
                textAlign: 'center'
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
                padding: '1rem',
                background: (submitting || password !== confirmPassword || password.length < 6)
                  ? 'rgba(255,255,255,0.1)'
                  : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                color: (submitting || password !== confirmPassword || password.length < 6) ? 'rgba(255,255,255,0.4)' : 'white',
                border: (submitting || password !== confirmPassword || password.length < 6) ? '1px solid rgba(255,255,255,0.1)' : 'none',
                borderRadius: '0.75rem',
                fontSize: '0.9375rem',
                fontWeight: 700,
                cursor: (submitting || password !== confirmPassword || password.length < 6) ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: (submitting || password !== confirmPassword || password.length < 6) ? 'none' : `0 8px 20px ${primaryColor}40`,
                transition: 'all 0.3s',
                marginTop: '0.5rem'
              }}
            >
              {submitting ? 'Attivazione in corso...' : 'Attiva Account'}
            </button>
          </form>
        </div>

        {/* Powered by */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.8125rem',
          fontWeight: 500
        }}>
          Powered by <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>OmnilyPro</span>
        </div>
      </div>
    </div>
  )
}
