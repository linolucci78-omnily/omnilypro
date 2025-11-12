import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'

export default function Login() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { login, customer, loading: authLoading } = useAuth()
  const { organization } = useOrganization()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && customer) {
      console.log('✅ Already logged in, redirecting to home')
      navigate(`/${slug}/home`, { replace: true })
    }
  }, [customer, authLoading, navigate, slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(`/${slug}/home`)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (!organization) return null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {organization.logo_url && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src={organization.logo_url} alt={organization.name} style={{ maxWidth: '120px', height: 'auto' }} />
          </div>
        )}

        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
          {organization.name}
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--gray-600)', marginBottom: '2rem' }}>
          Accedi alla tua carta fedeltà
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--gray-200)',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--gray-200)',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          {error && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link
              to={`/${slug}/register`}
              style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}
            >
              Non hai un account? Registrati
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
