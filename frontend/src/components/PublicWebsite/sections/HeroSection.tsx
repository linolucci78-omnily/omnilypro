import React from 'react'

interface HeroSectionProps {
  name: string
  tagline?: string
  subtitle?: string
  heroImage?: string
  primaryColor: string
  logo?: string
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  name,
  tagline,
  subtitle,
  heroImage,
  primaryColor,
  logo,
}) => {
  return (
    <section
      className="relative min-h-[600px] flex items-center justify-center text-white"
      style={{
        background: heroImage
          ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroImage}) center/cover`
          : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
      }}
    >
      <div className="container mx-auto px-4 text-center">
        {logo && (
          <div className="mb-8 flex justify-center">
            <img src={logo} alt={name} className="h-24 w-auto" />
          </div>
        )}

        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
          {name}
        </h1>

        {tagline && (
          <p className="text-2xl md:text-3xl mb-4 font-light animate-fade-in-delay-1">
            {tagline}
          </p>
        )}

        {subtitle && (
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto animate-fade-in-delay-2">
            {subtitle}
          </p>
        )}

        <div className="flex gap-4 justify-center animate-fade-in-delay-3">
          <a
            href="#loyalty"
            className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Scopri i Vantaggi
          </a>
          <a
            href="#contact"
            className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all transform hover:scale-105"
          >
            Contattaci
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  )
}
