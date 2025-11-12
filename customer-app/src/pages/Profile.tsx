import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'
import { useNavigate, useParams } from 'react-router-dom'
import { LogOut, User, Mail, Phone } from 'lucide-react'
import BottomNav from '../components/Layout/BottomNav'

export default function Profile() {
  const { customer, logout } = useAuth()
  const { organization } = useOrganization()
  const navigate = useNavigate()
  const { slug } = useParams()

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  const handleLogout = async () => {
    if (confirm('Sei sicuro di voler uscire?')) {
      await logout()
      navigate(`/${slug}/login`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ padding: '1.5rem', background: 'white', borderBottom: '1px solid var(--gray-200)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
          👤 Il Mio Profilo
        </h2>
        <p style={{ color: 'var(--gray-600)' }}>
          Gestisci il tuo account
        </p>
      </div>

      {/* Profile Header */}
      <div style={{ padding: '2rem 1.5rem' }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          border: '1px solid var(--gray-200)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: `linear-gradient(135deg, var(--primary), var(--secondary))`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            color: 'white',
            fontSize: '2rem',
            fontWeight: 700
          }}>
            {customer.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            {customer.name}
          </h3>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
            Cliente {organization?.name}
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--gray-100)' }}>
            <Mail size={20} color="var(--gray-600)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Email</div>
              <div>{customer.email}</div>
            </div>
          </div>

          {customer.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--gray-100)' }}>
              <Phone size={20} color="var(--gray-600)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Telefono</div>
                <div>{customer.phone}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0' }}>
            <User size={20} color="var(--gray-600)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>ID Cliente</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {customer.id.substring(0, 13).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div style={{ padding: '0 1.5rem 2rem' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'white',
            color: '#ef4444',
            border: '2px solid #ef4444',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <LogOut size={20} />
          Esci dall'Account
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
