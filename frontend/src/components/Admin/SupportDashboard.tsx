import React, { useState, useEffect } from 'react'
import {
  HelpCircle,
  MessageSquare,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  Paperclip,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Archive,
  Star,
  Calendar,
  Tag,
  Building2,
  Mail,
  Phone,
  FileText,
  Download,
  Upload,
  BookOpen,
  Package,
  CreditCard,
  Gift
} from 'lucide-react'
import PageLoader from '../UI/PageLoader'
import './AdminLayout.css'

interface SupportTicket {
  id: string
  number: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  customer_name: string
  customer_email: string
  organization_name: string
  assigned_to?: string
  created_at: string
  updated_at: string
  last_response_at: string
  response_time?: number
  resolution_time?: number
  satisfaction_rating?: number
  tags: string[]
  attachment_count: number
}

interface TicketMessage {
  id: string
  ticket_id: string
  sender_type: 'customer' | 'agent' | 'system'
  sender_name: string
  message: string
  created_at: string
  attachments: string[]
  is_internal: boolean
}

interface SupportAgent {
  id: string
  name: string
  email: string
  status: 'online' | 'away' | 'offline'
  active_tickets: number
  total_tickets: number
  avg_response_time: number
  satisfaction_rating: number
}

const SupportDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [agents, setAgents] = useState<SupportAgent[]>([])
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tickets' | 'agents' | 'reports' | 'docs'>('tickets')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Mock data
  const mockTickets: SupportTicket[] = [
    {
      id: '1',
      number: 'TICKET-2025-001',
      subject: 'Problema configurazione Z108',
      description: 'Il terminale Z108 non si connette al WiFi della sede. Ho provato a riavviare ma persiste il problema.',
      status: 'open',
      priority: 'high',
      category: 'Hardware',
      customer_name: 'Mario Rossi',
      customer_email: 'mario.rossi@caffedelcentro.it',
      organization_name: 'Caffè del Centro',
      assigned_to: 'Agent Tech',
      created_at: '2025-01-15T09:30:00Z',
      updated_at: '2025-01-15T10:15:00Z',
      last_response_at: '2025-01-15T10:15:00Z',
      tags: ['hardware', 'z108', 'wifi'],
      attachment_count: 2
    },
    {
      id: '2',
      number: 'TICKET-2025-002',
      subject: 'Richiesta attivazione piano Pro',
      description: 'Vorrei fare l\'upgrade dal piano Basic al piano Pro per la mia attività.',
      status: 'in_progress',
      priority: 'medium',
      category: 'Billing',
      customer_name: 'Anna Bianchi',
      customer_email: 'anna@fashionstore.it',
      organization_name: 'Fashion Store Milano',
      assigned_to: 'Agent Sales',
      created_at: '2025-01-15T08:45:00Z',
      updated_at: '2025-01-15T09:20:00Z',
      last_response_at: '2025-01-15T09:20:00Z',
      response_time: 25,
      tags: ['billing', 'upgrade', 'pro'],
      attachment_count: 0
    },
    {
      id: '3',
      number: 'TICKET-2025-003',
      subject: 'Bug nell\'app: punti non calcolati',
      description: 'I punti fedeltà non vengono calcolati correttamente dopo l\'ultimo aggiornamento.',
      status: 'resolved',
      priority: 'urgent',
      category: 'Bug Report',
      customer_name: 'Luca Verdi',
      customer_email: 'luca@pizzeriaroma.it',
      organization_name: 'Pizzeria Roma',
      assigned_to: 'Agent Dev',
      created_at: '2025-01-14T16:20:00Z',
      updated_at: '2025-01-15T11:30:00Z',
      last_response_at: '2025-01-15T11:30:00Z',
      response_time: 15,
      resolution_time: 1150,
      satisfaction_rating: 5,
      tags: ['bug', 'points', 'loyalty'],
      attachment_count: 1
    }
  ]

  const mockAgents: SupportAgent[] = [
    {
      id: '1',
      name: 'Agent Tech',
      email: 'tech@omnily.com',
      status: 'online',
      active_tickets: 12,
      total_tickets: 156,
      avg_response_time: 18,
      satisfaction_rating: 4.8
    },
    {
      id: '2',
      name: 'Agent Sales',
      email: 'sales@omnily.com',
      status: 'online',
      active_tickets: 8,
      total_tickets: 203,
      avg_response_time: 12,
      satisfaction_rating: 4.9
    },
    {
      id: '3',
      name: 'Agent Dev',
      email: 'dev@omnily.com',
      status: 'away',
      active_tickets: 5,
      total_tickets: 89,
      avg_response_time: 35,
      satisfaction_rating: 4.7
    }
  ]

  const mockMessages: TicketMessage[] = [
    {
      id: '1',
      ticket_id: '1',
      sender_type: 'customer',
      sender_name: 'Mario Rossi',
      message: 'Il terminale Z108 non si connette al WiFi della sede. Ho provato a riavviare ma persiste il problema.',
      created_at: '2025-01-15T09:30:00Z',
      attachments: ['screenshot_error.png', 'log_file.txt'],
      is_internal: false
    },
    {
      id: '2',
      ticket_id: '1',
      sender_type: 'agent',
      sender_name: 'Agent Tech',
      message: 'Ciao Mario, grazie per la segnalazione. Potresti verificare se il WiFi supporta WPA2? Il Z108 richiede questa configurazione.',
      created_at: '2025-01-15T10:15:00Z',
      attachments: [],
      is_internal: false
    }
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setTickets(mockTickets)
      setAgents(mockAgents)
      setMessages(mockMessages)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#3B82F6'
      case 'in_progress': return '#F59E0B'
      case 'pending_customer': return '#8B5CF6'
      case 'resolved': return '#10B981'
      case 'closed': return '#6B7280'
      default: return '#6B7280'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <MessageSquare size={16} />
      case 'in_progress': return <Clock size={16} />
      case 'pending_customer': return <User size={16} />
      case 'resolved': return <CheckCircle size={16} />
      case 'closed': return <XCircle size={16} />
      default: return <MessageSquare size={16} />
    }
  }

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10B981'
      case 'away': return '#F59E0B'
      case 'offline': return '#6B7280'
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return <PageLoader message="Caricamento sistema support..." size="medium" />
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <HelpCircle size={32} />
            <div>
              <h1>Support Center</h1>
              <p>Sistema di gestione ticket e supporto clienti - {tickets.length} ticket attivi</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              <Download size={16} />
              Esporta Report
            </button>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Nuovo Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="dashboard-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '1rem',
        padding: '0'
      }}>
        <div className="stat-card">
          <div className="stat-icon primary">
            <MessageSquare size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {tickets.filter(t => t.status === 'open').length}
            </div>
            <div className="stat-label">Aperti</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {tickets.filter(t => t.status === 'in_progress').length}
            </div>
            <div className="stat-label">In Corso</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {tickets.filter(t => t.status === 'resolved').length}
            </div>
            <div className="stat-label">Risolti</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon danger">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length}
            </div>
            <div className="stat-label">Priorità Alta</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <User size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {agents.filter(a => a.status === 'online').length}
            </div>
            <div className="stat-label">Agent Online</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <MessageSquare size={16} />
          Ticket
        </button>
        <button
          className={`tab ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          <User size={16} />
          Agent
        </button>
        <button
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={16} />
          Report
        </button>
        <button
          className={`tab ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <BookOpen size={16} />
          Documentazione
        </button>
      </div>

      {activeTab === 'tickets' && (
        <div className="dashboard-section">
          {/* Filters */}
          <div className="section-toolbar">
            <div className="toolbar-filters">
              <div className="search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Cerca ticket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select"
              >
                <option value="all">Tutti gli Stati</option>
                <option value="open">Aperti</option>
                <option value="in_progress">In Corso</option>
                <option value="pending_customer">In Attesa Cliente</option>
                <option value="resolved">Risolti</option>
                <option value="closed">Chiusi</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="form-select"
              >
                <option value="all">Tutte le Priorità</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Bassa</option>
              </select>

              <button className="btn-secondary">
                <Filter size={16} />
                Filtri Avanzati
              </button>
            </div>
          </div>

          {/* Tickets List */}
          <div className="tickets-list">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`ticket-card ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="ticket-header">
                  <div className="ticket-number">
                    <span className="number">{ticket.number}</span>
                    <div className="ticket-status">
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(ticket.status),
                          color: 'white'
                        }}
                      >
                        {getStatusIcon(ticket.status)}
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span
                        className="priority-badge"
                        style={{
                          backgroundColor: getPriorityColor(ticket.priority),
                          color: 'white'
                        }}
                      >
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="ticket-meta">
                    <span className="category">{ticket.category}</span>
                    <span className="created-at">{formatDate(ticket.created_at)}</span>
                  </div>
                </div>

                <div className="ticket-content">
                  <h3>{ticket.subject}</h3>
                  <p>{ticket.description.substring(0, 120)}...</p>

                  <div className="ticket-customer">
                    <div className="customer-info">
                      <Building2 size={14} />
                      <span>{ticket.organization_name}</span>
                      <User size={14} />
                      <span>{ticket.customer_name}</span>
                    </div>

                    {ticket.assigned_to && (
                      <div className="assigned-to">
                        <span>Assegnato a: {ticket.assigned_to}</span>
                      </div>
                    )}
                  </div>

                  <div className="ticket-tags">
                    {ticket.tags.map((tag) => (
                      <span key={tag} className="tag">
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                    {ticket.attachment_count > 0 && (
                      <span className="attachment-count">
                        <Paperclip size={12} />
                        {ticket.attachment_count}
                      </span>
                    )}
                  </div>
                </div>

                <div className="ticket-actions">
                  <button className="btn-icon">
                    <Eye size={16} />
                  </button>
                  <button className="btn-icon">
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon">
                    <Archive size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Ticket Detail Panel */}
          {selectedTicket && (
            <div className="ticket-detail-panel">
              <div className="panel-header">
                <h2>{selectedTicket.subject}</h2>
                <div className="panel-actions">
                  <button className="btn-secondary">
                    <Send size={16} />
                    Rispondi
                  </button>
                  <button className="btn-primary">
                    Risolvi Ticket
                  </button>
                </div>
              </div>

              <div className="panel-content">
                <div className="ticket-info">
                  <div className="info-group">
                    <label>Cliente:</label>
                    <span>{selectedTicket.customer_name} ({selectedTicket.customer_email})</span>
                  </div>
                  <div className="info-group">
                    <label>Azienda:</label>
                    <span>{selectedTicket.organization_name}</span>
                  </div>
                  <div className="info-group">
                    <label>Categoria:</label>
                    <span>{selectedTicket.category}</span>
                  </div>
                  {selectedTicket.response_time && (
                    <div className="info-group">
                      <label>Tempo di Risposta:</label>
                      <span>{formatDuration(selectedTicket.response_time)}</span>
                    </div>
                  )}
                </div>

                <div className="ticket-messages">
                  {messages
                    .filter(m => m.ticket_id === selectedTicket.id)
                    .map((message) => (
                      <div
                        key={message.id}
                        className={`message ${message.sender_type}`}
                      >
                        <div className="message-header">
                          <span className="sender">{message.sender_name}</span>
                          <span className="timestamp">{formatDate(message.created_at)}</span>
                        </div>
                        <div className="message-content">
                          <p>{message.message}</p>
                          {message.attachments.length > 0 && (
                            <div className="attachments">
                              {message.attachments.map((file) => (
                                <span key={file} className="attachment">
                                  <Paperclip size={12} />
                                  {file}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Team Support</h2>
            <button className="btn-primary">
              <Plus size={16} />
              Nuovo Agent
            </button>
          </div>

          <div className="agents-grid">
            {agents.map((agent) => (
              <div key={agent.id} className="agent-card">
                <div className="agent-header">
                  <div className="agent-info">
                    <h3>{agent.name}</h3>
                    <span className="agent-email">{agent.email}</span>
                  </div>
                  <div
                    className="agent-status"
                    style={{
                      backgroundColor: getAgentStatusColor(agent.status),
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {agent.status.toUpperCase()}
                  </div>
                </div>

                <div className="agent-stats">
                  <div className="stat">
                    <span className="label">Ticket Attivi:</span>
                    <span className="value">{agent.active_tickets}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Ticket Totali:</span>
                    <span className="value">{agent.total_tickets}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Tempo Medio Risposta:</span>
                    <span className="value">{formatDuration(agent.avg_response_time)}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Rating Soddisfazione:</span>
                    <span className="value">
                      <Star size={12} />
                      {agent.satisfaction_rating}/5
                    </span>
                  </div>
                </div>

                <div className="agent-actions">
                  <button className="btn-secondary">
                    <MessageSquare size={16} />
                    Assegna Ticket
                  </button>
                  <button className="btn-secondary">
                    <Eye size={16} />
                    Dettagli
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Report Support</h2>
            <button className="btn-primary">
              <Download size={16} />
              Genera Report
            </button>
          </div>

          <div className="reports-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            <div className="report-card">
              <h3>Performance Team</h3>
              <div className="chart-placeholder">
                <User size={48} />
                <p>Grafico performance team support</p>
              </div>
            </div>

            <div className="report-card">
              <h3>Tempo di Risoluzione</h3>
              <div className="chart-placeholder">
                <Clock size={48} />
                <p>Grafico tempi di risoluzione ticket</p>
              </div>
            </div>

            <div className="report-card">
              <h3>Soddisfazione Clienti</h3>
              <div className="chart-placeholder">
                <Star size={48} />
                <p>Grafico rating soddisfazione</p>
              </div>
            </div>

            <div className="report-card">
              <h3>Volume Ticket per Categoria</h3>
              <div className="chart-placeholder">
                <MessageSquare size={48} />
                <p>Grafico distribuzione categorie</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Documentazione Componenti</h2>
            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
              Guide dettagliate per l'utilizzo dei vari componenti di Omnily
            </p>
          </div>

          <div className="docs-container" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem',
            marginTop: '1.5rem'
          }}>

            {/* Membership Guide */}
            <div className="doc-card" style={{
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Package size={32} />
              </div>

              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
                Sistema Membership
              </h3>

              <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '1rem' }}>
                Sistema completo per la gestione di membership e abbonamenti dei clienti.
              </p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Check size={16} style={{ color: '#10b981', marginTop: '0.25rem', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    <strong>Crea Template:</strong> Definisci diversi tipi di membership (mensile, annuale, pacchetti)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Check size={16} style={{ color: '#10b981', marginTop: '0.25rem', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    <strong>Vendi Membership:</strong> Associa membership ai clienti con codice univoco
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Check size={16} style={{ color: '#10b981', marginTop: '0.25rem', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    <strong>Valida Utilizzo:</strong> Scansiona QR code o inserisci manualmente il codice
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Check size={16} style={{ color: '#10b981', marginTop: '0.25rem', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    <strong>Monitora Statistiche:</strong> Visualizza ricavi, utilizzi e membership in scadenza
                  </span>
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#fef3f2',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#991b1b'
              }}>
                <strong>Nota:</strong> I limiti giornalieri si resettano automaticamente a mezzanotte
              </div>
            </div>

            {/* Gift Certificates - Coming Soon */}
            <div className="doc-card" style={{
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              opacity: 0.6
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Gift size={32} />
              </div>

              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
                Gift Certificates
              </h3>

              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                Documentazione completa per la gestione dei buoni regalo digitali.
              </p>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                In arrivo...
              </div>
            </div>

            {/* Payment System - Coming Soon */}
            <div className="doc-card" style={{
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              opacity: 0.6
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <CreditCard size={32} />
              </div>

              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
                Sistema Pagamenti
              </h3>

              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                Guida all'integrazione e gestione dei metodi di pagamento.
              </p>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                In arrivo...
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default SupportDashboard