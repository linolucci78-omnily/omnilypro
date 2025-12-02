import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Trophy, QrCode, Lock } from 'lucide-react'
import confetti from 'canvas-confetti'
import BottomNav from '../components/Layout/BottomNav'
import { rewardsService, type Reward } from '../services/rewardsService'
import { supabase } from '../services/supabase'

export default function Rewards() {
  const { customer, refreshCustomer } = useAuth()
  const navigate = useNavigate()
  const { slug } = useParams()
  const [activeTab, setActiveTab] = useState<'catalog' | 'myRewards'>('catalog')
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState<any>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [myRewards, setMyRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [redeemedRewardName, setRedeemedRewardName] = useState('')
  const [redemptionId, setRedemptionId] = useState<string | null>(null)
  const [successAudio] = useState(() => {
    const audio = new Audio('/sounds/mixkit-winning-notification-2018.wav')
    audio.volume = 1.0
    audio.load()
    return audio
  })

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  // Carica premi dal database
  useEffect(() => {
    const loadRewards = async () => {
      if (!customer?.organization_id) {
        console.log('❌ No organization_id for customer')
        return
      }

      console.log('📦 Loading rewards for organization:', customer.organization_id)
      setLoading(true)
      try {
        // Carica tutti i premi attivi
        const allRewards = await rewardsService.getActiveRewards(customer.organization_id)
        console.log('✅ Loaded rewards:', allRewards.length, 'rewards')
        console.log('📋 Rewards data:', allRewards)
        setRewards(allRewards)

        // Carica storico riscatti (se disponibile)
        if (customer.id) {
          const redemptions = await rewardsService.getCustomerRedemptions(
            customer.id,
            customer.organization_id
          )
          console.log('✅ Loaded redemptions:', redemptions.length, 'items')
          setMyRewards(redemptions)
        }
      } catch (error) {
        console.error('❌ Error loading rewards:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRewards()
  }, [customer?.id, customer?.organization_id])

  // Supabase Realtime per ricevere notifiche quando viene riscattato un premio
  useEffect(() => {
    if (!customer?.id || !showRedeemModal) return

    console.log('🔌 Realtime listener attivato per customer:', customer.id)

    const channel = supabase
      .channel('reward_redemptions_listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reward_redemptions',
          filter: `customer_id=eq.${customer.id}`
        },
        async (payload) => {
          console.log('🎉 Nuovo riscatto ricevuto da Realtime!', payload)

          const newRedemption = payload.new as any

          // Chiudi il modal del QR code
          setShowRedeemModal(false)
          setShowConfirmModal(false)

          // Ottieni il nome del premio
          const rewardName = newRedemption.reward_name || selectedReward?.name || 'Premio'
          setRedeemedRewardName(rewardName)

          // Trigger confetti
          triggerConfetti()

          // Mostra modal di successo
          setShowSuccessModal(true)

          // Ricarica i dati del cliente (per aggiornare i punti)
          await refreshCustomer()

          // Ricarica la lista dei premi riscattati
          const redemptions = await rewardsService.getCustomerRedemptions(
            customer.id,
            customer.organization_id
          )
          setMyRewards(redemptions)

          // Dopo 3 secondi, passa al tab "I Miei Premi"
          setTimeout(() => {
            setShowSuccessModal(false)
            setActiveTab('myRewards')
          }, 3000)
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
      })

    return () => {
      console.log('🔌 Realtime listener disattivato')
      supabase.removeChannel(channel)
    }
  }, [customer?.id, customer?.organization_id, showRedeemModal])

  // Realtime listener per quando un premio viene marcato come "usato" dal POS
  useEffect(() => {
    if (!customer?.id) return

    console.log('🔌 Realtime UPDATE listener attivato per customer:', customer.id)

    const channel = supabase
      .channel('reward_redemptions_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reward_redemptions',
          filter: `customer_id=eq.${customer.id}`
        },
        async (payload) => {
          console.log('✅ Premio marcato come usato da Realtime!', payload)

          const updatedRedemption = payload.new as any

          // Controlla se è stato appena usato (used_at è stato impostato)
          if (updatedRedemption.used_at && !payload.old?.used_at) {
            console.log('🎉 Premio appena utilizzato!')

            // Chiudi il modal del QR se è aperto
            setShowRedeemModal(false)

            // Mostra il nome del premio utilizzato
            setRedeemedRewardName(updatedRedemption.reward_name || 'Premio')

            // Trigger confetti
            triggerConfetti()

            // Riproduci suono di successo
            playSuccessSound()

            // Mostra modal di successo
            setShowSuccessModal(true)

            // Nascondi il modal dopo 3 secondi
            setTimeout(() => {
              setShowSuccessModal(false)
            }, 3000)
          }

          // Ricarica la lista dei premi riscattati per aggiornare lo stato
          const redemptions = await rewardsService.getCustomerRedemptions(
            customer.id,
            customer.organization_id
          )
          setMyRewards(redemptions)
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime UPDATE subscription status:', status)
      })

    return () => {
      console.log('🔌 Realtime UPDATE listener disattivato')
      supabase.removeChannel(channel)
    }
  }, [customer?.id, customer?.organization_id])

  const handleRedeemClick = (reward: any) => {
    setSelectedReward(reward)
    setShowConfirmModal(true)
  }

  const playSuccessSound = async () => {
    try {
      console.log('🔊 Riproduzione suono di successo...')

      // Reset audio to beginning
      successAudio.currentTime = 0
      successAudio.volume = 1.0

      await successAudio.play()
      console.log('✅ Suono riprodotto con successo! Volume:', successAudio.volume)
    } catch (error) {
      console.error('❌ Errore riproduzione audio:', error)

      // Fallback: prova con un beep sintetizzato FORTE
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 1000
        oscillator.type = 'square'

        gainNode.gain.setValueAtTime(1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.6)

        console.log('🔊 Fallback: beep sintetizzato riprodotto')
      } catch (fallbackError) {
        console.error('❌ Anche il fallback è fallito:', fallbackError)
      }
    }
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#dc2626', '#fbbf24', '#ffffff']
    })
  }

  const handleConfirmRedeem = async () => {
    if (!customer || !selectedReward) return

    setShowConfirmModal(false)

    console.log('🎁 Premio selezionato:', selectedReward)
    console.log('🔑 Creazione redemption per:', selectedReward.name)

    // Crea il redemption nel database (stato "In Attesa")
    const result = await rewardsService.createRedemption(
      customer.id,
      customer.organization_id,
      selectedReward.id,
      selectedReward.name,
      selectedReward.type || 'product',
      selectedReward.value || '',
      selectedReward.points_required,
      customer.points
    )

    if (!result.success) {
      console.error('❌ Errore creazione redemption:', result.error)
      alert('Errore durante il riscatto del premio. Riprova.')
      return
    }

    console.log('✅ Redemption creato con ID:', result.redemptionId)

    // Salva l'ID del redemption per il QR code
    setRedemptionId(result.redemptionId!)

    // Ricarica la lista dei redemptions per mostrarlo in "I Miei Premi"
    const updatedRedemptions = await rewardsService.getCustomerRedemptions(customer.id, customer.organization_id)
    setMyRewards(updatedRedemptions)
    console.log('📋 Lista redemptions aggiornata:', updatedRedemptions.length)

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
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Caricamento premi...</p>
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nessun premio disponibile</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rewards.map((reward) => {
                const canRedeem = (customer.points || 0) >= reward.points_required

                return (
                  <div
                    key={reward.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 transition-all hover:shadow-xl"
                  >
                    {/* Immagine con zoom effect */}
                    <div className="relative h-40 overflow-hidden bg-gray-100">
                      {reward.image_url ? (
                        <img
                          src={reward.image_url}
                          alt={reward.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Trophy className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      {/* Badge punti */}
                      <div className="absolute top-3 right-3 bg-white rounded-lg px-3 py-1.5 shadow-md">
                        <span className="text-red-600 font-bold text-sm">{reward.points_required} pt</span>
                      </div>
                    </div>

                    {/* Contenuto card */}
                    <div className="p-4">
                      {/* Nome */}
                      <h3 className="text-gray-900 font-bold text-base mb-1 leading-tight">
                        {reward.name}
                      </h3>

                      {/* Descrizione */}
                      {reward.description && (
                        <p className="text-gray-500 text-xs mb-2 leading-relaxed">
                          {reward.description}
                        </p>
                      )}

                      {/* Tier richiesto - solo se non riscattabile */}
                      {!canRedeem && reward.required_tier && (
                        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <Lock className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700">
                            Richiede livello {reward.required_tier}
                          </span>
                        </div>
                      )}

                      {/* Punti mancanti - solo se non riscattabile per punti insufficienti */}
                      {!canRedeem && !reward.required_tier && (
                        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <Lock className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-semibold text-gray-600">
                            Mancano {reward.points_required - (customer.points || 0)} punti
                          </span>
                        </div>
                      )}

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
                        {canRedeem ? (
                          <>
                            Riscatta
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Non disponibile
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
              {myRewards.map((reward) => {
                const isUsed = reward.used_at != null

                return (
                  <div
                    key={reward.id}
                    className={`rounded-2xl shadow-md border overflow-hidden transition-all relative ${
                      isUsed
                        ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                        : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                    }`}
                  >
                    {/* Badge colorato in alto a destra */}
                    <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full font-bold text-xs shadow-lg ${
                      isUsed
                        ? 'bg-gray-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {isUsed ? '✓ Usato' : '⏱ In Attesa'}
                    </div>

                    <div className="flex items-center gap-4 p-4">
                      {/* Immagine */}
                      {reward.image_url || reward.image ? (
                        <img
                          src={reward.image_url || reward.image}
                          alt={reward.reward_name || reward.name}
                          className={`w-24 h-24 rounded-xl object-cover ${
                            isUsed ? 'grayscale opacity-70' : ''
                          }`}
                        />
                      ) : (
                        <div className={`w-24 h-24 rounded-xl flex items-center justify-center ${
                          isUsed
                            ? 'bg-gray-200'
                            : 'bg-yellow-100'
                        }`}>
                          <Trophy className={`w-12 h-12 ${
                            isUsed ? 'text-gray-400' : 'text-yellow-500'
                          }`} />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className={`font-bold text-base mb-1 pr-20 ${
                          isUsed ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          {reward.reward_name || reward.name}
                        </h3>
                        <p className={`text-sm mb-3 ${
                          isUsed ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {isUsed
                            ? `Usato il ${new Date(reward.used_at).toLocaleDateString('it-IT')} alle ${new Date(reward.used_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
                            : `Riscattato il ${new Date(reward.redeemed_at).toLocaleDateString('it-IT')} alle ${new Date(reward.redeemed_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
                          }
                        </p>

                        {/* Pulsante Usa Ora (solo se non usato) */}
                        {!isUsed && (
                          <button
                            onClick={() => handleUseReward(reward)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 transition-colors shadow-md"
                          >
                            <QrCode className="w-4 h-4" />
                            Usa Ora
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Conferma Riscatto */}
      {showConfirmModal && selectedReward && (
        <div
          className="fixed inset-0 bg-white flex items-center justify-center z-[9999] overflow-y-auto"
          onClick={() => setShowConfirmModal(false)}
        >
          <div className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {/* Header con back button */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-xl font-black text-gray-900">
                Conferma Riscatto
              </h2>
              <div className="w-10"></div>
            </div>

            <div className="space-y-6">
              {/* Immagine del premio */}
              <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                {selectedReward.image_url || selectedReward.image ? (
                  <img
                    src={selectedReward.image_url || selectedReward.image}
                    alt={selectedReward.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Titolo */}
              <h2 className="text-2xl font-black text-gray-900 text-center">
                {selectedReward.name}
              </h2>
              <p className="text-gray-600 text-center">
                Vuoi davvero spendere <span className="text-red-600 font-bold">{selectedReward.points} punti</span> per questo premio?
              </p>

              {/* Pulsanti */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-base hover:bg-gray-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmRedeem}
                  className="py-4 bg-red-600 text-white rounded-xl font-bold text-base hover:bg-red-700 transition-colors"
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Riscatto con QR Code */}
      {showRedeemModal && selectedReward && (
        <div
          className="fixed inset-0 bg-white flex items-center justify-center z-[9999] overflow-y-auto"
          onClick={() => setShowRedeemModal(false)}
        >
          <div className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {/* Header con back button */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowRedeemModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-xl font-black text-gray-900">
                Premio Riscattato
              </h2>
              <div className="w-10"></div>
            </div>

            <div className="space-y-6">
              {/* Icona trofeo con animazione */}
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                  <Trophy className="w-12 h-12 text-green-600" strokeWidth={2.5} />
                </div>
              </div>

              {/* Titolo */}
              <div>
                <h3 className="text-3xl font-black text-gray-900 text-center mb-2">
                  Congratulazioni!
                </h3>
                <p className="text-gray-600 text-center">
                  Mostra questo QR in cassa per ritirare il tuo premio
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-dashed border-green-300 shadow-lg">
                <div className="flex justify-center bg-white rounded-xl p-4">
                  <QRCodeSVG
                    value={JSON.stringify({ redemptionId: redemptionId || selectedReward.id, type: 'use_reward' })}
                    size={240}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-900 font-bold text-lg">
                  {selectedReward.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Successo Riscatto */}
      {showSuccessModal && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 z-50"></div>

          {/* Modal */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 max-w-md mx-auto">
            <div className="p-8 text-center">
              {/* Icona trofeo con animazione */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                  <Trophy className="w-16 h-16 text-green-600" strokeWidth={2.5} />
                </div>
              </div>

              {/* Titolo */}
              <h2 className="text-4xl font-black text-gray-900 mb-4">
                Premio Utilizzato!
              </h2>

              <p className="text-xl text-gray-600 mb-2">
                Il tuo premio <span className="font-bold text-green-600">{redeemedRewardName}</span>
              </p>

              <p className="text-lg text-gray-600 mb-6">
                è stato utilizzato con successo!
              </p>

              <p className="text-sm text-gray-500">
                Grazie per averci scelto! 🎉
              </p>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  )
}
