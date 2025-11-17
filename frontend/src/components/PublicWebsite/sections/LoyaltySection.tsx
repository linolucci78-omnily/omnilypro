import React from 'react'

interface LoyaltySectionProps {
  pointsName?: string
  pointsPerEuro?: number
  rewardThreshold?: number
  welcomeBonus?: number
  primaryColor: string
  secondaryColor: string
  featuredRewards?: Array<{
    id: string
    name: string
    description?: string
    points_required: number
    type: string
  }>
}

export const LoyaltySection: React.FC<LoyaltySectionProps> = ({
  pointsName = 'Punti',
  pointsPerEuro = 1,
  rewardThreshold = 100,
  welcomeBonus = 0,
  primaryColor,
  secondaryColor,
  featuredRewards = [],
}) => {
  return (
    <section id="loyalty" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold text-center mb-6"
            style={{ color: primaryColor }}
          >
            Programma Fedeltà
          </h2>

          <div className="w-24 h-1 mx-auto mb-12" style={{ backgroundColor: primaryColor }}></div>

          <p className="text-xl text-center text-gray-700 mb-16 max-w-3xl mx-auto">
            Vieni premiato ogni volta che ci scegli! Accumula {pointsName.toLowerCase()} ad ogni acquisto e sblocca premi esclusivi.
          </p>

          {/* How it works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center transform hover:scale-105 transition-transform">
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">Iscriviti Gratis</h3>
              <p className="text-gray-600 mb-4">
                Registrati al nostro programma fedeltà in pochi secondi
              </p>
              {welcomeBonus > 0 && (
                <div
                  className="inline-block px-4 py-2 rounded-full text-white font-semibold"
                  style={{ backgroundColor: secondaryColor }}
                >
                  +{welcomeBonus} {pointsName} di benvenuto!
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg text-center transform hover:scale-105 transition-transform">
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">Accumula {pointsName}</h3>
              <p className="text-gray-600 mb-4">
                Ogni €1 speso ti fa guadagnare <strong>{pointsPerEuro}</strong> {pointsName.toLowerCase()}
              </p>
              <div className="text-4xl font-bold" style={{ color: primaryColor }}>
                €1 = {pointsPerEuro}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg text-center transform hover:scale-105 transition-transform">
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">Riscatta Premi</h3>
              <p className="text-gray-600 mb-4">
                A partire da <strong>{rewardThreshold}</strong> {pointsName.toLowerCase()} puoi richiedere fantastici premi
              </p>
              <svg className="w-16 h-16 mx-auto" style={{ color: secondaryColor }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
              </svg>
            </div>
          </div>

          {/* Featured Rewards */}
          {featuredRewards.length > 0 && (
            <div className="mb-16">
              <h3 className="text-3xl font-bold text-center mb-8 text-gray-800">
                Premi in Evidenza
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredRewards.slice(0, 3).map((reward) => (
                  <div
                    key={reward.id}
                    className="bg-white rounded-xl p-6 shadow-md border-2 border-transparent hover:border-opacity-100 transition-all"
                    style={{ borderColor: `${primaryColor}40` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">
                        {reward.type === 'discount' ? 'Sconto' : reward.type === 'freeProduct' ? 'Omaggio' : 'Premio'}
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {reward.points_required} {pointsName}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold mb-2">{reward.name}</h4>
                    {reward.description && (
                      <p className="text-gray-600 text-sm">{reward.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            <div className="bg-white rounded-2xl p-12 shadow-xl">
              <h3 className="text-3xl font-bold mb-4">Inizia Subito!</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Scansiona il QR code con il tuo smartphone per iscriverti al programma fedeltà
              </p>
              <div className="inline-block p-8 bg-gray-100 rounded-2xl mb-8">
                {/* TODO: Generate dynamic QR code */}
                <div className="w-48 h-48 bg-white border-4 border-gray-300 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">QR Code</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Oppure scarica la nostra app mobile dagli store
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
