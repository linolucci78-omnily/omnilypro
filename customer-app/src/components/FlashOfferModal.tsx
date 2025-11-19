import { useState, useEffect } from 'react'
import { X, Copy, Sparkles, Clock, Save } from 'lucide-react'

interface FlashOfferModalProps {
  offer: {
    id: number
    title: string
    description: string
    code: string
    discount: string
    expiresInHours: number
  }
  onClose: () => void
  onSave: (offerId: number) => void
}

export default function FlashOfferModal({ offer, onClose, onSave }: FlashOfferModalProps) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(offer.expiresInHours)

  useEffect(() => {
    // Timer countdown (in real app, calculate from actual expiry timestamp)
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 0.0001 : 0))
    }, 3600) // Update every hour for display

    return () => clearInterval(interval)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    onSave(offer.id)
    onClose()
  }

  const formatTimeLeft = (hours: number) => {
    const h = Math.floor(hours)
    return `${h}h`
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md pb-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient - SOLO icona sparkle grande */}
        <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-t-3xl pt-8 pb-12 overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>

          {/* Grande icona sparkle al centro */}
          <div className="flex justify-center">
            <Sparkles className="w-24 h-24 text-yellow-300" fill="currentColor" strokeWidth={1.5} />
          </div>

          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Content */}
        <div className="px-6 pt-4">
          {/* Badge Flash e Timer */}
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-2 bg-yellow-100 rounded-full">
              <span className="text-yellow-900 text-xs font-bold uppercase tracking-wider">
                Flash Offer
              </span>
            </div>
            <div className="px-4 py-2 bg-red-50 rounded-full flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              <span className="text-red-600 text-xs font-bold">
                {formatTimeLeft(timeLeft)}
              </span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-gray-900 text-2xl font-black mb-2">
            {offer.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-6">
            {offer.description}
          </p>

          {/* Promo Code Card */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase mb-1">
                  Codice Promo
                </p>
                <span className="text-red-600 text-xl font-black tracking-wider">
                  {offer.code}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="p-3 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Copy className={`w-5 h-5 ${copied ? 'text-green-600' : 'text-gray-400'}`} />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-base hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2 mb-3"
          >
            <Save className="w-5 h-5" />
            Salva per dopo
          </button>

          {/* Info text */}
          <p className="text-gray-400 text-xs text-center leading-relaxed">
            Salvando l'offerta, il timer di {formatTimeLeft(timeLeft)} continuerà a scorrere nel tuo portafoglio.
          </p>
        </div>
      </div>
    </div>
  )
}
