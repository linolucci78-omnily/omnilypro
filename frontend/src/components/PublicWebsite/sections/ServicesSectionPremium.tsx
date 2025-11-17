import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Sparkles, ArrowRight } from 'lucide-react'
import * as Icons from 'lucide-react'

interface Service {
  title: string
  description: string
  icon: string
  image?: string
}

interface ServicesSectionPremiumProps {
  services: Service[]
  primaryColor: string
  bgType?: string
  bgColor?: string
  bgGradientStart?: string
  bgGradientEnd?: string
  bgImage?: string
  enableParallax?: boolean
  enableOverlay?: boolean
  overlayColor?: string
  overlayOpacity?: number
  textColor?: string
}

export const ServicesSectionPremium: React.FC<ServicesSectionPremiumProps> = ({
  services,
  primaryColor,
  bgType = 'gradient',
  bgColor = '#f8fafc',
  bgGradientStart = '#f8fafc',
  bgGradientEnd = '#e2e8f0',
  bgImage,
  enableParallax = false,
  enableOverlay = false,
  overlayColor = '#000000',
  overlayOpacity = 0.5,
  textColor = '#1f2937',
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Parallax effect
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  // Calculate background
  const getBackground = () => {
    if (bgType === 'color') {
      return bgColor
    } else if (bgType === 'gradient') {
      return `linear-gradient(180deg, ${bgGradientStart} 0%, ${bgGradientEnd} 100%)`
    } else if (bgType === 'image' && bgImage) {
      return `url(${bgImage})`
    }
    return bgColor
  }

  // Return null if no services
  if (!services || services.length === 0) {
    return null
  }

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent || Icons.Sparkles
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] },
    },
  }

  return (
    <section
      id="services"
      className="relative py-32 overflow-hidden"
      style={{
        background: bgType === 'image' ? 'transparent' : getBackground(),
      }}
    >
      {/* Background image with overlay and parallax */}
      {bgType === 'image' && bgImage && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute inset-0 w-full h-[120%]"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              y: enableParallax ? y : 0,
            }}
          />
          {enableOverlay && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: overlayColor,
                opacity: overlayOpacity,
              }}
            />
          )}
        </div>
      )}

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div
          className="absolute top-0 right-0 w-1/2 h-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }}
        />
        <div
          className="absolute bottom-0 left-0 w-1/2 h-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }}
        />
      </div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-20"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 mb-6"
          >
            <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm font-semibold text-gray-700">I Nostri Servizi</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-black mb-6" style={{ color: textColor }}>
            Cosa{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)` }}
            >
              Offriamo
            </span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-xl max-w-3xl mx-auto" style={{ color: textColor, opacity: 0.8 }}>
            Servizi di alta qualità pensati per soddisfare ogni tua esigenza
          </motion.p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => {
            const IconComponent = getIcon(service.icon)
            const gradients = [
              'from-blue-500 to-cyan-500',
              'from-purple-500 to-pink-500',
              'from-orange-500 to-red-500',
              'from-green-500 to-emerald-500',
              'from-yellow-500 to-orange-500',
              'from-pink-500 to-rose-500',
            ]
            const gradient = gradients[index % gradients.length]

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -15, scale: 1.02 }}
                className="group relative"
              >
                <div className="relative h-full p-8 rounded-3xl bg-white shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />

                  {/* Image if provided */}
                  {service.image && (
                    <div className="relative h-48 -mx-8 -mt-8 mb-6 overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    </div>
                  )}

                  {/* Icon */}
                  <div className="relative mb-6">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} p-0.5 group-hover:scale-110 transition-transform duration-500`}
                    >
                      <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                        <IconComponent className="w-8 h-8 text-gray-700" />
                      </div>
                    </div>
                    {/* Glow effect */}
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
                    />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:translate-x-1 transition-transform duration-500">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>

                  {/* Learn more link */}
                  <motion.div
                    className="flex items-center gap-2 font-semibold group-hover:gap-3 transition-all"
                    style={{ color: primaryColor }}
                  >
                    <span>Scopri di più</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000" />

                  {/* Corner decoration */}
                  <div
                    className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-full opacity-5"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, transparent)` }}
                  />
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
