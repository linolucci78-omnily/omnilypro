import React, { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Sparkles, ArrowRight, Star, Zap } from 'lucide-react'

interface HeroSectionPremiumProps {
  name: string
  tagline?: string
  subtitle?: string
  heroImage?: string
  primaryColor: string
  logo?: string
  enableParallax?: boolean
  enableParticles?: boolean
  bgType?: string
  bgColor?: string
  bgGradientStart?: string
  bgGradientEnd?: string
  overlayColor?: string
  overlayOpacity?: number
}

export const HeroSectionPremium: React.FC<HeroSectionPremiumProps> = ({
  name,
  tagline,
  subtitle,
  heroImage,
  primaryColor,
  logo,
  enableParallax = true,
  enableParticles = false,
  bgType = 'gradient',
  bgColor = '#0f172a',
  bgGradientStart = '#0f172a',
  bgGradientEnd = '#0f172a',
  overlayColor = '#000000',
  overlayOpacity = 0.5,
}) => {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Calculate background based on user choice
  const getBackground = () => {
    if (bgType === 'color') {
      return bgColor
    } else if (bgType === 'gradient') {
      return `linear-gradient(135deg, ${bgGradientStart} 0%, ${bgGradientEnd} 100%)`
    }
    // If image, the background will be handled by heroImage
    return `linear-gradient(135deg, ${bgGradientStart} 0%, ${bgGradientEnd} 100%)`
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Floating animation variants
  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const floatingVariantsAlt = {
    animate: {
      y: [0, -30, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.5
      }
    }
  }

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: getBackground()
      }}
    >
      {/* Hero background image with overlay and parallax */}
      {heroImage && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: enableParallax ? 'fixed' : 'scroll',
              zIndex: 0,
            }}
          />
          <div
            className="absolute inset-0 backdrop-blur-[2px]"
            style={{
              backgroundColor: overlayColor,
              opacity: overlayOpacity,
              zIndex: 1,
            }}
          />
        </>
      )}

      {/* Animated background gradient mesh */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -inset-[100%] opacity-30"
          animate={{
            background: [
              `radial-gradient(circle at 20% 50%, ${primaryColor}40 0%, transparent 50%)`,
              `radial-gradient(circle at 80% 80%, ${primaryColor}40 0%, transparent 50%)`,
              `radial-gradient(circle at 40% 20%, ${primaryColor}40 0%, transparent 50%)`,
              `radial-gradient(circle at 20% 50%, ${primaryColor}40 0%, transparent 50%)`,
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Floating orbs */}
      <motion.div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{
          background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
          left: mousePosition.x - 144,
          top: mousePosition.y - 144,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      />

      {/* Animated particles - Conditional */}
      {enableParticles && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Glass morphism container */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center"
      >
        {/* Logo with glow effect */}
        {logo && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 1, delay: 0.2 }}
            className="mb-8 flex justify-center"
          >
            <div
              className="relative inline-block p-4 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20"
              style={{
                boxShadow: `0 0 80px ${primaryColor}80, 0 0 40px ${primaryColor}40`,
              }}
            >
              <img src={logo} alt={name} className="h-20 w-auto" />
              <div
                className="absolute -inset-1 rounded-3xl blur-xl opacity-50"
                style={{ background: primaryColor }}
              />
            </div>
          </motion.div>
        )}

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white">
            <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm font-medium">Premium Loyalty Program</span>
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
        </motion.div>

        {/* Main heading - Nome organizzazione (da Branding o override) */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
        >
          <span className="block text-white mb-2">{name}</span>
          {tagline && (
            <span
              className="block bg-clip-text text-transparent bg-gradient-to-r text-5xl md:text-6xl lg:text-7xl"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd, white)`,
              }}
            >
              {tagline}
            </span>
          )}
        </motion.h1>

        {/* Descrizione aggiuntiva opzionale */}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed px-6 py-4 rounded-2xl backdrop-blur-sm bg-white/5"
          >
            {subtitle}
          </motion.p>
        )}

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.a
            href="#loyalty"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="button group relative overflow-hidden inline-flex items-center gap-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative flex items-center gap-2">
              Scopri il Programma
              <Zap className="w-5 h-5" />
            </span>
          </motion.a>

          <motion.a
            href="#contact"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="button group backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:bg-white/20 inline-flex items-center gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderWidth: '2px',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
          >
            Contattaci
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </motion.div>

        {/* Floating decorative elements */}
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 opacity-20 blur-xl"
        />
        <motion.div
          variants={floatingVariantsAlt}
          animate="animate"
          className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 opacity-20 blur-xl"
        />

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-white"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}
