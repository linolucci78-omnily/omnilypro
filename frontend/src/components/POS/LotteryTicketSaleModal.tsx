import React, { useState, useEffect } from 'react'
import { X, Ticket, User, Mail, Phone, Sparkles, Printer, Check } from 'lucide-react'
import { lotteryService, LotteryEvent, LotteryTicket } from '../../services/lotteryService'
import { ZCSPrintService } from '../../services/printService'
import './LotteryTicketSaleModal.css'

interface LotteryTicketSaleModalProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  staffId?: string
  staffName?: string
  onTicketSold?: (ticket: LotteryTicket) => void
}

/**
 * POS Modal for Selling Lottery Tickets
 * Integrated into the POS system for quick ticket sales
 */
export const LotteryTicketSaleModal: React.FC<LotteryTicketSaleModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  staffId,
  staffName,
  onTicketSold
}) => {
  const [activeEvents, setActiveEvents] = useState<LotteryEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<LotteryEvent | null>(null)
  const [loading, setLoading] = useState(false)
  const [selling, setSelling] = useState(false)

  // Form fields
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerId, setCustomerId] = useState<string | undefined>(undefined)

  // Success state
  const [soldTicket, setSoldTicket] = useState<LotteryTicket | null>(null)

  // Printer service instance
  const [printerService, setPrinterService] = useState<ZCSPrintService | null>(null)

  // Initialize printer service
  useEffect(() => {
    const initPrinter = async () => {
      try {
        const printer = new ZCSPrintService({
          storeName: 'Lottery System',
          storeAddress: '',
          storePhone: '',
          storeTax: '',
          paperWidth: 384,
          fontSizeNormal: 24,
          fontSizeLarge: 30,
          printDensity: 3
        })
        setPrinterService(printer)
      } catch (error) {
        console.error('Failed to initialize printer:', error)
      }
    }
    if (isOpen) {
      initPrinter()
    }
  }, [isOpen])

  // Load active events
  useEffect(() => {
    if (isOpen && organizationId) {
      loadActiveEvents()
    }
  }, [isOpen, organizationId])

  const loadActiveEvents = async () => {
    try {
      setLoading(true)
      const events = await lotteryService.getActiveEvents(organizationId)
      setActiveEvents(events)

      // Auto-select if only one event
      if (events.length === 1) {
        setSelectedEvent(events[0])
      }
    } catch (error) {
      console.error('Failed to load active lottery events:', error)
      alert('Errore nel caricamento degli eventi attivi')
    } finally {
      setLoading(false)
    }
  }

  const handleSellTicket = async () => {
    if (!selectedEvent || !customerName.trim()) {
      alert('Inserisci almeno il nome del cliente')
      return
    }

    try {
      setSelling(true)

      // Create ticket
      const ticket = await lotteryService.createTicket({
        eventId: selectedEvent.id,
        organizationId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerId,
        staffId,
        staffName,
        pricePaid: selectedEvent.ticket_price
      })

      // Show success state
      setSoldTicket(ticket)

      // Notify parent
      if (onTicketSold) {
        onTicketSold(ticket)
      }

      // Auto-print after a moment
      setTimeout(() => {
        handlePrintTicket(ticket)
      }, 500)

    } catch (error) {
      console.error('Failed to sell ticket:', error)
      alert('Errore nella vendita del biglietto')
    } finally {
      setSelling(false)
    }
  }

  const handlePrintTicket = async (ticket: LotteryTicket) => {
    if (!selectedEvent || !printerService) {
      console.warn('Cannot print: missing event or printer service')
      return
    }

    try {
      const success = await printerService.printLotteryTicket({
        eventName: selectedEvent.name,
        ticketNumber: ticket.ticket_number,
        customerName: ticket.customer_name,
        customerEmail: ticket.customer_email || undefined,
        customerPhone: ticket.customer_phone || undefined,
        fortuneMessage: ticket.fortune_message || undefined,
        prizeName: selectedEvent.prize_name || undefined,
        prizeValue: selectedEvent.prize_value || undefined,
        extractionDate: selectedEvent.extraction_date,
        pricePaid: ticket.price_paid,
        purchasedByStaff: ticket.purchased_by_staff_name || undefined,
        createdAt: ticket.created_at,
        qrCodeData: ticket.qr_code_data
      })

      if (success) {
        console.log('✅ Biglietto stampato con successo!')
      } else {
        console.error('❌ Errore stampa biglietto')
        alert('Errore durante la stampa del biglietto')
      }
    } catch (error) {
      console.error('❌ Print error:', error)
      alert('Errore durante la stampa del biglietto')
    }
  }

  const handleReset = () => {
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
    setCustomerId(undefined)
    setSoldTicket(null)
  }

  const handleClose = () => {
    handleReset()
    setSelectedEvent(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="lottery-sale-modal-overlay">
      <div className="lottery-sale-modal">
        {/* Header */}
        <div className="modal-header" style={{
          background: selectedEvent
            ? `linear-gradient(135deg, ${selectedEvent.brand_colors.primary}, ${selectedEvent.brand_colors.secondary})`
            : 'linear-gradient(135deg, #e74c3c, #c0392b)'
        }}>
          <div className="modal-title">
            <Ticket className="w-6 h-6" />
            <h2>Vendi Biglietto Lotteria</h2>
          </div>
          <button onClick={handleClose} className="close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Caricamento eventi...</p>
            </div>
          ) : soldTicket ? (
            // Success State
            <div className="success-state">
              <div className="success-icon" style={{
                backgroundColor: selectedEvent?.brand_colors.accent
              }}>
                <Check className="w-12 h-12 text-white" />
              </div>

              <h3 className="success-title">Biglietto Venduto!</h3>

              <div className="ticket-info-card">
                <div className="info-row">
                  <span className="label">Cliente:</span>
                  <span className="value">{soldTicket.customer_name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Biglietto N.:</span>
                  <span className="value ticket-number">{soldTicket.ticket_number}</span>
                </div>
                <div className="info-row">
                  <span className="label">Prezzo:</span>
                  <span className="value">€{soldTicket.price_paid.toFixed(2)}</span>
                </div>
                {soldTicket.fortune_message && (
                  <div className="fortune-box">
                    <Sparkles className="w-4 h-4" />
                    <span>"{soldTicket.fortune_message}"</span>
                  </div>
                )}
              </div>

              <div className="action-buttons">
                <button
                  onClick={() => handlePrintTicket(soldTicket)}
                  className="btn-secondary"
                >
                  <Printer className="w-4 h-4" />
                  Ristampa
                </button>
                <button
                  onClick={handleReset}
                  className="btn-primary"
                  style={{
                    backgroundColor: selectedEvent?.brand_colors.primary
                  }}
                >
                  Vendi Altro Biglietto
                </button>
              </div>

              <button onClick={handleClose} className="btn-text">
                Chiudi
              </button>
            </div>
          ) : (
            // Sale Form
            <>
              {/* Event Selection */}
              {activeEvents.length === 0 ? (
                <div className="empty-state">
                  <Ticket className="w-16 h-16 text-gray-300" />
                  <p>Nessun evento lotteria attivo</p>
                  <p className="text-sm text-gray-500">
                    Crea un evento dalla dashboard per iniziare a vendere biglietti
                  </p>
                </div>
              ) : (
                <>
                  <div className="form-section">
                    <label className="form-label">Evento Lotteria</label>
                    <select
                      value={selectedEvent?.id || ''}
                      onChange={(e) => {
                        const event = activeEvents.find(ev => ev.id === e.target.value)
                        setSelectedEvent(event || null)
                      }}
                      className="form-select"
                    >
                      <option value="">Seleziona un evento</option>
                      {activeEvents.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.name} - €{event.ticket_price.toFixed(2)}
                          {' '}(Estrazione: {new Date(event.extraction_date).toLocaleDateString('it-IT')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEvent && (
                    <>
                      {/* Event Info Card */}
                      <div className="event-info-card" style={{
                        borderColor: selectedEvent.brand_colors.primary
                      }}>
                        <div className="event-info-header">
                          <h4>{selectedEvent.name}</h4>
                          <span className="event-price" style={{
                            backgroundColor: selectedEvent.brand_colors.accent
                          }}>
                            €{selectedEvent.ticket_price.toFixed(2)}
                          </span>
                        </div>
                        {selectedEvent.prize_name && (
                          <div className="prize-info">
                            <strong>Premio:</strong> {selectedEvent.prize_name}
                            {selectedEvent.prize_value && (
                              <span className="prize-value">
                                {' '}(€{selectedEvent.prize_value.toFixed(2)})
                              </span>
                            )}
                          </div>
                        )}
                        <div className="event-stats">
                          <span>Biglietti venduti: {selectedEvent.total_tickets_sold}</span>
                          <span>Estrazione: {new Date(selectedEvent.extraction_date).toLocaleDateString('it-IT', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>

                      {/* Customer Form */}
                      <div className="form-section">
                        <label className="form-label required">
                          <User className="w-4 h-4" />
                          Nome Cliente
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Nome e cognome"
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-section">
                          <label className="form-label">
                            <Mail className="w-4 h-4" />
                            Email (opzionale)
                          </label>
                          <input
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="email@esempio.it"
                            className="form-input"
                          />
                        </div>

                        <div className="form-section">
                          <label className="form-label">
                            <Phone className="w-4 h-4" />
                            Telefono (opzionale)
                          </label>
                          <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="+39 123 456 7890"
                            className="form-input"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="modal-actions">
                        <button onClick={handleClose} className="btn-cancel">
                          Annulla
                        </button>
                        <button
                          onClick={handleSellTicket}
                          disabled={!customerName.trim() || selling}
                          className="btn-primary"
                          style={{
                            backgroundColor: selectedEvent.brand_colors.primary
                          }}
                        >
                          {selling ? (
                            <>
                              <div className="spinner-small" />
                              Vendita...
                            </>
                          ) : (
                            <>
                              <Ticket className="w-4 h-4" />
                              Vendi Biglietto - €{selectedEvent.ticket_price.toFixed(2)}
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
