import React, { useState, useEffect } from 'react'
import {
  Mail,
  TrendingUp,
  Users,
  Settings,
  RefreshCw,
  Clock,
  Target,
  Gift,
  Eye,
  MousePointer,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getWinbackStats, sendWinbackEmail } from '../../services/emailAutomationService'
import PageLoader from '../UI/PageLoader'
import './WinbackDashboard.css'

interface WinbackStats {
  totalSent: number
  totalOpened: number
  totalClicked: number
  customersReturned: number
  openRate: string
  clickRate: string
  returnRate: string
}

interface WinbackSettings {
  enabled: boolean
  daysThreshold: number
  bonusPoints: number
}

interface InactiveCustomer {
  id: string
  name: string
  email: string
  points: number
  tier: string
  last_visit: string
  daysSinceVisit: number
}

interface WinbackDashboardProps {
  organizationId: string
  organizationName: string
}

const WinbackDashboard: React.FC<WinbackDashboardProps> = ({
  organizationId,
  organizationName
}) => {
  const [stats, setStats] = useState<WinbackStats>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    customersReturned: 0,
    openRate: '0',
    clickRate: '0',
    returnRate: '0'
  })
  const [settings, setSettings] = useState<WinbackSettings>({
    enabled: true,
    daysThreshold: 30,
    bonusPoints: 50
  })
  const [inactiveCustomers, setInactiveCustomers] = useState<InactiveCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'inactive' | 'settings'>('overview')

  useEffect(() => {
    loadDashboardData()
  }, [organizationId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load stats, settings, and inactive customers in parallel
      const [statsData, settingsData, customersData] = await Promise.all([
        getWinbackStats(organizationId),
        loadSettings(),
        loadInactiveCustomers()
      ])

      setStats(statsData)
      setSettings(settingsData)
      setInactiveCustomers(customersData)
    } catch (error) {
      console.error('❌ Error loading win-back dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async (): Promise<WinbackSettings> => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('winback_enabled, winback_days_threshold, winback_bonus_points')
        .eq('id', organizationId)
        .single()

      // If columns don't exist yet (migration not run), return defaults silently
      if (error && error.code === '42703') {
        console.log('⚠️ Win-back columns not yet created. Using defaults. Run migration 070.')
        return { enabled: true, daysThreshold: 30, bonusPoints: 50 }
      }

      if (error) throw error

      return {
        enabled: data?.winback_enabled ?? true,
        daysThreshold: data?.winback_days_threshold ?? 30,
        bonusPoints: data?.winback_bonus_points ?? 50
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error)
      return { enabled: true, daysThreshold: 30, bonusPoints: 50 }
    }
  }

  const loadInactiveCustomers = async (): Promise<InactiveCustomer[]> => {
    try {
      const { data: orgSettings } = await supabase
        .from('organizations')
        .select('winback_days_threshold')
        .eq('id', organizationId)
        .single()

      const daysThreshold = orgSettings?.winback_days_threshold || 30
      const thresholdDate = new Date()
      thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, points, tier, last_visit')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .not('email', 'is', null)
        .lt('last_visit', thresholdDate.toISOString())
        .order('last_visit', { ascending: true })
        .limit(50)

      if (error) throw error

      return (data || []).map(customer => ({
        ...customer,
        daysSinceVisit: Math.floor(
          (Date.now() - new Date(customer.last_visit).getTime()) / (1000 * 60 * 60 * 24)
        )
      }))
    } catch (error) {
      console.error('❌ Error loading inactive customers:', error)
      return []
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true)

      const { error } = await supabase
        .from('organizations')
        .update({
          winback_enabled: settings.enabled,
          winback_days_threshold: settings.daysThreshold,
          winback_bonus_points: settings.bonusPoints
        })
        .eq('id', organizationId)

      // If columns don't exist yet (migration not run), log warning
      if (error && error.code === '42703') {
        console.warn('⚠️ Le colonne win-back non esistono ancora nel database. Esegui la migration 070.')
        return
      }

      if (error) throw error

      // Reload inactive customers with new threshold
      const customersData = await loadInactiveCustomers()
      setInactiveCustomers(customersData)

      console.log('✅ Win-back settings saved')
    } catch (error) {
      console.error('❌ Error saving settings:', error)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSendWinbackEmail = async (customer: InactiveCustomer) => {
    try {
      setSendingEmail(customer.id)

      const success = await sendWinbackEmail(organizationId, customer)

      if (success) {
        console.log(`✅ Email win-back inviata a ${customer.name}`)
        // Reload stats
        const statsData = await getWinbackStats(organizationId)
        setStats(statsData)
      } else {
        console.error('❌ Errore nell\'invio dell\'email')
      }
    } catch (error) {
      console.error('❌ Error sending win-back email:', error)
    } finally {
      setSendingEmail(null)
    }
  }

  if (loading) {
    return <PageLoader message="Caricamento dashboard win-back..." size="small" />
  }

  return (
    <div className="winback-dashboard">
      {/* Header */}
      <div className="winback-header">
        <div className="header-content">
          <h2>🎯 Campagne Win-back</h2>
          <p>Riattiva i clienti inattivi con email automatiche personalizzate</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={loadDashboardData}
          >
            <RefreshCw size={16} />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="winback-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={16} />
          Panoramica
        </button>
        <button
          className={`tab ${activeTab === 'inactive' ? 'active' : ''}`}
          onClick={() => setActiveTab('inactive')}
        >
          <Users size={16} />
          Clienti Inattivi ({inactiveCustomers.length})
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          Impostazioni
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon mail">
                <Mail size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalSent}</div>
                <div className="stat-label">Email Inviate</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon opened">
                <Eye size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.openRate}%</div>
                <div className="stat-label">Tasso Apertura</div>
                <div className="stat-detail">{stats.totalOpened} aperture</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon clicked">
                <MousePointer size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.clickRate}%</div>
                <div className="stat-label">Tasso Click</div>
                <div className="stat-detail">{stats.totalClicked} click</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon returned">
                <UserCheck size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.returnRate}%</div>
                <div className="stat-label">Tasso Ritorno</div>
                <div className="stat-detail">{stats.customersReturned} clienti tornati</div>
              </div>
            </div>
          </div>

          {/* Campaign Status */}
          <div className="campaign-status">
            <h3>Stato Campagna</h3>
            <div className="status-grid">
              <div className="status-item">
                <div className={`status-indicator ${settings.enabled ? 'active' : 'inactive'}`}>
                  {settings.enabled ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                <div className="status-info">
                  <div className="status-label">Automazione</div>
                  <div className="status-value">{settings.enabled ? 'Attiva' : 'Disattivata'}</div>
                </div>
              </div>

              <div className="status-item">
                <div className="status-indicator active">
                  <Clock size={20} />
                </div>
                <div className="status-info">
                  <div className="status-label">Soglia Inattività</div>
                  <div className="status-value">{settings.daysThreshold} giorni</div>
                </div>
              </div>

              <div className="status-item">
                <div className="status-indicator active">
                  <Gift size={20} />
                </div>
                <div className="status-info">
                  <div className="status-label">Bonus Punti</div>
                  <div className="status-value">{settings.bonusPoints} punti</div>
                </div>
              </div>

              <div className="status-item">
                <div className="status-indicator active">
                  <Target size={20} />
                </div>
                <div className="status-info">
                  <div className="status-label">Clienti Eligibili</div>
                  <div className="status-value">{inactiveCustomers.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inactive' && (
        <div className="tab-content">
          <div className="inactive-customers">
            <div className="customers-header">
              <h3>Clienti Inattivi</h3>
              <p>Clienti che non visitano da più di {settings.daysThreshold} giorni</p>
            </div>

            {inactiveCustomers.length > 0 ? (
              <div className="customers-table">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>Tier</th>
                      <th>Punti</th>
                      <th>Ultima Visita</th>
                      <th>Giorni Inattivo</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveCustomers.map(customer => (
                      <tr key={customer.id}>
                        <td className="customer-name">{customer.name}</td>
                        <td className="customer-email">{customer.email}</td>
                        <td>
                          <span className={`tier-badge ${customer.tier.toLowerCase()}`}>
                            {customer.tier}
                          </span>
                        </td>
                        <td className="customer-points">{customer.points}</td>
                        <td className="customer-date">
                          {new Date(customer.last_visit).toLocaleDateString('it-IT')}
                        </td>
                        <td className="customer-days">
                          <span className={`days-badge ${customer.daysSinceVisit > 60 ? 'critical' : 'warning'}`}>
                            {customer.daysSinceVisit} giorni
                          </span>
                        </td>
                        <td className="customer-actions">
                          <button
                            className="btn-send-winback"
                            onClick={() => handleSendWinbackEmail(customer)}
                            disabled={sendingEmail === customer.id}
                          >
                            {sendingEmail === customer.id ? (
                              <>
                                <RefreshCw size={14} className="spinning" />
                                Invio...
                              </>
                            ) : (
                              <>
                                <Mail size={14} />
                                Invia Win-back
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <CheckCircle2 size={48} />
                <h4>Nessun cliente inattivo!</h4>
                <p>Ottimo lavoro! Tutti i tuoi clienti sono attivi.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="tab-content">
          <div className="settings-form">
            <h3>Configurazione Win-back</h3>
            <p>Personalizza la tua strategia di riattivazione clienti</p>

            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                />
                <span className="toggle-switch"></span>
                <span className="toggle-text">
                  {settings.enabled ? 'Automazione Attiva' : 'Automazione Disattivata'}
                </span>
              </label>
              <p className="form-help">
                {settings.enabled
                  ? 'Le email win-back verranno inviate automaticamente ogni giorno alle 10:00'
                  : 'L\'automazione è disattivata. Puoi comunque inviare email manualmente dalla lista clienti inattivi.'}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="daysThreshold">
                <Clock size={16} />
                Soglia Inattività (giorni)
              </label>
              <input
                type="number"
                id="daysThreshold"
                min="7"
                max="365"
                value={settings.daysThreshold}
                onChange={(e) => setSettings({ ...settings, daysThreshold: parseInt(e.target.value) })}
              />
              <p className="form-help">
                Un cliente è considerato inattivo se non visita da più di {settings.daysThreshold} giorni
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="bonusPoints">
                <Gift size={16} />
                Punti Bonus Win-back
              </label>
              <input
                type="number"
                id="bonusPoints"
                min="0"
                max="1000"
                step="10"
                value={settings.bonusPoints}
                onChange={(e) => setSettings({ ...settings, bonusPoints: parseInt(e.target.value) })}
              />
              <p className="form-help">
                I clienti riceveranno {settings.bonusPoints} punti bonus quando tornano dopo l'email win-back
              </p>
            </div>

            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleSaveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Salva Impostazioni
                  </>
                )}
              </button>
            </div>

            {/* Info Panel */}
            <div className="info-panel">
              <h4>📋 Come Funziona</h4>
              <ul>
                <li>
                  <strong>Automazione Giornaliera:</strong> Ogni giorno alle 10:00 il sistema identifica i clienti inattivi
                </li>
                <li>
                  <strong>Email Personalizzate:</strong> Ogni cliente riceve un'email con il logo e i colori del tuo brand
                </li>
                <li>
                  <strong>Bonus Punti:</strong> Offri punti bonus per incentivare il ritorno
                </li>
                <li>
                  <strong>Anti-spam:</strong> Un cliente riceve max 1 email win-back ogni 60 giorni
                </li>
                <li>
                  <strong>Tracking:</strong> Monitora aperture, click e ritorni effettivi
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WinbackDashboard
