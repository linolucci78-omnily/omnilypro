import React, { useState, useEffect } from 'react'
import { X, Ticket, User, Mail, Phone, Sparkles, Printer, Check, Loader, AlertCircle, Plus, Trophy, Calendar, DollarSign } from 'lucide-react'
import { lotteryService, LotteryEvent, LotteryTicket } from '../../services/lotteryService'
import { ZCSPrintService } from '../../services/printService'
import './LotteryTicketSaleInline.css'

interface LotteryTicketSaleInlineProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  primaryColor: string
  secondaryColor: string
  staffId?: string
  staffName?: string
  onTicketSold?: (ticket: LotteryTicket) => void
}

export const LotteryTicketSaleInline: React.FC<LotteryTicketSaleInlineProps> = ({
  isOpen,
  onClose,
  organizationId,
  primaryColor,
  secondaryColor,
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
  const [isComplimentary, setIsComplimentary] = useState(false)

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

  useEffect(() => {
    if (isOpen) {
      loadActiveEvents()
    }
  }, [isOpen, organizationId])

  const loadActiveEvents = async () => {
    try {
      setLoading(true)
      const events = await lotteryService.getEvents(organizationId)
      const active = events.filter(e => e.status === 'active')
      setActiveEvents(active)

      if (active.length > 0 && !selectedEvent) {
        setSelectedEvent(active[0])
      }
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSell = async () => {
    if (!selectedEvent || !customerName.trim()) {
      alert('Seleziona un evento e inserisci il nome del cliente')
      return
    }

    try {
      setSelling(true)

      const ticket = await lotteryService.sellTicket({
        eventId: selectedEvent.id,
        organizationId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerId,
        pricePaid: isComplimentary ? 0 : selectedEvent.ticket_price,
        isComplimentary,
        staffId,
        staffName
      })

      setSoldTicket(ticket)
      onTicketSold?.(ticket)

      // Auto print
      if (printerService) {
        await handlePrintTicket(ticket)
      }
    } catch (error: any) {
      alert(`Errore: ${error.message}`)
    } finally {
      setSelling(false)
    }
  }

  const handlePrintTicket = async (ticket: LotteryTicket) => {
    if (!selectedEvent || !printerService) return

    try {
      const success = await printerService.printLotteryTicket({
        eventName: selectedEvent.name,
        ticketNumber: ticket.ticket_number,
        customerName: ticket.customer_name,
        customerEmail: ticket.customer_email,
        customerPhone: ticket.customer_phone,
        fortuneMessage: ticket.fortune_message,
        prizeName: selectedEvent.prize_name,
        prizeValue: selectedEvent.prize_value,
        extractionDate: selectedEvent.extraction_date,
        pricePaid: ticket.price_paid,
        purchasedByStaff: ticket.sold_by_staff_name,
        createdAt: ticket.created_at,
        qrCodeData: JSON.stringify({
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          eventId: selectedEvent.id,
          eventName: selectedEvent.name
        })
      })

      if (success) {
        console.log('✅ Biglietto stampato con successo!')
      }
    } catch (error) {
      console.error('Errore stampa:', error)
    }
  }

  const handleClose = () => {
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
    setCustomerId(undefined)
    setSoldTicket(null)
    setSelectedEvent(null)
    onClose()
  }

  const handleNewSale = () => {
    setCustomerName('')
    setIsComplimentary(false)
    setCustomerEmail('')
    setCustomerPhone('')
    setCustomerId(undefined)
    setSoldTicket(null)
  }

  if (!isOpen) return null

  return (
    <div
      className="ticket-sale-inline"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="ticket-sale-header" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
        <h2><Ticket size={24} /> Vendita Biglietto Lotteria</h2>
        <button onClick={handleClose} className="close-btn-inline">
          <X size={24} />
        </button>
      </div>

      <div className="ticket-sale-content">
        {loading ? (
          <div className="loading-state">
            <Loader className="spinner" size={32} />
            <p>Caricamento eventi...</p>
          </div>
        ) : soldTicket ? (
          // Success State
          <div className="success-state">
            <div className="success-icon" style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
            }}>
              <Check size={48} />
            </div>

            <h3>Biglietto Venduto!</h3>

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
                <span className="value">
                  {soldTicket.price_paid === 0 ? (
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>🎁 OMAGGIO</span>
                  ) : (
                    `€${soldTicket.price_paid.toFixed(2)}`
                  )}
                </span>
              </div>
              {soldTicket.fortune_message && (
                <div className="fortune-box">
                  <Sparkles size={16} />
                  <span>"{soldTicket.fortune_message}"</span>
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button
                onClick={() => handlePrintTicket(soldTicket)}
                className="btn-secondary"
              >
                <Printer size={20} />
                Ristampa
              </button>
              <button
                onClick={handleNewSale}
                className="btn-primary"
              >
                <Plus size={20} />
                Nuovo Biglietto
              </button>
            </div>
          </div>
        ) : activeEvents.length === 0 ? (
          <div className="empty-state">
            <Ticket size={48} style={{ opacity: 0.3 }} />
            <h3>Nessun Evento Attivo</h3>
            <p>Crea un evento lotteria attivo per vendere biglietti</p>
          </div>
        ) : (
          // Sale Form
          <form onSubmit={(e) => { e.preventDefault(); handleSell(); }} className="sale-form">
            <div className="form-grid">
              <div className="form-group span-2">
                <label>Evento Lotteria *</label>
                <select
                  value={selectedEvent?.id || ''}
                  onChange={(e) => {
                    const event = activeEvents.find(ev => ev.id === e.target.value)
                    setSelectedEvent(event || null)
                  }}
                  required
                >
                  {activeEvents.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name} - €{event.ticket_price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEvent && (
                <div className="event-info span-2">
                  <div className="info-item">
                    <Trophy size={16} />
                    <span>{selectedEvent.prize_name || 'Nessun premio specificato'}</span>
                  </div>
                  <div className="info-item">
                    <Calendar size={16} />
                    <span>Estrazione: {new Date(selectedEvent.extraction_date).toLocaleDateString('it-IT')}</span>
                  </div>
                  <div className="info-item">
                    <DollarSign size={16} />
                    <span>Prezzo: €{selectedEvent.ticket_price.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="form-divider span-2">Dati Cliente</div>

              <div className="form-group span-2">
                <label>Nome Cliente *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Mario Rossi"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email (opzionale)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="mario@email.com"
                />
              </div>

              <div className="form-group">
                <label>Telefono (opzionale)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+39 333 1234567"
                />
              </div>

              <div className="complimentary-wrapper span-2">
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    id="complimentary-checkbox"
                    checked={isComplimentary}
                    onChange={(e) => setIsComplimentary(e.target.checked)}
                    className="checkbox-input"
                  />
                  <label htmlFor="complimentary-checkbox" className="checkbox-text">
                    🎁 Biglietto Omaggio (Gratuito)
                  </label>
                </div>
                {isComplimentary && (
                  <div className="complimentary-notice">
                    <AlertCircle size={16} />
                    <span>Il biglietto sarà registrato come omaggio a €0.00</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleClose} className="btn-cancel">
                Annulla
              </button>
              <button type="submit" disabled={selling} className="btn-primary">
                {selling ? (
                  <>
                    <Loader className="spinner" size={20} />
                    Vendita in corso...
                  </>
                ) : (
                  <>
                    <Ticket size={20} />
                    Vendi Biglietto
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default LotteryTicketSaleInline
