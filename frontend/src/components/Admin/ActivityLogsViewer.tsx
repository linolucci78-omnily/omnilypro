import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Activity,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Smartphone,
  Building2,
  Calendar
} from 'lucide-react'
import PageLoader from '../UI/PageLoader'
import './AdminLayout.css'

interface ActivityLog {
  id: string
  device_id?: string
  user_id?: string
  organization_id?: string
  activity_type: string
  activity_title?: string
  activity_description?: string
  activity_data?: any
  success: boolean
  error_details?: string
  ip_address?: string
  user_agent?: string
  created_at: string
  // Joined data
  device?: {
    name: string
  }
  organization?: {
    name: string
  }
}

const ActivityLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'success' | 'failed'>('all')
  const [filterActivity, setFilterActivity] = useState<string>('all')
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadLogs()
  }, [dateRange])

  const loadLogs = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('mdm_activity_logs')
        .select(`
          *,
          device:devices(name),
          organization:organizations(name)
        `)
        .order('created_at', { ascending: false })
        .limit(500)

      // Filter by date range
      if (dateRange.from) {
        query = query.gte('created_at', new Date(dateRange.from).toISOString())
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        query = query.lte('created_at', toDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const activityTypes = [
    'all',
    'command_sent',
    'device_registered',
    'app_installed',
    'config_updated',
    'kiosk_activated',
    'kiosk_deactivated',
    'device_reboot',
    'device_shutdown'
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'command_sent':
        return <Activity size={16} />
      case 'device_registered':
        return <Smartphone size={16} />
      case 'app_installed':
        return <Download size={16} />
      default:
        return <Activity size={16} />
    }
  }

  const getActivityColor = (type: string) => {
    const colors: { [key: string]: string } = {
      command_sent: '#3b82f6',
      device_registered: '#10b981',
      app_installed: '#8b5cf6',
      config_updated: '#f59e0b',
      kiosk_activated: '#ef4444',
      kiosk_deactivated: '#6b7280'
    }
    return colors[type] || '#6b7280'
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(dateString))
  }

  const exportToCSV = () => {
    const headers = ['Data', 'Tipo', 'Titolo', 'Dispositivo', 'Organizzazione', 'Stato', 'IP']
    const rows = filteredLogs.map(log => [
      formatDate(log.created_at),
      log.activity_type,
      log.activity_title || '',
      log.device?.name || 'N/A',
      log.organization?.name || 'N/A',
      log.success ? 'Success' : 'Failed',
      log.ip_address || 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `activity-logs-${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.activity_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.activity_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.device?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.organization?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType =
      filterType === 'all' ||
      (filterType === 'success' && log.success) ||
      (filterType === 'failed' && !log.success)

    const matchesActivity =
      filterActivity === 'all' || log.activity_type === filterActivity

    return matchesSearch && matchesType && matchesActivity
  })

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.success).length,
    failed: logs.filter(l => !l.success).length,
    devices: new Set(logs.map(l => l.device_id).filter(Boolean)).size
  }

  if (loading) {
    return <PageLoader message="Caricamento activity logs..." size="medium" />
  }

  return (
    <div className="admin-dashboard" style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0 }}>
      {/* Header */}
      <div className="dashboard-header" style={{ padding: '1.5rem' }}>
        <div className="header-title-section">
          <h1>📊 Activity Logs</h1>
          <p>Cronologia completa delle attività del sistema MDM</p>
        </div>
        <button className="btn-primary" onClick={exportToCSV}>
          <Download size={20} />
          Esporta CSV
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-stats" style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="stat-card">
          <Activity size={20} />
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Eventi Totali</div>
          </div>
        </div>
        <div className="stat-card online">
          <CheckCircle size={20} />
          <div>
            <div className="stat-value">{stats.success}</div>
            <div className="stat-label">Successi</div>
          </div>
        </div>
        <div className="stat-card offline">
          <XCircle size={20} />
          <div>
            <div className="stat-value">{stats.failed}</div>
            <div className="stat-label">Falliti</div>
          </div>
        </div>
        <div className="stat-card">
          <Smartphone size={20} />
          <div>
            <div className="stat-value">{stats.devices}</div>
            <div className="stat-label">Dispositivi</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="search-bar" style={{ marginBottom: '1rem' }}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca per titolo, descrizione, dispositivo o organizzazione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={18} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
            >
              <option value="all">Tutti gli stati</option>
              <option value="success">Solo successi</option>
              <option value="failed">Solo fallimenti</option>
            </select>
          </div>

          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
          >
            {activityTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Tutte le attività' : type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Calendar size={18} />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
            />
            <span>-</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ padding: '0 1.5rem', overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                Data/Ora
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                Tipo Attività
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                Dettagli
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                Dispositivo
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                Organizzazione
              </th>
              <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>
                Stato
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <tr
                key={log.id}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                }}
              >
                <td style={{ padding: '1rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={14} style={{ color: '#6b7280' }} />
                    {formatDate(log.created_at)}
                  </div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    backgroundColor: getActivityColor(log.activity_type) + '20',
                    color: getActivityColor(log.activity_type)
                  }}>
                    {getActivityIcon(log.activity_type)}
                    <span style={{ fontWeight: '500' }}>
                      {log.activity_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                    {log.activity_title || 'N/A'}
                  </div>
                  {log.activity_description && (
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {log.activity_description}
                    </div>
                  )}
                  {log.error_details && (
                    <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.25rem' }}>
                      ⚠️ {log.error_details}
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  {log.device ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Smartphone size={14} style={{ color: '#6b7280' }} />
                      {log.device.name}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  {log.organization ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={14} style={{ color: '#6b7280' }} />
                      {log.organization.name}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {log.success ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      <CheckCircle size={14} />
                      Success
                    </div>
                  ) : (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      <XCircle size={14} />
                      Failed
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div className="no-devices" style={{ margin: '2rem 0' }}>
            <Activity size={48} />
            <h3>Nessun log trovato</h3>
            <p>Non ci sono activity logs che corrispondono ai criteri di ricerca.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogsViewer
