import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Check, X, Sparkles } from 'lucide-react'

interface PricingPlan {
  name: string
  price: string
  period: string
  description?: string
  features: string[]
  excludedFeatures?: string[]
  highlighted?: boolean
  ctaText?: string
  ctaLink?: string
}

interface PricingSectionPremiumProps {
  plans: PricingPlan[]
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

export const PricingSectionPremium: React.FC<PricingSectionPremiumProps> = ({
  plans,
  primaryColor,
  bgType = 'gradient',
  bgColor = '#ffffff',
  bgGradientStart = '#ffffff',
  bgGradientEnd = '#f8fafc',
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

  // Return null if no plans
  if (!plans || plans.length === 0) {
    return null
  }

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <section
      id="pricing"
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
            <span className="text-sm font-semibold text-gray-700">Listino</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-black mb-6" style={{ color: textColor }}>
            Scegli il{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)` }}
            >
              Piano Perfetto
            </span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-xl max-w-3xl mx-auto" style={{ color: textColor, opacity: 0.8 }}>
            Piani flessibili per ogni esigenza
          </motion.p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className={`grid gap-8 ${
            plans.length === 1
              ? 'max-w-md mx-auto'
              : plans.length === 2
              ? 'md:grid-cols-2 max-w-4xl mx-auto'
              : plans.length === 3
              ? 'md:grid-cols-3'
              : 'md:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`relative p-8 rounded-3xl bg-white shadow-xl border-2 transition-all duration-300 ${
                plan.highlighted
                  ? 'border-transparent ring-4'
                  : 'border-gray-100 hover:shadow-2xl'
              }`}
              style={{
                ringColor: plan.highlighted ? primaryColor : undefined,
              }}
            >
              {/* Highlighted badge */}
              {plan.highlighted && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-sm font-bold whitespace-nowrap"
                  style={{ backgroundColor: primaryColor }}
                >
                  Più Popolare
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                {plan.name}
              </h3>

              {/* Description */}
              {plan.description && (
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
              )}

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-5xl font-black"
                    style={{ color: primaryColor }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-gray-600 text-lg">/{plan.period}</span>
                </div>
              </div>

              {/* CTA Button */}
              <motion.a
                href={plan.ctaLink || '#contact'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`block w-full py-4 px-6 rounded-xl text-center font-bold mb-8 transition-all duration-300 ${
                  plan.highlighted
                    ? 'text-white shadow-lg'
                    : 'border-2 hover:shadow-lg'
                }`}
                style={{
                  backgroundColor: plan.highlighted ? primaryColor : 'transparent',
                  borderColor: plan.highlighted ? 'transparent' : primaryColor,
                  color: plan.highlighted ? '#ffffff' : primaryColor,
                }}
              >
                {plan.ctaText || 'Inizia Ora'}
              </motion.a>

              {/* Features */}
              <div className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Check className="w-3 h-3" style={{ color: primaryColor }} />
                    </div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}

                {/* Excluded features */}
                {plan.excludedFeatures && plan.excludedFeatures.map((feature, featureIndex) => (
                  <div key={`excluded-${featureIndex}`} className="flex items-start gap-3 opacity-50">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-gray-100">
                      <X className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-gray-500 text-sm line-through">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Decorative gradient for highlighted plan */}
              {plan.highlighted && (
                <div
                  className="absolute bottom-0 right-0 w-32 h-32 rounded-tl-full opacity-10 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, transparent)`,
                  }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
