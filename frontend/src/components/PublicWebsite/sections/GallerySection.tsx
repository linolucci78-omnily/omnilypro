import React, { useState } from 'react'

interface GallerySectionProps {
  gallery: string[]
  primaryColor: string
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  gallery,
  primaryColor,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  if (!gallery || gallery.length === 0) return null

  return (
    <>
      <section id="gallery" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold text-center mb-6"
              style={{ color: primaryColor }}
            >
              Gallery
            </h2>

            <div className="w-24 h-1 mx-auto mb-16" style={{ backgroundColor: primaryColor }}></div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((image, index) => (
                <div
                  key={index}
                  className="aspect-square overflow-hidden rounded-lg cursor-pointer transform hover:scale-105 transition-transform shadow-md"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            &times;
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  )
}
