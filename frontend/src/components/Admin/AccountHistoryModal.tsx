import React, { useState, useEffect } from 'react'
import { X, History, Clock, User, CreditCard, Ban, RefreshCw, Mail, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

  const getEventColor = (type: HistoryEvent['type']) => {
    const colors = {
      plan_change: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      suspension: 'text-red-600 bg-red-100 dark:bg-red-900/30',
      activation: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      payment: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
      login: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
      settings: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
      email_sent: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30'
    }
    return colors[type] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh]"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <History size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Storico Account</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {businessOwner.company} - {businessOwner.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Filter */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-shrink-0 overflow-x-auto">
                {eventTypes.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                      ${filter === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Caricamento storico...</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {filter === 'all' ? 'Nessun evento registrato' : 'Nessun evento trovato per questo filtro'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHistory.map((event, index) => {
                      const Icon = getEventIcon(event.type)
                      const colorClass = getEventColor(event.type)

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex gap-4"
                        >
                          {/* Timeline Line */}
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                              <Icon size={18} />
                            </div>
                            {index < filteredHistory.length - 1 && (
                              <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-2" />
                            )}
                          </div>

                          {/* Event Content */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-medium">{event.title}</h3>
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Clock size={12} />
                                {new Date(event.timestamp).toLocaleString('it-IT')}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {event.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <User size={12} />
                              <span>Eseguito da: {event.performedBy}</span>
                            </div>

                            {/* Metadata */}
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs">
                                <p className="font-medium mb-1">Dettagli:</p>
                                <ul className="space-y-1">
                                  {Object.entries(event.metadata).map(([key, value]) => (
                                    <li key={key} className="flex gap-2">
                                      <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                                      <span className="font-medium">{String(value)}</span>
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
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredHistory.length} {filteredHistory.length === 1 ? 'evento' : 'eventi'} {filter !== 'all' && 'filtrati'}
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AccountHistoryModal
