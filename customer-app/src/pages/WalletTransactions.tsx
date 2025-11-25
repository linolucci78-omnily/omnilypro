import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Gift, CreditCard, RefreshCw } from 'lucide-react'
import BottomNav from '../components/Layout/BottomNav'
import { walletService, type WalletTransaction } from '../services/walletService'

export default function WalletTransactions() {
  const { customer } = useAuth()
  const { organization } = useOrganization()
  const navigate = useNavigate()
  const { slug } = useParams()
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [walletId, setWalletId] = useState<string | null>(null)

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  useEffect(() => {
    const loadTransactions = async () => {
      if (!organization?.id || !customer?.id) return

      setLoading(true)
      try {
        // Ottieni wallet
        const wallet = await walletService.getOrCreateWallet(organization.id, customer.id)
        setWalletId(wallet.id)

        // Carica transazioni
        const txs = await walletService.getTransactions(wallet.id, 100)
        setTransactions(txs)
      } catch (error) {
        console.error('Error loading transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [organization?.id, customer?.id])

  const getTransactionIcon = (type: WalletTransaction['type']) => {
    switch (type) {
      case 'credit':
      case 'top_up':
        return <TrendingUp className="w-5 h-5 text-green-600" strokeWidth={2.5} />
      case 'gift_certificate_redeem':
        return <Gift className="w-5 h-5 text-purple-600" strokeWidth={2.5} />
      case 'refund':
        return <RefreshCw className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
      case 'debit':
      case 'payment':
        return <TrendingDown className="w-5 h-5 text-red-600" strokeWidth={2.5} />
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" strokeWidth={2.5} />
    }
  }

  const getTransactionLabel = (type: WalletTransaction['type']) => {
    switch (type) {
      case 'credit':
        return 'Accredito'
      case 'debit':
        return 'Addebito'
      case 'gift_certificate_redeem':
        return 'Riscatto Gift Certificate'
      case 'refund':
        return 'Rimborso'
      case 'payment':
        return 'Pagamento'
      case 'top_up':
        return 'Ricarica'
      default:
        return 'Transazione'
    }
  }

  const isCredit = (type: WalletTransaction['type']) => {
    return ['credit', 'gift_certificate_redeem', 'refund', 'top_up'].includes(type)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Oggi ' + date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ieri ' + date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={() => navigate(`/${slug}/wallet`)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
        </button>
        <h1 className="text-2xl font-black text-gray-900">Storico Transazioni</h1>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">Caricamento...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nessuna Transazione</h3>
            <p className="text-gray-500">Le tue transazioni appariranno qui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const credit = isCredit(tx.type)
              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-12 h-12 rounded-xl flex items-center justify-center
                          ${
                            credit
                              ? 'bg-green-50'
                              : 'bg-red-50'
                          }
                        `}
                      >
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{getTransactionLabel(tx.type)}</p>
                        <p className="text-sm text-gray-500">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`
                          text-xl font-black
                          ${credit ? 'text-green-600' : 'text-red-600'}
                        `}
                      >
                        {credit ? '+' : '-'}€{tx.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Saldo: €{tx.balance_after.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {tx.description && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      {tx.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
