import React, { useState, useEffect } from 'react'
import {
  Shield,
  AlertTriangle,
  Eye,
  Lock,
  Activity,
  Users,
  Globe,
  Database,
  Key,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  UserX,
  LogIn,
  LogOut,
  Settings,
  Mail,
  Smartphone,
  MapPin,
  Calendar,
  TrendingUp,
  Bell,
  FileText,
  Zap
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './SecurityDashboard.css'

interface SecurityEvent {
  id: string
  event_type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'account_locked' | 'permission_change' | 'data_access' | 'api_call'
  user_id?: string
  user_email?: string
  organization_id?: string
  organization_name?: string
  ip_address?: string
  user_agent?: string
  location?: string
  details?: any
  severity: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
}

interface SecurityAlert {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'investigating' | 'resolved'
  affected_users?: number
  created_at: string
  resolved_at?: string
}

interface SecurityStats {
  totalEvents: number
  criticalAlerts: number
  failedLogins: number
  activeUsers: number
  blockedIPs: number
  dataAccesses: number
}

const SecurityDashboard: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalAlerts: 0,
    failedLogins: 0,
    activeUsers: 0,
    blockedIPs: 0,
    dataAccesses: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'events' | 'alerts' | 'users' | 'settings'>('events')
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'login' | 'logout' | 'failed_login' | 'data_access'>('all')
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  useEffect(() => {
    loadSecurityData()
  }, [timeRange])

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calculate time range
      const now = new Date()
      const timeRangeMap = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      }
      const startTime = new Date(now.getTime() - timeRangeMap[timeRange])

      // Load security events from audit log
      const { data: eventsData, error: eventsError } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users(email),
          organizations(name)
        `)
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (eventsError) throw eventsError

      // Transform audit logs to security events
      const securityEvents: SecurityEvent[] = (eventsData || []).map((log: any) => ({
        id: log.id,
        event_type: mapActionToEventType(log.action),
        user_id: log.user_id,
        user_email: log.users?.email,
        organization_id: log.organization_id,
        organization_name: log.organizations?.name,
        ip_address: log.metadata?.ip_address,
        user_agent: log.metadata?.user_agent,
        location: log.metadata?.location,
        details: log.metadata,
        severity: determineSeverity(log.action, log.metadata),
        created_at: log.created_at
      }))

      setEvents(securityEvents)

      // Generate mock security alerts based on events
      const mockAlerts: SecurityAlert[] = [
        {
          id: 'alert_1',
          title: 'Tentativi di accesso sospetti',
          description: 'Rilevati multipli tentativi di login falliti dallo stesso IP',
          severity: 'high',
          status: 'active',
          affected_users: 3,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'alert_2',
          title: 'Accesso da posizione non riconosciuta',
          description: 'Login da un paese mai utilizzato prima',
          severity: 'medium',
          status: 'investigating',
          affected_users: 1,
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'alert_3',
          title: 'Picco di accessi ai dati',
          description: 'Volume di accessi ai dati superior alla norma',
          severity: 'low',
          status: 'resolved',
          affected_users: 0,
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          resolved_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ]

      setAlerts(mockAlerts)

      // Calculate security stats
      const securityStats: SecurityStats = {
        totalEvents: securityEvents.length,
        criticalAlerts: mockAlerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
        failedLogins: securityEvents.filter(e => e.event_type === 'failed_login').length,
        activeUsers: new Set(securityEvents.filter(e => e.event_type === 'login').map(e => e.user_id)).size,
        blockedIPs: 0, // Would come from firewall/security service
        dataAccesses: securityEvents.filter(e => e.event_type === 'data_access').length
      }

      setStats(securityStats)

    } catch (err) {
      console.error('Error loading security data:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati di sicurezza')
    } finally {
      setLoading(false)
    }
  }

  const mapActionToEventType = (action: string): SecurityEvent['event_type'] => {
    const mapping: Record<string, SecurityEvent['event_type']> = {
      'user.login': 'login',
      'user.logout': 'logout',
      'user.login_failed': 'failed_login',
      'user.password_change': 'password_change',
      'user.account_locked': 'account_locked',
      'user.permission_change': 'permission_change',
      'data.access': 'data_access',
      'api.call': 'api_call'
    }
    return mapping[action] || 'api_call'
  }

  const determineSeverity = (action: string, metadata: any): SecurityEvent['severity'] => {
    if (action.includes('failed') || action.includes('locked')) return 'high'
    if (action.includes('permission') || action.includes('password')) return 'medium'
    return 'low'
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.ip_address?.includes(searchTerm) ||
                         event.event_type.includes(searchTerm.toLowerCase())

    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter
    const matchesType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter

    return matchesSearch && matchesSeverity && matchesType
  })

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { color: 'success', icon: CheckCircle2, label: 'Basso' },
      medium: { color: 'warning', icon: AlertTriangle, label: 'Medio' },
      high: { color: 'danger', icon: XCircle, label: 'Alto' },
      critical: { color: 'critical', icon: AlertTriangle, label: 'Critico' }
    }

    const config = severityConfig[severity as keyof typeof severityConfig]
    if (!config) return null

    const Icon = config.icon

    return (
      <span className={`severity-badge ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    )
  }

  const getEventTypeIcon = (eventType: string) => {
    const icons = {
      login: LogIn,
      logout: LogOut,
      failed_login: UserX,
      password_change: Key,
      account_locked: Lock,
      permission_change: Settings,
      data_access: Database,
      api_call: Zap
    }

    const Icon = icons[eventType as keyof typeof icons] || Activity
    return <Icon size={16} />
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'danger', icon: AlertTriangle, label: 'Attivo' },
      investigating: { color: 'warning', icon: Eye, label: 'In Investigazione' },
      resolved: { color: 'success', icon: CheckCircle2, label: 'Risolto' }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon

    return (
      <span className={`status-badge ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Caricamento dati di sicurezza...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} />
        <h3>Errore nel caricamento</h3>
        <p>{error}</p>
        <button onClick={loadSecurityData} className="btn-primary">
          <RefreshCw size={16} />
          Riprova
        </button>
      </div>
    )
  }

  return (
    <div className="security-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Security Dashboard</h1>
          <p>Monitoraggio sicurezza e audit completo del sistema</p>
        </div>
        <div className="header-actions">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="time-range-select"
          >
            <option value="1h">Ultima ora</option>
            <option value="24h">Ultime 24 ore</option>
            <option value="7d">Ultimi 7 giorni</option>
            <option value="30d">Ultimi 30 giorni</option>
          </select>
          <button className="btn-secondary">
            <Download size={16} />
            Esporta Report
          </button>
          <button onClick={loadSecurityData} className="btn-secondary">
            <RefreshCw size={16} />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="security-stats-grid">
        <div className="stat-card critical">
          <div className="stat-icon">
            <Shield size={32} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.criticalAlerts}</div>
            <div className="stat-label">Alert Critici</div>
            <div className="stat-trend">
              {stats.criticalAlerts > 0 ? 'Richiede attenzione' : 'Sistema sicuro'}
            </div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">
            <UserX size={32} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.failedLogins}</div>
            <div className="stat-label">Login Falliti</div>
            <div className="stat-detail">ultimi {timeRange}</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <Users size={32} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeUsers}</div>
            <div className="stat-label">Utenti Attivi</div>
            <div className="stat-detail">sessioni uniche</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <Activity size={32} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalEvents}</div>
            <div className="stat-label">Eventi Totali</div>
            <div className="stat-detail">ultimi {timeRange}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="security-tabs">
        <button
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <Activity size={16} />
          Eventi di Sicurezza
        </button>
        <button
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <AlertTriangle size={16} />
          Alert Attivi
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          Utenti Sospetti
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          Configurazione
        </button>
      </div>

      {/* Security Events Tab */}
      {activeTab === 'events' && (
        <div className="events-section">
          {/* Filters */}
          <div className="filters-section">
            <div className="search-container">
              <Search size={20} />
              <input
                type="text"
                placeholder="Cerca per utente, IP, organizzazione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filters-container">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="filter-select"
              >
                <option value="all">Tutte le severità</option>
                <option value="low">Basso</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
                <option value="critical">Critico</option>
              </select>

              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value as any)}
                className="filter-select"
              >
                <option value="all">Tutti i tipi</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="failed_login">Login Falliti</option>
                <option value="data_access">Accesso Dati</option>
              </select>
            </div>
          </div>

          {/* Events Table */}
          <div className="events-table">
            <div className="table-header">
              <h3>Eventi di Sicurezza ({filteredEvents.length})</h3>
            </div>

            <div className="table-container">
              <div className="table-header-row">
                <div className="table-cell">Evento</div>
                <div className="table-cell">Utente</div>
                <div className="table-cell">Organizzazione</div>
                <div className="table-cell">IP Address</div>
                <div className="table-cell">Severità</div>
                <div className="table-cell">Data/Ora</div>
                <div className="table-cell">Azioni</div>
              </div>

              {filteredEvents.map((event) => (
                <div key={event.id} className="table-row">
                  <div className="table-cell">
                    <div className="event-info">
                      {getEventTypeIcon(event.event_type)}
                      <span className="event-type">{event.event_type.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="user-info">
                      {event.user_email || 'Sistema'}
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="org-info">
                      {event.organization_name || '-'}
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="ip-info">
                      <Globe size={12} />
                      {event.ip_address || '-'}
                    </div>
                  </div>

                  <div className="table-cell">
                    {getSeverityBadge(event.severity)}
                  </div>

                  <div className="table-cell">
                    <div className="time-info">
                      <Clock size={12} />
                      {formatDateTime(event.created_at)}
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="actions-container">
                      <button className="action-btn" title="Visualizza dettagli">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" title="Altre azioni">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredEvents.length === 0 && (
                <div className="empty-state">
                  <Activity size={48} />
                  <h3>Nessun evento trovato</h3>
                  <p>Non ci sono eventi che corrispondono ai criteri di ricerca.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="alerts-section">
          <div className="alerts-grid">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-card ${alert.severity}`}>
                <div className="alert-header">
                  <div className="alert-title">
                    <AlertTriangle size={20} />
                    {alert.title}
                  </div>
                  <div className="alert-status">
                    {getStatusBadge(alert.status)}
                  </div>
                </div>
                <div className="alert-description">
                  {alert.description}
                </div>
                <div className="alert-meta">
                  <div className="alert-severity">
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <div className="alert-time">
                    <Clock size={12} />
                    {formatDateTime(alert.created_at)}
                  </div>
                  {alert.affected_users && alert.affected_users > 0 && (
                    <div className="alert-affected">
                      <Users size={12} />
                      {alert.affected_users} utenti
                    </div>
                  )}
                </div>
                <div className="alert-actions">
                  <button className="btn-secondary small">
                    <Eye size={14} />
                    Dettagli
                  </button>
                  {alert.status === 'active' && (
                    <button className="btn-primary small">
                      <CheckCircle2 size={14} />
                      Risolvi
                    </button>
                  )}
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="empty-state">
                <Shield size={48} />
                <h3>Nessun alert attivo</h3>
                <p>Il sistema è sicuro, non ci sono alert di sicurezza attivi.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab - Placeholder */}
      {activeTab === 'users' && (
        <div className="users-section">
          <div className="placeholder-content">
            <Users size={64} />
            <h3>Analisi Utenti Sospetti</h3>
            <p>Qui verranno mostrati gli utenti con comportamenti anomali</p>
            <ul>
              <li>Tentativi di accesso multipli falliti</li>
              <li>Accessi da posizioni geografiche anomale</li>
              <li>Pattern di utilizzo sospetti</li>
              <li>Accesso a dati sensibili fuori orario</li>
            </ul>
          </div>
        </div>
      )}

      {/* Settings Tab - Placeholder */}
      {activeTab === 'settings' && (
        <div className="settings-section">
          <div className="settings-grid">
            <div className="settings-card">
              <h3>
                <Lock size={20} />
                Politiche di Sicurezza
              </h3>
              <div className="settings-list">
                <div className="setting-item">
                  <label>Durata sessione (minuti)</label>
                  <input type="number" defaultValue={120} />
                </div>
                <div className="setting-item">
                  <label>Max tentativi login</label>
                  <input type="number" defaultValue={5} />
                </div>
                <div className="setting-item">
                  <label>Blocco account (minuti)</label>
                  <input type="number" defaultValue={30} />
                </div>
              </div>
            </div>

            <div className="settings-card">
              <h3>
                <Bell size={20} />
                Notifiche Sicurezza
              </h3>
              <div className="settings-list">
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Notifica login sospetti
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Alert accessi non autorizzati
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" />
                    Report settimanali
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-card">
              <h3>
                <Database size={20} />
                Audit e Logging
              </h3>
              <div className="settings-list">
                <div className="setting-item">
                  <label>Retention log (giorni)</label>
                  <input type="number" defaultValue={90} />
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Log accessi dati
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Log modifiche sistema
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecurityDashboard