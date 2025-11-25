import { useState } from 'react'
import { Copy, Share2, Users, Trophy, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'

interface InviteFriendsModalProps {
  onClose: () => void
}

export default function InviteFriendsModal({ onClose }: InviteFriendsModalProps) {
  const { customer } = useAuth()
  const { organization } = useOrganization()
  const [copied, setCopied] = useState(false)

  if (!customer || !organization) return null

  const referralCode = customer.referral_code || 'LOADING...'
  const friendsInvited = customer.friends_invited || 0
  const pointsEarned = customer.referral_points_earned || 0

  // Trova il prossimo tier - con fallback se referral_tiers non esiste
  const referralTiers = organization.referral_tiers || []
  const sortedTiers = [...referralTiers].sort((a, b) => a.friends_required - b.friends_required)
  const nextTier = sortedTiers.find(tier => tier.friends_required > friendsInvited)
  const currentTier = sortedTiers.reverse().find(tier => tier.friends_required <= friendsInvited)

  const friendsToNext = nextTier ? nextTier.friends_required - friendsInvited : 0
  const progressPercent = nextTier
    ? (friendsInvited / nextTier.friends_required) * 100
    : 100

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/${organization.slug}/register?ref=${referralCode}`
    const shareText = `Unisciti a ${organization.name} con il mio codice ${referralCode} e guadagna punti!`

    if (navigator.share) {
      navigator.share({
        title: `Invito a ${organization.name}`,
        text: shareText,
        url: shareUrl
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      alert('Link copiato negli appunti!')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-white flex items-center justify-center z-[9999] overflow-y-auto"
      onClick={onClose}
    >
      <div className="w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header con back button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
          </button>
          <h2 className="text-xl font-black text-gray-900">
            Invita Amici
          </h2>
          <div className="w-10"></div>
        </div>

        <div className="space-y-6">
          {/* Header con Gradiente */}
          <div className="relative bg-gradient-to-br from-red-600 via-red-500 to-rose-600 px-6 py-8 rounded-3xl shadow-2xl">
            {/* Titolo */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-white mb-1">
                Team {organization.name}
              </h3>
              <p className="text-red-50 text-sm">
                Invita amici, guadagna {organization.points_name}!
              </p>
            </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Amici Invitati
                </span>
              </div>
              <p className="text-3xl font-black text-white">
                {friendsInvited}
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-white" strokeWidth={2.5} />
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  {organization.points_name} Guadagnati
                </span>
              </div>
              <p className="text-3xl font-black text-white">
                +{pointsEarned}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Codice Referral */}
          <div>
            <label className="block text-gray-600 text-xs font-bold mb-2 uppercase tracking-wide">
              Il Tuo Codice Univoco
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-center">
                <p className="text-xl font-black text-gray-900 tracking-wider">
                  {referralCode}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Copy className={`w-5 h-5 ${copied ? 'text-green-600' : 'text-gray-600'}`} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Progress Bar con Next Tier */}
          {nextTier && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-600 text-xs font-bold uppercase tracking-wide">
                  Prossimo Bonus: {nextTier.name}
                </label>
                <span className="text-gray-900 text-sm font-bold">
                  {friendsToNext} amici mancanti
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              {/* Descrizione */}
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                {nextTier.description}
              </p>
            </div>
          )}

          {/* Tutti i Livelli Referral */}
          <div>
            <label className="block text-gray-600 text-xs font-bold mb-3 uppercase tracking-wide">
              Livelli Referral
            </label>
            <div className="space-y-2">
              {sortedTiers.reverse().map((tier, index) => {
                const isAchieved = friendsInvited >= tier.friends_required
                const isCurrent = currentTier?.name === tier.name

                return (
                  <div
                    key={index}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      isCurrent
                        ? 'bg-red-50 border-red-500'
                        : isAchieved
                        ? 'bg-green-50 border-green-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Trophy
                          className={`w-5 h-5 ${
                            isCurrent
                              ? 'text-red-600'
                              : isAchieved
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                          strokeWidth={2.5}
                        />
                        <span className={`font-bold text-sm ${
                          isCurrent || isAchieved ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {tier.name}
                        </span>
                      </div>
                      <span className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-red-600'
                          : isAchieved
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}>
                        +{tier.points_reward} {organization.points_name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {tier.description}
                    </p>
                    <p className="text-xs font-semibold text-gray-500">
                      Richiede {tier.friends_required} {tier.friends_required === 1 ? 'amico' : 'amici'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
          </div>

          {/* Bottone Share */}
          <button
            onClick={handleShare}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-base hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" strokeWidth={2.5} />
            Condividi Link Invito
          </button>
        </div>
      </div>
    </div>
  )
}
