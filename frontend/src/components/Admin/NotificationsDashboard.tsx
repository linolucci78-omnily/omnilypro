import React, { useState, useEffect } from 'react'
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Mail,
  Smartphone,
  Globe,
  Users,
  Settings,
  Send,
  Calendar,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Target,
  MessageSquare,
  Zap
} from 'lucide-react'
import './AdminDashboard.css'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'system'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  channels: ('email' | 'sms' | 'push' | 'in_app')[]
  target_audience: string
  scheduled_at?: string
  sent_at?: string
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  recipients_count: number
  open_rate?: number
  click_rate?: number
  created_by: string
  created_at: string
  organization_id?: string
}

interface NotificationTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: string
  variables: string[]
  usage_count: number
}

const NotificationsDashboard: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'notifications' | 'templates' | 'analytics'>('notifications')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Mock data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Nuovo Aggiornamento Sistema',
      message: 'È disponibile l\'aggiornamento v2.1 con nuove funzionalità di analytics.',
      type: 'info',
      priority: 'medium',
      channels: ['email', 'in_app'],
      target_audience: 'all_users',
      sent_at: '2025-01-15T09:00:00Z',
      status: 'sent',
      recipients_count: 1247,
      open_rate: 67.5,
      click_rate: 23.1,
      created_by: 'Admin',
      created_at: '2025-01-15T08:30:00Z'
    },
    {
      id: '2',
      title: 'Manutenzione Programmata',
      message: 'Manutenzione server programmata per domenica 19 gennaio dalle 02:00 alle 04:00.',
      type: 'warning',
      priority: 'high',
      channels: ['email', 'sms', 'push'],
      target_audience: 'business_owners',
      scheduled_at: '2025-01-17T18:00:00Z',
      status: 'scheduled',
      recipients_count: 156,
      created_by: 'System Admin',
      created_at: '2025-01-14T15:20:00Z'
    },
    {
      id: '3',
      title: 'Benvenuto in OMNILY Pro!',
      message: 'Congratulazioni per aver scelto OMNILY Pro. Inizia subito a configurare il tuo loyalty program.',
      type: 'success',
      priority: 'medium',
      channels: ['email'],
      target_audience: 'new_customers',
      sent_at: '2025-01-15T14:30:00Z',
      status: 'sent',
      recipients_count: 23,
      open_rate: 89.2,
      click_rate: 45.6,
      created_by: 'Marketing Bot',
      created_at: '2025-01-15T14:25:00Z'
    },
    {
      id: '4',
      title: 'Errore Sistema Pagamenti',
      message: 'Rilevato problema con il gateway di pagamento. Il team tecnico sta investigando.',
      type: 'error',
      priority: 'urgent',
      channels: ['email', 'sms'],
      target_audience: 'admins',
      sent_at: '2025-01-15T11:45:00Z',
      status: 'sent',
      recipients_count: 5,
      open_rate: 100,
      click_rate: 80,
      created_by: 'System Monitor',
      created_at: '2025-01-15T11:45:00Z'
    }
  ]

  const mockTemplates: NotificationTemplate[] = [
    {
      id: '1',
      name: 'Benvenuto Nuovo Cliente',
      subject: 'Benvenuto in OMNILY Pro!',
      content: 'Ciao {{name}}, benvenuto in OMNILY Pro! Il tuo account {{organization}} è stato attivato.',
      type: 'welcome',
      variables: ['name', 'organization'],
      usage_count: 156
    },
    {
      id: '2',
      name: 'Promemoria Pagamento',
      subject: 'Promemoria: Fattura in scadenza',
      content: 'La fattura {{invoice_number}} di €{{amount}} scade il {{due_date}}.',
      type: 'billing',
      variables: ['invoice_number', 'amount', 'due_date'],
      usage_count: 89
    },
    {
      id: '3',
      name: 'Aggiornamento Sistema',
      subject: 'Nuovo aggiornamento disponibile',
      content: 'È disponibile l\'aggiornamento {{version}} con {{features}}.',
      type: 'system',
      variables: ['version', 'features'],
      usage_count: 34
    }
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(mockNotifications)
      setTemplates(mockTemplates)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} />
      case 'warning': return <AlertTriangle size={16} />
      case 'error': return <XCircle size={16} />
      case 'system': return <Settings size={16} />
      default: return <Info size={16} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return '#10B981'
      case 'warning': return '#F59E0B'
      case 'error': return '#EF4444'
      case 'system': return '#8B5CF6'
      default: return '#3B82F6'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626'
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail size={14} />
      case 'sms': return <Smartphone size={14} />
      case 'push': return <Bell size={14} />
      case 'in_app': return <Globe size={14} />
      default: return <MessageSquare size={14} />
    }
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-title">
              <Bell size={32} />
              <div>
                <h1>Gestione Notifiche</h1>
                <p>Caricamento sistema notifiche...</p>
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
            <Bell size={32} />
            <div>
              <h1>Gestione Notifiche</h1>
              <p>Sistema di comunicazione multi-canale - {notifications.length} notifiche</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Nuova Notifica
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} />
          Notifiche
        </button>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <MessageSquare size={16} />
          Template
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Target size={16} />
          Analytics
        </button>
      </div>

      {/* Quick Stats */}
      <div className="dashboard-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        padding: '0'
      }}>
        <div className="stat-card">
          <div className="stat-icon primary">
            <Send size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {notifications.filter(n => n.status === 'sent').length}
            </div>
            <div className="stat-label">Inviate Oggi</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {notifications.filter(n => n.status === 'scheduled').length}
            </div>
            <div className="stat-label">Programmate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <Eye size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {Math.round(notifications.filter(n => n.open_rate).reduce((acc, n) => acc + (n.open_rate || 0), 0) / notifications.filter(n => n.open_rate).length) || 0}%
            </div>
            <div className="stat-label">Tasso Apertura</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {notifications.reduce((acc, n) => acc + n.recipients_count, 0).toLocaleString()}
            </div>
            <div className="stat-label">Destinatari Totali</div>
          </div>
        </div>
      </div>

      {activeTab === 'notifications' && (
        <div className="dashboard-section">
          {/* Filters */}
          <div className="section-toolbar">
            <div className="toolbar-filters">
              <div className="search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Cerca notifiche..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-select"
              >
                <option value="all">Tutti i Tipi</option>
                <option value="info">Info</option>
                <option value="success">Successo</option>
                <option value="warning">Warning</option>
                <option value="error">Errore</option>
                <option value="system">Sistema</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select"
              >
                <option value="all">Tutti gli Stati</option>
                <option value="draft">Bozza</option>
                <option value="scheduled">Programmate</option>
                <option value="sent">Inviate</option>
                <option value="failed">Fallite</option>
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div key={notification.id} className="notification-card">
                <div className="notification-header">
                  <div className="notification-type" style={{ color: getTypeColor(notification.type) }}>
                    {getTypeIcon(notification.type)}
                    <span>{notification.type.toUpperCase()}</span>
                  </div>

                  <div className="notification-priority" style={{
                    backgroundColor: getPriorityColor(notification.priority),
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {notification.priority.toUpperCase()}
                  </div>

                  <div className="notification-status">
                    <span className={`status-badge ${notification.status}`}>
                      {notification.status === 'sent' && '✓ Inviata'}
                      {notification.status === 'scheduled' && '⏰ Programmata'}
                      {notification.status === 'draft' && '📝 Bozza'}
                      {notification.status === 'failed' && '❌ Fallita'}
                    </span>
                  </div>
                </div>

                <div className="notification-content">
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>

                  <div className="notification-meta">
                    <div className="meta-row">
                      <div className="meta-item">
                        <Users size={14} />
                        <span>{notification.recipients_count.toLocaleString()} destinatari</span>
                      </div>

                      <div className="meta-item">
                        <span>Canali:</span>
                        <div className="channels">
                          {notification.channels.map((channel) => (
                            <span key={channel} className="channel-badge">
                              {getChannelIcon(channel)}
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="meta-row">
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>
                          {notification.sent_at
                            ? `Inviata: ${formatDate(notification.sent_at)}`
                            : notification.scheduled_at
                            ? `Programmata: ${formatDate(notification.scheduled_at)}`
                            : `Creata: ${formatDate(notification.created_at)}`
                          }
                        </span>
                      </div>

                      {notification.open_rate && (
                        <div className="meta-item">
                          <Eye size={14} />
                          <span>Apertura: {notification.open_rate}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="notification-actions">
                  <button className="btn-icon">
                    <Eye size={16} />
                  </button>
                  <button className="btn-icon">
                    <Edit size={16} />
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

      {activeTab === 'templates' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Template Notifiche</h2>
            <button className="btn-primary">
              <Plus size={16} />
              Nuovo Template
            </button>
          </div>

          <div className="templates-grid">
            {templates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h3>{template.name}</h3>
                  <div className="template-type">{template.type}</div>
                </div>

                <div className="template-content">
                  <div className="template-subject">
                    <strong>Oggetto:</strong> {template.subject}
                  </div>
                  <div className="template-preview">
                    {template.content.substring(0, 100)}...
                  </div>

                  <div className="template-variables">
                    <strong>Variabili:</strong>
                    {template.variables.map((variable) => (
                      <span key={variable} className="variable-tag">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>

                  <div className="template-usage">
                    <Zap size={14} />
                    <span>Utilizzato {template.usage_count} volte</span>
                  </div>
                </div>

                <div className="template-actions">
                  <button className="btn-secondary">
                    <Eye size={16} />
                    Anteprima
                  </button>
                  <button className="btn-secondary">
                    <Edit size={16} />
                    Modifica
                  </button>
                  <button className="btn-primary">
                    <Send size={16} />
                    Usa Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Analytics Notifiche</h2>
          </div>

          <div className="analytics-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            <div className="analytics-card">
              <h3>Performance per Canale</h3>
              <div className="channel-stats">
                <div className="channel-stat">
                  <Mail size={16} />
                  <span>Email: 72% apertura</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: '72%' }}></div>
                  </div>
                </div>
                <div className="channel-stat">
                  <Smartphone size={16} />
                  <span>SMS: 95% apertura</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: '95%' }}></div>
                  </div>
                </div>
                <div className="channel-stat">
                  <Bell size={16} />
                  <span>Push: 58% apertura</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: '58%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h3>Engagement per Tipo</h3>
              <div className="type-stats">
                <div className="type-stat success">
                  <CheckCircle size={16} />
                  <span>Welcome: 89% click rate</span>
                </div>
                <div className="type-stat warning">
                  <AlertTriangle size={16} />
                  <span>Alerts: 65% click rate</span>
                </div>
                <div className="type-stat info">
                  <Info size={16} />
                  <span>Updates: 34% click rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsDashboard