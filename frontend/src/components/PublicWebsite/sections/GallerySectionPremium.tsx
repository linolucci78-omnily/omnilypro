import React, { useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Sparkles, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { GalleryCarousel } from './GalleryCarousel'

interface GalleryImage {
  url: string
  caption?: string
}

interface GallerySectionPremiumProps {
  gallery: GalleryImage[]
  primaryColor: string
  layout?: string
  enableLightbox?: boolean
  enableZoom?: boolean
  enableCaptions?: boolean
  bgType?: string
  bgColor?: string
  bgGradientStart?: string
  bgGradientEnd?: string
  bgImage?: string
  enableParallax?: boolean
  enableOverlay?: boolean
  overlayColor?: string
  overlayOpacity?: number
}

export const GallerySectionPremium: React.FC<GallerySectionPremiumProps> = ({
  gallery,
  primaryColor,
  layout = 'masonry',
  enableLightbox = true,
  enableZoom = true,
  enableCaptions = true,
  bgType = 'color',
  bgColor = '#ffffff',
  bgGradientStart = '#f8fafc',
  bgGradientEnd = '#e2e8f0',
  bgImage,
  enableParallax = false,
  enableOverlay = false,
  overlayColor = '#000000',
  overlayOpacity = 0.5,
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  // Parallax effect for background image
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  // Return null if no gallery images
  if (!gallery || gallery.length === 0) {
    return null
  }

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
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] },
    },
  }

  const handlePrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + gallery.length) % gallery.length)
    }
  }

  const handleNext = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % gallery.length)
    }
  }

  return (
    <section
      id="gallery"
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

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full rounded-full"
          style={{ background: `radial-gradient(circle, ${primaryColor}, transparent 70%)` }}
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
            <span className="text-sm font-semibold text-gray-700">Gallery</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
            I Nostri{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)` }}
            >
              Momenti Migliori
            </span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-xl text-gray-600 max-w-3xl mx-auto">
            Esplora la nostra gallery e scopri la qualità del nostro lavoro
          </motion.p>
        </motion.div>

        {/* Gallery Content - Carousel or Grid */}
        {layout === 'carousel' ? (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            <GalleryCarousel
              gallery={gallery}
              primaryColor={primaryColor}
              enableCaptions={enableCaptions}
            />
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className={`grid gap-4 ${
              layout === 'grid'
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {gallery.map((image, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: enableZoom ? 1.05 : 1, zIndex: 10 }}
              onClick={() => enableLightbox && setSelectedImage(index)}
              className={`relative group overflow-hidden rounded-2xl ${
                layout === 'masonry' && index % 7 === 0 ? 'md:col-span-2 md:row-span-2' : ''
              } ${enableLightbox ? 'cursor-pointer' : 'cursor-default'}`}
              style={{
                aspectRatio: layout === 'masonry' && index % 7 === 0 ? '16/9' : '1/1',
              }}
            >
              {/* Image */}
              <img
                src={image.url}
                alt={image.caption || `Gallery image ${index + 1}`}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  enableZoom ? 'group-hover:scale-110' : ''
                }`}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {enableCaptions && image.caption && (
                    <p className="font-semibold text-lg mb-2">{image.caption}</p>
                  )}
                  {enableLightbox && (
                    <div className="flex items-center gap-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                      <Maximize2 className="w-4 h-4" />
                      <span>Clicca per ingrandire</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Border glow on hover */}
              {enableZoom && (
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 0 3px ${primaryColor}`,
                  }}
                />
              )}
            </motion.div>
          ))}
          </motion.div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close button */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedImage(null)
              }}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Previous button */}
            {gallery.length > 1 && (
              <motion.button
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevious()
                }}
                className="absolute left-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            )}

            {/* Next button */}
            {gallery.length > 1 && (
              <motion.button
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                className="absolute right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            )}

            {/* Image */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-6xl max-h-[90vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={gallery[selectedImage].url}
                alt={gallery[selectedImage].caption || `Gallery image ${selectedImage + 1}`}
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              />
              {enableCaptions && gallery[selectedImage].caption && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 text-center"
                >
                  <p className="text-white text-xl font-semibold px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 inline-block">
                    {gallery[selectedImage].caption}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Image counter */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold"
            >
              {selectedImage + 1} / {gallery.length}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
