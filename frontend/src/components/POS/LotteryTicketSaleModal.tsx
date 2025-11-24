import React, { useState, useEffect } from 'react'
import { X, Ticket, User, Mail, Phone, Sparkles, Printer, Check, Download, Send } from 'lucide-react'
import { lotteryService, LotteryEvent, LotteryTicket } from '../../services/lotteryService'
import { ZCSPrintService } from '../../services/printService'
import { LotteryPdfService } from '../../services/lotteryPdfService'
import { supabase } from '../../lib/supabase'
import Toast from '../UI/Toast'
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

  // Toast state
  const [toast, setToast] = useState<{
    isVisible: boolean
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }>({
    isVisible: false,
    message: '',
    type: 'info'
  })

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ isVisible: true, message, type })
  }

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  // Initialize printer service with organization data
  useEffect(() => {
    const initPrinter = async () => {
      try {
        // Fetch organization data
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('name, address, phone, vat_number')
          .eq('id', organizationId)
          .single()

        if (orgError) {
          console.error('Error fetching organization:', orgError)
        }

        const printer = new ZCSPrintService({
          storeName: orgData?.name || 'Lottery System',
          storeAddress: orgData?.address || '',
          storePhone: orgData?.phone || '',
          storeVat: orgData?.vat_number || '',
          storeTax: '',
          paperWidth: 384,
          fontSizeNormal: 24,
          fontSizeLarge: 30,
          printDensity: 3
        })

        // IMPORTANTE: Inizializza il bridge Android
        const initialized = await printer.initialize()
        if (initialized) {
          console.log('✅ Printer initialized successfully with org data:', {
            name: orgData?.name,
            address: orgData?.address,
            phone: orgData?.phone,
            vat: orgData?.vat_number
          })
          setPrinterService(printer)
        } else {
          console.error('❌ Failed to initialize printer')
          setPrinterService(null)
        }
      } catch (error) {
        console.error('Failed to initialize printer:', error)
        setPrinterService(null)
      }
    }
    if (isOpen) {
      initPrinter()
    }
  }, [isOpen, organizationId])

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
      showToast('Inserisci almeno il nome del cliente', 'warning')
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

      // Generate PDF ticket
      try {
        const orgData = await supabase
          .from('organizations')
          .select('name, address, phone, vat_number')
          .eq('id', organizationId)
          .single()

        const pdfBlob = await LotteryPdfService.generateTicketPDF({
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
          qrCodeData: ticket.qr_code_data,
          organizationName: orgData.data?.name,
          brandColors: selectedEvent.brand_colors
        })

        console.log('✅ PDF generated successfully')

        // Send email if customer provided email
        if (ticket.customer_email && ticket.customer_email.trim()) {
          try {
            await handleEmailTicket(ticket, pdfBlob)
          } catch (emailError) {
            console.error('Email error:', emailError)
            showToast('Biglietto creato ma errore invio email', 'warning')
          }
        }

        // Auto-download PDF
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `biglietto-${ticket.ticket_number}.pdf`
        link.click()
        URL.revokeObjectURL(url)

        showToast('Biglietto PDF generato con successo!', 'success')
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError)
        showToast('Biglietto creato ma errore generazione PDF', 'warning')
      }

      // Auto-print thermal backup after a moment
      setTimeout(() => {
        handlePrintTicket(ticket)
      }, 500)

    } catch (error: any) {
      console.error('Failed to sell ticket:', error)
      showToast(`Errore nella vendita del biglietto: ${error.message || 'Errore sconosciuto'}`, 'error')
    } finally {
      setSelling(false)
    }
  }

  const handleEmailTicket = async (ticket: LotteryTicket, pdfBlob: Blob) => {
    if (!ticket.customer_email) {
      showToast('Nessuna email specificata', 'warning')
      return
    }

    try {
      // Convert PDF to base64
      const reader = new FileReader()
      const pdfBase64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1] // Remove data:application/pdf;base64,
          resolve(base64)
        }
        reader.onerror = reject
      })
      reader.readAsDataURL(pdfBlob)

      const pdfBase64 = await pdfBase64Promise

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-lottery-ticket-email', {
        body: {
          to: ticket.customer_email,
          ticketNumber: ticket.ticket_number,
          customerName: ticket.customer_name,
          eventName: selectedEvent?.name || 'Lotteria',
          extractionDate: selectedEvent?.extraction_date || new Date().toISOString(),
          pdfBase64: pdfBase64,
          organizationId: organizationId
        }
      })

      if (error) {
        console.error('Email error:', error)
        showToast('Errore invio email', 'error')
        return
      }

      console.log('✅ Email sent successfully:', data)
      showToast(`Email inviata a ${ticket.customer_email}`, 'success')
    } catch (error) {
      console.error('Failed to send email:', error)
      showToast('Errore invio email', 'error')
      throw error
    }
  }

  const handleDownloadPDF = async (ticket: LotteryTicket) => {
    if (!selectedEvent) return

    try {
      const orgData = await supabase
        .from('organizations')
        .select('name, address, phone, vat_number')
        .eq('id', organizationId)
        .single()

      await LotteryPdfService.downloadTicket({
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
        qrCodeData: ticket.qr_code_data,
        organizationName: orgData.data?.name,
        brandColors: selectedEvent.brand_colors
      })

      showToast('Download PDF avviato', 'success')
    } catch (error) {
      console.error('Download error:', error)
      showToast('Errore download PDF', 'error')
    }
  }

  const handleResendEmail = async (ticket: LotteryTicket) => {
    if (!ticket.customer_email) {
      showToast('Nessuna email specificata', 'warning')
      return
    }

    if (!selectedEvent) return

    try {
      const orgData = await supabase
        .from('organizations')
        .select('name, address, phone, vat_number')
        .eq('id', organizationId)
        .single()

      const pdfBlob = await LotteryPdfService.generateTicketPDF({
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
        qrCodeData: ticket.qr_code_data,
        organizationName: orgData.data?.name,
        brandColors: selectedEvent.brand_colors
      })

      await handleEmailTicket(ticket, pdfBlob)
    } catch (error) {
      console.error('Resend email error:', error)
      showToast('Errore reinvio email', 'error')
    }
  }

  const handlePrintTicket = async (ticket: LotteryTicket) => {
    if (!selectedEvent || !printerService) {
      console.warn('Cannot print: missing event or printer service')
      showToast('Stampante non disponibile', 'warning')
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
        showToast('Biglietto stampato con successo!', 'success')
      } else {
        console.error('❌ Errore stampa biglietto')
        showToast('Errore durante la stampa del biglietto', 'error')
      }
    } catch (error) {
      console.error('❌ Print error:', error)
      showToast('Errore durante la stampa del biglietto', 'error')
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
                  onClick={() => handleDownloadPDF(soldTicket)}
                  className="btn-secondary"
                >
                  <Download className="w-4 h-4" />
                  Scarica PDF
                </button>
                {soldTicket.customer_email && (
                  <button
                    onClick={() => handleResendEmail(soldTicket)}
                    className="btn-secondary"
                  >
                    <Send className="w-4 h-4" />
                    Invia Email
                  </button>
                )}
                <button
                  onClick={() => handlePrintTicket(soldTicket)}
                  className="btn-secondary"
                >
                  <Printer className="w-4 h-4" />
                  Stampa Termica
                </button>
              </div>

              <div className="action-buttons" style={{ marginTop: '10px' }}>
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

      {/* Toast */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </div>
  )
}
