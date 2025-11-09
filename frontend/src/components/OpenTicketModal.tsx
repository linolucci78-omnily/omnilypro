import React, { useState } from 'react'
import { X, Send, AlertCircle } from 'lucide-react'
import { supportTicketsApi } from '../lib/supabase'
import './OpenTicketModal.css'

interface OpenTicketModalProps {
  organizationId: string
  organizationName: string
  onClose: () => void
  onSuccess: (ticketNumber: string) => void
}

const OpenTicketModal: React.FC<OpenTicketModalProps> = ({
  organizationId,
  organizationName,
  onClose,
  onSuccess
}) => {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'general' | 'technical' | 'billing' | 'feature_request'>('general')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!subject.trim()) {
      setError('Inserisci un oggetto per il ticket')
      return
    }

    if (!description.trim()) {
      setError('Inserisci una descrizione del problema')
      return
    }

    setLoading(true)

    try {
      const ticket = await supportTicketsApi.create({
        organization_id: organizationId,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority
      })

      // Create initial message
      // await ticketMessagesApi.create({
      //   ticket_id: ticket.id,
      //   message: description.trim(),
      //   author_type: 'customer'
      // })

      onSuccess(ticket.ticket_number)
      onClose()
    } catch (err: any) {
      console.error('Error creating ticket:', err)
      setError(err.message || 'Errore durante la creazione del ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="open-ticket-panel open" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Apri Ticket di Supporto</h2>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-subtitle">
          <p>Richiedi assistenza per {organizationName}</p>
        </div>

        <form onSubmit={handleSubmit} className="ticket-form">
          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="subject">
              Oggetto <span className="required">*</span>
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Breve descrizione del problema..."
              maxLength={200}
              disabled={loading}
              required
            />
            <span className="char-count">{subject.length}/200</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Categoria</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                disabled={loading}
              >
                <option value="general">Generale</option>
                <option value="technical">Tecnico</option>
                <option value="billing">Fatturazione</option>
                <option value="feature_request">Richiesta Funzionalità</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priorità</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                disabled={loading}
              >
                <option value="low">Bassa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Descrizione <span className="required">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi dettagliatamente il problema o la richiesta di assistenza..."
              rows={6}
              maxLength={2000}
              disabled={loading}
              required
            />
            <span className="char-count">{description.length}/2000</span>
          </div>

          <div className="priority-info">
            <AlertCircle size={16} />
            <span>
              {priority === 'urgent' && 'Priorità Urgente: Risposta entro 2 ore'}
              {priority === 'high' && 'Priorità Alta: Risposta entro 4 ore'}
              {priority === 'medium' && 'Priorità Media: Risposta entro 24 ore'}
              {priority === 'low' && 'Priorità Bassa: Risposta entro 48 ore'}
            </span>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !subject.trim() || !description.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Creazione...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Invia Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OpenTicketModal
