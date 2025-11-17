import React, { useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Star, Quote, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

interface Testimonial {
  name: string
  role?: string
  content: string
  rating: number
  image?: string
}

interface TestimonialsSectionPremiumProps {
  testimonials: Testimonial[]
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

export const TestimonialsSectionPremium: React.FC<TestimonialsSectionPremiumProps> = ({
  testimonials,
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

  const [currentIndex, setCurrentIndex] = useState(0)

  // Parallax effect
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  // Return null if no testimonials
  if (!testimonials || testimonials.length === 0) {
    return null
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
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
      id="testimonials"
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

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/2 -left-1/4 w-full h-full opacity-5"
          style={{
            background: `conic-gradient(from 0deg, ${primaryColor}, transparent, ${primaryColor})`,
          }}
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
            <span className="text-sm font-semibold text-gray-700">Recensioni</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-black mb-6" style={{ color: textColor }}>
            Cosa Dicono{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)` }}
            >
              i Nostri Clienti
            </span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-xl max-w-3xl mx-auto" style={{ color: textColor, opacity: 0.8 }}>
            La soddisfazione dei nostri clienti è la nostra priorità
          </motion.p>
        </motion.div>

        {/* Featured Testimonial Carousel */}
        <div className="relative max-w-5xl mx-auto mb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="relative p-12 md:p-16 rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                {/* Quote icon */}
                <div className="absolute top-8 left-8 opacity-10">
                  <Quote className="w-24 h-24" style={{ color: primaryColor }} />
                </div>

                {/* Stars */}
                <div className="flex justify-center gap-1 mb-8 relative z-10">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < testimonials[currentIndex].rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-2xl md:text-3xl text-gray-800 leading-relaxed text-center mb-12 relative z-10 font-light italic">
                  "{testimonials[currentIndex].content}"
                </p>

                {/* Author */}
                <div className="flex items-center justify-center gap-4 relative z-10">
                  {testimonials[currentIndex].image && (
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-full p-0.5"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)`,
                        }}
                      >
                        <img
                          src={testimonials[currentIndex].image}
                          alt={testimonials[currentIndex].name}
                          className="w-full h-full rounded-full object-cover bg-white"
                        />
                      </div>
                      <div
                        className="absolute inset-0 rounded-full blur-lg opacity-50"
                        style={{ background: primaryColor }}
                      />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-bold text-xl text-gray-900">
                      {testimonials[currentIndex].name}
                    </div>
                    {testimonials[currentIndex].role && (
                      <div className="text-gray-600">{testimonials[currentIndex].role}</div>
                    )}
                  </div>
                </div>

                {/* Decorative gradient */}
                <div
                  className="absolute bottom-0 right-0 w-64 h-64 rounded-tl-full opacity-5"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, transparent)`,
                  }}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevious}
                className="w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:border-gray-300 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className="relative group"
                  >
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentIndex ? 'w-8' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      style={{
                        background:
                          index === currentIndex
                            ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)`
                            : undefined,
                      }}
                    />
                  </button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:border-gray-300 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>
          )}
        </div>

        {/* All Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              onClick={() => setCurrentIndex(index)}
              className={`relative p-6 rounded-2xl bg-white shadow-lg border cursor-pointer transition-all duration-300 ${
                index === currentIndex
                  ? 'border-transparent ring-2'
                  : 'border-gray-100 hover:shadow-xl'
              }`}
              style={{
                ringColor: index === currentIndex ? primaryColor : undefined,
              }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 leading-relaxed mb-4 line-clamp-4 italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                {testimonial.image && (
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  {testimonial.role && <div className="text-sm text-gray-600">{testimonial.role}</div>}
                </div>
              </div>

              {/* Selected indicator */}
              {index === currentIndex && (
                <motion.div
                  layoutId="activeTestimonial"
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    boxShadow: `0 0 0 2px ${primaryColor}`,
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
