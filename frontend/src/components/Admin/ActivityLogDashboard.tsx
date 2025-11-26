import React, { useState, useEffect } from 'react'
import {
  Activity,
  User,
  Shield,
  FileText,
  Settings,
  CreditCard,
  Package,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Download,
  Eye,
  Clock,
  ChevronDown,
  Building2,
  Smartphone,
  Truck,
  Factory,
  Database
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PageLoader from '../UI/PageLoader'
import './AdminLayout.css'

interface ActivityLog {
  id: string
  timestamp: string
  user_id: string
  user_name: string
  user_email: string
  action: string
  resource_type: string
  resource_id?: string
  details: string
  ip_address: string
  user_agent: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  organization_id?: string
  organization_name?: string
  success: boolean
  metadata?: Record<string, any>
}

const ActivityLogDashboard: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedUser, setSelectedUser] = useState('all')
  const [dateRange, setDateRange] = useState('24h')
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load REAL activity logs from database
  const loadActivityLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calculate time range
      const now = new Date()
      const timeRangeMap: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        'all': 365 * 24 * 60 * 60 * 1000 // 1 year
      }
      const startTime = new Date(now.getTime() - timeRangeMap[dateRange])

      // Fetch real audit logs from database
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(500)

      if (logsError) throw logsError

      // Transform audit_logs to ActivityLog format
      const realActivities: ActivityLog[] = (logsData || []).map((log: any) => {
        const metadata = log.metadata || {}

        return {
          id: log.id,
          timestamp: log.created_at,
          user_id: log.user_id || 'system',
          user_name: metadata.user_name || metadata.email || 'Sistema',
          user_email: metadata.email || 'system@omnily.com',
          action: log.action,
          resource_type: extractResourceType(log.action),
          resource_id: metadata.resource_id,
          details: generateDetails(log.action, metadata),
          ip_address: metadata.ip_address || 'N/A',
          user_agent: metadata.user_agent || 'N/A',
          severity: determineSeverity(log.action),
          category: categorizeAction(log.action),
          organization_id: log.organization_id,
          organization_name: metadata.organization_name,
          success: !log.action.includes('failed') && !log.action.includes('error'),
          metadata: metadata
        }
      })

      setActivities(realActivities)
      setFilteredActivities(realActivities)

    } catch (err) {
      console.error('[ActivityLog] Error loading logs:', err)
      setError(err instanceof Error ? err.message : 'Errore caricamento log')
      setActivities([])
      setFilteredActivities([])
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const extractResourceType = (action: string): string => {
    if (action.includes('user')) return 'user'
    if (action.includes('organization')) return 'organization'
    if (action.includes('subscription') || action.includes('billing')) return 'subscription'
    if (action.includes('hardware') || action.includes('printer')) return 'hardware'
    if (action.includes('plan')) return 'plan'
    if (action.includes('login') || action.includes('auth')) return 'auth'
    return 'system'
  }

  const generateDetails = (action: string, metadata: any): string => {
    // Generate human-readable details from action and metadata
    const actionMap: Record<string, string> = {
      'user.login': `Login effettuato da ${metadata.ip_address || 'IP sconosciuto'}`,
      'user.logout': 'Logout effettuato',
      'user.login_failed': `Tentativo di login fallito - ${metadata.reason || 'password errata'}`,
      'user.created': `Nuovo utente creato: ${metadata.email || ''}`,
      'user.updated': `Utente aggiornato: ${metadata.email || ''}`,
      'user.deleted': `Utente eliminato: ${metadata.email || ''}`,
      'organization.created': `Nuova organizzazione creata: ${metadata.organization_name || ''}`,
      'organization.updated': `Organizzazione aggiornata: ${metadata.organization_name || ''}`,
      'subscription.created': `Subscription creato - Piano: ${metadata.plan || 'N/A'}`,
      'subscription.updated': `Subscription aggiornato - Piano: ${metadata.plan || 'N/A'}`,
      'plan.changed': `Piano modificato da ${metadata.old_plan || 'N/A'} a ${metadata.new_plan || 'N/A'}`,
    }

    return actionMap[action] || `${action} - ${JSON.stringify(metadata).substring(0, 100)}`
  }

  const determineSeverity = (action: string): 'low' | 'medium' | 'high' | 'critical' => {
    if (action.includes('failed') || action.includes('error') || action.includes('deleted')) return 'high'
    if (action.includes('login') || action.includes('created') || action.includes('updated')) return 'medium'
    return 'low'
  }

  const categorizeAction = (action: string): string => {
    if (action.includes('login') || action.includes('auth')) return 'security'
    if (action.includes('subscription') || action.includes('billing') || action.includes('plan')) return 'billing'
    if (action.includes('user')) return 'users'
    if (action.includes('organization')) return 'organizations'
    if (action.includes('hardware') || action.includes('printer')) return 'hardware'
    return 'system'
  }

  // ✅ REMOVED ALL MOCK DATA - Now loading 100% REAL data from audit_logs table

  const categories = [
    { value: 'all', label: 'Tutte le Categorie' },
    { value: 'security', label: 'Sicurezza', icon: Shield },
    { value: 'billing', label: 'Fatturazione', icon: CreditCard },
    { value: 'admin', label: 'Amministrazione', icon: Settings },
    { value: 'inventory', label: 'Inventario', icon: Package },
    { value: 'loyalty', label: 'Loyalty Program', icon: FileText },
    { value: 'system', label: 'Sistema', icon: Database }
  ]

  const severityLevels = [
    { value: 'all', label: 'Tutti i Livelli' },
    { value: 'low', label: 'Basso', color: '#10B981' },
    { value: 'medium', label: 'Medio', color: '#F59E0B' },
    { value: 'high', label: 'Alto', color: '#EF4444' },
    { value: 'critical', label: 'Critico', color: '#DC2626' }
  ]

  useEffect(() => {
    // Load REAL data from database when component mounts or dateRange changes
    loadActivityLogs()
  }, [dateRange])

  useEffect(() => {
    let filtered = activities

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(activity => activity.category === selectedCategory)
    }

    // Filter by severity
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(activity => activity.severity === selectedSeverity)
    }

    // Filter by user
    if (selectedUser !== 'all') {
      filtered = filtered.filter(activity => activity.user_id === selectedUser)
    }

    // Filter by date range
    const now = new Date()
    const timeFilters: Record<string, number> = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    }

    if (timeFilters[dateRange]) {
      const cutoff = new Date(now.getTime() - (timeFilters[dateRange] * 60 * 60 * 1000))
      filtered = filtered.filter(activity => new Date(activity.timestamp) >= cutoff)
    }

    setFilteredActivities(filtered)
  }, [activities, searchTerm, selectedCategory, selectedSeverity, selectedUser, dateRange])

  const getActionIcon = (action: string, category: string) => {
    switch (category) {
      case 'security': return <Shield size={16} />
      case 'billing': return <CreditCard size={16} />
      case 'admin': return <Settings size={16} />
      case 'inventory': return <Package size={16} />
      case 'loyalty': return <FileText size={16} />
      case 'system': return <Database size={16} />
      default: return <Activity size={16} />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#10B981'
      case 'medium': return '#F59E0B'
      case 'high': return '#EF4444'
      case 'critical': return '#DC2626'
      default: return '#6B7280'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Category', 'Severity', 'Details', 'Organization', 'Success'],
      ...filteredActivities.map(activity => [
        formatTimestamp(activity.timestamp),
        activity.user_name,
        activity.action,
        activity.category,
        activity.severity,
        activity.details,
        activity.organization_name || '',
        activity.success ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <PageLoader message="Caricamento audit trail..." size="medium" />
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <Activity size={32} />
            <div>
              <h1>Log Attività</h1>
              <p>Audit trail completo del sistema - {filteredActivities.length} eventi</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="btn-secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filtri
            </button>
            <button className="btn-primary" onClick={exportLogs}>
              <Download size={16} />
              Esporta CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="dashboard-section">
          <div className="filter-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div className="filter-group">
              <label>Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Gravità</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="form-select"
              >
                {severityLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Periodo</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="form-select"
              >
                <option value="1h">Ultima ora</option>
                <option value="24h">Ultime 24 ore</option>
                <option value="7d">Ultimi 7 giorni</option>
                <option value="30d">Ultimi 30 giorni</option>
                <option value="all">Tutti</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Cerca</label>
              <div className="search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Cerca utente, azione, dettagli..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon security">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {activities.filter(a => a.category === 'security').length}
            </div>
            <div className="stat-label">Eventi Sicurezza</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {activities.filter(a => a.severity === 'high' || a.severity === 'critical').length}
            </div>
            <div className="stat-label">Alert Critici</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <User size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {new Set(activities.map(a => a.user_id)).size}
            </div>
            <div className="stat-label">Utenti Attivi</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {activities.filter(a => {
                const now = new Date()
                const activityTime = new Date(a.timestamp)
                return (now.getTime() - activityTime.getTime()) < (24 * 60 * 60 * 1000)
              }).length}
            </div>
            <div className="stat-label">Ultime 24h</div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Timeline Attività</h2>
          <span className="result-count">{filteredActivities.length} eventi</span>
        </div>

        <div className="activity-timeline">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="timeline-item">
              <div className="timeline-marker" style={{
                backgroundColor: getSeverityColor(activity.severity)
              }}>
                {getActionIcon(activity.action, activity.category)}
              </div>

              <div className="timeline-content">
                <div className="timeline-header">
                  <div className="timeline-title">
                    <span className="action-type">{activity.action}</span>
                    {activity.organization_name && (
                      <span className="organization-badge">
                        <Building2 size={12} />
                        {activity.organization_name}
                      </span>
                    )}
                    <span
                      className="severity-badge"
                      style={{ backgroundColor: getSeverityColor(activity.severity) }}
                    >
                      {activity.severity.toUpperCase()}
                    </span>
                  </div>

                  <div className="timeline-meta">
                    <span className="timestamp">
                      <Clock size={12} />
                      {formatTimestamp(activity.timestamp)}
                    </span>
                    <span className="user-info">
                      <User size={12} />
                      {activity.user_name}
                    </span>
                  </div>
                </div>

                <div className="timeline-details">
                  <p className="activity-description">{activity.details}</p>

                  <div className="activity-metadata">
                    <div className="metadata-grid">
                      <div className="metadata-item">
                        <span className="label">IP:</span>
                        <span className="value">{activity.ip_address}</span>
                      </div>
                      <div className="metadata-item">
                        <span className="label">Categoria:</span>
                        <span className="value">{activity.category}</span>
                      </div>
                      <div className="metadata-item">
                        <span className="label">Esito:</span>
                        <span className={`value ${activity.success ? 'success' : 'error'}`}>
                          {activity.success ? 'Successo' : 'Fallito'}
                        </span>
                      </div>
                      {activity.resource_id && (
                        <div className="metadata-item">
                          <span className="label">Risorsa:</span>
                          <span className="value">{activity.resource_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="empty-state">
            <Activity size={48} />
            <h3>Nessuna attività trovata</h3>
            <p>Non ci sono eventi che corrispondono ai filtri selezionati.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogDashboard