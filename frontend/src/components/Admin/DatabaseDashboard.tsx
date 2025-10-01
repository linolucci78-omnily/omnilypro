import React, { useState, useEffect } from 'react'
import {
  Database,
  Server,
  HardDrive,
  Activity,
  RefreshCw,
  Download,
  Upload,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Settings,
  Terminal,
  FileText,
  Zap,
  Eye,
  Play,
  Pause,
  Trash2
} from 'lucide-react'
import './AdminDashboard.css'

interface DatabaseStats {
  total_size: string
  table_count: number
  total_records: number
  connection_count: number
  cache_hit_ratio: number
  queries_per_second: number
  avg_query_time: number
  uptime: string
}

interface DatabaseTable {
  name: string
  schema: string
  size: string
  record_count: number
  last_vacuum: string
  last_analyze: string
  indexes_count: number
}

interface BackupHistory {
  id: string
  filename: string
  size: string
  created_at: string
  type: 'full' | 'incremental'
  status: 'completed' | 'failed' | 'in_progress'
  duration: string
}

interface DatabaseQuery {
  id: string
  query: string
  duration: number
  calls: number
  mean_time: number
  total_time: number
  rows: number
}

const DatabaseDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'queries' | 'backups' | 'monitoring'>('overview')
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null)
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [backups, setBackups] = useState<BackupHistory[]>([])
  const [slowQueries, setSlowQueries] = useState<DatabaseQuery[]>([])

  // Mock data
  const mockStats: DatabaseStats = {
    total_size: '2.4 GB',
    table_count: 47,
    total_records: 1247583,
    connection_count: 23,
    cache_hit_ratio: 98.7,
    queries_per_second: 145,
    avg_query_time: 12.5,
    uptime: '15 giorni 4 ore'
  }

  const mockTables: DatabaseTable[] = [
    {
      name: 'organizations',
      schema: 'public',
      size: '245 MB',
      record_count: 1247,
      last_vacuum: '2025-01-14T02:00:00Z',
      last_analyze: '2025-01-15T02:00:00Z',
      indexes_count: 8
    },
    {
      name: 'users',
      schema: 'public',
      size: '567 MB',
      record_count: 15432,
      last_vacuum: '2025-01-14T02:15:00Z',
      last_analyze: '2025-01-15T02:15:00Z',
      indexes_count: 12
    },
    {
      name: 'loyalty_transactions',
      schema: 'public',
      size: '1.2 GB',
      record_count: 892456,
      last_vacuum: '2025-01-14T03:30:00Z',
      last_analyze: '2025-01-15T03:30:00Z',
      indexes_count: 15
    },
    {
      name: 'rewards',
      schema: 'public',
      size: '123 MB',
      record_count: 5678,
      last_vacuum: '2025-01-14T02:45:00Z',
      last_analyze: '2025-01-15T02:45:00Z',
      indexes_count: 6
    }
  ]

  const mockBackups: BackupHistory[] = [
    {
      id: '1',
      filename: 'omnily_backup_2025-01-15_02-00.sql',
      size: '2.1 GB',
      created_at: '2025-01-15T02:00:00Z',
      type: 'full',
      status: 'completed',
      duration: '18m 32s'
    },
    {
      id: '2',
      filename: 'omnily_backup_2025-01-14_02-00.sql',
      size: '2.0 GB',
      created_at: '2025-01-14T02:00:00Z',
      type: 'full',
      status: 'completed',
      duration: '17m 45s'
    },
    {
      id: '3',
      filename: 'omnily_backup_2025-01-13_14-30.sql',
      size: '456 MB',
      created_at: '2025-01-13T14:30:00Z',
      type: 'incremental',
      status: 'completed',
      duration: '8m 12s'
    }
  ]

  const mockSlowQueries: DatabaseQuery[] = [
    {
      id: '1',
      query: 'SELECT * FROM loyalty_transactions WHERE created_at > $1 ORDER BY points DESC',
      duration: 2340,
      calls: 156,
      mean_time: 15.0,
      total_time: 2340,
      rows: 12456
    },
    {
      id: '2',
      query: 'UPDATE users SET last_activity = $1 WHERE id = $2',
      duration: 1890,
      calls: 8934,
      mean_time: 0.21,
      total_time: 1890,
      rows: 8934
    }
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setDbStats(mockStats)
      setTables(mockTables)
      setBackups(mockBackups)
      setSlowQueries(mockSlowQueries)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981'
      case 'failed': return '#EF4444'
      case 'in_progress': return '#F59E0B'
      default: return '#6B7280'
    }
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-title">
              <Database size={32} />
              <div>
                <h1>Database Management</h1>
                <p>Caricamento sistema database...</p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="loading-spinner">Caricamento...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <Database size={32} />
            <div>
              <h1>Database Management</h1>
              <p>Gestione e monitoraggio database PostgreSQL - {dbStats?.total_size}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              <RefreshCw size={16} />
              Aggiorna
            </button>
            <button className="btn-secondary">
              <Download size={16} />
              Backup Now
            </button>
            <button className="btn-primary">
              <Settings size={16} />
              Configurazione
            </button>
          </div>
        </div>
      </div>

      {/* Database Status Banner */}
      <div className="status-banner" style={{
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        color: 'white',
        padding: '1rem',
        borderRadius: '8px',
        margin: '0 0 1rem 0',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <CheckCircle size={20} />
        <span>Database Online - Uptime: {dbStats?.uptime} - Connessioni: {dbStats?.connection_count}/100</span>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Panoramica
        </button>
        <button
          className={`tab ${activeTab === 'tables' ? 'active' : ''}`}
          onClick={() => setActiveTab('tables')}
        >
          <FileText size={16} />
          Tabelle
        </button>
        <button
          className={`tab ${activeTab === 'queries' ? 'active' : ''}`}
          onClick={() => setActiveTab('queries')}
        >
          <Terminal size={16} />
          Query Performance
        </button>
        <button
          className={`tab ${activeTab === 'backups' ? 'active' : ''}`}
          onClick={() => setActiveTab('backups')}
        >
          <Shield size={16} />
          Backup
        </button>
        <button
          className={`tab ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <Activity size={16} />
          Monitoraggio
        </button>
      </div>

      {activeTab === 'overview' && dbStats && (
        <>
          {/* Database Stats */}
          <div className="dashboard-stats" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            padding: '0'
          }}>
            <div className="stat-card">
              <div className="stat-icon primary">
                <HardDrive size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{dbStats.total_size}</div>
                <div className="stat-label">Dimensione Database</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon success">
                <FileText size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{dbStats.table_count}</div>
                <div className="stat-label">Tabelle</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon info">
                <Database size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{dbStats.total_records.toLocaleString()}</div>
                <div className="stat-label">Record Totali</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon warning">
                <Zap size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{dbStats.queries_per_second}</div>
                <div className="stat-label">Query/sec</div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Metriche Performance</h2>
            </div>

            <div className="metrics-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              <div className="metric-card">
                <div className="metric-header">
                  <h3>Cache Hit Ratio</h3>
                  <span className="metric-value success">{dbStats.cache_hit_ratio}%</span>
                </div>
                <div className="metric-progress">
                  <div className="progress-bar">
                    <div
                      className="progress success"
                      style={{ width: `${dbStats.cache_hit_ratio}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <h3>Tempo Medio Query</h3>
                  <span className="metric-value warning">{dbStats.avg_query_time}ms</span>
                </div>
                <div className="metric-description">
                  Target: &lt; 10ms per query standard
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <h3>Connessioni Attive</h3>
                  <span className="metric-value info">{dbStats.connection_count}/100</span>
                </div>
                <div className="metric-progress">
                  <div className="progress-bar">
                    <div
                      className="progress info"
                      style={{ width: `${(dbStats.connection_count / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'tables' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Tabelle Database</h2>
            <div className="header-actions">
              <button className="btn-secondary">
                <RefreshCw size={16} />
                Vacuum All
              </button>
              <button className="btn-secondary">
                <BarChart3 size={16} />
                Analyze All
              </button>
            </div>
          </div>

          <div className="tables-list">
            {tables.map((table) => (
              <div key={table.name} className="table-card">
                <div className="table-header">
                  <div className="table-info">
                    <h3>{table.name}</h3>
                    <span className="table-schema">{table.schema}</span>
                  </div>
                  <div className="table-size">{table.size}</div>
                </div>

                <div className="table-stats">
                  <div className="stat">
                    <span className="label">Record:</span>
                    <span className="value">{table.record_count.toLocaleString()}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Indici:</span>
                    <span className="value">{table.indexes_count}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Ultimo Vacuum:</span>
                    <span className="value">{formatDate(table.last_vacuum)}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Ultimo Analyze:</span>
                    <span className="value">{formatDate(table.last_analyze)}</span>
                  </div>
                </div>

                <div className="table-actions">
                  <button className="btn-icon">
                    <Eye size={16} />
                  </button>
                  <button className="btn-icon">
                    <RefreshCw size={16} />
                  </button>
                  <button className="btn-icon">
                    <BarChart3 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'queries' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Query Performance</h2>
            <div className="header-actions">
              <button className="btn-secondary">
                <RefreshCw size={16} />
                Aggiorna
              </button>
            </div>
          </div>

          <div className="queries-list">
            {slowQueries.map((query) => (
              <div key={query.id} className="query-card">
                <div className="query-header">
                  <div className="query-stats">
                    <span className="duration">{query.duration}ms</span>
                    <span className="calls">{query.calls} chiamate</span>
                    <span className="mean-time">Media: {query.mean_time}ms</span>
                  </div>
                </div>

                <div className="query-content">
                  <code className="query-text">{query.query}</code>
                </div>

                <div className="query-actions">
                  <button className="btn-secondary">
                    <Eye size={16} />
                    Explain
                  </button>
                  <button className="btn-secondary">
                    <BarChart3 size={16} />
                    Analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'backups' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Backup Database</h2>
            <div className="header-actions">
              <button className="btn-primary">
                <Download size={16} />
                Nuovo Backup
              </button>
            </div>
          </div>

          <div className="backups-list">
            {backups.map((backup) => (
              <div key={backup.id} className="backup-card">
                <div className="backup-header">
                  <div className="backup-info">
                    <h3>{backup.filename}</h3>
                    <span className="backup-type">{backup.type}</span>
                  </div>
                  <div
                    className="backup-status"
                    style={{ color: getStatusColor(backup.status) }}
                  >
                    {backup.status === 'completed' && <CheckCircle size={16} />}
                    {backup.status === 'failed' && <AlertTriangle size={16} />}
                    {backup.status === 'in_progress' && <RefreshCw size={16} />}
                    <span>{backup.status}</span>
                  </div>
                </div>

                <div className="backup-details">
                  <div className="detail">
                    <span className="label">Dimensione:</span>
                    <span className="value">{backup.size}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Durata:</span>
                    <span className="value">{backup.duration}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Creato:</span>
                    <span className="value">{formatDate(backup.created_at)}</span>
                  </div>
                </div>

                <div className="backup-actions">
                  <button className="btn-secondary">
                    <Download size={16} />
                    Download
                  </button>
                  <button className="btn-secondary">
                    <Upload size={16} />
                    Restore
                  </button>
                  <button className="btn-icon danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Monitoraggio Real-time</h2>
          </div>

          <div className="monitoring-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            <div className="monitoring-card">
              <h3>CPU & Memoria Database</h3>
              <div className="chart-placeholder">
                <BarChart3 size={48} />
                <p>Grafico CPU e memoria in tempo reale</p>
              </div>
            </div>

            <div className="monitoring-card">
              <h3>I/O Database</h3>
              <div className="chart-placeholder">
                <Activity size={48} />
                <p>Grafico operazioni I/O in tempo reale</p>
              </div>
            </div>

            <div className="monitoring-card">
              <h3>Connessioni Attive</h3>
              <div className="chart-placeholder">
                <Server size={48} />
                <p>Monitor connessioni database</p>
              </div>
            </div>

            <div className="monitoring-card">
              <h3>Query Performance</h3>
              <div className="chart-placeholder">
                <Zap size={48} />
                <p>Performance query in tempo reale</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatabaseDashboard