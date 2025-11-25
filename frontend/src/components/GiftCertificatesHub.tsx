import React, { useState, useEffect } from 'react'
import { CreditCard, TrendingUp, DollarSign, Euro, ArrowLeft, Plus, QrCode, Eye, Palette, Smartphone, Trophy, Package, CheckCircle, Clock } from 'lucide-react'
import { giftCertificatesService } from '../services/giftCertificatesService'
import type { GiftCertificate, GiftCertificateStats } from '../types/giftCertificate'
import GiftCertificatesPanel from './GiftCertificatesPanel'
import './GiftCertificatesHub.css'

interface GiftCertificatesHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
  printService?: any
}

type ViewType = 'hub' | 'manage' | 'customer-preview'

const GiftCertificatesHub: React.FC<GiftCertificatesHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor,
  printService
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')
  const [certificates, setCertificates] = useState<GiftCertificate[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<GiftCertificateStats>({
    total_issued: 0,
    total_value_issued: 0,
    active_count: 0,
    active_balance: 0,
    total_redeemed: 0,
    fully_used_count: 0,
    expired_count: 0,
    avg_certificate_value: 0,
    redemption_rate: 0
  })
  const [showGiftPanel, setShowGiftPanel] = useState(false)

  useEffect(() => {
    fetchCertificates()
  }, [organizationId])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const response = await giftCertificatesService.getAll(organizationId)
      setCertificates(response.data)

      const statsData = await giftCertificatesService.getStats(organizationId)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching gift certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Top 3 gift certificates più utilizzati (ordinati per valore riscattato)
  const topCertificates = [...certificates]
    .filter(c => c.status === 'partially_used' || c.status === 'fully_used')
    .sort((a, b) => {
      const aUsed = a.original_amount - a.current_balance
      const bUsed = b.original_amount - b.current_balance
      return bUsed - aUsed
    })
    .slice(0, 3)

  // Vista gestione completa
  if (activeView === 'manage') {
    return (
      <div>
        <button
          className="back-button"
          onClick={() => {
            setActiveView('hub')
            fetchCertificates()
          }}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Gift Certificates</span>
        </button>
        <GiftCertificatesPanel
          isOpen={true}
          onClose={() => setActiveView('hub')}
          organizationId={organizationId}
          organizationName={organizationName}
          printService={printService}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>
    )
  }

  // Vista Cliente (Preview)
  if (activeView === 'customer-preview') {
    const activeCertificates = certificates.filter(c => c.status === 'active' || c.status === 'partially_used')

    return (
      <div
        style={{
          '--primary-color': primaryColor,
          '--secondary-color': secondaryColor
        } as React.CSSProperties}
      >
        <button
          className="back-button"
          onClick={() => setActiveView('hub')}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Gift Certificates</span>
        </button>

        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              I Tuoi Gift Certificates
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: 0 }}>
              Consulta i tuoi buoni regalo e il saldo disponibile
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
              <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Caricamento gift certificates...</p>
            </div>
          ) : activeCertificates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <CreditCard size={64} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4b5563', margin: '1rem 0 0.5rem 0' }}>
                Nessun Gift Certificate Attivo
              </h3>
              <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
                Al momento non hai gift certificates attivi
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {activeCertificates.map(cert => (
                <div
                  key={cert.id}
                  style={{
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '20px',
                    padding: '2rem',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = primaryColor
                    e.currentTarget.style.boxShadow = `0 12px 32px ${primaryColor}26`
                    e.currentTarget.style.transform = 'translateY(-4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#1f2937',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Gift Certificate
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0,
                      fontFamily: 'monospace'
                    }}>
                      Codice: {cert.code}
                    </p>
                  </div>

                  <div style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    padding: '1.5rem',
                    borderRadius: '16px',
                    marginBottom: '1.5rem',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', opacity: 0.9 }}>
                      Saldo Disponibile
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                      {formatCurrency(cert.current_balance)}
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                      Valore originale: {formatCurrency(cert.original_amount)}
                    </div>
                  </div>

                  {cert.recipient_name && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>
                        Beneficiario:
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#1f2937', marginLeft: '0.5rem' }}>
                        {cert.recipient_name}
                      </span>
                    </div>
                  )}

                  {cert.valid_until && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>
                        Valido fino al:
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#1f2937', marginLeft: '0.5rem' }}>
                        {formatDate(cert.valid_until)}
                      </span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '1.5rem',
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    borderRadius: '12px'
                  }}>
                    {cert.status === 'active' ? (
                      <>
                        <CheckCircle size={16} color="#10b981" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981' }}>
                          Attivo
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock size={16} color="#f59e0b" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f59e0b' }}>
                          Parzialmente Usato
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Vista principale Hub
  return (
    <div
      className="gift-certificates-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="gift-certificates-hub-header">
        <div className="gift-certificates-hub-header-content">
          <div className="gift-certificates-hub-icon">
            <CreditCard size={48} />
          </div>
          <div>
            <h1>Centro Gift Certificates</h1>
            <p>Gestisci i gift certificates e monitora le performance</p>
          </div>
        </div>
      </div>

      {/* Statistiche Overview */}
      <div className="gift-certificates-stats-grid">
        <div className="gift-certificates-stat-card">
          <div className="gift-certificates-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <CreditCard size={24} />
          </div>
          <div className="gift-certificates-stat-content">
            <div className="gift-certificates-stat-value">{stats.total_issued}</div>
            <div className="gift-certificates-stat-label">Totale Emessi</div>
          </div>
        </div>

        <div className="gift-certificates-stat-card">
          <div className="gift-certificates-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Euro size={24} />
          </div>
          <div className="gift-certificates-stat-content">
            <div className="gift-certificates-stat-value">{formatCurrency(stats.active_balance)}</div>
            <div className="gift-certificates-stat-label">Saldo Attivo</div>
          </div>
        </div>

        <div className="gift-certificates-stat-card">
          <div className="gift-certificates-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="gift-certificates-stat-content">
            <div className="gift-certificates-stat-value">{formatCurrency(stats.total_redeemed)}</div>
            <div className="gift-certificates-stat-label">Totale Riscattato</div>
          </div>
        </div>

        <div className="gift-certificates-stat-card">
          <div className="gift-certificates-stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="gift-certificates-stat-content">
            <div className="gift-certificates-stat-value">{stats.redemption_rate}%</div>
            <div className="gift-certificates-stat-label">Tasso Riscatto</div>
          </div>
        </div>
      </div>

      {/* Top 3 Gift Certificates Più Utilizzati */}
      {topCertificates.length > 0 && (
        <div className="gift-certificates-top-section">
          <h2><Trophy size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Top 3 Gift Certificates Più Utilizzati</h2>
          <div className="gift-certificates-top-grid">
            {topCertificates.map((cert, index) => {
              const amountUsed = cert.original_amount - cert.current_balance
              return (
                <div key={cert.id} className="gift-certificates-top-card">
                  <div className="gift-certificates-top-badge">#{index + 1}</div>
                  <div className="gift-certificates-top-info">
                    <h3>{cert.code}</h3>
                    <div className="gift-certificates-top-meta">
                      <span className="gift-certificates-top-amount">{formatCurrency(cert.original_amount)}</span>
                      <span className="gift-certificates-top-used">{formatCurrency(amountUsed)} usati</span>
                    </div>
                    {cert.recipient_name && (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        {cert.recipient_name}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Card Azioni Principali */}
      <div className="gift-certificates-hub-cards">
        {/* Card: Gestione Completa */}
        <div
          className="gift-certificates-hub-card gift-certificates-hub-card-primary"
          onClick={() => setShowGiftPanel(true)}
        >
          <div className="gift-certificates-hub-card-icon">
            <CreditCard size={32} />
          </div>
          <div className="gift-certificates-hub-card-content">
            <h3>Gestione Gift Certificates</h3>
            <p>Emetti, valida e gestisci i gift certificates per i tuoi clienti</p>
            <ul className="gift-certificates-hub-card-features">
              <li><Plus size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Emetti nuovi gift certificates</li>
              <li><QrCode size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Valida e riscatta codici</li>
              <li><Package size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Gestione completa buoni</li>
              <li><CreditCard size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Monitoraggio utilizzo</li>
            </ul>
          </div>
          <div className="gift-certificates-hub-card-arrow">→</div>
        </div>

        {/* Card: Anteprima Clienti */}
        <div
          className="gift-certificates-hub-card gift-certificates-hub-card-secondary"
          onClick={() => setActiveView('customer-preview')}
        >
          <div className="gift-certificates-hub-card-icon">
            <Eye size={32} />
          </div>
          <div className="gift-certificates-hub-card-content">
            <h3>Vista Cliente</h3>
            <p>Vedi come i tuoi clienti visualizzano i loro gift certificates</p>
            <ul className="gift-certificates-hub-card-features">
              <li><Eye size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Preview interfaccia cliente</li>
              <li><Palette size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Personalizzazione colori</li>
              <li><Smartphone size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Responsive design</li>
            </ul>
          </div>
          <div className="gift-certificates-hub-card-arrow">→</div>
        </div>
      </div>

      {/* Gift Certificates Panel Modal */}
      {showGiftPanel && (
        <GiftCertificatesPanel
          isOpen={showGiftPanel}
          onClose={() => {
            setShowGiftPanel(false)
            fetchCertificates()
          }}
          organizationId={organizationId}
          organizationName={organizationName}
          printService={printService}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}
    </div>
  )
}

export default GiftCertificatesHub
