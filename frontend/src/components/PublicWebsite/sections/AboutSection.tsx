import React from 'react'

interface AboutSectionProps {
  name: string
  description?: string
  industry?: string
  primaryColor: string
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  name,
  description,
  industry,
  primaryColor,
}) => {
  const defaultDescription = `${name} è un'attività ${industry ? `nel settore ${industry}` : 'locale'} che si dedica a fornire i migliori servizi ai propri clienti. La nostra missione è garantire la massima soddisfazione attraverso qualità, professionalità e attenzione al cliente.`

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold text-center mb-6"
            style={{ color: primaryColor }}
          >
            Chi Siamo
          </h2>

          <div className="w-24 h-1 mx-auto mb-12" style={{ backgroundColor: primaryColor }}></div>

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <p className="text-xl mb-6 text-center">
              {description || defaultDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Qualità</h3>
              <p className="text-gray-600">Eccellenza in ogni dettaglio</p>
            </div>

            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Professionalità</h3>
              <p className="text-gray-600">Team esperto e qualificato</p>
            </div>

            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Passione</h3>
              <p className="text-gray-600">Amore per ciò che facciamo</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
