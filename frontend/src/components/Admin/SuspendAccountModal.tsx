import React, { useState } from 'react'
import { X, Ban, AlertTriangle, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SuspendAccountModalProps {
  isOpen: boolean
  onClose: () => void
  businessOwner: {
    id: string
    name: string
    email: string
    company: string
    planType: string
  }
  onConfirm: (reason: string, duration?: 'temporary' | 'permanent') => Promise<void>
}

const SuspendAccountModal: React.FC<SuspendAccountModalProps> = ({
  isOpen,
  onClose,
  businessOwner,
  onConfirm
}) => {
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState<'temporary' | 'permanent'>('temporary')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suspendReasons = [
    'Mancato pagamento',
    'Violazione termini di servizio',
    'Richiesta del cliente',
    'Attività sospetta',
    'Revisione account',
    'Altro'
  ]

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Seleziona o inserisci un motivo per la sospensione')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await onConfirm(reason, duration)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Errore durante la sospensione dell\'account')
    } finally {
      setLoading(false)
    }
  }

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <Ban size={20} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                      Sospendi Account
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {businessOwner.company}
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

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Warning */}
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertTriangle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-red-900 dark:text-red-100 mb-1">
                      Attenzione: Azione Critica
                    </p>
                    <p className="text-red-700 dark:text-red-300">
                      La sospensione dell'account impedirà al business owner di accedere alla piattaforma.
                      Tutti i dati saranno preservati ma non accessibili fino alla riattivazione.
                    </p>
                  </div>
                </div>

                {/* Business Owner Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="font-medium mb-2">Informazioni Account:</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600 dark:text-gray-400">Nome:</span> <span className="font-medium">{businessOwner.name}</span></p>
                    <p><span className="text-gray-600 dark:text-gray-400">Email:</span> <span className="font-medium">{businessOwner.email}</span></p>
                    <p><span className="text-gray-600 dark:text-gray-400">Piano:</span> <span className="font-medium uppercase">{businessOwner.planType}</span></p>
                  </div>
                </div>

                {/* Duration Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Durata Sospensione
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setDuration('temporary')}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all
                        ${duration === 'temporary'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                        <span className="font-medium">Temporanea</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        L'account può essere riattivato manualmente
                      </p>
                    </button>

                    <button
                      onClick={() => setDuration('permanent')}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all
                        ${duration === 'permanent'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Ban size={18} className="text-red-600 dark:text-red-400" />
                        <span className="font-medium">Permanente</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Richiede approvazione admin per riattivazione
                      </p>
                    </button>
                  </div>
                </div>

                {/* Reason Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Motivo della Sospensione *
                  </label>
                  <div className="space-y-2">
                    {suspendReasons.map((reasonOption) => (
                      <label
                        key={reasonOption}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reasonOption}
                          checked={reason === reasonOption}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">{reasonOption}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Reason */}
                {reason === 'Altro' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Specifica il Motivo
                    </label>
                    <textarea
                      value={reason === 'Altro' ? '' : reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                      placeholder="Inserisci il motivo dettagliato..."
                    />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !reason.trim()}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sospensione...
                    </>
                  ) : (
                    <>
                      <Ban size={18} />
                      Sospendi Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SuspendAccountModal
