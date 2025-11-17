import React from 'react'

interface Service {
  title: string
  description: string
  icon?: string
  price?: string
}

interface ServicesSectionProps {
  services: Service[]
  primaryColor: string
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  primaryColor,
}) => {
  if (!services || services.length === 0) return null

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold text-center mb-6"
            style={{ color: primaryColor }}
          >
            I Nostri Servizi
          </h2>

          <div className="w-24 h-1 mx-auto mb-16" style={{ backgroundColor: primaryColor }}></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-shadow border border-gray-100"
              >
                {service.icon && (
                  <div className="mb-6">
                    <span className="text-5xl">{service.icon}</span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {service.description}
                </p>
                {service.price && (
                  <div
                    className="text-2xl font-bold mt-4"
                    style={{ color: primaryColor }}
                  >
                    {service.price}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
