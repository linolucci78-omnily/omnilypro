import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Trophy, QrCode } from 'lucide-react'
import confetti from 'canvas-confetti'
import BottomNav from '../components/Layout/BottomNav'

export default function Rewards() {
  const { customer } = useAuth()
  const navigate = useNavigate()
  const { slug } = useParams()
  const [activeTab, setActiveTab] = useState<'catalog' | 'myRewards'>('catalog')
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState<any>(null)

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  // Mock premi riscattati
  const myRewards = [
    {
      id: 1,
      name: 'Espresso Premium',
      redeemedDate: '2023-10-24',
      code: 'RDM-R1-PREV',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
      used: false
    }
  ]

  // Mock rewards data - con immagini placeholder
  const mockRewards = [
    {
      id: 1,
      name: 'Espresso Premium',
      category: 'BEVANDE',
      description: 'Un caffè espresso miscela arabica 100%.',
      points: 150,
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      name: 'Cornetto Artigianale',
      category: 'COLAZIONE',
      description: 'Scegli tra crema, cioccolato o marmellata.',
      points: 250,
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      name: 'Cappuccino Grande',
      category: 'BEVANDE',
      description: 'Doppio shot di espresso e latte montato.',
      points: 300,
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      name: 'Torta della Nonna',
      category: 'DOLCI',
      description: 'Una fetta della nostra torta fatta in casa.',
      points: 500,
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop'
    }
  ]

  const handleRedeemClick = (reward: any) => {
    setSelectedReward(reward)
    setShowConfirmModal(true)
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#dc2626', '#fbbf24', '#ffffff']
    })
  }

  const handleConfirmRedeem = () => {
    setShowConfirmModal(false)

    // Trigger confetti
    triggerConfetti()

    // Dopo 1 secondo mostra il modal con QR
    setTimeout(() => {
      setShowRedeemModal(true)
    }, 1000)
  }

  const handleUseReward = (reward: any) => {
    setSelectedReward(reward)
    setShowRedeemModal(true)
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header pulito */}
      <div className="px-6 pt-8 pb-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Premi
        </h2>
        <p className="text-gray-600">
          Hai <span className="text-red-600 font-bold">{customer.points || 0}</span> punti disponibili
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'catalog'
                ? 'bg-gray-100 text-gray-900'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            Catalogo
          </button>
          <button
            onClick={() => setActiveTab('myRewards')}
            className={`py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'myRewards'
                ? 'bg-white text-gray-900 border-2 border-blue-600'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            I Miei Premi
          </button>
        </div>
      </div>

      {/* Contenuto tab - Catalogo */}
      {activeTab === 'catalog' && (
        <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          {mockRewards.map((reward) => {
            const canRedeem = (customer.points || 0) >= reward.points

            return (
              <div
                key={reward.id}
                className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 transition-all hover:shadow-xl"
              >
                {/* Immagine con zoom effect */}
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  <img
                    src={reward.image}
                    alt={reward.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  {/* Badge punti */}
                  <div className="absolute top-3 right-3 bg-white rounded-lg px-3 py-1.5 shadow-md">
                    <span className="text-red-600 font-bold text-sm">{reward.points} pt</span>
                  </div>
                </div>

                {/* Contenuto card */}
                <div className="p-4">
                  {/* Categoria */}
                  <p className="text-red-600 text-xs font-bold uppercase tracking-wide mb-1">
                    {reward.category}
                  </p>

                  {/* Nome */}
                  <h3 className="text-gray-900 font-bold text-base mb-1 leading-tight">
                    {reward.name}
                  </h3>

                  {/* Descrizione */}
                  <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                    {reward.description}
                  </p>

                  {/* Pulsante Riscatta */}
                  <button
                    onClick={() => handleRedeemClick(reward)}
                    disabled={!canRedeem}
                    className={`
                      w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
                      ${canRedeem
                        ? 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    Riscatta
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        </div>
      )}

      {/* Contenuto tab - I Miei Premi */}
      {activeTab === 'myRewards' && (
        <div className="px-6 pb-6">
          {myRewards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Non hai ancora riscattato premi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Immagine */}
                    <img
                      src={reward.image}
                      alt={reward.name}
                      className="w-24 h-24 rounded-xl object-cover"
                    />

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-gray-900 font-bold text-base mb-1">
                        {reward.name}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3">
                        Riscattato il {reward.redeemedDate}
                      </p>

                      {/* Pulsante Usa Ora */}
                      <button
                        onClick={() => handleUseReward(reward)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                        Usa Ora
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Conferma Riscatto */}
      {showConfirmModal && selectedReward && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowConfirmModal(false)}
          ></div>

          {/* Modal */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 max-w-md mx-auto">
            <div className="p-8">
              {/* Immagine del premio */}
              <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-6">
                <img
                  src={selectedReward.image}
                  alt={selectedReward.name}
                  className="w-full h-full object-cover"
                />
                {/* X button */}
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="absolute top-3 right-3 w-10 h-10 bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Titolo */}
              <h2 className="text-2xl font-black text-gray-900 text-center mb-2">
                {selectedReward.name}
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Vuoi davvero spendere <span className="text-red-600 font-bold">{selectedReward.points} punti</span> per questo premio?
              </p>

              {/* Pulsanti */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-base hover:bg-gray-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmRedeem}
                  className="py-3 bg-red-600 text-white rounded-xl font-semibold text-base hover:bg-red-700 transition-colors"
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Riscatto con QR Code */}
      {showRedeemModal && selectedReward && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowRedeemModal(false)}
          ></div>

          {/* Modal */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 max-w-md mx-auto">
            <div className="p-8">
              {/* Icona trofeo con animazione */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                  <Trophy className="w-12 h-12 text-green-600" strokeWidth={2.5} />
                </div>
              </div>

              {/* Titolo */}
              <h2 className="text-3xl font-black text-gray-900 text-center mb-2">
                Congratulazioni!
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Hai riscattato <span className="font-bold">{selectedReward.name}</span>.
              </p>

              {/* QR Code */}
              <div className="bg-pink-50 rounded-2xl p-6 border-4 border-dashed border-pink-300 mb-6">
                <p className="text-red-500 text-sm font-bold text-center mb-4 uppercase tracking-wide">
                  Scansiona in cassa
                </p>
                <div className="flex justify-center mb-4">
                  <QRCodeSVG
                    value={`REWARD:${selectedReward.code}`}
                    size={220}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-red-600 text-lg font-bold text-center tracking-wider">
                  {selectedReward.code}
                </p>
              </div>

              {/* Pulsante chiudi */}
              <button
                onClick={() => setShowRedeemModal(false)}
                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-base hover:bg-gray-800 transition-colors"
              >
                Chiudi e vai ai Miei Premi
              </button>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  )
}
