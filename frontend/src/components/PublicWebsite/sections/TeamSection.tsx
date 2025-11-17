import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface TeamMember {
  name: string
  role: string
  image?: string
  bio?: string
}

interface TeamSectionProps {
  team: TeamMember[]
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

export const TeamSection: React.FC<TeamSectionProps> = ({
  team,
  primaryColor,
  bgType = 'color',
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
  if (!team || team.length === 0) return null

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

  return (
    <section
      id="team"
      className="relative py-20 overflow-hidden"
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
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold text-center mb-6"
            style={{ color: textColor }}
          >
            Il Nostro Team
          </h2>

          <div className="w-24 h-1 mx-auto mb-16" style={{ backgroundColor: primaryColor }}></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center group">
                <div className="mb-4 relative overflow-hidden rounded-2xl">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className="w-full aspect-square flex items-center justify-center text-white text-6xl font-bold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-sm font-medium mb-2" style={{ color: primaryColor }}>
                  {member.role}
                </p>
                {member.bio && <p className="text-gray-600 text-sm">{member.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
