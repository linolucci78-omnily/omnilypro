import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useScroll } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Gift,
  Star,
  Zap,
  Crown,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Coins,
  Trophy,
  Rocket,
  Percent,
  TrendingDown,
} from 'lucide-react'

interface LoyaltySectionPremiumProps {
  pointsName?: string
  pointsPerEuro?: number
  rewardThreshold?: number
  welcomeBonus?: number
  primaryColor: string
  secondaryColor?: string
  featuredRewards?: any[]
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

export const LoyaltySectionPremium: React.FC<LoyaltySectionPremiumProps> = ({
  pointsName = 'Punti',
  pointsPerEuro = 1,
  rewardThreshold = 100,
  welcomeBonus = 0,
  primaryColor,
  secondaryColor,
  featuredRewards = [],
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

  const [activeStep, setActiveStep] = useState(0)

  // Parallax effect
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  // Animated Counter Component
  const AnimatedCounter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
      if (!inView) return

      const duration = 2000 // 2 seconds
      const steps = 60
      const increment = target / steps
      const stepDuration = duration / steps

      let currentStep = 0
      const timer = setInterval(() => {
        currentStep++
        if (currentStep <= steps) {
          setCount(Math.min(Math.ceil(increment * currentStep), target))
        } else {
          clearInterval(timer)
        }
      }, stepDuration)

      return () => clearInterval(timer)
    }, [inView, target])

    return <>{count}{suffix}</>
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

  const steps = [
    {
      icon: Rocket,
      title: 'Iscriviti Gratis',
      description: `Registrati in 30 secondi${welcomeBonus > 0 ? ` e ricevi ${welcomeBonus} ${pointsName} di benvenuto!` : '!'}`,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Coins,
      title: 'Accumula Punti',
      description: `Guadagna ${pointsPerEuro} ${pointsName} per ogni euro speso. Più acquisti, più guadagni!`,
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Trophy,
      title: 'Sblocca Premi',
      description: `Con solo ${rewardThreshold} ${pointsName} ottieni premi esclusivi e vantaggi VIP!`,
      color: 'from-yellow-500 to-orange-500',
    },
  ]

  const benefits = [
    { icon: Crown, text: 'Premi Esclusivi VIP', color: 'text-yellow-500' },
    { icon: Zap, text: 'Punti Doppi in Eventi Speciali', color: 'text-purple-500' },
    { icon: Gift, text: 'Regali di Compleanno', color: 'text-pink-500' },
    { icon: Star, text: 'Accesso Anticipato alle Novità', color: 'text-blue-500' },
    { icon: Award, text: 'Sconti Esclusivi per i Membri', color: 'text-green-500' },
    { icon: TrendingUp, text: 'Livelli VIP con Vantaggi Crescenti', color: 'text-orange-500' },
  ]

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
      transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] },
    },
  }

  return (
    <section
      id="loyalty"
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

      {/* Animated background elements - Enhanced */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main floating icons */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50 - Math.random() * 30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.05, 0.3, 0.05],
              scale: [1, 1.3, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          >
            {i % 5 === 0 ? (
              <Star className="w-10 h-10" style={{ color: primaryColor }} />
            ) : i % 5 === 1 ? (
              <Sparkles className="w-8 h-8" style={{ color: secondaryColor || primaryColor }} />
            ) : i % 5 === 2 ? (
              <Gift className="w-9 h-9" style={{ color: primaryColor }} />
            ) : i % 5 === 3 ? (
              <Coins className="w-8 h-8" style={{ color: primaryColor }} />
            ) : (
              <Crown className="w-10 h-10 text-yellow-500" />
            )}
          </motion.div>
        ))}

        {/* Glowing orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full blur-3xl"
            style={{
              left: `${20 + i * 20}%`,
              top: `${20 + (i % 2) * 60}%`,
              width: `${150 + Math.random() * 100}px`,
              height: `${150 + Math.random() * 100}px`,
              background: `radial-gradient(circle, ${primaryColor}20, transparent)`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, 30, 0],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 6 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-20"
        >
          {/* Premium badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-8 backdrop-blur-xl shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
              border: `2px solid ${primaryColor}40`,
            }}
          >
            <Crown className="w-5 h-5" style={{ color: primaryColor }} />
            <span className="font-bold text-gray-900">Programma Fedeltà Premium</span>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </motion.div>

          {/* Main heading */}
          <motion.h2 variants={itemVariants} className="text-5xl md:text-7xl font-black mb-6" style={{ color: textColor }}>
            Guadagna{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
              }}
            >
              Premi Straordinari
            </span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed" style={{ color: textColor, opacity: 0.8 }}>
            Ogni acquisto ti avvicina a premi esclusivi. Più sei fedele, più vantaggi ottieni!
          </motion.p>
        </motion.div>

        {/* Stats Cards - Spectacular showcase */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24"
        >
          {/* Stat 1: Points per euro */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            className="relative group"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="relative p-8 rounded-3xl bg-white shadow-2xl border-2 border-gray-100 overflow-hidden">
              {/* Animated gradient background */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                </div>

                <div className="text-5xl font-black mb-2" style={{ color: primaryColor }}>
                  <AnimatedCounter target={pointsPerEuro} />
                </div>

                <div className="text-gray-600 font-semibold mb-1">
                  {pointsName} per €1
                </div>

                <div className="text-sm text-gray-500">
                  Accumula punti ad ogni acquisto
                </div>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
            </div>
          </motion.div>

          {/* Stat 2: Reward threshold */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            className="relative group"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="relative p-8 rounded-3xl bg-white shadow-2xl border-2 border-gray-100 overflow-hidden">
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <Trophy className="w-8 h-8 text-yellow-500 animate-bounce" />
                </div>

                <div className="text-5xl font-black mb-2" style={{ color: primaryColor }}>
                  <AnimatedCounter target={rewardThreshold} />
                </div>

                <div className="text-gray-600 font-semibold mb-1">
                  {pointsName} per il primo premio
                </div>

                <div className="text-sm text-gray-500">
                  Raggiungi premi esclusivi
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
            </div>
          </motion.div>

          {/* Stat 3: Welcome bonus */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            className="relative group"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="relative p-8 rounded-3xl bg-white shadow-2xl border-2 border-gray-100 overflow-hidden">
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <Rocket className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>

                <div className="text-5xl font-black mb-2" style={{ color: primaryColor }}>
                  {welcomeBonus > 0 ? <AnimatedCounter target={welcomeBonus} /> : '∞'}
                </div>

                <div className="text-gray-600 font-semibold mb-1">
                  {welcomeBonus > 0 ? `${pointsName} di benvenuto` : 'Vantaggi illimitati'}
                </div>

                <div className="text-sm text-gray-500">
                  {welcomeBonus > 0 ? 'Subito alla registrazione' : 'Scopri tutti i benefici'}
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
            </div>
          </motion.div>
        </motion.div>

        {/* Example progress showcase - Interactive */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mb-24"
        >
          <motion.div
            variants={itemVariants}
            className="relative p-10 rounded-3xl bg-white shadow-2xl border-2 border-gray-100 overflow-hidden"
          >
            {/* Background gradient */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
              }}
            />

            <div className="relative z-10">
              {/* Title */}
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
                  <Zap className="w-8 h-8" style={{ color: primaryColor }} />
                  Esempio: Il Tuo Primo Premio
                  <Sparkles className="w-8 h-8 text-yellow-500" />
                </h3>
                <p className="text-gray-600 text-lg">
                  Basta spendere <span className="font-bold" style={{ color: primaryColor }}>€{Math.ceil(rewardThreshold / pointsPerEuro)}</span> per ottenere il tuo primo premio!
                </p>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-600">
                    I tuoi {pointsName}
                  </span>
                  <span className="text-2xl font-black" style={{ color: primaryColor }}>
                    {Math.floor(rewardThreshold * 0.7)} / {rewardThreshold}
                  </span>
                </div>

                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  {/* Animated progress fill */}
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full shadow-lg"
                    style={{
                      background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
                    }}
                    initial={{ width: 0 }}
                    animate={inView ? { width: '70%' } : { width: 0 }}
                    transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
                  </motion.div>

                  {/* Progress text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white drop-shadow-lg">
                      70% completato
                    </span>
                  </div>
                </div>
              </div>

              {/* What you need */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Hai già</div>
                    <div className="text-xl font-bold text-gray-900">{Math.floor(rewardThreshold * 0.7)} {pointsName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Ti servono</div>
                    <div className="text-xl font-bold text-gray-900">{Math.ceil(rewardThreshold * 0.3)} {pointsName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Prossimo acquisto</div>
                    <div className="text-xl font-bold text-gray-900">€{Math.ceil((rewardThreshold * 0.3) / pointsPerEuro)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Confetti effect */}
            <div className="absolute top-4 right-4">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              >
                <Sparkles className="w-12 h-12 text-yellow-500" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* How it works - Interactive steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mb-24"
        >
          <motion.h3 variants={itemVariants} className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            Come Funziona in{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
              }}
            >
              3 Semplici Passi
            </span>
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -10 }}
                onHoverStart={() => setActiveStep(index)}
                className="relative group cursor-pointer"
              >
                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-full h-1 -translate-y-1/2 z-0">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${step.color} rounded-full`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: inView ? 1 : 0 }}
                      transition={{ duration: 0.8, delay: index * 0.3 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                )}

                <div className="relative p-8 rounded-3xl bg-white shadow-xl border-2 border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  {/* Gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                  />

                  {/* Step number */}
                  <div className="absolute top-4 right-4">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-black text-xl shadow-lg`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-6 relative">
                    <div
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} p-0.5 group-hover:scale-110 transition-transform duration-500`}
                    >
                      <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                        <step.icon className="w-10 h-10 text-gray-700" />
                      </div>
                    </div>
                    {/* Glow effect */}
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
                    />
                  </div>

                  {/* Content */}
                  <h4 className="text-2xl font-bold text-gray-900 mb-3 group-hover:translate-x-1 transition-transform duration-500">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-lg">{step.description}</p>

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mb-24"
        >
          <motion.h3 variants={itemVariants} className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            Vantaggi{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
              }}
            >
              Esclusivi
            </span>
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.03, x: 5 }}
                className="flex items-center gap-4 p-6 rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl ${benefit.color} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <span className="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                  {benefit.text}
                </span>
                <CheckCircle className="w-5 h-5 text-green-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Featured Rewards - Premium showcase */}
        {featuredRewards.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="mb-20"
          >
            <motion.h3 variants={itemVariants} className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
              Premi{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
                }}
              >
                in Evidenza
              </span>
            </motion.h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredRewards.slice(0, 3).map((reward, index) => (
                <motion.div
                  key={reward.id}
                  variants={itemVariants}
                  whileHover={{ y: -15, scale: 1.02 }}
                  className="relative group"
                >
                  <div className="relative rounded-3xl overflow-hidden bg-white shadow-2xl border-2 border-gray-100 hover:border-transparent transition-all duration-500">
                    {/* Featured badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <div
                        className="px-4 py-2 rounded-full backdrop-blur-xl text-white font-bold text-sm shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
                      >
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-current" />
                          TOP
                        </div>
                      </div>
                    </div>

                    {/* Image */}
                    {reward.image_url && (
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={reward.image_url}
                          alt={reward.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                      <h4 className="text-2xl font-bold text-gray-900 mb-2 group-hover:translate-x-1 transition-transform">
                        {reward.name}
                      </h4>
                      {reward.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2">{reward.description}</p>
                      )}

                      {/* Points required */}
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                            color: primaryColor,
                          }}
                        >
                          <Coins className="w-5 h-5" />
                          {reward.points_required} {pointsName}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
                          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Glow effect */}
                    <div
                      className="absolute -inset-1 rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10"
                      style={{ background: primaryColor }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Section - Premium */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center"
        >
          <motion.div
            variants={itemVariants}
            className="relative inline-block p-12 rounded-3xl overflow-hidden"
          >
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 opacity-90"
              animate={{
                backgroundImage: [
                  `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
                  `linear-gradient(135deg, ${secondaryColor || primaryColor}, ${primaryColor})`,
                  `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
                ],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            />

            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
                Pronto a Iniziare?
              </h3>
              <p className="text-xl text-white/90 mb-8">
                Iscriviti ora e inizia a guadagnare premi straordinari!
              </p>
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-gray-900 font-bold text-lg shadow-2xl hover:shadow-3xl transition-all group"
              >
                Unisciti al Programma
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </motion.a>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
