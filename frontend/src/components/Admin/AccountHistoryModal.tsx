import React, { useState, useEffect } from 'react'
import { X, History, Clock, User, CreditCard, Ban, RefreshCw, Mail, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import '../../pages/BusinessOwners.css'
import '../EditOrganizationModal.css'

interface HistoryEvent {
  id: string
  type: 'plan_change' | 'suspension' | 'activation' | 'payment' | 'login' | 'settings' | 'email_sent'
  title: string
  description: string
  timestamp: string
  performedBy: string
  metadata?: Record<string, any>
}

interface AccountHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  businessOwner: {
    id: string
    name: string
    email: string
    company: string
  }
  onLoadHistory: (ownerId: string) => Promise<HistoryEvent[]>
}

const AccountHistoryModal: React.FC<AccountHistoryModalProps> = ({
  isOpen,
  onClose,
  businessOwner,
  onLoadHistory
}) => {
  const [history, setHistory] = useState<HistoryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const events = await onLoadHistory(businessOwner.id)
      setHistory(events)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (type: HistoryEvent['type']) => {
    const icons = {
      plan_change: CreditCard,
      suspension: Ban,
      activation: RefreshCw,
      payment: CreditCard,
      login: User,
      settings: Settings,
      email_sent: Mail
    }
    return icons[type] || History
  }

  const getEventStyle = (type: HistoryEvent['type']) => {
    const styles = {
      plan_change: { color: '#2563eb', background: '#dbeafe' },
      suspension: { color: '#dc2626', background: '#fee2e2' },
      activation: { color: '#16a34a', background: '#dcfce7' },
      payment: { color: '#9333ea', background: '#f3e8ff' },
      login: { color: '#4b5563', background: '#f3f4f6' },
      settings: { color: '#ca8a04', background: '#fef3c7' },
      email_sent: { color: '#0891b2', background: '#cffafe' }
    }
    return styles[type] || { color: '#4b5563', background: '#f3f4f6' }
  }

  const filteredHistory = filter === 'all'
    ? history
    : history.filter(event => event.type === filter)

  const eventTypes = [
    { value: 'all', label: 'Tutti gli Eventi' },
    { value: 'plan_change', label: 'Cambi Piano' },
    { value: 'suspension', label: 'Sospensioni' },
    { value: 'payment', label: 'Pagamenti' },
    { value: 'login', label: 'Accessi' },
    { value: 'email_sent', label: 'Email Inviate' }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="edit-org-overlay" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="edit-org-modal"
            style={{ maxWidth: '900px' }}
          >
            {/* Header */}
            <div className="edit-org-header">
              <div className="edit-org-header-content">
                <History size={24} />
                <div>
                  <h2>Storico Account</h2>
                  <p>{businessOwner.company} - {businessOwner.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="edit-org-close-btn">
                <X size={24} />
              </button>
            </div>

            {/* Filter */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {eventTypes.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: filter === value ? '#3b82f6' : '#f3f4f6',
                    color: filter === value ? 'white' : '#374151'
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== value) {
                      e.currentTarget.style.background = '#e5e7eb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== value) {
                      e.currentTarget.style.background = '#f3f4f6'
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Timeline */}
            <div className="edit-org-content" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px' }} />
                  <p style={{ color: '#64748b' }}>Caricamento storico...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <History size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
                  <p style={{ color: '#64748b' }}>
                    {filter === 'all' ? 'Nessun evento registrato' : 'Nessun evento trovato per questo filtro'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredHistory.map((event, index) => {
                      const Icon = getEventIcon(event.type)

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          style={{ display: 'flex', gap: '16px' }}
                        >
                          {/* Timeline Line */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              ...getEventStyle(event.type)
                            }}>
                              <Icon size={18} />
                            </div>
                            {index < filteredHistory.length - 1 && (
                              <div style={{
                                width: '2px',
                                flex: 1,
                                background: '#e5e7eb',
                                margin: '8px 0'
                              }} />
                            )}
                          </div>

                          {/* Event Content */}
                          <div style={{ flex: 1, paddingBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <h3 style={{ fontWeight: '500', color: '#1e293b' }}>{event.title}</h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                                <Clock size={12} />
                                {new Date(event.timestamp).toLocaleString('it-IT')}
                              </div>
                            </div>
                            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                              {event.description}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                              <User size={12} />
                              <span>Eseguito da: {event.performedBy}</span>
                            </div>

                            {/* Metadata */}
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div style={{
                                marginTop: '8px',
                                padding: '12px',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}>
                                <p style={{ fontWeight: '500', marginBottom: '4px', color: '#1e293b' }}>Dettagli:</p>
                                <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {Object.entries(event.metadata).map(([key, value]) => (
                                    <li key={key} style={{ display: 'flex', gap: '8px' }}>
                                      <span style={{ color: '#64748b' }}>{key}:</span>
                                      <span style={{ fontWeight: '500', color: '#1e293b' }}>{String(value)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                {filteredHistory.length} {filteredHistory.length === 1 ? 'evento' : 'eventi'} {filter !== 'all' && 'filtrati'}
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  color: '#334155',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                Chiudi
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AccountHistoryModal
