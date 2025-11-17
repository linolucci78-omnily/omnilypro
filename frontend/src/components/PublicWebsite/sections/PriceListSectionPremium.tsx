import React from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Clock } from 'lucide-react'

export interface PriceListItem {
  id: string
  name: string
  description?: string
  price: string
  duration?: string
  image?: string
}

export interface PriceListCategory {
  id: string
  name: string
  description?: string
  items: PriceListItem[]
}

interface PriceListSectionPremiumProps {
  categories: PriceListCategory[]
  primaryColor: string
  title?: string
  subtitle?: string
  layout?: 'vertical' | 'horizontal'
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

export const PriceListSectionPremium: React.FC<PriceListSectionPremiumProps> = ({
  categories,
  primaryColor,
  title = 'I Nostri Servizi',
  subtitle = 'Scopri i nostri servizi e i relativi prezzi',
  layout = 'vertical',
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
  const getBackground = () => {
    if (bgType === 'image' && bgImage) {
      return `url(${bgImage})`
    }
    if (bgType === 'gradient') {
      return `linear-gradient(135deg, ${bgGradientStart}, ${bgGradientEnd})`
    }
    return bgColor
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const categoryVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
      },
    },
  }

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <section
      id="pricing"
      style={{
        position: 'relative',
        padding: '120px 0',
        background: bgType === 'image' ? 'transparent' : getBackground(),
        backgroundSize: bgType === 'image' ? 'cover' : undefined,
        backgroundPosition: bgType === 'image' ? 'center' : undefined,
        backgroundAttachment: enableParallax && bgType === 'image' ? 'fixed' : undefined,
        color: textColor,
        overflow: 'hidden',
      }}
    >
      {/* Background Image with Overlay */}
      {bgType === 'image' && bgImage && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: enableParallax ? 'fixed' : 'scroll',
              zIndex: 0,
            }}
          />
          {enableOverlay && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: overlayColor,
                opacity: overlayOpacity,
                zIndex: 1,
              }}
            />
          )}
        </>
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            textAlign: 'center',
            marginBottom: '80px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 24px',
              borderRadius: '100px',
              background: `${primaryColor}15`,
              marginBottom: '24px',
            }}
          >
            <DollarSign size={24} style={{ color: primaryColor }} />
            <span style={{ fontWeight: 600, color: primaryColor }}>Listino Prezzi</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 800,
              margin: '0 0 16px 0',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: '18px',
              maxWidth: '600px',
              margin: '0 auto',
              opacity: 0.8,
            }}
          >
            {subtitle}
          </p>
        </motion.div>

        {/* Categories */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{
            display: 'grid',
            gap: '48px',
          }}
        >
          {categories.map((category) => (
            <motion.div
              key={category.id}
              variants={categoryVariants}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Category Header */}
              <div style={{ marginBottom: '32px' }}>
                <h3
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                    color: primaryColor,
                  }}
                >
                  {category.name}
                </h3>
                {category.description && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      color: '#64748b',
                    }}
                  >
                    {category.description}
                  </p>
                )}
              </div>

              {/* Items */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: layout === 'horizontal' ? 'repeat(auto-fit, minmax(250px, 1fr))' : '1fr',
                gap: '16px'
              }}>
                {(!category.items || category.items.length === 0) ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '32px', fontSize: '16px' }}>
                    Nessun servizio in questa categoria
                  </p>
                ) : (
                  category.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    style={{
                      display: 'flex',
                      flexDirection: layout === 'horizontal' ? 'column' : 'row',
                      alignItems: layout === 'horizontal' ? 'center' : 'flex-start',
                      justifyContent: layout === 'horizontal' ? 'center' : 'space-between',
                      gap: '24px',
                      padding: '20px',
                      borderRadius: '16px',
                      background: index % 2 === 0 ? '#f8fafc' : 'transparent',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      textAlign: layout === 'horizontal' ? 'center' : 'left',
                    }}
                    whileHover={{
                      scale: 1.02,
                      background: `${primaryColor}08`,
                    }}
                  >
                    {/* Image */}
                    {item.image && (
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          margin: '0 0 6px 0',
                          fontSize: '18px',
                          fontWeight: 600,
                          color: '#1e293b',
                        }}
                      >
                        {item.name}
                      </h4>
                      {item.description && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            color: '#64748b',
                            lineHeight: 1.5,
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                      {item.duration && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '8px',
                            fontSize: '13px',
                            color: '#94a3b8',
                          }}
                        >
                          <Clock size={14} />
                          <span>{item.duration}</span>
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: primaryColor,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.price}
                    </div>
                  </motion.div>
                )))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
