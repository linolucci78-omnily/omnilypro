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
import './ActivityLogDashboard.css'

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
    <div className="activity-log-dashboard">
      {/* Header */}
      <div className="activity-log-header">
        <div className="activity-log-title">
          <Activity size={28} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Log Attività</h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
              Audit trail completo del sistema
            </p>
          </div>
        </div>
        <div className="activity-log-stats">
          <div className="stat-badge">
            <div className="stat-badge-value">{filteredActivities.length}</div>
            <div className="stat-badge-label">Eventi</div>
          </div>
          <button className="btn-primary" onClick={exportLogs} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: 'var(--omnily-primary, #7c3aed)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            <Download size={16} />
            Esporta CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="activity-log-filters">
        <div className="filter-group">
          <label>Periodo</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="filter-select">
            <option value="1h">Ultima ora</option>
            <option value="24h">Ultime 24 ore</option>
            <option value="7d">Ultimi 7 giorni</option>
            <option value="30d">Ultimi 30 giorni</option>
            <option value="all">Tutti</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Categoria</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="filter-select">
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Gravità</label>
          <select value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)} className="filter-select">
            {severityLevels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-state">
          <h3><AlertTriangle size={20} />Errore caricamento log</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Activity Table */}
      <div className="activity-log-table-container">
        <table className="activity-log-table">
          <thead>
            <tr>
              <th>Data/Ora</th>
              <th>Utente</th>
              <th>Azione</th>
              <th>Categoria</th>
              <th>Gravità</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.map((activity) => {
              const date = new Date(activity.timestamp)
              const initials = activity.user_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()

              return (
                <tr key={activity.id}>
                  {/* Timestamp */}
                  <td>
                    <div className="log-timestamp">
                      <div className="log-date">
                        {date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="log-time">
                        {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </td>

                  {/* User */}
                  <td>
                    <div className="log-user">
                      <div className="user-avatar">{initials}</div>
                      <div className="user-info">
                        <div className="user-name">{activity.user_name}</div>
                        <div className="user-email">{activity.user_email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Action */}
                  <td>
                    <div className="log-action">
                      <div className="action-type">{activity.action}</div>
                      <div className="action-details">{activity.details}</div>
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <div className={`log-category category-${activity.category}`}>
                      {getActionIcon(activity.action, activity.category)}
                      {activity.category}
                    </div>
                  </td>

                  {/* Severity */}
                  <td>
                    <div className={`severity-badge severity-${activity.severity}`}>
                      {activity.severity}
                    </div>
                  </td>

                  {/* IP Address */}
                  <td>
                    <div className="log-ip">{activity.ip_address}</div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredActivities.length === 0 && !error && (
          <div className="empty-state">
            <Activity size={64} />
            <h3>Nessuna attività trovata</h3>
            <p>Non ci sono eventi registrati nel periodo selezionato</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogDashboard