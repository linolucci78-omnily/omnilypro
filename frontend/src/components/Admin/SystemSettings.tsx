import React, { useState, useEffect } from 'react'
import {
  Settings,
  Database,
  Server,
  Globe,
  Mail,
  Bell,
  Palette,
  Shield,
  Activity,
  Monitor,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Save,
  Upload,
  Download,
  Edit2,
  Eye,
  MoreHorizontal,
  Zap,
  Clock,
  TrendingUp,
  BarChart3,
  Smartphone,
  Users,
  CreditCard
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './SystemSettings.css'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  database_connections: number
  api_response_time: number
  error_rate: number
  active_users: number
}

interface ConfigSetting {
  id: string
  category: 'system' | 'email' | 'notifications' | 'security' | 'integrations'
  key: string
  value: string
  type: 'text' | 'number' | 'boolean' | 'json'
  description: string
  is_sensitive: boolean
  updated_at: string
}

interface SystemMetric {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  active_users: number
  api_calls: number
  response_time: number
}

const SystemSettings: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: 0,
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    database_connections: 0,
    api_response_time: 0,
    error_rate: 0,
    active_users: 0
  })
  const [settings, setSettings] = useState<ConfigSetting[]>([])
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'monitoring' | 'settings' | 'database' | 'integrations'>('monitoring')
  const [editingSettings, setEditingSettings] = useState<Set<string>>(new Set())
  const [settingsChanges, setSettingsChanges] = useState<Record<string, string>>({})

  useEffect(() => {
    loadSystemData()

    // Setup real-time monitoring
    const interval = setInterval(updateMetrics, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadSystemData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load system health (mock data - would come from monitoring service)
      const mockHealth: SystemHealth = {
        status: 'healthy',
        uptime: 25 * 24 * 60 * 60, // 25 days in seconds
        cpu_usage: 35.2,
        memory_usage: 68.7,
        disk_usage: 42.1,
        database_connections: 45,
        api_response_time: 120,
        error_rate: 0.02,
        active_users: 147
      }
      setHealth(mockHealth)

      // Load system settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_config')
        .select('*')
        .order('category', { ascending: true })

      if (settingsError) {
        console.warn('System config table not found, using mock data')
        // Mock settings data
        const mockSettings: ConfigSetting[] = [
          {
            id: '1',
            category: 'system',
            key: 'session_timeout',
            value: '7200',
            type: 'number',
            description: 'Durata sessione utente in secondi',
            is_sensitive: false,
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            category: 'system',
            key: 'max_upload_size',
            value: '10485760',
            type: 'number',
            description: 'Dimensione massima upload in bytes (10MB)',
            is_sensitive: false,
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            category: 'email',
            key: 'smtp_host',
            value: 'smtp.gmail.com',
            type: 'text',
            description: 'Host server SMTP',
            is_sensitive: false,
            updated_at: new Date().toISOString()
          },
          {
            id: '4',
            category: 'email',
            key: 'smtp_password',
            value: '***hidden***',
            type: 'text',
            description: 'Password SMTP',
            is_sensitive: true,
            updated_at: new Date().toISOString()
          },
          {
            id: '5',
            category: 'notifications',
            key: 'enable_push_notifications',
            value: 'true',
            type: 'boolean',
            description: 'Abilita notifiche push',
            is_sensitive: false,
            updated_at: new Date().toISOString()
          },
          {
            id: '6',
            category: 'security',
            key: 'max_login_attempts',
            value: '5',
            type: 'number',
            description: 'Massimo numero di tentativi di login',
            is_sensitive: false,
            updated_at: new Date().toISOString()
          },
          {
            id: '7',
            category: 'integrations',
            key: 'stripe_public_key',
            value: 'pk_test_***',
            type: 'text',
            description: 'Chiave pubblica Stripe',
            is_sensitive: false,
            updated_at: new Date().toISOString()
          },
          {
            id: '8',
            category: 'integrations',
            key: 'stripe_secret_key',
            value: '***hidden***',
            type: 'text',
            description: 'Chiave segreta Stripe',
            is_sensitive: true,
            updated_at: new Date().toISOString()
          }
        ]
        setSettings(mockSettings)
      } else {
        setSettings(settingsData || [])
      }

      // Generate mock metrics for the last 24 hours
      const mockMetrics: SystemMetric[] = []
      const now = new Date()
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
        mockMetrics.push({
          timestamp: timestamp.toISOString(),
          cpu: 20 + Math.random() * 60,
          memory: 40 + Math.random() * 40,
          disk: 35 + Math.random() * 20,
          active_users: 50 + Math.random() * 200,
          api_calls: 1000 + Math.random() * 5000,
          response_time: 80 + Math.random() * 200
        })
      }
      setMetrics(mockMetrics)

    } catch (err) {
      console.error('Error loading system data:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati di sistema')
    } finally {
      setLoading(false)
    }
  }

  const updateMetrics = async () => {
    // In a real app, this would fetch current metrics from monitoring service
    const now = new Date()
    const newMetric: SystemMetric = {
      timestamp: now.toISOString(),
      cpu: 20 + Math.random() * 60,
      memory: 40 + Math.random() * 40,
      disk: 35 + Math.random() * 20,
      active_users: 50 + Math.random() * 200,
      api_calls: 1000 + Math.random() * 5000,
      response_time: 80 + Math.random() * 200
    }

    setMetrics(prev => [...prev.slice(-23), newMetric])

    // Update health status
    setHealth(prev => ({
      ...prev,
      cpu_usage: newMetric.cpu,
      memory_usage: newMetric.memory,
      disk_usage: newMetric.disk,
      active_users: newMetric.active_users,
      api_response_time: newMetric.response_time
    }))
  }

  const handleEditSetting = (settingId: string) => {
    setEditingSettings(prev => new Set([...prev, settingId]))
  }

  const handleCancelEdit = (settingId: string) => {
    setEditingSettings(prev => {
      const newSet = new Set(prev)
      newSet.delete(settingId)
      return newSet
    })
    setSettingsChanges(prev => {
      const newChanges = { ...prev }
      delete newChanges[settingId]
      return newChanges
    })
  }

  const handleSaveSetting = async (setting: ConfigSetting) => {
    try {
      const newValue = settingsChanges[setting.id] || setting.value

      // In a real app, this would save to database
      console.log('Saving setting:', setting.key, '=', newValue)

      // Update local state
      setSettings(prev => prev.map(s =>
        s.id === setting.id
          ? { ...s, value: newValue, updated_at: new Date().toISOString() }
          : s
      ))

      // Clear editing state
      handleCancelEdit(setting.id)

    } catch (err) {
      console.error('Error saving setting:', err)
    }
  }

  const handleSettingChange = (settingId: string, value: string) => {
    setSettingsChanges(prev => ({
      ...prev,
      [settingId]: value
    }))
  }

  const getStatusColor = (status: string) => {
    const colors = {
      healthy: 'success',
      warning: 'warning',
      critical: 'danger'
    }
    return colors[status as keyof typeof colors] || 'info'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      healthy: CheckCircle2,
      warning: AlertTriangle,
      critical: XCircle
    }
    const Icon = icons[status as keyof typeof icons] || CheckCircle2
    return <Icon size={20} />
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    return `${days}d ${hours}h`
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      system: Settings,
      email: Mail,
      notifications: Bell,
      security: Shield,
      integrations: Zap
    }
    const Icon = icons[category as keyof typeof icons] || Settings
    return <Icon size={16} />
  }

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, ConfigSetting[]>)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Caricamento impostazioni di sistema...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} />
        <h3>Errore nel caricamento</h3>
        <p>{error}</p>
        <button onClick={loadSystemData} className="btn-primary">
          <RefreshCw size={16} />
          Riprova
        </button>
      </div>
    )
  }

  return (
    <div className="system-settings">
      {/* Header */}
      <div className="settings-header">
        <div className="header-content">
          <h1>Impostazioni di Sistema</h1>
          <p>Configurazione e monitoraggio del sistema OMNILY PRO</p>
        </div>
        <div className="header-actions">
          <button onClick={updateMetrics} className="btn-secondary">
            <RefreshCw size={16} />
            Aggiorna Metriche
          </button>
          <button className="btn-secondary">
            <Download size={16} />
            Esporta Config
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="system-status-card">
        <div className="status-header">
          <div className="status-info">
            <div className={`status-indicator ${getStatusColor(health.status)}`}>
              {getStatusIcon(health.status)}
              <span className="status-text">
                Sistema {health.status === 'healthy' ? 'Operativo' : health.status === 'warning' ? 'Attenzione' : 'Critico'}
              </span>
            </div>
            <div className="uptime-info">
              <Clock size={16} />
              Uptime: {formatUptime(health.uptime)}
            </div>
          </div>
          <div className="quick-metrics">
            <div className="quick-metric">
              <Users size={16} />
              <span>{health.active_users} utenti attivi</span>
            </div>
            <div className="quick-metric">
              <Activity size={16} />
              <span>{health.api_response_time}ms response time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <Monitor size={16} />
          Monitoraggio
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          Configurazioni
        </button>
        <button
          className={`tab ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          <Database size={16} />
          Database
        </button>
        <button
          className={`tab ${activeTab === 'integrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('integrations')}
        >
          <Zap size={16} />
          Integrazioni
        </button>
      </div>

      {/* Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <div className="monitoring-section">
          {/* Resource Usage Cards */}
          <div className="resource-cards">
            <div className="resource-card">
              <div className="resource-header">
                <Cpu size={20} />
                <span>CPU</span>
              </div>
              <div className="resource-value">{health.cpu_usage.toFixed(1)}%</div>
              <div className="resource-bar">
                <div
                  className="resource-fill cpu"
                  style={{ width: `${health.cpu_usage}%` }}
                />
              </div>
            </div>

            <div className="resource-card">
              <div className="resource-header">
                <MemoryStick size={20} />
                <span>Memoria</span>
              </div>
              <div className="resource-value">{health.memory_usage.toFixed(1)}%</div>
              <div className="resource-bar">
                <div
                  className="resource-fill memory"
                  style={{ width: `${health.memory_usage}%` }}
                />
              </div>
            </div>

            <div className="resource-card">
              <div className="resource-header">
                <HardDrive size={20} />
                <span>Disco</span>
              </div>
              <div className="resource-value">{health.disk_usage.toFixed(1)}%</div>
              <div className="resource-bar">
                <div
                  className="resource-fill disk"
                  style={{ width: `${health.disk_usage}%` }}
                />
              </div>
            </div>

            <div className="resource-card">
              <div className="resource-header">
                <Network size={20} />
                <span>DB Connections</span>
              </div>
              <div className="resource-value">{health.database_connections}</div>
              <div className="resource-detail">connessioni attive</div>
            </div>
          </div>

          {/* Metrics Charts Placeholder */}
          <div className="charts-section">
            <div className="chart-card">
              <h3>
                <TrendingUp size={20} />
                Utilizzo Risorse (24h)
              </h3>
              <div className="chart-placeholder">
                <BarChart3 size={64} />
                <p>Grafico utilizzo CPU, Memoria, Disco</p>
                <p className="chart-note">Da implementare con Chart.js</p>
              </div>
            </div>

            <div className="chart-card">
              <h3>
                <Activity size={20} />
                Utenti Attivi
              </h3>
              <div className="chart-placeholder">
                <Users size={64} />
                <p>Grafico utenti attivi nel tempo</p>
                <p className="chart-note">Da implementare con Chart.js</p>
              </div>
            </div>
          </div>

          {/* Recent Metrics Table */}
          <div className="metrics-table">
            <div className="table-header">
              <h3>Metriche Recenti</h3>
            </div>
            <div className="table-container">
              <div className="table-header-row">
                <div className="table-cell">Timestamp</div>
                <div className="table-cell">CPU %</div>
                <div className="table-cell">Memoria %</div>
                <div className="table-cell">Utenti</div>
                <div className="table-cell">API Calls</div>
                <div className="table-cell">Response Time</div>
              </div>
              {metrics.slice(-10).reverse().map((metric, index) => (
                <div key={index} className="table-row">
                  <div className="table-cell">
                    {new Date(metric.timestamp).toLocaleTimeString('it-IT')}
                  </div>
                  <div className="table-cell">{metric.cpu.toFixed(1)}%</div>
                  <div className="table-cell">{metric.memory.toFixed(1)}%</div>
                  <div className="table-cell">{Math.round(metric.active_users)}</div>
                  <div className="table-cell">{Math.round(metric.api_calls)}</div>
                  <div className="table-cell">{Math.round(metric.response_time)}ms</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="settings-section">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
            <div key={category} className="settings-category">
              <div className="category-header">
                {getCategoryIcon(category)}
                <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
              </div>

              <div className="settings-list">
                {categorySettings.map((setting) => (
                  <div key={setting.id} className="setting-item">
                    <div className="setting-info">
                      <div className="setting-label">{setting.key}</div>
                      <div className="setting-description">{setting.description}</div>
                    </div>

                    <div className="setting-value">
                      {editingSettings.has(setting.id) ? (
                        <div className="setting-edit">
                          {setting.type === 'boolean' ? (
                            <select
                              value={settingsChanges[setting.id] || setting.value}
                              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                              className="setting-input"
                            >
                              <option value="true">Attivo</option>
                              <option value="false">Disattivo</option>
                            </select>
                          ) : (
                            <input
                              type={setting.type === 'number' ? 'number' : 'text'}
                              value={settingsChanges[setting.id] || setting.value}
                              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                              className="setting-input"
                              disabled={setting.is_sensitive}
                            />
                          )}
                          <div className="setting-actions">
                            <button
                              onClick={() => handleSaveSetting(setting)}
                              className="btn-primary small"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => handleCancelEdit(setting.id)}
                              className="btn-secondary small"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="setting-display">
                          <span className="setting-current-value">
                            {setting.is_sensitive ? '***hidden***' :
                             setting.type === 'boolean' ?
                               (setting.value === 'true' ? 'Attivo' : 'Disattivo') :
                               setting.value}
                          </span>
                          <button
                            onClick={() => handleEditSetting(setting.id)}
                            className="edit-btn"
                            title="Modifica"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <div className="database-section">
          <div className="database-stats">
            <div className="db-stat-card">
              <Database size={32} />
              <div className="db-stat-content">
                <div className="db-stat-value">PostgreSQL 14.2</div>
                <div className="db-stat-label">Versione Database</div>
              </div>
            </div>

            <div className="db-stat-card">
              <Server size={32} />
              <div className="db-stat-content">
                <div className="db-stat-value">{health.database_connections}</div>
                <div className="db-stat-label">Connessioni Attive</div>
              </div>
            </div>

            <div className="db-stat-card">
              <HardDrive size={32} />
              <div className="db-stat-content">
                <div className="db-stat-value">2.4 GB</div>
                <div className="db-stat-label">Dimensione DB</div>
              </div>
            </div>
          </div>

          <div className="database-operations">
            <div className="operation-card">
              <h3>Backup Database</h3>
              <p>Crea un backup completo del database</p>
              <div className="operation-actions">
                <button className="btn-primary">
                  <Download size={16} />
                  Backup Completo
                </button>
                <button className="btn-secondary">
                  <Clock size={16} />
                  Backup Incrementale
                </button>
              </div>
            </div>

            <div className="operation-card">
              <h3>Manutenzione</h3>
              <p>Operazioni di pulizia e ottimizzazione</p>
              <div className="operation-actions">
                <button className="btn-secondary">
                  <RefreshCw size={16} />
                  Analizza Tabelle
                </button>
                <button className="btn-secondary">
                  <Database size={16} />
                  Reindex
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="integrations-section">
          <div className="integrations-grid">
            <div className="integration-card">
              <div className="integration-header">
                <div className="integration-icon stripe">
                  <CreditCard size={24} />
                </div>
                <div className="integration-info">
                  <h3>Stripe</h3>
                  <p>Payment processing</p>
                </div>
                <div className="integration-status connected">
                  <CheckCircle2 size={16} />
                  Connesso
                </div>
              </div>
              <div className="integration-details">
                <div className="detail-item">
                  <span>Chiave pubblica:</span>
                  <span>pk_test_***</span>
                </div>
                <div className="detail-item">
                  <span>Webhook URL:</span>
                  <span>https://api.omnily.pro/webhooks/stripe</span>
                </div>
              </div>
              <div className="integration-actions">
                <button className="btn-secondary">
                  <Settings size={14} />
                  Configura
                </button>
                <button className="btn-secondary">
                  <Eye size={14} />
                  Test
                </button>
              </div>
            </div>

            <div className="integration-card">
              <div className="integration-header">
                <div className="integration-icon email">
                  <Mail size={24} />
                </div>
                <div className="integration-info">
                  <h3>SMTP Email</h3>
                  <p>Email delivery</p>
                </div>
                <div className="integration-status connected">
                  <CheckCircle2 size={16} />
                  Connesso
                </div>
              </div>
              <div className="integration-details">
                <div className="detail-item">
                  <span>Server:</span>
                  <span>smtp.gmail.com:587</span>
                </div>
                <div className="detail-item">
                  <span>Autenticazione:</span>
                  <span>TLS</span>
                </div>
              </div>
              <div className="integration-actions">
                <button className="btn-secondary">
                  <Settings size={14} />
                  Configura
                </button>
                <button className="btn-secondary">
                  <Mail size={14} />
                  Test Email
                </button>
              </div>
            </div>

            <div className="integration-card">
              <div className="integration-header">
                <div className="integration-icon push">
                  <Smartphone size={24} />
                </div>
                <div className="integration-info">
                  <h3>Push Notifications</h3>
                  <p>Mobile notifications</p>
                </div>
                <div className="integration-status disconnected">
                  <XCircle size={16} />
                  Non Configurato
                </div>
              </div>
              <div className="integration-details">
                <div className="detail-item">
                  <span>Firebase Key:</span>
                  <span>Non configurato</span>
                </div>
                <div className="detail-item">
                  <span>APNs Certificate:</span>
                  <span>Non configurato</span>
                </div>
              </div>
              <div className="integration-actions">
                <button className="btn-primary">
                  <Settings size={14} />
                  Configura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemSettings