import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView as useFramerInView } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Award, Target, Heart, TrendingUp, Sparkles, Users } from 'lucide-react'

// Custom hook for animated counter
const useAnimatedCounter = (end: number, duration: number = 2000, inView: boolean = false) => {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)

  useEffect(() => {
    if (!inView) {
      setCount(0)
      countRef.current = 0
      return
    }

    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = Math.floor(easeOutQuart * end)

      countRef.current = current
      setCount(current)

      if (progress === 1) {
        clearInterval(timer)
        setCount(end)
      }
    }, 16) // ~60fps

    return () => clearInterval(timer)
  }, [end, duration, inView])

  return count
}

// Component for animated stat display
const AnimatedStat: React.FC<{
  value: string
  label: string
  primaryColor: string
  inView: boolean
}> = ({ value, label, primaryColor, inView }) => {
  // Parse the stat value to extract numbers and other characters
  const parseStatValue = (val: string) => {
    const match = val.match(/^(\d+)(.*)$/)
    if (match) {
      return {
        number: parseInt(match[1]),
        suffix: match[2] // Could be "+", "%", etc.
      }
    }
    return { number: 0, suffix: val }
  }

  const { number, suffix } = parseStatValue(value)
  const animatedNumber = useAnimatedCounter(number, 2000, inView)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8 }}
      className="text-center group cursor-pointer"
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r mb-2"
        style={{
          backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)`,
        }}
      >
        {number > 0 ? animatedNumber : ''}{suffix}
      </motion.div>
      <div className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
        {label}
      </div>
    </motion.div>
  )
}

interface AboutSectionPremiumProps {
  name: string
  description?: string
  industry?: string
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
  stat1Value?: string
  stat1Label?: string
  stat2Value?: string
  stat2Label?: string
  stat3Value?: string
  stat3Label?: string
  stat4Value?: string
  stat4Label?: string
  statsColor?: string
}

export const AboutSectionPremium: React.FC<AboutSectionPremiumProps> = ({
  name,
  description,
  industry,
  primaryColor,
  bgType = 'color',
  bgColor = '#ffffff',
  bgGradientStart = '#f8fafc',
  bgGradientEnd = '#e2e8f0',
  bgImage,
  enableParallax = false,
  enableOverlay = false,
  overlayColor = '#000000',
  overlayOpacity = 0.5,
  textColor = '#1f2937',
  stat1Value = '500+',
  stat1Label = 'Clienti Felici',
  stat2Value = '15+',
  stat2Label = 'Anni di Esperienza',
  stat3Value = '98%',
  stat3Label = 'Soddisfazione',
  stat4Value = '24/7',
  stat4Label = 'Supporto',
  statsColor,
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Parallax effect for background image
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  // Calculate background based on user choice
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
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] },
    },
  }

  const features = [
    {
      icon: Award,
      title: 'Eccellenza',
      description: 'Qualità premium in ogni dettaglio',
      color: 'from-yellow-400 to-orange-500',
    },
    {
      icon: Heart,
      title: 'Passione',
      description: 'Amore per ciò che facciamo',
      color: 'from-pink-400 to-rose-500',
    },
    {
      icon: Target,
      title: 'Precisione',
      description: 'Attenzione ai minimi particolari',
      color: 'from-blue-400 to-cyan-500',
    },
    {
      icon: TrendingUp,
      title: 'Innovazione',
      description: 'Sempre un passo avanti',
      color: 'from-green-400 to-emerald-500',
    },
  ]

  return (
    <section
      id="about"
      className="relative py-32 overflow-hidden"
      style={{
        background: bgType === 'image' ? 'transparent' : getBackground(),
        backgroundSize: bgType === 'image' ? 'cover' : 'auto',
        backgroundPosition: bgType === 'image' ? 'center' : 'initial',
        backgroundAttachment: enableParallax && bgType === 'image' ? 'fixed' : 'scroll',
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

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full opacity-5"
          style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)` }}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full opacity-5"
          style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)` }}
        />
      </div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-20"
        >
          {/* Section badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 mb-6">
            <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm font-semibold text-gray-700">Chi Siamo</span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            variants={itemVariants}
            className="text-5xl md:text-6xl font-black mb-6"
            style={{ color: textColor }}
          >
            Scopri{' '}
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)`,
              }}
            >
              {name}
            </span>
          </motion.h2>

          {industry && (
            <motion.div
              variants={itemVariants}
              className="inline-block px-6 py-2 rounded-full text-sm font-bold"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                color: primaryColor,
                border: `2px solid ${primaryColor}30`,
              }}
            >
              {industry}
            </motion.div>
          )}
        </motion.div>

        {/* Description with glassmorphism */}
        {description && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="max-w-4xl mx-auto mb-20"
          >
            <div className="relative p-12 rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-gray-200/50">
              {/* Decorative corner elements */}
              <div
                className="absolute top-0 left-0 w-20 h-20 rounded-br-3xl opacity-10"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, transparent)` }}
              />
              <div
                className="absolute bottom-0 right-0 w-20 h-20 rounded-tl-3xl opacity-10"
                style={{ background: `linear-gradient(135deg, transparent, ${primaryColor})` }}
              />

              <p
                className="text-xl md:text-2xl leading-relaxed text-center relative z-10"
                style={{ color: textColor }}
              >
                {description}
              </p>

              {/* Glow effect */}
              <div
                className="absolute -inset-1 rounded-3xl blur-2xl opacity-20 -z-10"
                style={{ background: primaryColor }}
              />
            </div>
          </motion.div>
        )}

        {/* Features grid with premium cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative"
            >
              <div className="relative p-8 rounded-2xl bg-white shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />

                {/* Icon with gradient */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-500`}
                >
                  <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-gray-700" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:translate-x-1 transition-transform duration-500">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats section with animated counters */}
        <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: stat1Value, label: stat1Label },
            { value: stat2Value, label: stat2Label },
            { value: stat3Value, label: stat3Label },
            { value: stat4Value, label: stat4Label },
          ].map((stat, index) => (
            <AnimatedStat
              key={index}
              value={stat.value}
              label={stat.label}
              primaryColor={primaryColor}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
