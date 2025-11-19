import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Ticket, MessageCircle, Clock, Copy } from 'lucide-react'
import BottomNav from '../components/Layout/BottomNav'

interface Coupon {
  id: number
  title: string
  description: string
  badgeText: string
  badgeType: 'percentage' | 'free' | 'promo'
  code: string
  expiryDate: string
  status: 'active' | 'used'
}

export default function Coupons() {
  const { customer } = useAuth()
  const navigate = useNavigate()
  const { slug } = useParams()
  const [expandedCoupon, setExpandedCoupon] = useState<number | null>(null)
  const [copiedCode, setCopiedCode] = useState<number | null>(null)

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  // Mock coupons data
  const coupons: Coupon[] = [
    {
      id: 1,
      title: 'Sconto Colazione',
      description: '20% di sconto su tutti i prodotti da colazione entro le 10:00.',
      badgeText: '-20%',
      badgeType: 'percentage',
      code: 'MORNING20',
      expiryDate: '30 Nov 2023',
      status: 'active'
    },
    {
      id: 2,
      title: 'Caffè Omaggio',
      description: 'Un caffè espresso in omaggio con qualsiasi acquisto di pasticceria.',
      badgeText: 'FREE',
      badgeType: 'free',
      code: 'FREECOFFEE',
      expiryDate: '15 Dic 2023',
      status: 'active'
    },
    {
      id: 3,
      title: 'Happy Hour',
      description: 'Paghi 1 prendi 2 su tutti gli aperitivi dalle 18:00.',
      badgeText: '2x1',
      badgeType: 'promo',
      code: 'HAPPYHOUR2X1',
      expiryDate: '31 Dic 2023',
      status: 'active'
    },
    {
      id: 4,
      title: 'Buono Compleanno',
      description: 'Una fetta di torta in omaggio per il tuo compleanno.',
      badgeText: 'GIFT',
      badgeType: 'free',
      code: 'BDAY2023',
      expiryDate: '31 Gen 2024',
      status: 'used'
    }
  ]

  const handleToggleCoupon = (couponId: number) => {
    setExpandedCoupon(expandedCoupon === couponId ? null : couponId)
  }

  const handleCopyCode = (couponId: number, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(couponId)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Coupon
          </h1>
          <p className="text-gray-500 text-base">
            Le tue offerte esclusive
          </p>
        </div>
        {/* Icon */}
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <Ticket className="w-8 h-8 text-red-600" strokeWidth={2} />
        </div>
      </div>

      {/* Coupons List */}
      <div className="px-6 space-y-4">
        {coupons.map((coupon) => {
          const isExpanded = expandedCoupon === coupon.id

          return (
            <div key={coupon.id} className="relative">
              {/* Main coupon card */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="flex items-stretch">
                  {/* Left badge */}
                  <div className="w-32 bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center relative flex-shrink-0">
                    <p className="text-white font-black text-3xl">
                      {coupon.badgeText}
                    </p>
                    {/* Notch effect */}
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 pr-3">
                    {/* Title and badge */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-gray-900 font-bold text-lg flex-1">
                        {coupon.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ml-2 ${
                        coupon.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {coupon.status === 'active' ? 'ATTIVO' : 'USATO'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {coupon.description}
                    </p>

                    {/* Footer with expiry and button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Scade: {coupon.expiryDate}</span>
                      </div>

                      {coupon.status === 'active' && (
                        <button
                          onClick={() => handleToggleCoupon(coupon.id)}
                          className="px-5 py-2 bg-white border-2 border-red-600 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                        >
                          {isExpanded ? 'Nascondi' : 'Usa Ora'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded QR section with smooth transition */}
                <div
                  className={`bg-gray-900 px-6 border-t-2 border-dashed border-gray-300 transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded && coupon.status === 'active'
                      ? 'max-h-[600px] py-8 opacity-100'
                      : 'max-h-0 py-0 opacity-0'
                  }`}
                >
                    <p className="text-white text-center mb-4 font-medium">
                      Mostra questo codice in cassa
                    </p>

                    {/* Code with copy button */}
                    <div className="bg-white rounded-xl p-4 mb-6 flex items-center justify-between">
                      <span className="text-gray-900 font-bold text-xl tracking-wider">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(coupon.id, coupon.code)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Copy className={`w-5 h-5 ${copiedCode === coupon.id ? 'text-green-600' : 'text-gray-400'}`} />
                      </button>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-2xl">
                        <QRCodeSVG
                          value={`COUPON:${coupon.code}`}
                          size={200}
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chat button floating */}
      <button className="fixed bottom-24 right-6 w-16 h-16 bg-gray-800 rounded-full shadow-2xl flex items-center justify-center z-50">
        <MessageCircle className="w-7 h-7 text-white" fill="white" />
        {/* Green dot */}
        <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
      </button>

      <BottomNav />
    </div>
  )
}
