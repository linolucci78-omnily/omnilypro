import React, { useState, useEffect } from 'react'
import { PartyPopper, Calendar, Award, TrendingUp, Mail, CheckCircle, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getAnniversaryStats } from '../../services/emailAutomationService'
import './WinbackDashboard.css' // Riusiamo lo stesso CSS

interface AnniversaryDashboardProps {
  organizationId: string
  organizationName: string
}

interface AnniversaryStats {
  totalSent: number
  totalOpened: number
  totalClicked: number
  openRate: string
  clickRate: string
}

interface UpcomingAnniversary {
  id: string
  name: string
  email: string
  created_at: string
  points: number
  tier: string
  total_spent: number
  visit_count: number
  years: number
  daysUntil: number
}

const AnniversaryDashboard: React.FC<AnniversaryDashboardProps> = ({
  organizationId,
  organizationName
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upcoming' | 'settings'>('overview')
  const [stats, setStats] = useState<AnniversaryStats>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    openRate: '0',
    clickRate: '0'
  })
  const [upcomingAnniversaries, setUpcomingAnniversaries] = useState<UpcomingAnniversary[]>([])
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load stats
      const statsData = await getAnniversaryStats(organizationId)
      setStats(statsData)

      // Load automation settings
      const { data: automation } = await supabase
        .from('email_automations')
        .select('enabled')
        .eq('organization_id', organizationId)
        .eq('automation_type', 'anniversary')
        .single()

      if (automation) {
        setEnabled(automation.enabled)
      }

      // Load upcoming anniversaries (next 30 days)
      await loadUpcomingAnniversaries()
    } catch (error) {
      console.error('[AnniversaryDashboard] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUpcomingAnniversaries = async () => {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, email, created_at, points, tier, total_spent, visit_count')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .not('email', 'is', null)

      if (error) throw error

      const today = new Date()
      const todayMonth = today.getMonth() + 1
      const todayDay = today.getDate()

      const upcoming = customers
        ?.map(customer => {
          const createdDate = new Date(customer.created_at)
          const createdMonth = createdDate.getMonth() + 1
          const createdDay = createdDate.getDate()
          const years = today.getFullYear() - createdDate.getFullYear()

          // Skip if less than 1 year
          if (years < 1) return null

          // Calculate days until anniversary
          let daysUntil = 0
          const anniversaryThisYear = new Date(today.getFullYear(), createdMonth - 1, createdDay)

          if (anniversaryThisYear < today) {
            // Anniversary already passed this year, calculate for next year
            const anniversaryNextYear = new Date(today.getFullYear() + 1, createdMonth - 1, createdDay)
            daysUntil = Math.ceil((anniversaryNextYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          } else {
            daysUntil = Math.ceil((anniversaryThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          }

          return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            created_at: customer.created_at,
            points: customer.points || 0,
            tier: customer.tier || 'Bronze',
            total_spent: customer.total_spent || 0,
            visit_count: customer.visit_count || 0,
            years,
            daysUntil
          }
        })
        .filter((c): c is UpcomingAnniversary => c !== null && c.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil) || []

      setUpcomingAnniversaries(upcoming)
    } catch (error) {
      console.error('[AnniversaryDashboard] Error loading upcoming anniversaries:', error)
    }
  }

  const handleToggleAutomation = async () => {
    try {
      const { error } = await supabase
        .from('email_automations')
        .update({ enabled: !enabled })
        .eq('organization_id', organizationId)
        .eq('automation_type', 'anniversary')

      if (error) throw error

      setEnabled(!enabled)
      console.log(`✅ Anniversary automation ${!enabled ? 'abilitata' : 'disabilitata'}`)
    } catch (error) {
      console.error('[AnniversaryDashboard] Error toggling automation:', error)
    }
  }

  const getBonusPoints = (years: number) => {
    if (years >= 5) return 500
    if (years >= 3) return 300
    if (years >= 2) return 200
    return 100
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
          <div className="winback-icon">
            <PartyPopper size={40} />
          </div>
          <div>
            <h1>🎉 Campagne Anniversario</h1>
            <p>Celebra i traguardi di fedeltà dei tuoi clienti</p>
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
          className={`winback-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <Calendar size={18} />
          <span>Prossimi Anniversari ({upcomingAnniversaries.length})</span>
        </button>
        <button
          className={`winback-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Award size={18} />
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
                <div className="winback-stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  <Mail size={24} />
                </div>
                <div className="winback-stat-content">
                  <div className="winback-stat-value">{stats.totalSent}</div>
                  <div className="winback-stat-label">Email Inviate</div>
                </div>
              </div>

              <div className="winback-stat-card">
                <div className="winback-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                  <Eye size={24} />
                </div>
                <div className="winback-stat-content">
                  <div className="winback-stat-value">{stats.totalOpened}</div>
                  <div className="winback-stat-label">Email Aperte</div>
                </div>
              </div>

              <div className="winback-stat-card">
                <div className="winback-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <CheckCircle size={24} />
                </div>
                <div className="winback-stat-content">
                  <div className="winback-stat-value">{stats.openRate}%</div>
                  <div className="winback-stat-label">Tasso Apertura</div>
                </div>
              </div>

              <div className="winback-stat-card">
                <div className="winback-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <TrendingUp size={24} />
                </div>
                <div className="winback-stat-content">
                  <div className="winback-stat-value">{stats.clickRate}%</div>
                  <div className="winback-stat-label">Tasso Click</div>
                </div>
              </div>
            </div>

            <div className="winback-info-box" style={{ marginTop: '2rem' }}>
              <PartyPopper size={24} />
              <div>
                <h3>Come Funziona</h3>
                <p>
                  Le email di anniversario vengono inviate automaticamente ogni giorno alle 10:00 AM.
                  Il sistema identifica i clienti che compiono 1, 2, 3, 5+ anni di membership e invia
                  loro un'email celebrativa con bonus punti crescenti e un recap personalizzato dell'anno.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="winback-tab-panel">
            <h2 style={{ marginBottom: '1.5rem' }}>📅 Prossimi Anniversari (30 giorni)</h2>

            {upcomingAnniversaries.length === 0 ? (
              <div className="winback-empty-state">
                <Calendar size={48} />
                <h3>Nessun anniversario imminente</h3>
                <p>Non ci sono clienti con anniversari nei prossimi 30 giorni.</p>
              </div>
            ) : (
              <div className="winback-customers-table">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>Anni</th>
                      <th>Giorni Mancanti</th>
                      <th>Bonus Punti</th>
                      <th>Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAnniversaries.map(customer => (
                      <tr key={customer.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1f2937' }}>{customer.name}</div>
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '0.875rem' }}>{customer.email}</td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            color: 'white',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}>
                            {customer.years} {customer.years === 1 ? 'anno' : 'anni'}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: customer.daysUntil === 0 ? '#fef3c7' : '#dbeafe',
                            color: customer.daysUntil === 0 ? '#92400e' : '#1e40af',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}>
                            {customer.daysUntil === 0 ? 'Oggi!' : `${customer.daysUntil} giorni`}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            color: '#f59e0b',
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}>
                            +{getBonusPoints(customer.years)} punti
                          </span>
                        </td>
                        <td>{customer.tier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  <p>Abilita o disabilita l'invio automatico delle email di anniversario</p>
                </div>
                <label className="winback-toggle">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={handleToggleAutomation}
                  />
                  <span className="winback-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="winback-info-box">
              <Award size={24} />
              <div>
                <h3>Struttura Bonus Punti</h3>
                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                  <li><strong>1 anno:</strong> 100 punti bonus</li>
                  <li><strong>2 anni:</strong> 200 punti bonus</li>
                  <li><strong>3-4 anni:</strong> 300 punti bonus</li>
                  <li><strong>5+ anni:</strong> 500 punti bonus</li>
                </ul>
              </div>
            </div>

            <div className="winback-info-box" style={{ marginTop: '1.5rem' }}>
              <Calendar size={24} />
              <div>
                <h3>Programmazione Cron Job</h3>
                <p>
                  Le email vengono inviate automaticamente ogni giorno alle <strong>10:00 AM</strong> tramite
                  Supabase Edge Function. Il cron job controlla i clienti con anniversario oggi e invia
                  automaticamente le email con recap personalizzato e bonus punti.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnniversaryDashboard
