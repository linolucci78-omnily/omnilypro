import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Send, Gift, Share2, Copy } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import BottomNav from '../components/Layout/BottomNav'
import ChatButton from '../components/ChatButton'

interface GiftCard {
  id: number
  code: string
  amount: number
  color: string
  from?: string
  used?: boolean
}

export default function Wallet() {
  const { customer } = useAuth()
  const { organization } = useOrganization()
  const navigate = useNavigate()
  const { slug } = useParams()
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  // Mock gift cards (in produzione verranno da database)
  const [giftCards, setGiftCards] = useState<GiftCard[]>([
    {
      id: 1,
      code: 'BDAY-LUCE-24',
      amount: 25.00,
      color: 'from-purple-500 to-purple-600',
      from: 'Marco',
      used: false
    },
    {
      id: 2,
      code: 'COFFEE-TIME',
      amount: 10.00,
      color: 'from-pink-500 to-pink-600',
      from: 'Sofia',
      used: false
    }
  ])

  const [walletBalance, setWalletBalance] = useState(15.50)

  // Controlla se l'organizzazione ha il wallet abilitato
  const hasWalletEnabled = organization?.wallet_enabled || false

  const handleRedeemCard = () => {
    if (!selectedCard || !hasWalletEnabled) return

    // Aggiungi il valore al wallet
    setWalletBalance(prev => prev + selectedCard.amount)

    // Segna la gift card come usata
    setGiftCards(prev =>
      prev.map(card =>
        card.id === selectedCard.id ? { ...card, used: true } : card
      )
    )

    setSelectedCard(null)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleShareCard = () => {
    // TODO: Implement share logic
    setSelectedCard(null)
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
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-4 bg-white text-gray-900 rounded-2xl font-bold text-base hover:bg-gray-100 transition-colors">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Ricarica
            </button>
            <button className="flex items-center justify-center gap-2 py-4 bg-gray-700 text-white rounded-2xl font-bold text-base hover:bg-gray-600 transition-colors">
              <Send className="w-5 h-5" strokeWidth={2.5} />
              Invia
            </button>
          </div>
        </div>

        {/* Gift Cards Section */}
        <div>
          <h2 className="text-xl font-black text-gray-900 mb-4">
            Gift Card Digitali
          </h2>

          {/* Gift Cards Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {giftCards.map((card) => (
              <button
                key={card.id}
                onClick={() => !card.used && setSelectedCard(card)}
                disabled={card.used}
                className={`relative rounded-2xl p-6 text-left transition-all shadow-lg ${
                  card.used
                    ? 'bg-gradient-to-br from-gray-300 to-gray-400 opacity-60 cursor-not-allowed'
                    : `bg-gradient-to-br ${card.color} hover:scale-105`
                }`}
              >
                {/* Gift Icon */}
                <div className="mb-8">
                  <Gift className={`w-10 h-10 ${card.used ? 'text-gray-500' : 'text-white'}`} strokeWidth={2} />
                </div>

                {/* Code */}
                <p className={`font-bold text-base mb-2 break-words ${card.used ? 'text-gray-600' : 'text-white'}`}>
                  {card.code}
                </p>

                {/* Amount */}
                <p className={`text-2xl font-black ${card.used ? 'text-gray-600' : 'text-white'}`}>
                  €{card.amount.toFixed(2)}
                </p>

                {/* Used Badge */}
                {card.used && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-gray-600 rounded-lg">
                    <span className="text-white text-xs font-bold uppercase">Usato</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Add New Card Button */}
          <button className="w-full py-6 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors">
            <Plus className="w-5 h-5" />
            <span className="font-semibold text-base">Aggiungi nuova carta</span>
          </button>
        </div>
      </div>

      {/* Chat button */}
      <ChatButton />

      {/* Gift Card Details Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-[100]"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md pb-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="pt-4 pb-3 px-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900 text-center">
                Dettagli Gift Card
              </h2>
            </div>

            {/* Content */}
            <div className="px-6 pt-4 space-y-4">
              {/* Card Preview */}
              <div className={`bg-gradient-to-br ${selectedCard.color} rounded-2xl p-6 text-center shadow-lg`}>
                <div className="flex justify-center mb-4">
                  <Gift className="w-12 h-12 text-white" strokeWidth={2} />
                </div>

                <p className="text-white text-4xl font-black mb-3">
                  €{selectedCard.amount.toFixed(2)}
                </p>

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
                    className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                    Riscatta nel Wallet
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

              {/* Close Button */}
              <button
                onClick={() => setSelectedCard(null)}
                className="w-full py-3 text-gray-500 font-semibold text-sm hover:text-gray-700 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
