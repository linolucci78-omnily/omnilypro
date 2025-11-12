import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'
import { useNavigate, useParams } from 'react-router-dom'
import BottomNav from '../components/Layout/BottomNav'

export default function Home() {
  const { customer } = useAuth()
  const { organization, loyaltyTiers } = useOrganization()
  const navigate = useNavigate()
  const { slug } = useParams()

  // Redirect to login if not authenticated
  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  // Find current tier
  const currentTier = loyaltyTiers.find(t => t.name === customer.tier) || loyaltyTiers[0]
  const nextTier = loyaltyTiers.find(t => t.threshold > (customer.points || 0))

  const progress = nextTier
    ? ((customer.points || 0) / nextTier.threshold) * 100
    : 100

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', background: 'white', borderBottom: '1px solid var(--gray-200)' }}>
        {organization?.logo_url && (
          <img src={organization.logo_url} alt={organization.name} style={{ height: '40px', marginBottom: '1rem' }} />
        )}
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
          Ciao {customer.name?.split(' ')[0] || 'Cliente'}! 👋
        </h2>
        <p style={{ color: 'var(--gray-600)' }}>
          Benvenuto nella tua app fedeltà
        </p>
      </div>

      {/* Points Card */}
      <div style={{ padding: '1.5rem' }}>
        <div style={{
          background: `linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)`,
          color: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
        }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            💎 I TUOI PUNTI
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
            {customer.points || 0}
          </div>

          {/* Progress Bar */}
          <div style={{ background: 'rgba(255,255,255,0.2)', height: '8px', borderRadius: '4px', marginBottom: '0.5rem', overflow: 'hidden' }}>
            <div style={{
              background: 'white',
              height: '100%',
              width: `${Math.min(progress, 100)}%`,
              borderRadius: '4px',
              transition: 'width 0.3s'
            }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', opacity: 0.9 }}>
            <span>🏆 {currentTier?.name || 'Base'}</span>
            {nextTier && (
              <span>Mancano {nextTier.threshold - (customer.points || 0)} per {nextTier.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>📊 Statistiche</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
              {customer.points || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Punti Totali
            </div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
              {currentTier?.name || 'Base'}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Livello Attuale
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 1.5rem 2rem' }}>
        <div style={{ background: 'var(--gray-50)', padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--gray-700)' }}>
            Mostra la tua carta al cassiere per accumulare punti!
          </p>
          <button
            onClick={() => navigate(`/${slug}/card`)}
            style={{
              padding: '0.875rem 2rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Mostra Carta →
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
