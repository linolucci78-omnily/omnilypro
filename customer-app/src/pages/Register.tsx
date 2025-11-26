import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useOrganization } from '../contexts/OrganizationContext'

export default function Register() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { organization } = useOrganization()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!organization) {
        throw new Error('Organizzazione non trovata')
      }

      // 1. Crea utente Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Errore nella creazione dell\'utente')

      // 2. Crea record cliente
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          id: authData.user.id,
          organization_id: organization.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          points: 0,
          tier: null,
          total_spent: 0,
          visits: 0,
          is_active: true,
          notifications_enabled: true
        })

      if (customerError) throw customerError

      // Successo - redirect to login
      alert('Registrazione completata! Ora puoi fare il login.')
      navigate(`/${slug}/login`)
    } catch (err: any) {
      setError(err.message || 'Registrazione fallita')
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
          Registrati e ottieni la tua carta fedeltà
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              Telefono (opzionale)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--gray-200)',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
              Minimo 6 caratteri
            </p>
          </div>

          <div style={{
            padding: '0.75rem',
            background: 'var(--gray-50)',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--gray-700)',
            lineHeight: '1.5'
          }}>
            Registrandoti accetti i nostri{' '}
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary)', textDecoration: 'underline' }}
            >
              Termini di Servizio e Privacy Policy
            </a>
            ,{' '}
            <a
              href="/cookie-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary)', textDecoration: 'underline' }}
            >
              Cookie Policy
            </a>
            {' '}e{' '}
            <a
              href="/rights.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary)', textDecoration: 'underline' }}
            >
              Diritti degli Utenti
            </a>
            .
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
            {loading ? 'Registrazione...' : 'Registrati'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link
              to={`/${slug}/login`}
              style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}
            >
              Hai già un account? Accedi
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
