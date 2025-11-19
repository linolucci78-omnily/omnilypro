import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Trophy, CreditCard, MessageCircle } from 'lucide-react'
import BottomNav from '../components/Layout/BottomNav'

export default function Card() {
  const { customer } = useAuth()
  const { organization, loyaltyTiers } = useOrganization()
  const navigate = useNavigate()
  const { slug } = useParams()

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  const currentTier = loyaltyTiers.find(t => t.name === customer.tier) || loyaltyTiers[0]

  // QR Code data - stesso formato del POS per compatibilità
  const qrData = `OMNILY_CUSTOMER:${customer.id}`
  const userCode = `u_${customer.id.substring(0, 3)}`

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Contenitore principale con padding */}
      <div className="p-6 pt-8">
        {/* Loyalty Card - gradiente rosso */}
        <div className="bg-gradient-to-br from-red-800 via-red-700 to-red-800 rounded-3xl shadow-2xl p-6 mb-6">
          {/* Header card con nome organizzazione e trofeo */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-white text-2xl font-bold mb-1">
                {organization?.name || 'LUCE'}
              </h1>
              <p className="text-white/70 text-sm uppercase tracking-widest">
                LOYALTY CLUB
              </p>
            </div>
            <Trophy className="w-12 h-12 text-yellow-400" strokeWidth={2} />
          </div>

          {/* Member name */}
          <div className="mb-6">
            <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
              MEMBER NAME
            </p>
            <h2 className="text-white text-xl font-bold">
              {customer.name || 'Membro'}
            </h2>
          </div>

          {/* Tier e icona credito */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
                TIER
              </p>
              <p className="text-yellow-400 text-lg font-bold">
                {currentTier?.name || 'Base'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white/60" />
            </div>
          </div>
        </div>

        {/* Sezione Carta Fedeltà - bianca */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          {/* Divider rosso in alto */}
          <div className="w-full h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full mb-6"></div>

          {/* Titolo */}
          <h3 className="text-gray-900 text-2xl font-bold text-center mb-2">
            Carta Fedeltà
          </h3>
          <p className="text-gray-500 text-center mb-8">
            Mostra questo codice in cassa
          </p>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-white rounded-2xl border-4 border-dashed border-pink-200">
              <QRCodeSVG
                value={qrData}
                size={280}
                level="H"
                includeMargin={false}
                fgColor="#000000"
              />
            </div>
          </div>

          {/* User code */}
          <p className="text-gray-900 text-xl font-bold text-center tracking-wider">
            {userCode}
          </p>
        </div>
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
