import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import BottomNav from '../components/Layout/BottomNav'
import NotificationsPanel from '../components/NotificationsPanel'
import InviteFriendsModal from '../components/InviteFriendsModal'
import FlashOfferModal from '../components/FlashOfferModal'
import ChatButton from '../components/ChatButton'
import { couponsService } from '../services/couponsService'

export default function Home() {
  const { customer, loading: authLoading } = useAuth()
  const { loyaltyTiers, organization } = useOrganization()
  const navigate = useNavigate()
  const { slug } = useParams()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedFlashOffer, setSelectedFlashOffer] = useState<any>(null)
  const [savedOffers, setSavedOffers] = useState<string[]>([])
  const [flashOffers, setFlashOffers] = useState<any[]>([])
  const [loadingOffers, setLoadingOffers] = useState(true)

  useEffect(() => {
    if (!authLoading && !customer) {
      navigate(`/${slug}/login`, { replace: true })
    }
  }, [customer, authLoading, navigate, slug])

  // Load flash offers from database
  useEffect(() => {
    const loadFlashOffers = async () => {
      if (!customer?.organization_id) return

      console.log('📦 Loading flash offers for organization:', customer.organization_id)
      setLoadingOffers(true)

      try {
        const offers = await couponsService.getFlashCoupons(customer.organization_id)
        console.log('✅ Loaded flash offers:', offers.length)

        // Convert to UI format (max 3 flash offers)
        const formattedOffers = offers.slice(0, 3).map(offer => ({
          id: offer.id,
          title: offer.title,
          description: offer.description,
          code: offer.code,
          discount: couponsService.getBadgeText(offer),
          expiresInHours: couponsService.getHoursUntilExpiration(offer.valid_until)
        }))

        setFlashOffers(formattedOffers)
      } catch (error) {
        console.error('❌ Error loading flash offers:', error)
      } finally {
        setLoadingOffers(false)
      }
    }

    loadFlashOffers()
  }, [customer?.organization_id])

  const handleShare = () => {
    if (!customer || !organization) return

    const referralCode = customer.referral_code || 'LOADING'
    const shareUrl = `${window.location.origin}/${slug}/register?ref=${encodeURIComponent(referralCode)}`
    const shareText = `Unisciti a ${organization.name} con il mio codice ${referralCode} e guadagna punti!`

    if (navigator.share) {
      navigator.share({
        title: `Invito a ${organization.name}`,
        text: shareText,
        url: shareUrl
      }).catch(() => {})
    } else {
      // Fallback: copia il link negli appunti
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      alert('Link copiato negli appunti!')
    }
  }

  const handleSaveOffer = (offerId: string) => {
    setSavedOffers(prev => [...prev, offerId])
    // Flash offers are now loaded from database and visible in Coupons page
    // No need to save to localStorage anymore
  }

  if (authLoading || !customer) {
    return null
  }

  const currentTier = loyaltyTiers.find(t => t.name === customer.tier) || loyaltyTiers[0]
  const currentTierIndex = loyaltyTiers.findIndex(t => t.name === customer.tier)
  const nextTier = currentTierIndex >= 0 ? loyaltyTiers[currentTierIndex + 1] : loyaltyTiers[0]

  // Calcola la progressione verso il prossimo livello
  const previousThreshold = currentTier?.threshold || 0
  const nextThreshold = nextTier?.threshold || (previousThreshold + 1000)
  const pointsInCurrentTier = (customer.points || 0) - previousThreshold
  const pointsNeededForNextTier = nextThreshold - previousThreshold
  const progress = (pointsInCurrentTier / pointsNeededForNextTier) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      {/* Header con gradiente burgundy scuro */}
      <div className="relative bg-gradient-to-br from-red-900 via-red-800 to-red-900 px-6 pt-8 pb-40 rounded-b-[2.5rem] shadow-2xl overflow-hidden group">
        {/* Effetto "Shine" Olografico (Animato) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-700 animate-shine pointer-events-none"></div>

        {/* Luci Statiche */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

        {/* Contenuto Header (relative per stare sopra gli effetti) */}
        <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {/* Avatar utente con bordo giallo ed effetto 3D */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 p-0.5 shadow-xl shadow-yellow-500/50">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  {customer?.avatar_url ? (
                    <img
                      src={customer.avatar_url}
                      alt={customer?.name || 'User'}
                      className="w-full h-full rounded-full object-cover shadow-inner"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-inner">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              {/* Riflesso luce superiore per effetto 3D */}
              <div className="absolute top-1 left-1/4 w-6 h-6 bg-white/30 rounded-full blur-sm pointer-events-none"></div>
            </div>
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wider font-medium">
                {customer.gender === 'male' ? 'BENTORNATO' : customer.gender === 'female' ? 'BENTORNATA' : 'BENTORNATO/A'}
              </p>
              <h1 className="text-white text-xl font-bold">
                {customer.name || 'Cliente'}
              </h1>
            </div>
          </div>
          {/* Notification bell */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center relative hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
          </button>
        </div>

        {/* Cerchio con anello di progressione */}
        <div className="relative flex flex-col items-center -mb-32">
          {/* Progress ring - mostra solo progressione verso prossimo livello */}
          <div className="relative w-56 h-56">
            {/* Background ring - grigio scuro semitrasparente */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="85"
                stroke="rgba(139, 69, 19, 0.2)"
                strokeWidth="16"
                fill="none"
              />
              {/* Progress ring - solo la parte completata in giallo */}
              <circle
                cx="100"
                cy="100"
                r="85"
                stroke="#EAB308"
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 85}`}
                strokeDashoffset={`${2 * Math.PI * 85 * (1 - Math.min(Math.max(progress, 0), 100) / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-700"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.5))'
                }}
              />
            </svg>

            {/* Inner circle - sfondo rosso scuro */}
            <div className="absolute inset-0 m-8 rounded-full bg-gradient-to-br from-red-800 to-red-900 flex flex-col items-center justify-center shadow-2xl">
              <h2 className="text-white text-6xl font-black mb-1">
                {customer.points || 0}
              </h2>
              <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Punti</p>
            </div>
          </div>

          {/* Badge livello sotto il cerchio */}
          <div className="mt-4 px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-xl">
            <p className="text-yellow-900 font-black text-base tracking-wide">
              {currentTier?.name || 'Base'}
            </p>
          </div>

          {/* Testo progressione */}
          <div className="mt-3 text-center">
            {nextTier ? (
              <p className="text-white/90 text-sm font-medium">
                Mancano <span className="font-bold text-yellow-400">{nextThreshold - (customer.points || 0)}</span> punti per <span className="font-bold">{nextTier.name}</span>
              </p>
            ) : (
              <p className="text-white/90 text-sm font-medium">
                <span className="font-bold text-yellow-400">Livello massimo raggiunto!</span>
              </p>
            )}
            {/* Barra di progressione gialla */}
            <div className="w-48 h-1.5 bg-red-950/40 rounded-full overflow-hidden mx-auto mt-2">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(Math.max(progress, 0), 100)}%`,
                  boxShadow: '0 0 8px rgba(234, 179, 8, 0.6)'
                }}
              ></div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Contenuto sotto - spacing per il cerchio che esce */}
      <div className="mt-36">
        {/* Sezione "Per te" - Offerte personalizzate */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900">Per te</h3>
          </div>

          {/* Flash Offers Cards - Caricamento dinamico */}
          {loadingOffers ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Caricamento offerte...</p>
            </div>
          ) : flashOffers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessuna offerta flash al momento</p>
            </div>
          ) : (
            flashOffers.map((offer, index) => (
              <button
                key={offer.id}
                onClick={() => setSelectedFlashOffer(offer)}
                className="w-full bg-gradient-to-br from-red-600 via-red-500 to-pink-500 rounded-2xl p-6 shadow-xl mb-4 hover:scale-[1.02] transition-transform text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-white text-xs font-semibold">Scelto per te</span>
                  </div>
                  <div className="text-right">
                    <span className="text-yellow-300 text-4xl font-black">{offer.discount}</span>
                  </div>
                </div>

                <h4 className="text-white text-xl font-bold mb-2 leading-tight">
                  {offer.title}
                </h4>
                <p className="text-white/90 text-sm mb-5 leading-relaxed">
                  {offer.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-white/80 text-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Scade in {offer.expiresInHours < 1
                        ? `${Math.floor(offer.expiresInHours * 60)}min`
                        : `${Math.floor(offer.expiresInHours)}h`}
                    </span>
                  </div>
                </div>

                {/* Coupon code card */}
                <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-red-600 font-bold text-sm tracking-wider">{offer.code}</span>
                  </div>
                </div>
              </button>
            ))
          )}

          {/* Card Invita un Amico */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl mb-4 relative overflow-hidden">
            {/* Decorative circle - cliccabile per aprire modal */}
            <button
              onClick={() => setShowInviteModal(true)}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gray-700/30 flex items-center justify-center hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>

            <h4 className="text-yellow-400 text-2xl font-bold mb-2 relative z-10">
              Invita un Amico
            </h4>
            <p className="text-gray-300 text-sm mb-4 pr-24 relative z-10">
              Guadagna <span className="text-yellow-400 font-bold">500 punti</span> per ogni amico che si iscrive.
            </p>
            <button
              onClick={handleShare}
              className="px-6 py-3 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors relative z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Invita ora
            </button>
          </div>

          {/* Attività Recente */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Attività Recente</h3>
              <button className="text-red-600 text-sm font-semibold flex items-center gap-1">
                Vedi tutto
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="text-center text-gray-500 text-sm mb-4">
                Nessuna transazione recente
              </div>
              {/* Simple activity graph placeholder */}
              <div className="h-20 flex items-end gap-1">
                {[20, 40, 30, 50, 45, 60, 55, 70, 65, 80].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-red-200 to-red-100 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pannello Notifiche */}
      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteFriendsModal onClose={() => setShowInviteModal(false)} />
      )}

      {/* Flash Offer Modal */}
      {selectedFlashOffer && (
        <FlashOfferModal
          offer={selectedFlashOffer}
          onClose={() => setSelectedFlashOffer(null)}
          onSave={handleSaveOffer}
        />
      )}

      {/* Chat Button */}
      <ChatButton />

      <BottomNav />
    </div>
  )
}
