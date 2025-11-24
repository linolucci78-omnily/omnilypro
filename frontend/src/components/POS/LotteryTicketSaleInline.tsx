import React, { useState, useEffect } from 'react'
import { X, Ticket, User, Mail, Phone, Sparkles, Printer, Check, Loader, AlertCircle, Plus, Trophy, Calendar, DollarSign, Download, Send } from 'lucide-react'
import { lotteryService, LotteryEvent, LotteryTicket } from '../../services/lotteryService'
import { ZCSPrintService } from '../../services/printService'
import { LotteryPdfService } from '../../services/lotteryPdfService'
import { supabase } from '../../lib/supabase'
import Toast from '../UI/Toast'
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
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerId, setCustomerId] = useState<string | undefined>(undefined)
  const [isComplimentary, setIsComplimentary] = useState(false)

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
      showToast('Seleziona un evento e inserisci il nome del cliente', 'warning')
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
        customerAddress: customerAddress.trim() || undefined,
        customerId,
        pricePaid: isComplimentary ? 0 : selectedEvent.ticket_price,
        isComplimentary,
        staffId,
        staffName
      })

      setSoldTicket(ticket)
      onTicketSold?.(ticket)

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
          console.log('📧 Attempting to send email to:', ticket.customer_email)
          try {
            await handleEmailTicket(ticket, pdfBlob)
            console.log('✅ Email sent successfully')
          } catch (emailError) {
            console.error('❌ Email error:', emailError)
            showToast('Biglietto creato ma errore invio email', 'warning')
          }
        } else {
          console.log('ℹ️ No email provided, skipping email send')
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

      // Auto print thermal backup
      if (printerService) {
        await handlePrintTicket(ticket)
      }
    } catch (error: any) {
      console.error('Failed to sell ticket:', error)
      showToast(`Errore: ${error.message}`, 'error')
    } finally {
      setSelling(false)
    }
  }

  const handleEmailTicket = async (ticket: LotteryTicket, pdfBlob: Blob) => {
    if (!ticket.customer_email) {
      console.warn('⚠️ No customer email provided')
      showToast('Nessuna email specificata', 'warning')
      return
    }

    console.log('📧 Starting email send process...')
    console.log('📧 Email details:', {
      to: ticket.customer_email,
      ticketNumber: ticket.ticket_number,
      organizationId: organizationId,
      pdfSize: pdfBlob.size
    })

    try {
      // Convert PDF to base64
      console.log('📄 Converting PDF to base64...')
      const reader = new FileReader()
      const pdfBase64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1]
          console.log('✅ PDF converted to base64, length:', base64.length)
          resolve(base64)
        }
        reader.onerror = (err) => {
          console.error('❌ FileReader error:', err)
          reject(err)
        }
      })
      reader.readAsDataURL(pdfBlob)

      const pdfBase64 = await pdfBase64Promise

      // Call Supabase Edge Function
      console.log('📤 Calling Supabase Edge Function: send-lottery-ticket-email')
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
        console.error('❌ Supabase Edge Function error:', error)
        showToast(`Errore invio email: ${error.message}`, 'error')
        return
      }

      console.log('✅ Email sent successfully via Edge Function:', data)
      showToast(`Email inviata a ${ticket.customer_email}`, 'success')
    } catch (error: any) {
      console.error('❌ Failed to send email:', error)
      showToast(`Errore invio email: ${error.message || 'Errore sconosciuto'}`, 'error')
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

  const handleClose = () => {
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
    setCustomerAddress('')
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
    setCustomerAddress('')
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
              <div className="form-group">
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
                <div className="event-info">
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

              <div className="form-divider">Dati Cliente</div>

              <div className="form-group">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Es. mario.rossi@email.com"
                />
              </div>

              <div className="form-group">
                <label>Telefono</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Es. +39 333 1234567"
                />
              </div>

              <div className="form-group">
                <label>Indirizzo</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Es. Via Roma 123, Milano"
                />
              </div>

              <div className="form-divider">Opzioni Pagamento</div>

              <div className="form-group">
                <div className="toggle-row">
                  <div className="toggle-info">
                    <label className="toggle-main-label">Biglietto Omaggio</label>
                    <span className="toggle-description">Il biglietto sarà gratuito (€0.00)</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isComplimentary}
                      onChange={(e) => setIsComplimentary(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
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

export default LotteryTicketSaleInline
