import React, { useState, useEffect } from 'react'
import { Mail, Phone, Calendar, MessageSquare, Check, Reply, Archive, Trash2, ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import Toast from './UI/Toast'
import './ContactMessagesPanel.css'

interface ContactMessage {
  id: string
  organization_id: string
  name: string
  email: string
  phone?: string
  message: string
  submitted_at: string
  status: 'new' | 'read' | 'replied' | 'archived'
  notes?: string
  created_at: string
  updated_at: string
}

interface ContactMessagesPanelProps {
  organizationId: string
  primaryColor: string
  onBack: () => void
}

export const ContactMessagesPanel: React.FC<ContactMessagesPanelProps> = ({
  organizationId,
  primaryColor,
  onBack,
}) => {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { toast, showSuccess, showError, hideToast } = useToast()

  useEffect(() => {
    loadMessages()
  }, [organizationId])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('contact_form_submissions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('submitted_at', { ascending: false })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      showError('Errore nel caricamento dei messaggi')
    } finally {
      setLoading(false)
    }
  }

  const updateMessageStatus = async (messageId: string, status: ContactMessage['status']) => {
    try {
      const { error } = await supabase
        .from('contact_form_submissions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', messageId)

      if (error) throw error

      setMessages(messages.map(msg =>
        msg.id === messageId ? { ...msg, status } : msg
      ))
      showSuccess('Stato aggiornato!')
    } catch (error) {
      console.error('Error updating message status:', error)
      showError('Errore nell\'aggiornamento dello stato')
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo messaggio?')) return

    try {
      const { error } = await supabase
        .from('contact_form_submissions')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      setMessages(messages.filter(msg => msg.id !== messageId))
      showSuccess('Messaggio eliminato!')
    } catch (error) {
      console.error('Error deleting message:', error)
      showError('Errore nell\'eliminazione del messaggio')
    }
  }

  const toggleExpand = (messageId: string) => {
    if (expandedMessageId === messageId) {
      setExpandedMessageId(null)
    } else {
      setExpandedMessageId(messageId)
      // Mark as read when expanded
      const message = messages.find(m => m.id === messageId)
      if (message && message.status === 'new') {
        updateMessageStatus(messageId, 'read')
      }
    }
  }

  const filteredMessages = messages.filter(msg => {
    const matchesStatus = filterStatus === 'all' || msg.status === filterStatus
    const matchesSearch = searchQuery === '' ||
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#ef4444'
      case 'read': return '#3b82f6'
      case 'replied': return '#10b981'
      case 'archived': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nuovo'
      case 'read': return 'Letto'
      case 'replied': return 'Risposto'
      case 'archived': return 'Archiviato'
      default: return status
    }
  }

  const statusCounts = {
    all: messages.length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length,
    archived: messages.filter(m => m.status === 'archived').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Caricamento messaggi...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="contact-messages-container"
      style={{
        '--primary-color': primaryColor,
      } as React.CSSProperties}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Header */}
      <div className="contact-messages-header">
        <button
          onClick={onBack}
          style={{
            background: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            transition: 'all 0.2s',
            marginRight: '20px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = primaryColor
            e.currentTarget.style.color = primaryColor
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.color = '#374151'
          }}
        >
          ← Indietro
        </button>
        <MessageSquare size={40} />
        <div className="contact-messages-header-content">
          <h1>Messaggi dal Sito</h1>
          <p>Gestisci e rispondi ai messaggi ricevuti tramite il form di contatto</p>
        </div>
      </div>

      {/* Stats */}
      <div className="contact-messages-stats">
        {[
          { key: 'all', label: 'Tutti', count: statusCounts.all, color: primaryColor },
          { key: 'new', label: 'Nuovi', count: statusCounts.new, color: '#ef4444' },
          { key: 'read', label: 'Letti', count: statusCounts.read, color: '#3b82f6' },
          { key: 'replied', label: 'Risposti', count: statusCounts.replied, color: '#10b981' },
          { key: 'archived', label: 'Archiviati', count: statusCounts.archived, color: '#6b7280' },
        ].map(stat => (
          <div
            key={stat.key}
            className={`contact-stat-card ${filterStatus === stat.key ? 'active' : ''}`}
            onClick={() => setFilterStatus(stat.key)}
            style={{
              '--stat-color': stat.color,
              '--stat-color-light': `${stat.color}15`,
            } as React.CSSProperties}
          >
            <div className="contact-stat-number">{stat.count}</div>
            <div className="contact-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="contact-messages-search">
        <Search size={20} />
        <input
          type="text"
          placeholder="Cerca per nome, email o messaggio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="clear-search"
            onClick={() => setSearchQuery('')}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="contact-messages-empty">
          <Mail size={64} />
          <h3>Nessun messaggio</h3>
          <p>
            {searchQuery || filterStatus !== 'all'
              ? 'Nessun messaggio trovato con i filtri selezionati'
              : 'Non hai ancora ricevuto messaggi dal form di contatto'}
          </p>
        </div>
      ) : (
        <div className="contact-messages-list">
          {filteredMessages.map((message) => {
            const isExpanded = expandedMessageId === message.id

            return (
              <div
                key={message.id}
                className={`contact-message-card ${message.status === 'new' ? 'new' : ''}`}
              >
                {/* Message Header */}
                <div
                  className="contact-message-header"
                  onClick={() => toggleExpand(message.id)}
                >
                  <div className="contact-message-info">
                    <div className="contact-message-name-row">
                      <h3 className="contact-message-name">{message.name}</h3>
                      <span
                        className="contact-message-status-badge"
                        style={{
                          background: `${getStatusColor(message.status)}15`,
                          color: getStatusColor(message.status),
                        }}
                      >
                        {getStatusLabel(message.status)}
                      </span>
                    </div>
                    <div className="contact-message-details">
                      <div className="contact-message-detail">
                        <Mail size={14} />
                        <a href={`mailto:${message.email}`}>{message.email}</a>
                      </div>
                      {message.phone && (
                        <div className="contact-message-detail">
                          <Phone size={14} />
                          <a href={`tel:${message.phone}`}>{message.phone}</a>
                        </div>
                      )}
                      <div className="contact-message-detail">
                        <Calendar size={14} />
                        {new Date(message.submitted_at).toLocaleString('it-IT')}
                      </div>
                    </div>
                    {!isExpanded && (
                      <p className="contact-message-preview">{message.message}</p>
                    )}
                  </div>
                  <div className={`contact-message-expand-icon ${isExpanded ? 'expanded' : ''}`}>
                    <ChevronDown size={20} />
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="contact-message-content">
                    <div className="contact-message-text">
                      <div className="contact-message-text-header">
                        <MessageSquare size={16} />
                        <span>Messaggio:</span>
                      </div>
                      <p className="contact-message-text-body">{message.message}</p>
                    </div>

                    {/* Actions */}
                    <div className="contact-message-actions">
                      <button
                        className="contact-message-action-btn primary"
                        onClick={() => window.location.href = `mailto:${message.email}`}
                      >
                        <Reply size={16} />
                        Rispondi
                      </button>

                      {message.status !== 'replied' && (
                        <button
                          className="contact-message-action-btn secondary replied"
                          onClick={() => updateMessageStatus(message.id, 'replied')}
                        >
                          <Check size={16} />
                          Segna come Risposto
                        </button>
                      )}

                      {message.status !== 'archived' && (
                        <button
                          className="contact-message-action-btn secondary archived"
                          onClick={() => updateMessageStatus(message.id, 'archived')}
                        >
                          <Archive size={16} />
                          Archivia
                        </button>
                      )}

                      <button
                        className="contact-message-action-btn secondary delete"
                        onClick={() => deleteMessage(message.id)}
                      >
                        <Trash2 size={16} />
                        Elimina
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
