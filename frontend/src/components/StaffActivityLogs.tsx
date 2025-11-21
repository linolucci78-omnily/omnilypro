import React, { useState, useEffect } from 'react'
import { X, Filter, Download, Calendar, User, FileText, TrendingUp, Search, RefreshCw } from 'lucide-react'
import { staffActivityService, type StaffActivityLog, type StaffActivityStats } from '../services/staffActivityService'
import './StaffActivityLogs.css'

interface StaffActivityLogsProps {
  organizationId: string
  onClose: () => void
}

const StaffActivityLogs: React.FC<StaffActivityLogsProps> = ({
  organizationId,
  onClose
}) => {
  const [logs, setLogs] = useState<StaffActivityLog[]>([])
  const [stats, setStats] = useState<StaffActivityStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today')

  // Carica logs e statistiche
  const loadData = async () => {
    setLoading(true)
    try {
      // Calcola date range
      const now = new Date()
      let startDate: string | undefined

      if (dateRange === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString()
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7))
        startDate = weekAgo.toISOString()
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.setDate(now.getDate() - 30))
        startDate = monthAgo.toISOString()
      }

      // Carica logs
      const logsData = await staffActivityService.getLogs({
        organizationId,
        actionType: filterType === 'all' ? undefined : filterType,
        startDate,
        limit: 100
      })
      setLogs(logsData)

      // Carica statistiche
      const statsData = await staffActivityService.getActivityStats({
        organizationId,
        startDate
      })
      setStats(statsData)

    } catch (error) {
      console.error('Error loading activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [organizationId, filterType, dateRange])

  // Filtra logs per ricerca
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.staff_name.toLowerCase().includes(query) ||
      log.description.toLowerCase().includes(query) ||
      log.customer_name?.toLowerCase().includes(query)
    )
  })

  // Mappa action_type a labels leggibili
  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'sale': 'Vendita',
      'reward_redeem': 'Riscatto Premio',
      'customer_create': 'Nuovo Cliente',
      'customer_update': 'Modifica Cliente',
      'customer_delete': 'Elimina Cliente',
      'login': 'Login',
      'logout': 'Logout'
    }
    return labels[actionType] || actionType
  }

  // Mappa action_type a colori
  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      'sale': '#10b981',
      'reward_redeem': '#f59e0b',
      'customer_create': '#3b82f6',
      'customer_update': '#8b5cf6',
      'customer_delete': '#ef4444',
      'login': '#06b6d4',
      'logout': '#6b7280'
    }
    return colors[actionType] || '#6b7280'
  }

  // Formatta data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    if (isToday) {
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Esporta logs in CSV
  const exportToCSV = () => {
    const headers = ['Data', 'Operatore', 'Azione', 'Descrizione', 'Cliente']
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString('it-IT'),
      log.staff_name,
      getActionLabel(log.action_type),
      log.description,
      log.customer_name || '-'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="staff-activity-logs-overlay">
      <div className="staff-activity-logs-modal">
        {/* Header */}
        <div className="staff-activity-logs-header">
          <div>
            <h2 className="staff-activity-logs-title">
              <FileText size={24} />
              Log Attività Operatori
            </h2>
            <p className="staff-activity-logs-subtitle">
              Monitora tutte le azioni degli operatori in tempo reale
            </p>
          </div>
          <button className="staff-activity-logs-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="staff-activity-logs-stats">
          {stats.slice(0, 4).map((stat) => (
            <div
              key={stat.action_type}
              className="staff-activity-logs-stat-card"
              style={{ borderLeft: `4px solid ${getActionColor(stat.action_type)}` }}
            >
              <div className="stat-label">{getActionLabel(stat.action_type)}</div>
              <div className="stat-value">{stat.count}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="staff-activity-logs-filters">
          {/* Search */}
          <div className="filter-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cerca per operatore, cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="filter-select"
          >
            <option value="today">Oggi</option>
            <option value="week">Ultima Settimana</option>
            <option value="month">Ultimo Mese</option>
            <option value="all">Tutto</option>
          </select>

          {/* Action Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tutte le azioni</option>
            <option value="sale">Vendite</option>
            <option value="reward_redeem">Riscatti Premi</option>
            <option value="customer_create">Nuovi Clienti</option>
            <option value="customer_update">Modifiche Clienti</option>
            <option value="login">Login</option>
          </select>

          {/* Actions */}
          <button className="filter-button" onClick={loadData}>
            <RefreshCw size={18} />
            Aggiorna
          </button>
          <button className="filter-button" onClick={exportToCSV}>
            <Download size={18} />
            Esporta CSV
          </button>
        </div>

        {/* Logs Table */}
        <div className="staff-activity-logs-content">
          {loading ? (
            <div className="staff-activity-logs-loading">
              <div className="spinner"></div>
              <p>Caricamento logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="staff-activity-logs-empty">
              <FileText size={48} opacity={0.3} />
              <p>Nessun log trovato per i filtri selezionati</p>
            </div>
          ) : (
            <div className="staff-activity-logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Data/Ora</th>
                    <th>Operatore</th>
                    <th>Azione</th>
                    <th>Descrizione</th>
                    <th>Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="log-date">{formatDate(log.created_at)}</td>
                      <td className="log-staff">
                        <User size={16} />
                        {log.staff_name}
                      </td>
                      <td>
                        <span
                          className="log-action-badge"
                          style={{ backgroundColor: getActionColor(log.action_type) + '20', color: getActionColor(log.action_type) }}
                        >
                          {getActionLabel(log.action_type)}
                        </span>
                      </td>
                      <td className="log-description">{log.description}</td>
                      <td className="log-customer">{log.customer_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="staff-activity-logs-footer">
          <p className="logs-count">
            {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} trovati
          </p>
        </div>
      </div>
    </div>
  )
}

export default StaffActivityLogs
