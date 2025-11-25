import React, { useState, useEffect } from 'react'
import { Ticket, TrendingUp, DollarSign, Euro, ArrowLeft, Plus, QrCode, Eye, Palette, Smartphone, Trophy, Tag, CheckCircle, Clock, Zap } from 'lucide-react'
import { couponsService } from '../services/couponsService'
import type { Coupon, CouponStats } from '../types/coupon'
import CouponsPanel from './CouponsPanel'
import './CouponsHub.css'

interface CouponsHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
}

type ViewType = 'hub' | 'manage' | 'customer-preview'

const CouponsHub: React.FC<CouponsHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [flashCoupons, setFlashCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CouponStats>({
    total_coupons: 0,
    active_coupons: 0,
    total_usage: 0,
    total_discount_given: 0,
    avg_discount_per_use: 0,
    expiring_soon_count: 0
  })
  const [showCouponsPanel, setShowCouponsPanel] = useState(false)

  useEffect(() => {
    fetchCoupons()
  }, [organizationId])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await couponsService.getAll(organizationId)
      setCoupons(response.data)

      const flashResponse = await couponsService.getFlashCoupons(organizationId)
      setFlashCoupons(flashResponse)

      const statsData = await couponsService.getStats(organizationId)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching coupons:', error)
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

  const formatCouponValue = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`
    } else if (coupon.type === 'fixed_amount') {
      return formatCurrency(Number(coupon.value))
    } else {
      return String(coupon.value)
    }
  }

  const getCouponTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      percentage: 'Sconto %',
      fixed_amount: 'Sconto Fisso',
      free_product: 'Prodotto Gratis',
      buy_x_get_y: 'Compra X Prendi Y',
      free_shipping: 'Spedizione Gratis'
    }
    return labels[type] || type
  }

  // Top 3 coupon più utilizzati
  const topCoupons = [...coupons]
    .sort((a, b) => b.current_usage - a.current_usage)
    .slice(0, 3)

  // Vista gestione completa
  if (activeView === 'manage') {
    return (
      <div>
        <button
          className="back-button"
          onClick={() => {
            setActiveView('hub')
            fetchCoupons()
          }}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Coupons</span>
        </button>
        <CouponsPanel
          isOpen={true}
          onClose={() => setActiveView('hub')}
          organizationId={organizationId}
          organizationName={organizationName}
        />
      </div>
    )
  }

  // Vista Cliente (Preview)
  if (activeView === 'customer-preview') {
    const activeCoupons = coupons.filter(c => c.status === 'active')

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
          <span>Torna a Coupons</span>
        </button>

        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              I Tuoi Coupon
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: 0 }}>
              Approfitta delle offerte speciali
            </p>
          </div>

          {/* Flash Coupons Section */}
          {flashCoupons.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Zap size={28} style={{ color: '#f59e0b' }} />
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>
                  Flash Offers
                </h2>
                <span style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {flashCoupons.length}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {flashCoupons.map(coupon => (
                  <div
                    key={coupon.id}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '100px',
                      height: '100px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      filter: 'blur(20px)'
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Zap size={20} fill="currentColor" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          Flash
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                        {coupon.title}
                      </h3>
                      <p style={{ fontSize: '0.875rem', margin: '0 0 1rem 0', opacity: 0.9 }}>
                        {coupon.description}
                      </p>

                      <div style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', opacity: 0.9 }}>
                          Codice
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                          {coupon.code}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                        Valido fino al {formatDate(coupon.valid_until)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standard Coupons Section */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
              <Tag size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Caricamento coupon...</p>
            </div>
          ) : activeCoupons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Ticket size={64} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4b5563', margin: '1rem 0 0.5rem 0' }}>
                Nessun Coupon Attivo
              </h3>
              <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
                Al momento non ci sono coupon disponibili
              </p>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1f2937', margin: '0 0 1.5rem 0' }}>
                Coupon Disponibili
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '2rem'
              }}>
                {activeCoupons.map(coupon => (
                  <div
                    key={coupon.id}
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
                      <div style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        background: '#f3f4f6',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#6b7280',
                        marginBottom: '1rem'
                      }}>
                        {getCouponTypeLabel(coupon.type)}
                      </div>
                      <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#1f2937',
                        margin: '0 0 0.5rem 0'
                      }}>
                        {coupon.title}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {coupon.description}
                      </p>
                    </div>

                    <div style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      padding: '1.5rem',
                      borderRadius: '16px',
                      marginBottom: '1.5rem',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', opacity: 0.9 }}>
                        Sconto
                      </div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>
                        {formatCouponValue(coupon)}
                      </div>
                      <div style={{ fontSize: '0.875rem', marginTop: '0.75rem', opacity: 0.9 }}>
                        Codice: <strong>{coupon.code}</strong>
                      </div>
                    </div>

                    {coupon.min_purchase_amount && (
                      <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        Acquisto minimo: <strong>{formatCurrency(coupon.min_purchase_amount)}</strong>
                      </div>
                    )}

                    {coupon.max_discount_amount && (
                      <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        Sconto massimo: <strong>{formatCurrency(coupon.max_discount_amount)}</strong>
                      </div>
                    )}

                    <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      Valido fino al <strong>{formatDate(coupon.valid_until)}</strong>
                    </div>

                    {coupon.usage_limit && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: '#f3f4f6',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {coupon.current_usage} / {coupon.usage_limit} utilizzi
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Vista principale Hub
  return (
    <div
      className="coupons-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="coupons-hub-header">
        <div className="coupons-hub-header-content">
          <div className="coupons-hub-icon">
            <Ticket size={48} />
          </div>
          <div>
            <h1>Centro Coupons</h1>
            <p>Gestisci coupon e offerte promozionali per i tuoi clienti</p>
          </div>
        </div>
      </div>

      {/* Statistiche Overview */}
      <div className="coupons-stats-grid">
        <div className="coupons-stat-card">
          <div className="coupons-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Ticket size={24} />
          </div>
          <div className="coupons-stat-content">
            <div className="coupons-stat-value">{stats.active_coupons}</div>
            <div className="coupons-stat-label">Coupon Attivi</div>
          </div>
        </div>

        <div className="coupons-stat-card">
          <div className="coupons-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="coupons-stat-content">
            <div className="coupons-stat-value">{stats.total_usage}</div>
            <div className="coupons-stat-label">Utilizzi Totali</div>
          </div>
        </div>

        <div className="coupons-stat-card">
          <div className="coupons-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Euro size={24} />
          </div>
          <div className="coupons-stat-content">
            <div className="coupons-stat-value">{formatCurrency(stats.total_discount_given)}</div>
            <div className="coupons-stat-label">Sconto Totale</div>
          </div>
        </div>

        <div className="coupons-stat-card">
          <div className="coupons-stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
            <DollarSign size={24} />
          </div>
          <div className="coupons-stat-content">
            <div className="coupons-stat-value">{formatCurrency(stats.avg_discount_per_use)}</div>
            <div className="coupons-stat-label">Media per Utilizzo</div>
          </div>
        </div>
      </div>

      {/* Flash Coupons Banner */}
      {flashCoupons.length > 0 && (
        <div className="coupons-flash-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Zap size={32} style={{ color: '#f59e0b' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1f2937' }}>
                Flash Coupons Attivi
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Offerte a tempo limitato in scadenza
              </p>
            </div>
            <div style={{
              marginLeft: 'auto',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '1.5rem'
            }}>
              {flashCoupons.length}
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Coupon Più Utilizzati */}
      {topCoupons.length > 0 && (
        <div className="coupons-top-section">
          <h2><Trophy size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Top 3 Coupon Più Utilizzati</h2>
          <div className="coupons-top-grid">
            {topCoupons.map((coupon, index) => (
              <div key={coupon.id} className="coupons-top-card">
                <div className="coupons-top-badge">#{index + 1}</div>
                <div className="coupons-top-info">
                  <h3>{coupon.code}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0' }}>
                    {coupon.title}
                  </p>
                  <div className="coupons-top-meta">
                    <span className="coupons-top-amount">{formatCouponValue(coupon)}</span>
                    <span className="coupons-top-used">{coupon.current_usage} utilizzi</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    {getCouponTypeLabel(coupon.type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Azioni Principali */}
      <div className="coupons-hub-cards">
        {/* Card: Gestione Completa */}
        <div
          className="coupons-hub-card coupons-hub-card-primary"
          onClick={() => setShowCouponsPanel(true)}
        >
          <div className="coupons-hub-card-icon">
            <Ticket size={32} />
          </div>
          <div className="coupons-hub-card-content">
            <h3>Gestione Coupons</h3>
            <p>Crea, valida e gestisci coupon e offerte promozionali</p>
            <ul className="coupons-hub-card-features">
              <li><Plus size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Crea nuovi coupon</li>
              <li><Zap size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Flash offers a tempo</li>
              <li><QrCode size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Valida codici promo</li>
              <li><TrendingUp size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Monitora performance</li>
            </ul>
          </div>
          <div className="coupons-hub-card-arrow">→</div>
        </div>

        {/* Card: Anteprima Clienti */}
        <div
          className="coupons-hub-card coupons-hub-card-secondary"
          onClick={() => setActiveView('customer-preview')}
        >
          <div className="coupons-hub-card-icon">
            <Eye size={32} />
          </div>
          <div className="coupons-hub-card-content">
            <h3>Vista Cliente</h3>
            <p>Vedi come i tuoi clienti visualizzano i coupon disponibili</p>
            <ul className="coupons-hub-card-features">
              <li><Eye size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Preview interfaccia cliente</li>
              <li><Palette size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Personalizzazione colori</li>
              <li><Smartphone size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Responsive design</li>
            </ul>
          </div>
          <div className="coupons-hub-card-arrow">→</div>
        </div>
      </div>

      {/* Coupons Panel Modal */}
      {showCouponsPanel && (
        <CouponsPanel
          isOpen={showCouponsPanel}
          onClose={() => {
            setShowCouponsPanel(false)
            fetchCoupons()
          }}
          organizationId={organizationId}
          organizationName={organizationName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}
    </div>
  )
}

export default CouponsHub
