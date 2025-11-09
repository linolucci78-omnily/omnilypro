import React, { useState, useEffect } from 'react'
import { Ticket, Filter, Search, AlertCircle, Clock, CheckCircle2, MessageSquare } from 'lucide-react'
import { supportTicketsApi, ticketMessagesApi, SupportTicket, TicketMessage, supabase } from '../lib/supabase'
import TicketDetailModal from './TicketDetailModal'
import './AdminTicketsPanel.css'

interface AdminTicketsPanelProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'waiting_reply' | 'resolved' | 'closed'
type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'urgent'
type CategoryFilter = 'all' | 'general' | 'technical' | 'billing' | 'feature_request'

const AdminTicketsPanel: React.FC<AdminTicketsPanelProps> = ({
  organizationId,
  primaryColor,
  secondaryColor
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Carica tutti i ticket (admin vede tutti, organization vede solo i suoi)
  const loadTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      // Se organizationId è "all", carica TUTTI i ticket (per admin)
      // Altrimenti carica solo quelli dell'organizzazione specifica
      const data = organizationId === 'all'
        ? await supportTicketsApi.getAll()
        : await supportTicketsApi.getByOrganization(organizationId)

      setTickets(data)
      setFilteredTickets(data)
    } catch (err) {
      console.error('Error loading tickets:', err)
      setError('Errore nel caricamento dei ticket')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()

    // Realtime subscription per nuovi ticket e aggiornamenti
    const channel = supabase
      .channel('support-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Ascolta INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'support_tickets'
        },
        (payload) => {
          console.log('🔔 Ticket cambiato:', payload)

          if (payload.eventType === 'INSERT') {
            // Nuovo ticket creato - ricarica per ottenere anche il nome org
            loadTickets()
          } else if (payload.eventType === 'UPDATE') {
            // Ticket aggiornato - ricarica per aggiornare i dati
            loadTickets()
          } else if (payload.eventType === 'DELETE') {
            // Ticket eliminato - rimuovi dalla lista
            setTickets((prev) => prev.filter(t => t.id !== payload.old.id))
            setFilteredTickets((prev) => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  // Applica filtri
  useEffect(() => {
    let filtered = [...tickets]

    // Filtro ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ticket =>
        ticket.ticket_number.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query)
      )
    }

    // Filtro stato
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter)
    }

    // Filtro priorità
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter)
    }

    // Filtro categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter)
    }

    setFilteredTickets(filtered)
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter])

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setShowDetailModal(true)
  }

  const handleTicketUpdate = async () => {
    await loadTickets()
    if (selectedTicket) {
      const updated = await supportTicketsApi.getById(selectedTicket.id)
      setSelectedTicket(updated)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#65a30d'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle size={16} />
      case 'in_progress': return <Clock size={16} />
      case 'waiting_reply': return <MessageSquare size={16} />
      case 'resolved': return <CheckCircle2 size={16} />
      case 'closed': return <CheckCircle2 size={16} />
      default: return <Ticket size={16} />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aperto'
      case 'in_progress': return 'In Lavorazione'
      case 'waiting_reply': return 'In Attesa Risposta'
      case 'resolved': return 'Risolto'
      case 'closed': return 'Chiuso'
      default: return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Bassa'
      case 'medium': return 'Media'
      case 'high': return 'Alta'
      case 'urgent': return 'Urgente'
      default: return priority
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return 'Generale'
      case 'technical': return 'Tecnico'
      case 'billing': return 'Fatturazione'
      case 'feature_request': return 'Richiesta Funzionalità'
      default: return category
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="admin-tickets-panel" style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor } as React.CSSProperties}>
        <div className="admin-tickets-loading">
          <div className="spinner"></div>
          <p>Caricamento ticket...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-tickets-panel" style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor } as React.CSSProperties}>
        <div className="admin-tickets-error">
          <AlertCircle size={48} />
          <p>{error}</p>
          <button className="btn-retry" onClick={loadTickets}>Riprova</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="admin-tickets-panel"
      style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor } as React.CSSProperties}
    >
      {/* Header */}
      <div className="admin-tickets-header">
        <div className="header-title">
          <Ticket size={32} />
          <div>
            <h1>Gestione Ticket di Supporto</h1>
            <p>Visualizza e gestisci tutte le richieste di supporto</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">Totali</span>
            <span className="stat-value">{tickets.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Aperti</span>
            <span className="stat-value">{tickets.filter(t => t.status === 'open').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">In Lavorazione</span>
            <span className="stat-value">{tickets.filter(t => t.status === 'in_progress').length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-tickets-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca per numero ticket, oggetto o descrizione..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="all">Tutti gli stati</option>
            <option value="open">Aperto</option>
            <option value="in_progress">In Lavorazione</option>
            <option value="waiting_reply">In Attesa Risposta</option>
            <option value="resolved">Risolto</option>
            <option value="closed">Chiuso</option>
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}>
            <option value="all">Tutte le priorità</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Bassa</option>
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}>
            <option value="all">Tutte le categorie</option>
            <option value="general">Generale</option>
            <option value="technical">Tecnico</option>
            <option value="billing">Fatturazione</option>
            <option value="feature_request">Richiesta Funzionalità</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="admin-tickets-list">
        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <Ticket size={64} />
            <p>Nessun ticket trovato</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`ticket-card status-${ticket.status}`}
              onClick={() => handleTicketClick(ticket)}
            >
              <div className="ticket-card-header">
                <div className="ticket-number">
                  <Ticket size={18} />
                  <span>{ticket.ticket_number}</span>
                </div>
                <div className="ticket-badges">
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                  >
                    {getPriorityLabel(ticket.priority)}
                  </span>
                  <span className={`status-badge status-${ticket.status}`}>
                    {getStatusIcon(ticket.status)}
                    {getStatusLabel(ticket.status)}
                  </span>
                </div>
              </div>

              <div className="ticket-card-body">
                <h3>{ticket.subject}</h3>
                <p className="ticket-description">{ticket.description}</p>
                <div className="ticket-meta">
                  <span className="category-tag">{getCategoryLabel(ticket.category)}</span>
                  {ticket.organization_name && (
                    <span className="organization-tag">
                      <span style={{ fontWeight: 600 }}>Da:</span> {ticket.organization_name}
                    </span>
                  )}
                  <span className="ticket-date">Creato: {formatDate(ticket.created_at)}</span>
                  {ticket.updated_at !== ticket.created_at && (
                    <span className="ticket-date">Aggiornato: {formatDate(ticket.updated_at)}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          organizationId={organizationId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedTicket(null)
          }}
          onUpdate={handleTicketUpdate}
          isAdmin={organizationId === 'all'} // Se organizationId è 'all' = Admin, altrimenti = Organizzazione
        />
      )}
    </div>
  )
}

export default AdminTicketsPanel
