import React, { useState } from 'react'
import { X, CreditCard, Check, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChangePlanModalProps {
  isOpen: boolean
  onClose: () => void
  businessOwner: {
    id: string
    name: string
    email: string
    company: string
    planType: 'free' | 'pro' | 'enterprise'
  }
  onConfirm: (newPlan: 'free' | 'pro' | 'enterprise') => Promise<void>
}

const ChangePlanModal: React.FC<ChangePlanModalProps> = ({
  isOpen,
  onClose,
  businessOwner,
  onConfirm
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise'>(businessOwner.planType)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plans = {
    free: {
      name: 'FREE',
      price: '€0',
      features: ['100 clienti', 'Dashboard base', 'Email support'],
      color: '#6b7280',
      bg: '#f3f4f6'
    },
    pro: {
      name: 'PRO',
      price: '€99',
      features: ['1000 clienti', 'Analytics avanzati', 'POS integration', 'Priority support'],
      color: '#3b82f6',
      bg: '#dbeafe'
    },
    enterprise: {
      name: 'ENTERPRISE',
      price: 'Custom',
      features: ['Clienti illimitati', 'White label', 'API access', 'Dedicated support', 'SSO'],
      color: '#8b5cf6',
      bg: '#ede9fe'
    }
  }

  const handleConfirm = async () => {
    if (selectedPlan === businessOwner.planType) {
      setError('Seleziona un piano diverso da quello attuale')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await onConfirm(selectedPlan)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Errore durante il cambio piano')
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <div>
                  <h2 className="text-2xl font-bold">Cambia Piano Subscription</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {businessOwner.company} - {businessOwner.email}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Piano attuale: <span className="font-semibold text-gray-900 dark:text-white">{plans[businessOwner.planType].name}</span>
                  </p>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {(Object.keys(plans) as Array<keyof typeof plans>).map((planKey) => {
                    const plan = plans[planKey]
                    const isSelected = selectedPlan === planKey
                    const isCurrent = businessOwner.planType === planKey

                    return (
                      <div
                        key={planKey}
                        onClick={() => setSelectedPlan(planKey)}
                        className={`
                          relative p-6 rounded-xl border-2 cursor-pointer transition-all
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                          ${isCurrent ? 'opacity-60' : ''}
                        `}
                      >
                        {isCurrent && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-medium">
                            Attuale
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check size={16} className="text-white" />
                          </div>
                        )}

                        <div className="mb-4">
                          <h3 className="text-lg font-bold" style={{ color: plan.color }}>
                            {plan.name}
                          </h3>
                          <p className="text-2xl font-bold mt-2">{plan.price}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">per mese</p>
                        </div>

                        <ul className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start text-sm">
                              <Check size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>

                {/* Warning */}
                {selectedPlan !== businessOwner.planType && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-6">
                    <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                        Attenzione
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        Il cambio piano avrà effetto immediato. Il business owner riceverà una notifica via email.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6">
                    <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
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
                  disabled={loading || selectedPlan === businessOwner.planType}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Aggiornamento...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Conferma Cambio Piano
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

export default ChangePlanModal
