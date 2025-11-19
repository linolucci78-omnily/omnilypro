import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Trophy, RefreshCw, Star } from 'lucide-react'
import BottomNav from '../components/Layout/BottomNav'
import ChatButton from '../components/ChatButton'

export default function Card() {
  const { customer } = useAuth()
  const { organization, loyaltyTiers } = useOrganization()
  const navigate = useNavigate()
  const { slug } = useParams()
  const [isFlipped, setIsFlipped] = useState(false)

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  const currentTier = loyaltyTiers.find(t => t.name === customer.tier) || loyaltyTiers[0]

  // QR Code data - stesso formato del POS per compatibilità
  const qrData = `OMNILY_CUSTOMER:${customer.id}`

  // Genera numero carta dal customer ID (mascherato)
  const customerId = customer.id || '0000'
  const last4 = customerId.slice(-4).padStart(4, '0')
  const cardNumber = `4829 1039 5821` // Numero fisso per ora

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-4 border-b border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          La tua Carta
        </h1>
        <p className="text-gray-500 text-base">
          Scansiona per raccogliere punti
        </p>
      </div>

      {/* Contenitore principale con padding */}
      <div className="p-6 pt-8">
        {/* CARTA 3D ANIMATA - CONTENITORE CON PROSPETTIVA */}
        <div className="w-full perspective-1000 group cursor-pointer mb-8" onClick={() => setIsFlipped(!isFlipped)}>

          {/* WRAPPER ANIMATO - Oggetto che fluttua */}
          <div className={`relative w-full aspect-[1.6/1] transition-all duration-700 transform-style-3d animate-float-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

            {/* LATO ANTERIORE (FRONT) */}
            <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden shadow-2xl shadow-red-900/40 border-r-2 border-b-4 border-black/20">

              {/* STRATO 1: Base Colore Gradiente */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-rose-900"></div>

              {/* STRATO 2: Texture Pattern a pois */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.5) 1.5px, transparent 1.5px)',
                  backgroundSize: '20px 20px'
                }}
              ></div>

              {/* STRATO 3: Effetto "Shine" Olografico (Animato) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-700 animate-shine"></div>

              {/* STRATO 4: Luci Statiche (Riflessi fissi agli angoli) */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full blur-2xl -ml-10 -mb-10"></div>

              {/* STRATO 5: Contenuto Reale */}
              <div className="relative h-full p-6 flex flex-col justify-between text-white z-10">
                {/* Header Card */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-black text-2xl tracking-tighter italic drop-shadow-lg">
                      {organization?.name?.toUpperCase() || 'LUCE'}
                    </h2>
                    <p className="text-[10px] tracking-[0.3em] uppercase opacity-80 drop-shadow-md">
                      Loyalty Club
                    </p>
                  </div>
                  <Trophy size={32} className="text-yellow-400 drop-shadow-lg filter brightness-110" />
                </div>

                {/* Footer Card */}
                <div>
                  <div className="flex items-end gap-4 mb-2">
                    <span
                      className="text-4xl font-mono tracking-widest drop-shadow-md"
                      style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}
                    >
                      •••• {last4}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] uppercase opacity-60 mb-0.5 drop-shadow">Card Holder</p>
                      <p className="font-medium text-sm tracking-wide drop-shadow-md">
                        {customer.name?.toUpperCase() || 'MEMBRO'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase opacity-60 mb-0.5 drop-shadow">Tier</p>
                      <p className="font-bold text-yellow-400 text-sm flex items-center gap-1 drop-shadow-md">
                        <Star size={10} fill="currentColor" />
                        {currentTier?.name || 'Gold'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LATO POSTERIORE (BACK) */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl overflow-hidden shadow-2xl bg-gray-900 text-white p-6 flex flex-col justify-between border border-gray-700">
              <div>
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-1">Supporto Membri</h3>
                <p className="text-sm">+39 02 123 4567</p>
                <p className="text-sm">vip@{organization?.slug || 'luce'}.com</p>
              </div>
              <div className="flex items-center justify-center flex-1 opacity-10">
                <Trophy size={80} />
              </div>
              <div className="text-[10px] text-gray-500 leading-tight">
                Questa carta è personale e non cedibile. L'uso costituisce accettazione dei termini e condizioni del programma {organization?.name || 'Luce'} Loyalty.
              </div>
            </div>
          </div>

          {/* Ombra del pavimento (fluttua in sincrono) */}
          <div className="w-[80%] h-4 bg-black/20 mx-auto rounded-[100%] blur-xl mt-8 animate-pulse"></div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="p-1 bg-white rounded-2xl">
              <QRCodeSVG
                value={qrData}
                size={260}
                level="H"
                includeMargin={false}
                fgColor="#000000"
              />
            </div>
          </div>

          {/* Numero completo */}
          <p className="text-gray-900 text-2xl font-bold text-center tracking-[8px] mb-4 font-mono">
            {cardNumber}
          </p>

          {/* Punti Fedeltà */}
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider font-medium">
              Punti Fedeltà
            </span>
          </div>
        </div>
      </div>

      {/* Chat button */}
      <ChatButton />

      <BottomNav />
    </div>
  )
}
