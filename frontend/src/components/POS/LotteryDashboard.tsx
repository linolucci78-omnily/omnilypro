import React, { useState, useEffect } from 'react'
import { Ticket, Plus, Calendar, Trophy, Users, DollarSign, Play, Eye, Edit, Trash2, ExternalLink, Radio } from 'lucide-react'
import { lotteryService, LotteryEvent } from '../../services/lotteryService'
import { supabase } from '../../lib/supabase'
import './LotteryDashboard.css'

interface LotteryDashboardProps {
  organizationId: string
  onOpenTicketSale?: () => void
}

/**
 * Lottery Dashboard Component
 * Manage lottery events, view stats, and control extractions
 */
export const LotteryDashboard: React.FC<LotteryDashboardProps> = ({
  organizationId,
  onOpenTicketSale
}) => {
  const [events, setEvents] = useState<LotteryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'past'>('active')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Load events
  useEffect(() => {
    loadEvents()
  }, [organizationId])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await lotteryService.getEvents(organizationId)
      setEvents(data)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter events based on active tab
  const filteredEvents = events.filter(event => {
    if (activeTab === 'active') return event.status === 'active'
    if (activeTab === 'past') return event.status === 'extracted' || event.status === 'closed'
    return true
  })

  const handleOpenDisplay = (eventId: string) => {
    const url = `/lottery/display/${eventId}`
    window.open(url, '_blank', 'fullscreen=yes')
  }

  const handleRemoteExtraction = async (event: LotteryEvent) => {
    if (!confirm(`Avviare l'estrazione REMOTA per "${event.name}"?\n\nAssicurati che il display sia aperto sullo schermo gigante!`)) return

    try {
      await supabase.from('lottery_extraction_commands').insert({
        event_id: event.id,
        organization_id: organizationId,
        command: 'START_EXTRACTION',
        status: 'pending'
      })

      alert('✅ Comando inviato! L\'estrazione sta partendo sul display!')
      loadEvents()
    } catch (error: any) {
      alert(`Errore: ${error.message}`)
    }
  }

  const handlePerformExtraction = async (event: LotteryEvent) => {
    if (!confirm(`Eseguire l'estrazione per "${event.name}"?`)) return

    try {
      const result = await lotteryService.performExtraction({
        eventId: event.id,
        organizationId
      })

      alert(`🎉 Vincitore: ${result.winner.customer_name}\nBiglietto: ${result.winner.ticket_number}`)
      loadEvents() // Reload to show updated status
    } catch (error: any) {
      alert(`Errore: ${error.message}`)
    }
  }

  return (
    <div className="lottery-dashboard">
      {/* Header */}
      <div className="lottery-header">
        <div className="header-title">
          <Ticket className="w-8 h-8" />
          <h1>Gestione Lotterie</h1>
        </div>
        <div className="header-actions">
          <button
            onClick={() => onOpenTicketSale?.()}
            className="btn-primary"
          >
            <Ticket className="w-5 h-5" />
            Vendi Biglietto
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-success"
          >
            <Plus className="w-5 h-5" />
            Nuovo Evento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="lottery-tabs">
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Play className="w-4 h-4" />
          Eventi Attivi
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Calendar className="w-4 h-4" />
          Tutti
        </button>
        <button
          className={`tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          <Trophy className="w-4 h-4" />
          Completati
        </button>
      </div>

      {/* Events List */}
      <div className="events-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Caricamento eventi...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <Ticket className="w-16 h-16 opacity-20" />
            <h3>Nessun evento {activeTab === 'active' ? 'attivo' : ''}</h3>
            <p>Crea un nuovo evento lotteria per iniziare!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              Crea Evento
            </button>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onOpenDisplay={handleOpenDisplay}
                onPerformExtraction={handlePerformExtraction}
                onRemoteExtraction={handleRemoteExtraction}
                onRefresh={loadEvents}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateEventModal
          organizationId={organizationId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            loadEvents()
          }}
        />
      )}
    </div>
  )
}

/**
 * Event Card Component
 */
const EventCard: React.FC<{
  event: LotteryEvent
  onOpenDisplay: (id: string) => void
  onPerformExtraction: (event: LotteryEvent) => void
  onRemoteExtraction: (event: LotteryEvent) => void
  onRefresh: () => void
}> = ({ event, onOpenDisplay, onPerformExtraction, onRemoteExtraction, onRefresh }) => {
  const statusColors = {
    draft: '#6b7280',
    active: '#10b981',
    closed: '#f59e0b',
    extracted: '#ef4444'
  }

  const statusLabels = {
    draft: 'Bozza',
    active: 'Attivo',
    closed: 'Chiuso',
    extracted: 'Estratto'
  }

  return (
    <div
      className="event-card"
      style={{ borderTopColor: event.brand_colors?.primary || '#e74c3c' }}
    >
      {/* Header */}
      <div className="event-card-header">
        <h3>{event.name}</h3>
        <span
          className="status-badge"
          style={{ backgroundColor: statusColors[event.status] }}
        >
          {statusLabels[event.status]}
        </span>
      </div>

      {/* Description */}
      {event.description && (
        <p className="event-description">{event.description}</p>
      )}

      {/* Prize */}
      {event.prize_name && (
        <div className="event-prize">
          <Trophy className="w-4 h-4" />
          <span>{event.prize_name}</span>
          {event.prize_value && (
            <span className="prize-value">€{event.prize_value.toFixed(2)}</span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="event-stats">
        <div className="stat">
          <Users className="w-4 h-4" />
          <span>{event.total_tickets_sold} biglietti</span>
        </div>
        <div className="stat">
          <DollarSign className="w-4 h-4" />
          <span>€{event.total_revenue.toFixed(2)}</span>
        </div>
        <div className="stat">
          <Ticket className="w-4 h-4" />
          <span>€{event.ticket_price.toFixed(2)}/cad</span>
        </div>
      </div>

      {/* Dates */}
      <div className="event-dates">
        <div className="date-info">
          <Calendar className="w-4 h-4" />
          <span>Estrazione: {new Date(event.extraction_date).toLocaleDateString('it-IT')}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="event-actions">
        <button
          onClick={() => onOpenDisplay(event.id)}
          className="btn-secondary"
          title="Apri Display"
        >
          <ExternalLink className="w-4 h-4" />
          Display
        </button>

        {event.status === 'active' && (
          <>
            <button
              onClick={() => onRemoteExtraction(event)}
              className="btn-secondary"
              disabled={event.total_tickets_sold === 0}
              title="Estrazione Remota (via Display)"
            >
              <Radio className="w-4 h-4" />
              Remota
            </button>
            <button
              onClick={() => onPerformExtraction(event)}
              className="btn-primary"
              disabled={event.total_tickets_sold === 0}
              title="Esegui Estrazione"
            >
              <Play className="w-4 h-4" />
              Estrai
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Create Event Modal
 */
const CreateEventModal: React.FC<{
  organizationId: string
  onClose: () => void
  onCreated: () => void
}> = ({ organizationId, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventDate: new Date().toISOString().split('T')[0],
    extractionDate: '',
    ticketPrice: 5.0,
    prizeName: '',
    prizeValue: 0,
    prizeDescription: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.extractionDate) {
      alert('Compila i campi obbligatori')
      return
    }

    try {
      setSaving(true)
      await lotteryService.createEvent({
        organization_id: organizationId,
        name: formData.name,
        description: formData.description || undefined,
        event_date: new Date(formData.eventDate).toISOString(),
        extraction_date: new Date(formData.extractionDate).toISOString(),
        ticket_price: formData.ticketPrice,
        prize_name: formData.prizeName || undefined,
        prize_value: formData.prizeValue > 0 ? formData.prizeValue : undefined,
        prize_description: formData.prizeDescription || undefined,
        brand_colors: {
          primary: '#dc2626',
          secondary: '#991b1b',
          accent: '#fbbf24'
        },
        status: 'active'
      })

      onCreated()
    } catch (error) {
      console.error('Failed to create event:', error)
      alert('Errore durante la creazione dell\'evento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuovo Evento Lotteria</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-event-form">
          <div className="form-group">
            <label>Nome Evento *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Es: Gran Lotteria di Natale"
              required
            />
          </div>

          <div className="form-group">
            <label>Descrizione</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrizione dell'evento..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data Evento</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Data Estrazione *</label>
              <input
                type="datetime-local"
                value={formData.extractionDate}
                onChange={(e) => setFormData({ ...formData, extractionDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Prezzo Biglietto (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.ticketPrice}
              onChange={(e) => setFormData({ ...formData, ticketPrice: parseFloat(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label>Nome Premio</label>
            <input
              type="text"
              value={formData.prizeName}
              onChange={(e) => setFormData({ ...formData, prizeName: e.target.value })}
              placeholder="Es: iPhone 15 Pro Max"
            />
          </div>

          <div className="form-group">
            <label>Valore Premio (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.prizeValue}
              onChange={(e) => setFormData({ ...formData, prizeValue: parseFloat(e.target.value) })}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Annulla
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creazione...' : 'Crea Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LotteryDashboard
