import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Send, Gift, Share2, Copy, History } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import BottomNav from '../components/Layout/BottomNav'
import ChatButton from '../components/ChatButton'
import { giftCertificatesService, type GiftCertificate } from '../services/giftCertificatesService'
import { walletService, type WalletTransaction } from '../services/walletService'
import { Toast } from '../components/Toast'

interface GiftCard {
  id: string
  code: string
  amount: number
  balance: number
  color: string
  from?: string
  status: string
  issuedAt: string
}

export default function Wallet() {
  const { customer } = useAuth()
  const { organization } = useOrganization()
  const navigate = useNavigate()
  const { slug } = useParams()
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  // Carica wallet balance e gift certificates
  useEffect(() => {
    const loadWalletData = async () => {
      if (!organization?.id || !customer?.id) return

      setLoading(true)
      try {
        // Carica wallet balance
        const wallet = await walletService.getOrCreateWallet(organization.id, customer.id)
        setWalletBalance(wallet.balance)
        setWalletId(wallet.id)

        // Carica gift certificates
        const certificates = await giftCertificatesService.getCustomerGiftCertificates(
          organization.id,
          customer.email,
          customer.phone || undefined
        )

        // Converti i gift certificates in GiftCard format
        const cards: GiftCard[] = certificates.map((cert, index) => ({
          id: cert.id,
          code: cert.code,
          amount: cert.original_amount,
          balance: cert.current_balance,
          color: getColorForIndex(index),
          from: cert.recipient_name || undefined,
          status: cert.status,
          issuedAt: cert.issued_at
        }))

        setGiftCards(cards)
      } catch (error) {
        console.error('Error loading wallet data:', error)
        setToast({ message: 'Errore caricamento dati wallet', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    loadWalletData()
  }, [organization?.id, customer?.id, customer?.email, customer?.phone])

  // Helper per assegnare colori diversi alle gift cards
  const getColorForIndex = (index: number): string => {
    const colors = [
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600'
    ]
    return colors[index % colors.length]
  }

  // Controlla se l'organizzazione ha il wallet abilitato
  const hasWalletEnabled = organization?.wallet_enabled || false

  const handleRedeemCard = async () => {
    if (!selectedCard || !hasWalletEnabled || !organization?.id || !customer?.id) return

    setRedeeming(true)
    try {
      // Riscatta il gift certificate nel wallet
      const result = await walletService.redeemGiftCertificate(
        organization.id,
        customer.id,
        selectedCard.code
      )

      if (result.success) {
        // Aggiorna il saldo wallet
        if (result.newBalance !== undefined) {
          setWalletBalance(result.newBalance)
        }

        // Segna la gift card come usata nello state locale
        setGiftCards(prev =>
          prev.map(card =>
            card.id === selectedCard.id
              ? { ...card, status: 'fully_used', balance: 0 }
              : card
          )
        )

        setToast({
          message: `€${selectedCard.balance.toFixed(2)} aggiunti al wallet!`,
          type: 'success'
        })
        setSelectedCard(null)
      } else {
        setToast({
          message: result.error || 'Errore durante il riscatto',
          type: 'error'
        })
      }
    } catch (error: any) {
      console.error('Error redeeming card:', error)
      setToast({
        message: 'Errore imprevisto durante il riscatto',
        type: 'error'
      })
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={() => navigate(`/${slug}/profile`)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
        </button>
        <h1 className="text-2xl font-black text-gray-900">
          Wallet
        </h1>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 shadow-xl">
          {/* Saldo */}
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">
            Saldo Disponibile
          </p>
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-white text-5xl font-black">€</span>
            <span className="text-white text-5xl font-black">{walletBalance.toFixed(2)}</span>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => navigate(`/${slug}/wallet/transactions`)}
              className="flex items-center justify-center gap-2 py-3.5 bg-white text-gray-900 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-colors"
            >
              <History className="w-5 h-5" strokeWidth={2.5} />
              Storico Transazioni
            </button>
          </div>

          {/* Info message */}
          <p className="text-gray-400 text-xs text-center mt-4">
            La ricarica del wallet sarà disponibile prossimamente
          </p>
        </div>

        {/* Gift Cards Section */}
        <div>
          <h2 className="text-xl font-black text-gray-900 mb-4">
            Gift Card Digitali
          </h2>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">Caricamento gift certificates...</p>
            </div>
          )}

          {/* Gift Cards Grid */}
          {!loading && giftCards.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {giftCards.map((card) => {
                const isUsed = card.status === 'fully_used'
                return (
                  <button
                    key={card.id}
                    onClick={() => !isUsed && setSelectedCard(card)}
                    disabled={isUsed}
                    className={`relative rounded-2xl p-6 text-left shadow-lg transition-all ${
                      isUsed
                        ? 'bg-gradient-to-br from-gray-300 to-gray-400 opacity-60 cursor-not-allowed'
                        : `bg-gradient-to-br ${card.color} hover:scale-105`
                    }`}
                  >
                    {/* Gift Icon */}
                    <div className="mb-8">
                      <Gift className={`w-10 h-10 ${isUsed ? 'text-gray-500' : 'text-white'}`} strokeWidth={2} />
                </div>

                    {/* Code */}
                    <p className={`font-bold text-base mb-2 break-words ${isUsed ? 'text-gray-600' : 'text-white'}`}>
                      {card.code}
                    </p>

                    {/* Balance */}
                    <p className={`text-2xl font-black ${isUsed ? 'text-gray-600' : 'text-white'}`}>
                      €{card.balance.toFixed(2)}
                    </p>

                    {/* Status Badge */}
                    {isUsed && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-gray-600 rounded-lg">
                        <span className="text-white text-xs font-bold uppercase">Usato</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Info message */}
          <p className="text-gray-400 text-xs text-center mt-2">
            Tocca un gift certificate per riscattarlo e aggiungerlo al tuo wallet
          </p>

          {/* Empty State */}
          {!loading && giftCards.length === 0 && (
            <div className="text-center py-8">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">Nessun gift certificate trovato</p>
              <p className="text-gray-400 text-sm mt-2">I tuoi gift certificates appariranno qui</p>
            </div>
          )}

        </div>
      </div>

      {/* Chat button */}
      <ChatButton />

      {/* Gift Card Details Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-white flex items-center justify-center z-[9999] overflow-y-auto"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con pulsante back */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedCard(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
              </button>
              <h2 className="text-xl font-black text-gray-900">
                Dettagli Gift Certificate
              </h2>
              <div className="w-10"></div> {/* Spacer per centrare il titolo */}
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Card Preview */}
              <div className={`bg-gradient-to-br ${selectedCard.color} rounded-2xl p-6 text-center shadow-lg`}>
                <div className="flex justify-center mb-4">
                  <Gift className="w-12 h-12 text-white" strokeWidth={2} />
                </div>

                <p className="text-white text-4xl font-black mb-3">
                  €{selectedCard.balance.toFixed(2)}
                </p>
                {selectedCard.balance !== selectedCard.amount && (
                  <p className="text-white/80 text-sm mb-2">
                    Valore originale: €{selectedCard.amount.toFixed(2)}
                  </p>
                )}

                <p className="text-white text-lg font-bold tracking-wider mb-4">
                  {selectedCard.code}
                </p>

                {selectedCard.from && (
                  <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <p className="text-white text-sm font-semibold">
                      Da: {selectedCard.from}
                    </p>
                  </div>
                )}
              </div>

              {/* SE L'ORGANIZZAZIONE HA WALLET ABILITATO */}
              {hasWalletEnabled ? (
                <>
                  <button
                    onClick={handleRedeemCard}
                    disabled={redeeming}
                    className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {redeeming ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Riscatto in corso...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                        Riscatta nel Wallet
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleShareCard}
                    className="w-full py-3.5 bg-gray-100 text-gray-900 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-5 h-5" strokeWidth={2.5} />
                    Invia ad un amico
                  </button>
                </>
              ) : (
                /* SE L'ORGANIZZAZIONE NON HA WALLET - MOSTRA QR CODE */
                <>
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-gray-900 text-center mb-3 font-semibold text-sm">
                      Mostra questo codice in cassa
                    </p>

                    {/* QR Code */}
                    <div className="flex justify-center mb-3">
                      <QRCodeSVG
                        value={`GIFTCARD:${selectedCard.code}`}
                        size={180}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    {/* Code with copy button */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <span className="text-gray-900 font-bold text-base tracking-wider">
                        {selectedCard.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(selectedCard.code)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Copy className={`w-5 h-5 ${copiedCode ? 'text-green-600' : 'text-gray-400'}`} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleShareCard}
                    className="w-full py-3.5 bg-gray-100 text-gray-900 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-5 h-5" strokeWidth={2.5} />
                    Invia ad un amico
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <BottomNav />
    </div>
  )
}
