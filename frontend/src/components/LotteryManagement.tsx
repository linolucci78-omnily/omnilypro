import React, { useState, useEffect } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Search,
  Calendar,
  Ticket,
  Trophy,
  DollarSign,
  Users,
  Play,
  ExternalLink,
  Radio,
  AlertCircle,
  CheckCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Tag,
  Gift,
  CircleDollarSign,
  List,
  Mail,
  Phone,
  User,
  Printer
} from 'lucide-react'
import { lotteryService, LotteryEvent, LotteryTicket } from '../services/lotteryService'
import { ZCSPrintService } from '../services/printService'
import { supabase } from '../lib/supabase'
import { LotteryTicketSaleInline } from './POS/LotteryTicketSaleInline'
import './LotteryManagement.css'

interface LotteryManagementProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
  staffId?: string
  staffName?: string
}

interface EventFormData {
  name: string
  description: string
  eventDate: string
  extractionDate: string
  ticketPrice: number
  prizeName: string
  prizeValue: number
  prizeDescription: string
  status: 'draft' | 'active' | 'closed' | 'extracted'
}

const LotteryManagement: React.FC<LotteryManagementProps> = ({
  organizationId,
  primaryColor,
  secondaryColor,
  staffId,
  staffName
}) => {
  const [events, setEvents] = useState<LotteryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showTicketSale, setShowTicketSale] = useState(false)
  const [editingEvent, setEditingEvent] = useState<LotteryEvent | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'closed' | 'extracted'>('all')
  const [validationError, setValidationError] = useState<string>('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Tickets view
  const [viewingTicketsEventId, setViewingTicketsEventId] = useState<string | null>(null)
  const [eventTickets, setEventTickets] = useState<LotteryTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [ticketSearchTerm, setTicketSearchTerm] = useState('')

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    eventDate: new Date().toISOString().split('T')[0],
    extractionDate: (() => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(18, 0, 0, 0)
      return tomorrow.toISOString().slice(0, 16)
    })(),
    ticketPrice: 5.0,
    prizeName: '',
    prizeValue: 0,
    prizeDescription: '',
    status: 'active'
  })

  useEffect(() => {
    fetchEvents()
  }, [organizationId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const allEvents = await lotteryService.getEvents(organizationId)

      // Recalculate totals for each event to ensure accuracy
      for (const event of allEvents) {
        await lotteryService.recalculateEventTotals(event.id)
      }

      // Fetch again after recalculation
      const updatedEvents = await lotteryService.getEvents(organizationId)
      setEvents(updatedEvents)
    } catch (error) {
      console.error('Error fetching lottery events:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(18, 0, 0, 0)

    setFormData({
      name: '',
      description: '',
      eventDate: new Date().toISOString().split('T')[0],
      extractionDate: tomorrow.toISOString().slice(0, 16),
      ticketPrice: 5.0,
      prizeName: '',
      prizeValue: 0,
      prizeDescription: '',
      status: 'active'
    })
    setEditingEvent(null)
    setValidationError('')
    setShowForm(false)
  }

  const handleOpenForm = (event?: LotteryEvent) => {
    // Close ticket sale form if open
    setShowTicketSale(false)

    if (event) {
      setEditingEvent(event)
      setFormData({
        name: event.name,
        description: event.description || '',
        eventDate: event.event_date.split('T')[0],
        extractionDate: event.extraction_date.split('T')[0] + 'T' + event.extraction_date.split('T')[1].substring(0, 5),
        ticketPrice: event.ticket_price,
        prizeName: event.prize_name || '',
        prizeValue: event.prize_value || 0,
        prizeDescription: event.prize_description || '',
        status: event.status
      })
    } else {
      resetForm()
    }
    setShowForm(true)
  }

  const handleOpenTicketSale = () => {
    // Close event form if open
    setShowForm(false)
    setShowTicketSale(true)
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setValidationError('Il nome dell\'evento è obbligatorio')
      return false
    }
    if (!formData.extractionDate) {
      setValidationError('La data di estrazione è obbligatoria')
      return false
    }
    if (formData.ticketPrice <= 0) {
      setValidationError('Il prezzo del biglietto deve essere maggiore di zero')
      return false
    }
    setValidationError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSaving(true)

      // Parse dates safely
      const eventDate = formData.eventDate ? new Date(formData.eventDate) : new Date()
      const extractionDate = new Date(formData.extractionDate)

      // Check if dates are valid
      if (isNaN(extractionDate.getTime())) {
        setValidationError('Data di estrazione non valida')
        setSaving(false)
        return
      }

      const eventData = {
        organization_id: organizationId,
        name: formData.name,
        description: formData.description || undefined,
        event_date: eventDate.toISOString(),
        extraction_date: extractionDate.toISOString(),
        ticket_price: formData.ticketPrice,
        prize_name: formData.prizeName || undefined,
        prize_value: formData.prizeValue > 0 ? formData.prizeValue : undefined,
        prize_description: formData.prizeDescription || undefined,
        brand_colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: '#fbbf24'
        },
        status: formData.status
      }

      if (editingEvent) {
        await lotteryService.updateEvent(editingEvent.id, eventData)
      } else {
        await lotteryService.createEvent(eventData)
      }

      await fetchEvents()
      resetForm()
    } catch (error) {
      console.error('Error saving event:', error)
      setValidationError('Errore durante il salvataggio dell\'evento')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id)
      setTimeout(() => setDeleteConfirmId(null), 3000)
      return
    }

    try {
      await lotteryService.deleteEvent(id)
      await fetchEvents()
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleOpenDisplay = (eventId: string) => {
    const url = `/lottery/display/${eventId}`
    window.open(url, '_blank', 'fullscreen=yes')
  }

  const handleViewTickets = async (eventId: string) => {
    try {
      setLoadingTickets(true)
      setViewingTicketsEventId(eventId)
      const tickets = await lotteryService.getEventTickets(eventId)
      setEventTickets(tickets)
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoadingTickets(false)
    }
  }

  const handleCloseTicketsView = () => {
    setViewingTicketsEventId(null)
    setEventTickets([])
    setTicketSearchTerm('')
  }

  const handlePrintTicket = async (ticket: LotteryTicket, event: LotteryEvent) => {
    try {
      // Create printer instance on the fly
      const printer = new ZCSPrintService({
        storeName: event.name,
        storeAddress: '',
        storePhone: '',
        storeTax: '',
        paperWidth: 384,
        fontSizeNormal: 24,
        fontSizeLarge: 30,
        printDensity: 3
      })

      const success = await printer.printLotteryTicket({
        eventName: event.name,
        ticketNumber: ticket.ticket_number,
        customerName: ticket.customer_name,
        customerEmail: ticket.customer_email,
        customerPhone: ticket.customer_phone,
        fortuneMessage: ticket.fortune_message,
        prizeName: event.prize_name,
        prizeValue: event.prize_value,
        extractionDate: event.extraction_date,
        pricePaid: ticket.price_paid,
        purchasedByStaff: ticket.purchased_by_staff_name,
        createdAt: ticket.created_at,
        qrCodeData: JSON.stringify({
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          eventId: event.id,
          eventName: event.name
        })
      })

      if (success) {
        alert('✅ Biglietto stampato con successo!')
      } else {
        alert('⚠️ Errore durante la stampa del biglietto')
      }
    } catch (error: any) {
      console.error('Errore stampa:', error)
      alert(`Errore durante la stampa: ${error.message}`)
    }
  }

  const handleDeleteTicket = async (ticketId: string, ticketNumber: string) => {
    if (!confirm(`Sei sicuro di voler eliminare il biglietto ${ticketNumber}?\n\nQuesta azione è irreversibile!`)) {
      return
    }

    try {
      // Delete ticket from database
      const { error } = await supabase
        .from('lottery_tickets')
        .delete()
        .eq('id', ticketId)

      if (error) throw error

      // Refresh tickets list
      if (viewingTicketsEventId) {
        await handleViewTickets(viewingTicketsEventId)
        // Refresh events to update totals
        await fetchEvents()
      }

      alert('✅ Biglietto eliminato con successo!')
    } catch (error: any) {
      alert(`Errore durante l'eliminazione: ${error.message}`)
    }
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
      await fetchEvents()
    } catch (error: any) {
      alert(`Errore: ${error.message}`)
    }
  }

  // Filtra eventi
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
      className="lottery-management"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="management-header">
        <div className="header-left">
          <div className="header-icon">
            <Ticket size={32} />
          </div>
          <div>
            <h1>Gestione Eventi Lotteria</h1>
            <p>Crea, modifica ed elimina eventi lotteria</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            onClick={handleOpenTicketSale}
            className="btn-secondary"
          >
            <Ticket size={20} />
            Vendi Biglietto
          </button>
          <button
            onClick={() => handleOpenForm()}
            className="btn-primary"
          >
            <Plus size={20} />
            Nuovo Evento
          </button>
        </div>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="inline-form-container">
          <div className="inline-form-header" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
            <h2>{editingEvent ? 'Modifica Evento' : 'Nuovo Evento'}</h2>
            <button onClick={resetForm} className="close-btn-inline">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="inline-form">
            {validationError && (
              <div className="error-banner">
                <AlertCircle size={20} />
                <span>{validationError}</span>
              </div>
            )}

            <div className="form-with-preview">
              {/* Preview Card */}
              <div className="event-preview-card">
                <h3>Anteprima Evento</h3>
                <div className="preview-ticket" style={{
                  background: `
                    linear-gradient(135deg,
                      ${primaryColor}20 0%,
                      ${primaryColor}40 50%,
                      ${secondaryColor}40 100%
                    ),
                    repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 10px,
                      rgba(255,255,255,0.03) 10px,
                      rgba(255,255,255,0.03) 20px
                    ),
                    linear-gradient(135deg, ${primaryColor}, ${secondaryColor})
                  `,
                  borderColor: primaryColor
                }}>
                  <div className="preview-ticket-header" style={{
                    background: `linear-gradient(180deg,
                      rgba(255,255,255,0.15) 0%,
                      rgba(255,255,255,0.05) 100%
                    )`
                  }}>
                    <Ticket size={32} />
                    <div className="preview-ticket-title">
                      {formData.name || 'Nome Evento'}
                    </div>
                  </div>

                  <div className="preview-ticket-body">
                    {formData.prizeName && (
                      <div className="preview-prize">
                        <Trophy size={20} />
                        <div>
                          <div className="preview-prize-name">{formData.prizeName}</div>
                          {formData.prizeValue > 0 && (
                            <div className="preview-prize-value">€{formData.prizeValue.toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="preview-info">
                      <div className="preview-info-row">
                        <Calendar size={16} />
                        <span>
                          {(() => {
                            if (!formData.extractionDate) return 'Data estrazione'
                            const date = new Date(formData.extractionDate)
                            return isNaN(date.getTime())
                              ? 'Data estrazione'
                              : date.toLocaleDateString('it-IT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                          })()}
                        </span>
                      </div>
                      <div className="preview-info-row">
                        <DollarSign size={16} />
                        <span>€{formData.ticketPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="preview-ticket-footer">
                    <span className={`preview-status preview-status-${formData.status}`}>
                      {formData.status === 'active' ? 'Attivo' : formData.status === 'draft' ? 'Bozza' : 'Chiuso'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="form-grid">
              <div className="form-group span-2">
                <label><Ticket size={18} /> Nome Evento *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Es: Gran Lotteria di Natale"
                  required
                />
              </div>

              <div className="form-group span-2">
                <label><FileText size={18} /> Descrizione</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrizione dell'evento..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label><Calendar size={18} /> Data Evento</label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label><Clock size={18} /> Data/Ora Estrazione *</label>
                <input
                  type="datetime-local"
                  value={formData.extractionDate}
                  onChange={(e) => setFormData({ ...formData, extractionDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label><Tag size={18} /> Prezzo Biglietto *</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.ticketPrice}
                    onChange={(e) => setFormData({ ...formData, ticketPrice: parseFloat(e.target.value) })}
                    required
                    className="input-with-prefix-field"
                  />
                </div>
              </div>

              <div className="form-group">
                <label><CheckCircle size={18} /> Stato</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as EventFormData['status'] })}
                >
                  <option value="draft">Bozza</option>
                  <option value="active">Attivo</option>
                  <option value="closed">Chiuso</option>
                </select>
              </div>

              <div className="form-divider span-2">Premio</div>

              <div className="form-group">
                <label><Trophy size={18} /> Nome Premio</label>
                <input
                  type="text"
                  value={formData.prizeName}
                  onChange={(e) => setFormData({ ...formData, prizeName: e.target.value })}
                  placeholder="Es: iPhone 15 Pro Max"
                />
              </div>

              <div className="form-group">
                <label><CircleDollarSign size={18} /> Valore Premio (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.prizeValue}
                  onChange={(e) => setFormData({ ...formData, prizeValue: parseFloat(e.target.value) })}
                />
              </div>

              <div className="form-group span-2">
                <label><Gift size={18} /> Descrizione Premio</label>
                <textarea
                  value={formData.prizeDescription}
                  onChange={(e) => setFormData({ ...formData, prizeDescription: e.target.value })}
                  placeholder="Dettagli sul premio..."
                  rows={2}
                />
              </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={resetForm} className="btn-cancel">
                Annulla
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? (
                  <>
                    <Loader className="spinner" size={20} />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {editingEvent ? 'Salva Modifiche' : 'Crea Evento'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket Sale Inline */}
      <LotteryTicketSaleInline
        isOpen={showTicketSale}
        onClose={() => setShowTicketSale(false)}
        organizationId={organizationId}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        staffId={staffId}
        staffName={staffName}
        onTicketSold={() => {
          fetchEvents() // Refresh events to update ticket counts
        }}
      />

      {/* Filters */}
      <div className="management-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca eventi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="status-filters">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tutti
          </button>
          <button
            className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Attivi
          </button>
          <button
            className={`filter-btn ${statusFilter === 'draft' ? 'active' : ''}`}
            onClick={() => setStatusFilter('draft')}
          >
            Bozze
          </button>
          <button
            className={`filter-btn ${statusFilter === 'closed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('closed')}
          >
            Chiusi
          </button>
          <button
            className={`filter-btn ${statusFilter === 'extracted' ? 'active' : ''}`}
            onClick={() => setStatusFilter('extracted')}
          >
            Estratti
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" size={48} />
          <p>Caricamento eventi...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state">
          <Ticket size={64} style={{ opacity: 0.3 }} />
          <h3>Nessun evento trovato</h3>
          <p>{searchTerm ? 'Prova a modificare i filtri di ricerca' : 'Crea il tuo primo evento lotteria!'}</p>
          <button
            onClick={() => handleOpenForm()}
            className="btn-primary"
          >
            <Plus size={20} />
            Crea Evento
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-card-header">
                <h3>{event.name}</h3>
                <span
                  className="status-badge"
                  style={{ backgroundColor: statusColors[event.status] }}
                >
                  {statusLabels[event.status]}
                </span>
              </div>

              {event.description && (
                <p className="event-description">{event.description}</p>
              )}

              {event.prize_name && (
                <div className="event-prize">
                  <Trophy size={18} />
                  <span>{event.prize_name}</span>
                  {event.prize_value && (
                    <span className="prize-value">€{event.prize_value.toFixed(2)}</span>
                  )}
                </div>
              )}

              <div className="event-stats">
                <div className="stat">
                  <Ticket size={18} />
                  <span>{event.total_tickets_sold} venduti</span>
                </div>
                <div className="stat">
                  <Gift size={18} style={{ color: '#f59e0b' }} />
                  <span>{event.total_complimentary_tickets || 0} omaggi</span>
                </div>
                <div className="stat">
                  <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#10b981' }}>€</span>
                  <span>{event.total_revenue.toFixed(2)}</span>
                </div>
              </div>

              <div className="event-dates">
                <Calendar size={16} />
                <span>Estrazione: {new Date(event.extraction_date).toLocaleDateString('it-IT')}</span>
              </div>

              <div className="event-actions">
                <button
                  onClick={() => handleViewTickets(event.id)}
                  className="btn-icon"
                  title="Vedi Biglietti"
                >
                  <List size={18} />
                </button>

                <button
                  onClick={() => handleOpenDisplay(event.id)}
                  className="btn-icon"
                  title="Apri Display"
                >
                  <ExternalLink size={18} />
                </button>

                {event.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleRemoteExtraction(event)}
                      className="btn-icon"
                      disabled={event.total_tickets_sold === 0}
                      title="Estrazione Remota"
                    >
                      <Radio size={18} />
                    </button>
                    <button
                      onClick={() => handlePerformExtraction(event)}
                      className="btn-icon btn-primary"
                      disabled={event.total_tickets_sold === 0}
                      title="Esegui Estrazione"
                    >
                      <Play size={18} />
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleOpenForm(event)}
                  className="btn-icon"
                  title="Modifica"
                >
                  <Edit2 size={18} />
                </button>

                <button
                  onClick={() => handleDelete(event.id)}
                  className={`btn-icon btn-danger ${deleteConfirmId === event.id ? 'confirm' : ''}`}
                  title={deleteConfirmId === event.id ? 'Clicca ancora per confermare' : 'Elimina'}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tickets View Modal */}
      {viewingTicketsEventId && (
        <div className="modal-overlay" onClick={handleCloseTicketsView}>
          <div className="tickets-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tickets-modal-header" style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
            }}>
              <h2>
                <List size={24} />
                Biglietti Venduti
              </h2>
              <button onClick={handleCloseTicketsView} className="close-btn">
                <X size={24} />
              </button>
            </div>

            <div className="tickets-modal-content">
              {loadingTickets ? (
                <div className="loading-state">
                  <Loader className="spinner" size={32} />
                  <p>Caricamento biglietti...</p>
                </div>
              ) : eventTickets.length === 0 ? (
                <div className="empty-state">
                  <Ticket size={48} style={{ opacity: 0.3 }} />
                  <h3>Nessun Biglietto Venduto</h3>
                  <p>Non ci sono ancora biglietti venduti per questo evento</p>
                </div>
              ) : (
                <div className="tickets-list">
                  {/* Summary Cards */}
                  <div className="tickets-summary">
                    <div className="summary-stat">
                      <Ticket size={28} />
                      <span>Totale Biglietti</span>
                      <strong>{eventTickets.length}</strong>
                    </div>
                    <div className="summary-stat">
                      <Ticket size={28} style={{ color: '#10b981' }} />
                      <span>Biglietti Venduti</span>
                      <strong>{eventTickets.filter(t => t.price_paid > 0).length}</strong>
                    </div>
                    <div className="summary-stat">
                      <Gift size={28} style={{ color: '#f59e0b' }} />
                      <span>Biglietti Omaggio</span>
                      <strong>{eventTickets.filter(t => t.price_paid === 0).length}</strong>
                    </div>
                    <div className="summary-stat">
                      <CircleDollarSign size={28} style={{ color: '#10b981' }} />
                      <span>Ricavi Totali</span>
                      <strong>€{eventTickets.reduce((sum, t) => sum + t.price_paid, 0).toFixed(2)}</strong>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="tickets-search-bar">
                    <Search size={20} />
                    <input
                      type="text"
                      placeholder="Cerca per numero biglietto, nome cliente, email o telefono..."
                      value={ticketSearchTerm}
                      onChange={(e) => setTicketSearchTerm(e.target.value)}
                      className="tickets-search-input"
                    />
                    {ticketSearchTerm && (
                      <button
                        onClick={() => setTicketSearchTerm('')}
                        className="search-clear-btn"
                        title="Cancella ricerca"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {/* Tickets Grid */}
                  {(() => {
                    // Get current event
                    const currentEvent = events.find(e => e.id === viewingTicketsEventId)

                    const filteredTickets = eventTickets.filter(ticket => {
                      if (!ticketSearchTerm) return true
                      const searchLower = ticketSearchTerm.toLowerCase()
                      return (
                        ticket.ticket_number.toLowerCase().includes(searchLower) ||
                        ticket.customer_name.toLowerCase().includes(searchLower) ||
                        ticket.customer_email?.toLowerCase().includes(searchLower) ||
                        ticket.customer_phone?.toLowerCase().includes(searchLower)
                      )
                    })

                    if (filteredTickets.length === 0) {
                      return (
                        <div className="empty-state" style={{ marginTop: '2rem' }}>
                          <Search size={48} style={{ opacity: 0.3 }} />
                          <h3>Nessun Risultato</h3>
                          <p>Nessun biglietto trovato per "{ticketSearchTerm}"</p>
                          <button
                            onClick={() => setTicketSearchTerm('')}
                            className="btn-secondary"
                            style={{ marginTop: '1rem' }}
                          >
                            Cancella Ricerca
                          </button>
                        </div>
                      )
                    }

                    return (
                      <div className="tickets-grid">
                        {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`ticket-card ${ticket.is_winner ? 'winner-card' : ''} ${ticket.price_paid === 0 ? 'complimentary-card' : ''}`}
                      >
                        {/* Header */}
                        <div className="ticket-card-header">
                          <div className="ticket-number-badge">
                            <Ticket size={18} />
                            <span>{ticket.ticket_number}</span>
                          </div>
                          <div className="ticket-actions">
                            <button
                              onClick={() => currentEvent && handlePrintTicket(ticket, currentEvent)}
                              className="ticket-print-btn"
                              title="Stampa biglietto"
                              disabled={!currentEvent}
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(ticket.id, ticket.ticket_number)}
                              className="ticket-delete-btn"
                              title="Elimina biglietto"
                              disabled={ticket.is_winner}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="ticket-card-body">
                          <div className="ticket-info-row">
                            <User size={16} />
                            <span className="info-label">Cliente</span>
                            <span className="info-value">{ticket.customer_name}</span>
                          </div>

                          {ticket.customer_email && (
                            <div className="ticket-info-row">
                              <Mail size={16} />
                              <span className="info-label">Email</span>
                              <span className="info-value">{ticket.customer_email}</span>
                            </div>
                          )}

                          {ticket.customer_phone && (
                            <div className="ticket-info-row">
                              <Phone size={16} />
                              <span className="info-label">Telefono</span>
                              <span className="info-value">{ticket.customer_phone}</span>
                            </div>
                          )}

                          <div className="ticket-info-row">
                            <Clock size={16} />
                            <span className="info-label">Data</span>
                            <span className="info-value">
                              {new Date(ticket.created_at).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="ticket-card-footer">
                          <div className="ticket-price-badge">
                            {ticket.price_paid === 0 ? (
                              <>
                                <Gift size={18} />
                                <span>OMAGGIO</span>
                              </>
                            ) : (
                              <>
                                <CircleDollarSign size={18} />
                                <span>€{ticket.price_paid.toFixed(2)}</span>
                              </>
                            )}
                          </div>

                          {ticket.is_winner && (
                            <div className="ticket-winner-badge">
                              <Trophy size={18} />
                              <span>VINCITORE</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LotteryManagement
