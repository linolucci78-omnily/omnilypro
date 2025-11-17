import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface GalleryImage {
  url: string
  caption?: string
}

interface GalleryCarouselProps {
  gallery: GalleryImage[]
  primaryColor: string
  enableCaptions?: boolean
}

export const GalleryCarousel: React.FC<GalleryCarouselProps> = ({
  gallery,
  primaryColor,
  enableCaptions = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const handlePrevious = () => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + gallery.length) % gallery.length)
  }

  const handleNext = () => {
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % gallery.length)
  }

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  if (!gallery || gallery.length === 0) {
    return null
  }

  return (
    <div className="relative w-full">
      {/* Main carousel container */}
      <div className="relative aspect-video max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <img
              src={gallery[currentIndex].url}
              alt={gallery[currentIndex].caption || `Slide ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Caption overlay */}
            {enableCaptions && gallery[currentIndex].caption && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent"
              >
                <p className="text-white text-2xl font-bold text-center">
                  {gallery[currentIndex].caption}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        {gallery.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all z-10 group"
            >
              <ChevronLeft className="w-8 h-8 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all z-10 group"
            >
              <ChevronRight className="w-8 h-8 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail navigation */}
      {gallery.length > 1 && (
        <div className="mt-6 flex justify-center gap-3 overflow-x-auto pb-4 px-4">
          {gallery.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden transition-all ${
                index === currentIndex
                  ? 'ring-4 scale-105'
                  : 'opacity-50 hover:opacity-100'
              }`}
              style={{
                ringColor: index === currentIndex ? primaryColor : 'transparent',
              }}
            >
              <img
                src={image.url}
                alt={image.caption || `Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === currentIndex && (
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="mt-4 text-center">
        <span
          className="inline-block px-6 py-2 rounded-full font-bold text-lg"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
            color: primaryColor,
          }}
        >
          {currentIndex + 1} / {gallery.length}
        </span>
      </div>
    </div>
  )
}
