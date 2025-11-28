import React, { useState, useEffect } from 'react'
import { Star, Mail, Eye, TrendingUp, Settings as SettingsIcon, MessageSquare, Award, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getReviewRequestStats, getRecentReviews } from '../../services/emailAutomationService'
import './WinbackDashboard.css' // Riusiamo lo stesso CSS

interface ReviewDashboardProps {
  organizationId: string
  organizationName: string
}

interface ReviewStats {
  totalSent: number
  totalOpened: number
  totalClicked: number
  totalReviews: number
  averageRating: string
  conversionRate: string
  openRate: string
  clickRate: string
}

interface Review {
  id: string
  rating: number
  comment: string | null
  platform: string
  created_at: string
  customers: {
    name: string
    email: string
  }
}

interface Settings {
  enabled: boolean
  daysAfterPurchase: number
  minAmount: number
  bonusPoints: number
}

const ReviewDashboard: React.FC<ReviewDashboardProps> = ({
  organizationId,
  organizationName
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'settings'>('overview')
  const [stats, setStats] = useState<ReviewStats>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalReviews: 0,
    averageRating: '0',
    conversionRate: '0',
    openRate: '0',
    clickRate: '0'
  })
  const [reviews, setReviews] = useState<Review[]>([])
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    daysAfterPurchase: 7,
    minAmount: 30,
    bonusPoints: 50
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load stats
      const statsData = await getReviewRequestStats(organizationId)
      setStats(statsData)

      // Load reviews
      const reviewsData = await getRecentReviews(organizationId, 50)
      setReviews(reviewsData as Review[])

      // Load settings
      await loadSettings()
    } catch (error) {
      console.error('[ReviewDashboard] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      // Load organization settings
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('review_request_enabled, review_request_days_after_purchase, review_request_min_amount, review_request_bonus_points')
        .eq('id', organizationId)
        .single()

      if (orgError) {
        console.error('[ReviewDashboard] Error loading settings:', orgError)
        return
      }

      if (org) {
        setSettings({
          enabled: org.review_request_enabled ?? true,
          daysAfterPurchase: org.review_request_days_after_purchase ?? 7,
          minAmount: org.review_request_min_amount ?? 30,
          bonusPoints: org.review_request_bonus_points ?? 50
        })
      }
    } catch (error) {
      console.error('[ReviewDashboard] Error loading settings:', error)
    }
  }

  const handleToggleAutomation = async () => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ review_request_enabled: !settings.enabled })
        .eq('id', organizationId)

      if (error) throw error

      setSettings({ ...settings, enabled: !settings.enabled })
      console.log(`✅ Review request automation ${!settings.enabled ? 'abilitata' : 'disabilitata'}`)
    } catch (error) {
      console.error('[ReviewDashboard] Error toggling automation:', error)
    }
  }

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          review_request_days_after_purchase: settings.daysAfterPurchase,
          review_request_min_amount: settings.minAmount,
          review_request_bonus_points: settings.bonusPoints
        })
        .eq('id', organizationId)

      if (error) throw error

      console.log('✅ Impostazioni salvate con successo')
    } catch (error) {
      console.error('[ReviewDashboard] Error saving settings:', error)
    }
  }

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  if (loading) {
    return (
      <div className="winback-dashboard">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: '#6b7280' }}>Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="winback-dashboard">
      {/* Header */}
      <div className="winback-header">
        <div className="winback-header-content">
          <div className="winback-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Star size={40} />
          </div>
          <div>
            <h1>⭐ Campagne Recensioni</h1>
            <p>Raccogli feedback e aumenta il social proof</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="winback-tabs">
        <button
          className={`winback-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={18} />
          <span>Panoramica</span>
        </button>
        <button
          className={`winback-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <MessageSquare size={18} />
          <span>Recensioni ({stats.totalReviews})</span>
        </button>
        <button
          className={`winback-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={18} />
          <span>Impostazioni</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="winback-content">
        {activeTab === 'overview' && (
          <div className="winback-tab-panel">
            <h2 style={{ marginBottom: '1.5rem' }}>📊 Statistiche Campagna</h2>

            <div className="winback-stats-grid">
              <div className="winback-stat-card">
                <div className="winback-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                  <Mail size={24} />
                </div>
                <div className="winback-stat-content">
                  <div className="winback-stat-value">{stats.totalSent}</div>
                  <div className="winback-stat-label">Email Inviate</div>
                </div>
              </div>

              <div className="winback-stat-card">
                <div className="winback-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <MessageSquare size={24} />
                </div>
                <div className="winback-stat-content">
                  <div className="winback-stat-value">{stats.totalReviews}</div>
                  <div className="winback-stat-label">Recensioni Ricevute</div>
                </div>
              </div>

              <div className="winback-stat-card">
                <div className="winback-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <Star size={24} />
                </div>
                <div className="winback-stat-content">
                  <div className="winback-stat-value">{stats.averageRating}</div>
                  <div className="winback-stat-label">Media Voti</div>
                </div>
              </div>

              <div className="winback-stat-card">
                <div className="winback-stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  <CheckCircle size={24} />
                </div>
                <div className="winback-stat-content">
                  <div className="winback-stat-value">{stats.conversionRate}%</div>
                  <div className="winback-stat-label">Tasso Conversione</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
              <div className="winback-stat-card" style={{ gridColumn: 'span 1' }}>
                <div className="winback-stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
                  <Eye size={24} />
                </div>
                <div className="winback-stat-content">
                  <div className="winback-stat-value">{stats.openRate}%</div>
                  <div className="winback-stat-label">Tasso Apertura</div>
                </div>
              </div>

              <div className="winback-stat-card" style={{ gridColumn: 'span 1' }}>
                <div className="winback-stat-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                  <TrendingUp size={24} />
                </div>
                <div className="winback-stat-content">
                  <div className="winback-stat-value">{stats.clickRate}%</div>
                  <div className="winback-stat-label">Tasso Click</div>
                </div>
              </div>
            </div>

            <div className="winback-info-box" style={{ marginTop: '2rem' }}>
              <Star size={24} />
              <div>
                <h3>Come Funziona</h3>
                <p>
                  Le email di richiesta recensione vengono inviate automaticamente {settings.daysAfterPurchase} giorni dopo
                  un acquisto superiore a €{settings.minAmount}. I clienti ricevono {settings.bonusPoints} punti bonus per
                  ogni recensione lasciata, incentivando il feedback e aumentando il tasso di conversione.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="winback-tab-panel">
            <h2 style={{ marginBottom: '1.5rem' }}>💬 Recensioni Clienti</h2>

            {reviews.length === 0 ? (
              <div className="winback-empty-state">
                <MessageSquare size={48} />
                <h3>Nessuna recensione ancora</h3>
                <p>Le recensioni dei clienti appariranno qui una volta ricevute.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {reviews.map(review => (
                  <div
                    key={review.id}
                    style={{
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      transition: 'all 0.3s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.25rem' }}>
                          {review.customers.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {review.customers.email}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.5rem' }}>
                        {renderStars(review.rating)}
                      </div>
                    </div>

                    {review.comment && (
                      <div style={{
                        background: '#f9fafb',
                        padding: '1rem',
                        borderRadius: '12px',
                        fontSize: '0.9375rem',
                        color: '#4b5563',
                        marginBottom: '1rem',
                        fontStyle: 'italic'
                      }}>
                        "{review.comment}"
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <span>
                        📅 {new Date(review.created_at).toLocaleDateString('it-IT')}
                      </span>
                      <span>
                        📱 {review.platform === 'internal' ? 'Interno' : review.platform}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="winback-tab-panel">
            <h2 style={{ marginBottom: '1.5rem' }}>⚙️ Configurazione Campagna</h2>

            <div className="winback-settings-card">
              <div className="winback-setting-row">
                <div>
                  <h3>Stato Automazione</h3>
                  <p>Abilita o disabilita l'invio automatico delle richieste di recensione</p>
                </div>
                <label className="winback-toggle">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={handleToggleAutomation}
                  />
                  <span className="winback-toggle-slider"></span>
                </label>
              </div>

              <div className="winback-setting-row">
                <div style={{ flex: 1 }}>
                  <h3>Giorni Dopo Acquisto</h3>
                  <p>Quanti giorni attendere dopo l'acquisto prima di inviare la richiesta</p>
                </div>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.daysAfterPurchase}
                  onChange={(e) => setSettings({ ...settings, daysAfterPurchase: parseInt(e.target.value) || 7 })}
                  style={{
                    width: '100px',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                />
              </div>

              <div className="winback-setting-row">
                <div style={{ flex: 1 }}>
                  <h3>Importo Minimo (€)</h3>
                  <p>Importo minimo dell'acquisto per inviare richiesta recensione</p>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.minAmount}
                  onChange={(e) => setSettings({ ...settings, minAmount: parseFloat(e.target.value) || 30 })}
                  style={{
                    width: '100px',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                />
              </div>

              <div className="winback-setting-row">
                <div style={{ flex: 1 }}>
                  <h3>Punti Bonus</h3>
                  <p>Punti offerti come incentivo per lasciare una recensione</p>
                </div>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={settings.bonusPoints}
                  onChange={(e) => setSettings({ ...settings, bonusPoints: parseInt(e.target.value) || 50 })}
                  style={{
                    width: '100px',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              style={{
                marginTop: '1.5rem',
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
              }}
            >
              💾 Salva Impostazioni
            </button>

            <div className="winback-info-box" style={{ marginTop: '2rem' }}>
              <Award size={24} />
              <div>
                <h3>Perché Raccogliere Recensioni?</h3>
                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                  <li><strong>Social Proof:</strong> Le recensioni aumentano la fiducia dei nuovi clienti</li>
                  <li><strong>SEO:</strong> Recensioni positive migliorano il ranking sui motori di ricerca</li>
                  <li><strong>Feedback:</strong> Scopri cosa funziona e cosa può essere migliorato</li>
                  <li><strong>Engagement:</strong> I clienti si sentono ascoltati e valorizzati</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewDashboard
