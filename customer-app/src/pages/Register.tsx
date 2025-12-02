import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useOrganization } from '../contexts/OrganizationContext'

export default function Register() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { organization } = useOrganization()
  const [searchParams] = useSearchParams()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referrerName, setReferrerName] = useState<string | null>(null)

  // Leggi il codice referral dall'URL
  useEffect(() => {
    const refParam = searchParams.get('ref')
    if (refParam && organization?.id) {
      setReferralCode(refParam)

      // Trova il nome del referrer
      const loadReferrer = async () => {
        try {
          const { data } = await supabase
            .from('customers')
            .select('name')
            .eq('organization_id', organization.id)
            .eq('referral_code', refParam)
            .single()

          if (data) {
            setReferrerName(data.name)
          }
        } catch (err) {
          console.error('Error loading referrer:', err)
        }
      }

      loadReferrer()
    }
  }, [searchParams, organization?.id])

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
          emailRedirectTo: `${window.location.origin}/${slug}/activate`,
          data: {
            name: formData.name
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Errore nella creazione dell\'utente')

      // 2. Trova l'ID del referrer se c'è un codice referral
      let referrerId: string | null = null
      if (referralCode) {
        try {
          const { data: referrerData } = await supabase
            .from('customers')
            .select('id')
            .eq('organization_id', organization.id)
            .eq('referral_code', referralCode)
            .single()

          if (referrerData) {
            referrerId = referrerData.id
          }
        } catch (err) {
          console.error('Error finding referrer:', err)
        }
      }

      // 3. Crea record cliente
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
          notifications_enabled: true,
          referred_by: referrerId
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

        {/* Messaggio Referral */}
        {referrerName && (
          <div style={{
            backgroundColor: 'var(--primary-50)',
            border: '2px solid var(--primary)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
              🎉 Sei stato invitato da {referrerName}!
            </p>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
              Registrandoti guadagnerai punti bonus
            </p>
          </div>
        )}

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
