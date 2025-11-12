import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import BottomNav from '../components/Layout/BottomNav'

export default function Card() {
  const { customer } = useAuth()
  const { organization } = useOrganization()
  const navigate = useNavigate()
  const { slug } = useParams()

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  // QR Code data - stesso formato del POS per compatibilità
  const qrData = `OMNILY_CUSTOMER:${customer.id}`

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', background: 'white', borderBottom: '1px solid var(--gray-200)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
          💳 La Mia Tessera
        </h2>
        <p style={{ color: 'var(--gray-600)' }}>
          Mostra questo QR al cassiere
        </p>
      </div>

      {/* Card */}
      <div style={{ padding: '2rem 1.5rem' }}>
        <div style={{
          background: 'white',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid var(--gray-200)'
        }}>
          {/* Logo */}
          {organization?.logo_url && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img
                src={organization.logo_url}
                alt={organization.name}
                style={{ maxWidth: '120px', height: 'auto' }}
              />
            </div>
          )}

          {/* QR Code */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '2rem',
            background: 'white',
            borderRadius: '1rem',
            marginBottom: '1.5rem'
          }}>
            <QRCodeSVG
              value={qrData}
              size={220}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Customer Info */}
          <div style={{ textAlign: 'center', borderTop: '2px dashed var(--gray-200)', paddingTop: '1.5rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {customer.name}
            </div>
            <div style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
              {customer.email}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.875rem' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {customer.points || 0}
                </div>
                <div style={{ color: 'var(--gray-600)' }}>Punti</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {customer.tier || 'Base'}
                </div>
                <div style={{ color: 'var(--gray-600)' }}>Livello</div>
              </div>
            </div>
          </div>

          {/* Card ID */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
              Card ID
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 600 }}>
              {customer.id.substring(0, 13).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ padding: '0 1.5rem 2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>
            💡 Come usare la tessera
          </h3>
          <ol style={{ paddingLeft: '1.25rem', color: 'var(--gray-700)', lineHeight: '1.75' }}>
            <li>Mostra questo QR code al cassiere</li>
            <li>Il cassiere lo scansiona con il lettore</li>
            <li>Accumuli punti o riscatti premi automaticamente!</li>
          </ol>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
