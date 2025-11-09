import React, { useState, useEffect } from 'react'
import { X, Send, Clock, User, Tag, AlertCircle, CheckCircle2, Shield, Building2 } from 'lucide-react'
import { supportTicketsApi, ticketMessagesApi, SupportTicket, TicketMessage, supabase } from '../lib/supabase'
import './TicketDetailModal.css'

interface TicketDetailModalProps {
  ticket: SupportTicket
  organizationId: string
  primaryColor: string
  secondaryColor: string
  onClose: () => void
  onUpdate: () => void
  isAdmin?: boolean // true = admin risponde, false/undefined = organizzazione risponde
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  organizationId,
  primaryColor,
  secondaryColor,
  onClose,
  onUpdate,
  isAdmin = false
}) => {
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [currentTicket, setCurrentTicket] = useState(ticket)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Scroll automatico verso il basso
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      const data = await ticketMessagesApi.getByTicket(ticket.id)
      setMessages(data)
      setTimeout(scrollToBottom, 100) // Scroll dopo che i messaggi sono renderizzati
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  useEffect(() => {
    loadMessages()

    // Realtime subscription per nuovi messaggi
    const channel = supabase
      .channel(`ticket-messages-${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`
        },
        (payload) => {
          console.log('🔔 Nuovo messaggio ricevuto:', payload)
          // Aggiungi il nuovo messaggio alla lista
          const newMessage = payload.new as TicketMessage
          setMessages((prev) => [...prev, newMessage])
          // Scroll automatico verso il nuovo messaggio
          setTimeout(scrollToBottom, 100)
        }
      )
      .subscribe()

    // Cleanup quando il componente viene smontato
    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticket.id])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      await ticketMessagesApi.create({
        ticket_id: ticket.id,
        message: newMessage.trim(),
        author_type: isAdmin ? 'staff' : 'customer', // Admin = staff, Organizzazione = customer
        is_internal: false
      })

      // Aggiorna stato ticket a "in_progress" se è "open"
      if (currentTicket.status === 'open') {
        await supportTicketsApi.update(ticket.id, { status: 'in_progress' })
        const updated = await supportTicketsApi.getById(ticket.id)
        setCurrentTicket(updated)
        onUpdate()
      }

      setNewMessage('')
      await loadMessages()
    } catch (err) {
      console.error('Error sending message:', err)
      // Non mostrare alert, l'errore è già loggato
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdating(true)
      await supportTicketsApi.update(ticket.id, { status: newStatus })
      const updated = await supportTicketsApi.getById(ticket.id)
      setCurrentTicket(updated)
      onUpdate()
    } catch (err) {
      console.error('Error updating status:', err)
      // Errore loggato, non mostrare alert
    } finally {
      setUpdating(false)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    try {
      setUpdating(true)
      await supportTicketsApi.update(ticket.id, { priority: newPriority })
      const updated = await supportTicketsApi.getById(ticket.id)
      setCurrentTicket(updated)
      onUpdate()
    } catch (err) {
      console.error('Error updating priority:', err)
      // Errore loggato, non mostrare alert
    } finally {
      setUpdating(false)
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#65a30d'
      default: return '#6b7280'
    }
  }

  return (
    <div className="ticket-modal-overlay" onClick={onClose}>
      <div
        className="ticket-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor } as React.CSSProperties}
      >
        {/* Header */}
        <div className="ticket-modal-header">
          <div className="ticket-modal-title">
            <h2>Ticket {currentTicket.ticket_number}</h2>
            <p>{currentTicket.subject}</p>
          </div>
          <button className="ticket-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Info Section */}
        <div className="ticket-info-section">
          <div className="ticket-info-row">
            <div className="ticket-info-item">
              <Clock size={16} />
              <span>Creato: {formatDate(currentTicket.created_at)}</span>
            </div>
            <div className="ticket-info-item">
              <Tag size={16} />
              <span>{currentTicket.category}</span>
            </div>
          </div>

          {isAdmin && (
            <div className="ticket-controls">
              <div className="control-group">
                <label>Stato:</label>
                <select
                  value={currentTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updating}
                >
                  <option value="open">Aperto</option>
                  <option value="in_progress">In Lavorazione</option>
                  <option value="waiting_reply">In Attesa Risposta</option>
                  <option value="resolved">Risolto</option>
                  <option value="closed">Chiuso</option>
                </select>
              </div>

              <div className="control-group">
                <label>Priorità:</label>
                <select
                  value={currentTicket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  disabled={updating}
                  style={{ borderColor: getPriorityColor(currentTicket.priority) }}
                >
                  <option value="low">Bassa</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="ticket-description-section">
          <h3>Descrizione</h3>
          <p>{currentTicket.description}</p>
        </div>

        {/* Messages */}
        <div className="ticket-messages-section">
          <h3>Messaggi</h3>
          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="no-messages">
                <AlertCircle size={32} />
                <p>Nessun messaggio ancora. Inizia la conversazione!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-item ${message.author_type === 'staff' ? 'staff-message' : 'user-message'}`}
                >
                  <div className="message-header">
                    <div className="message-author">
                      {message.author_type === 'staff' ? (
                        <Shield size={18} />
                      ) : (
                        <Building2 size={18} />
                      )}
                      <span>
                        {message.author_type === 'staff'
                          ? 'OMNILYPRO'
                          : currentTicket.organization_name || 'Cliente'}
                      </span>
                    </div>
                    <span className="message-date">{formatDate(message.created_at)}</span>
                  </div>
                  <div className="message-content">
                    {message.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply Form */}
        {currentTicket.status !== 'closed' && (
          <form className="ticket-reply-form" onSubmit={handleSendMessage}>
            <div className="reply-input-group">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isAdmin ? "Scrivi una risposta al cliente..." : "Scrivi un messaggio al supporto..."}
                rows={3}
                disabled={sending}
              />
            </div>
            <div className="reply-actions">
              <button
                type="submit"
                className="btn-send-reply"
                disabled={sending || !newMessage.trim()}
              >
                <Send size={18} />
                {sending ? 'Invio...' : (isAdmin ? 'Invia Risposta' : 'Invia Messaggio')}
              </button>
            </div>
          </form>
        )}

        {currentTicket.status === 'closed' && (
          <div className="ticket-closed-notice">
            <CheckCircle2 size={20} />
            <span>Questo ticket è stato chiuso</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TicketDetailModal
