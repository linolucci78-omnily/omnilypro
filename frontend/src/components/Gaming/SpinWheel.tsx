/**
 * OMNILYPRO GAMING MODULE - Spin the Wheel
 * Animated spinning wheel with prizes
 */

import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, Trophy, X } from 'lucide-react'
import { spinService } from '../../services/gaming/spinService'
import type { WheelConfig, WheelSector, SpinPrize } from '../../services/gaming/types'
import './SpinWheel.css'

interface SpinWheelProps {
  customerId: string
  organizationId: string
  primaryColor?: string
  onClose?: () => void
  onSpinComplete?: (prize: SpinPrize) => void
}

const SpinWheel: React.FC<SpinWheelProps> = ({
  customerId,
  organizationId,
  primaryColor = '#dc2626',
  onClose,
  onSpinComplete
}) => {
  const [config, setConfig] = useState<WheelConfig | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [prizeWon, setPrizeWon] = useState<SpinPrize | null>(null)
  const [canSpin, setCanSpin] = useState(true)
  const [spinsLeft, setSpinsLeft] = useState(3)
  const [loading, setLoading] = useState(true)
  const wheelRef = useRef<SVGGElement>(null)
  const wheelContainerRef = useRef<HTMLDivElement>(null)
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 })
  const spinSoundRef = useRef<HTMLAudioElement | null>(null)

  React.useEffect(() => {
    console.log('🎡 SpinWheel mounted! customerId:', customerId, 'organizationId:', organizationId)
    loadWheelConfig()
    checkSpinAvailability()
  }, [customerId, organizationId])

  // Calculate button position based on wheel position
  React.useEffect(() => {
    const updateButtonPosition = () => {
      if (wheelContainerRef.current) {
        const rect = wheelContainerRef.current.getBoundingClientRect()
        setButtonPosition({
          top: rect.top + rect.height / 2,
          left: rect.left + rect.width / 2
        })
      }
    }

    updateButtonPosition()
    window.addEventListener('resize', updateButtonPosition)
    window.addEventListener('scroll', updateButtonPosition)

    return () => {
      window.removeEventListener('resize', updateButtonPosition)
      window.removeEventListener('scroll', updateButtonPosition)
    }
  }, [loading])

  const loadWheelConfig = async () => {
    try {
      const wheelConfig = await spinService.getWheelConfig(organizationId)
      if (wheelConfig) {
        setConfig(wheelConfig)
      } else {
        // Seed default config if not exists
        await spinService.seedDefaultWheelConfig(organizationId)
        const newConfig = await spinService.getWheelConfig(organizationId)
        setConfig(newConfig)
      }
    } catch (error) {
      console.error('❌ Error loading wheel config:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkSpinAvailability = async () => {
    try {
      const { canSpin: available, spinsToday, maxSpins } = await spinService.canSpin(customerId, organizationId)
      setCanSpin(available)
      setSpinsLeft(maxSpins - spinsToday)
    } catch (error) {
      console.error('❌ Error checking spin availability:', error)
    }
  }

  const playSpinSound = () => {
    // Riproduci il file audio
    const audio = new Audio('/sounds/mixkit-completion-of-a-level-2063.wav')
    audio.volume = 0.5 // Volume al 50%
    audio.play().catch(error => {
      console.log('🔇 Could not play audio:', error)
    })
  }

  const handleSpin = async () => {
    console.log('🎡 handleSpin called!')
    console.log('  spinning:', spinning)
    console.log('  canSpin:', canSpin)
    console.log('  config:', config)

    if (spinning || !canSpin || !config) {
      console.log('❌ Cannot spin - check failed')
      return
    }

    try {
      console.log('🎡 Starting spin...')
      setSpinning(true)
      setPrizeWon(null)

      // Call spin API
      console.log('🎡 Calling spinService.spinWheel...')
      const result = await spinService.spinWheel(customerId, organizationId)
      console.log('🎡 Spin result:', result)

      if (!result.success) {
        alert(result.error || 'Errore durante lo spin')
        setSpinning(false)
        return
      }

      // Riproduci suono PRIMA di iniziare l'animazione
      try {
        playSpinSound()
      } catch (error) {
        console.log('🔇 Audio not available:', error)
      }

      // Find sector index
      const sectorIndex = config.sectors.findIndex(s => s.id === result.sector_landed?.id)

      console.log('🎯 Settore vinto:', result.sector_landed)
      console.log('   - ID:', result.sector_landed?.id)
      console.log('   - Label:', result.sector_landed?.label)
      console.log('   - Index nella ruota:', sectorIndex)

      // Calculate rotation (use configured spin_rotations or default to 5)
      const degreesPerSector = 360 / config.sectors.length
      const spinRotations = (config as any).spin_rotations || 5

      // I settori partono da -90° (top), il settore 0 è in alto
      // La freccia punta in alto (a -90° in coordinate SVG)
      // Per portare il settore desiderato sotto la freccia:
      const sectorStartAngle = (sectorIndex * degreesPerSector - 90)
      const sectorCenterAngle = sectorStartAngle + (degreesPerSector / 2)

      // Rotazione = giri completi - 90° (freccia) - angolo settore
      const targetDegrees = 360 * spinRotations - 90 - sectorCenterAngle

      console.log('   - Gradi per settore:', degreesPerSector)
      console.log('   - Angolo inizio settore:', sectorStartAngle)
      console.log('   - Angolo centro settore:', sectorCenterAngle)
      console.log('   - Rotazione totale:', targetDegrees)

      // Animate wheel
      if (wheelRef.current) {
        wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
        wheelRef.current.style.transform = `rotate(${targetDegrees}deg)`
      }

      // Show prize after animation
      setTimeout(() => {
        setPrizeWon(result.prize_won!)
        setSpinning(false)
        setSpinsLeft(prev => Math.max(0, prev - 1))

        if (onSpinComplete) {
          onSpinComplete(result.prize_won!)
        }

        // NON resettiamo la ruota - rimane ferma così puoi vedere dove si è fermata
        // Il reset avverrà quando chiudi il popup
      }, 4000)

      // Update spin availability
      setTimeout(() => {
        checkSpinAvailability()
      }, 4500)

    } catch (error) {
      console.error('❌ Error spinning wheel:', error)
      setSpinning(false)
    }
  }

  if (loading) {
    return (
      <div className="spin-wheel-modal">
        <div className="spin-wheel-content">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (!config || !config.sectors || config.sectors.length === 0) {
    return (
      <div className="spin-wheel-modal">
        <div className="spin-wheel-content">
          <p>Ruota non configurata</p>
          {onClose && (
            <button onClick={onClose} className="btn-close">Chiudi</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="spin-wheel-modal" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      <div
        className="spin-wheel-backdrop"
        onClick={(e) => {
          // Only close if clicking directly on backdrop, not propagated clicks
          if (e.target === e.currentTarget && onClose) {
            onClose()
          }
        }}
      ></div>

      <div className="spin-wheel-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        {onClose && (
          <button className="spin-close-btn" onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}>
            <X size={24} strokeWidth={4} />
          </button>
        )}

        {/* Title */}
        <div className="spin-title">
          <Sparkles size={28} />
          <h2>{config.name}</h2>
          <Sparkles size={28} />
        </div>

        {/* Spins left indicator */}
        <div className="spins-left">
          Spin disponibili oggi: <strong>{spinsLeft}</strong>
        </div>

        {/* Wrapper for wheel and button - both positioned independently */}
        <div className="wheel-and-button-wrapper" ref={wheelContainerRef}>
          {/* Wheel container */}
          <div className="wheel-container">
          {/* Pointer */}
          <div className="wheel-pointer">
            <div className="pointer-arrow"></div>
          </div>

          {/* Wheel wrapper - static container */}
          <div className="wheel-wrapper">
            {/* Wheel SVG */}
            <div className="wheel">
            <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              <defs>
                {/* Gradient for border */}
                <linearGradient id="wheelBorderGame" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: primaryColor, stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: primaryColor, stopOpacity: 0.7 }} />
                </linearGradient>
                {/* Shadow for sectors */}
                <filter id="sectorShadowGame">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.3"/>
                </filter>
              </defs>

              {/* Rotating group - ONLY THIS ROTATES */}
              <g ref={wheelRef} style={{ transformOrigin: 'center' }}>
              {/* Sectors */}
              {config.sectors.map((sector, index) => {
                const totalSectors = config.sectors.length
                const anglePerSector = 360 / totalSectors
                const startAngle = (anglePerSector * index - 90) * (Math.PI / 180)
                const endAngle = (anglePerSector * (index + 1) - 90) * (Math.PI / 180)

                const centerX = 250
                const centerY = 250
                const radius = 235

                const x1 = centerX + radius * Math.cos(startAngle)
                const y1 = centerY + radius * Math.sin(startAngle)
                const x2 = centerX + radius * Math.cos(endAngle)
                const y2 = centerY + radius * Math.sin(endAngle)

                const largeArcFlag = anglePerSector > 180 ? 1 : 0

                const pathData = [
                  `M ${centerX} ${centerY}`,
                  `L ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ')

                // Text position (middle of the arc)
                const midAngle = (startAngle + endAngle) / 2
                const textRotation = (midAngle * 180 / Math.PI) + 90

                // Render text vertically (letter by letter)
                const letters = sector.label.split('')
                const letterSpacing = 16
                const totalHeight = (letters.length - 1) * letterSpacing
                const startOffset = -totalHeight / 2

                return (
                  <g key={sector.id}>
                    <path
                      d={pathData}
                      fill={sector.color}
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="3"
                      filter="url(#sectorShadowGame)"
                    />
                    {letters.map((letter, letterIndex) => {
                      const textRadius = radius * 0.68
                      const textX = centerX + textRadius * Math.cos(midAngle)
                      const textY = centerY + textRadius * Math.sin(midAngle)
                      const letterOffset = startOffset + (letterIndex * letterSpacing)

                      return (
                        <text
                          key={letterIndex}
                          x={textX}
                          y={textY + letterOffset}
                          fill="white"
                          fontSize="15"
                          fontWeight="800"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                          style={{
                            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.6))',
                            letterSpacing: '1px'
                          }}
                        >
                          {letter}
                        </text>
                      )
                    })}
                  </g>
                )
              })}
              </g>
              {/* End of rotating group */}

              {/* Outer border circle with gradient - STATIC, doesn't rotate */}
              <circle
                cx="250"
                cy="250"
                r="242"
                fill="none"
                stroke="url(#wheelBorderGame)"
                strokeWidth="14"
              />

              {/* Inner decorative circle */}
              <circle
                cx="250"
                cy="250"
                r="225"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="2"
              />

              {/* Center button as SVG - always perfectly centered at 250,250 */}
              <g
                style={{ cursor: spinning || !canSpin ? 'not-allowed' : 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!spinning && canSpin) handleSpin()
                }}
              >
                {/* Outer red border */}
                <circle
                  cx="250"
                  cy="250"
                  r="54"
                  fill={primaryColor}
                />
                {/* White ring */}
                <circle
                  cx="250"
                  cy="250"
                  r="50"
                  fill="white"
                />
                {/* Button background */}
                <circle
                  cx="250"
                  cy="250"
                  r="44"
                  fill={spinning ? '#f59e0b' : !canSpin ? '#9ca3af' : primaryColor}
                  style={{ transition: 'fill 0.3s' }}
                />
                {/* Button text */}
                <text
                  x="250"
                  y="250"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="22"
                  fontWeight="900"
                  letterSpacing="1"
                  style={{
                    pointerEvents: 'none',
                    textTransform: 'uppercase',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}
                >
                  {spinning ? 'GIRA...' : !canSpin ? 'FINITI' : 'GIRA!'}
                </text>
              </g>
            </svg>
            </div>
          </div>
          </div>

          {/* Old HTML button - hidden, SVG button is used instead */}
          <button
            className={`spin-button ${spinning ? 'spinning' : ''} ${!canSpin ? 'disabled' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              handleSpin()
            }}
            disabled={spinning || !canSpin}
            style={{ display: 'none' }}
          >
            {spinning ? 'GIRA...' : !canSpin ? 'FINITI' : 'GIRA!'}
          </button>
        </div>

        {/* Prize reveal modal */}
        {prizeWon && (
          <div className="prize-reveal">
            <div className="prize-reveal-content">
              <div className="prize-confetti">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7'][i % 5]
                    }}
                  />
                ))}
              </div>

              <Trophy size={64} color="#f59e0b" />
              <h2>Hai Vinto!</h2>
              <div className="prize-won-label">{prizeWon.label}</div>

              {prizeWon.code && (
                <div className="prize-code">
                  Codice: <strong>{prizeWon.code}</strong>
                </div>
              )}

              <button
                className="prize-ok-btn"
                onClick={() => {
                  setPrizeWon(null)
                  // La ruota rimane ferma - NON si resetta

                  if (spinsLeft === 0 && onClose) {
                    onClose()
                  }
                }}
              >
                Fantastico!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SpinWheel
