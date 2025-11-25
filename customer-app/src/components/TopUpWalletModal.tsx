import { useState } from 'react'
import { X, CreditCard, Euro } from 'lucide-react'

interface TopUpWalletModalProps {
  isOpen: boolean
  onClose: () => void
  onTopUp: (amount: number, paymentMethod: string) => Promise<void>
  currentBalance: number
}

export default function TopUpWalletModal({
  isOpen,
  onClose,
  onTopUp,
  currentBalance
}: TopUpWalletModalProps) {
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'cash'>('card')
  const [loading, setLoading] = useState(false)

  const presetAmounts = [10, 20, 50, 100, 200]

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return
    }

    setLoading(true)
    try {
      await onTopUp(numAmount, selectedMethod === 'card' ? 'Carta di Credito' : 'Contanti')
      setAmount('')
      onClose()
    } catch (error) {
      console.error('Error topping up:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900">Ricarica Wallet</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
          </button>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 mb-6">
          <p className="text-gray-400 text-sm font-semibold mb-1">Saldo Attuale</p>
          <p className="text-white text-3xl font-black">€{currentBalance.toFixed(2)}</p>
        </div>

        {/* Preset Amounts */}
        <div className="mb-6">
          <p className="text-gray-700 font-semibold mb-3">Importi Rapidi</p>
          <div className="grid grid-cols-5 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className={`
                  py-3 rounded-xl font-bold transition-all
                  ${
                    amount === preset.toString()
                      ? 'bg-gray-900 text-white scale-105'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }
                `}
              >
                €{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="mb-6">
          <p className="text-gray-700 font-semibold mb-3">Importo Personalizzato</p>
          <div className="relative">
            <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-lg focus:outline-none focus:border-gray-900 transition-colors"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <p className="text-gray-700 font-semibold mb-3">Metodo di Pagamento</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedMethod('card')}
              className={`
                flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all
                ${
                  selectedMethod === 'card'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }
              `}
            >
              <CreditCard className="w-5 h-5" strokeWidth={2.5} />
              Carta
            </button>
            <button
              onClick={() => setSelectedMethod('cash')}
              className={`
                flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all
                ${
                  selectedMethod === 'cash'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }
              `}
            >
              <Euro className="w-5 h-5" strokeWidth={2.5} />
              Contanti
            </button>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleTopUp}
          disabled={!amount || parseFloat(amount) <= 0 || loading}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Elaborazione...
            </>
          ) : (
            <>
              Ricarica €{amount || '0.00'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
