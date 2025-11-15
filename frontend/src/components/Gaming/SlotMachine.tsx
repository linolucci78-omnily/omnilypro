/**
 * OMNILYPRO GAMING MODULE - Slot Machine
 * Animated 3-reel slot machine with prizes
 */

import React, { useState, useRef } from 'react'
import { Trophy, X, Sparkles, Award } from 'lucide-react'
import { slotMachineService } from '../../services/gaming/slotMachineService'
import type { SlotMachineConfig, SlotSymbol, SlotPrize } from '../../services/gaming/types'
import './SlotMachine.css'

interface SlotMachineProps {
  customerId: string
  organizationId: string
  primaryColor?: string
  onClose?: () => void
  onSpinComplete?: (prize?: SlotPrize) => void
}

const SlotMachine: React.FC<SlotMachineProps> = React.memo(({
  customerId,
  organizationId,
  primaryColor = '#dc2626',
  onClose,
  onSpinComplete
}) => {
  const [config, setConfig] = useState<SlotMachineConfig | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>(['🍒', '🍋', '🍊'])
  const [prizeWon, setPrizeWon] = useState<SlotPrize | null>(null)
  const [canPlay, setCanPlay] = useState(true)
  const [spinsLeft, setSpinsLeft] = useState(3)
  const [loading, setLoading] = useState(true)
  const [showWin, setShowWin] = useState(false)

  // All possible symbols for animation
  const allSymbols: SlotSymbol[] = ['🍒', '🍋', '🍊', '🍉', '⭐', '💎', '7️⃣', '🎰']

  React.useEffect(() => {
    console.log('🎰 SlotMachine mounted!', { customerId, organizationId })
    loadSlotConfig()
    checkPlayAvailability()

    return () => {
      console.log('🎰 SlotMachine unmounting!')
    }
  }, [customerId, organizationId])

  const loadSlotConfig = async () => {
    try {
      console.log('🎰 Loading slot config for org:', organizationId)
      const slotConfig = await slotMachineService.getSlotConfig(organizationId)
      console.log('🎰 Loaded config:', slotConfig)
      if (slotConfig) {
        console.log('🎰 Config winning_combinations:', slotConfig.winning_combinations)
        setConfig(slotConfig)
      } else {
        console.log('🎰 No config found, seeding default...')
        // Seed default config
        await slotMachineService.seedDefaultSlotConfig(organizationId)
        const newConfig = await slotMachineService.getSlotConfig(organizationId)
        console.log('🎰 Seeded new config:', newConfig)
        setConfig(newConfig)
      }
    } catch (error) {
      console.error('❌ Error loading slot config:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkPlayAvailability = async () => {
    try {
      const { canPlay: available, spinsToday, maxSpins } = await slotMachineService.canPlay(customerId, organizationId)
      setCanPlay(available)
      setSpinsLeft(maxSpins - spinsToday)
    } catch (error) {
      console.error('❌ Error checking play availability:', error)
    }
  }

  const playSound = (type: 'spin' | 'win' | 'jackpot') => {
    // Sound effects
    const audio = new Audio(
      type === 'jackpot' ? '/sounds/jackpot.mp3' :
      type === 'win' ? '/sounds/win.mp3' :
      '/sounds/slot-spin.wav'
    )
    audio.volume = 1.0
    audio.play().catch(error => console.log('🔇 Could not play audio:', error))
  }

  const handleSpin = async () => {
    if (spinning || !canPlay || !config) {
      console.log('❌ Cannot spin')
      return
    }

    try {
      setSpinning(true)
      setPrizeWon(null)
      setShowWin(false)

      // Play spin sound
      playSound('spin')

      // Animate reels spinning for 2 seconds
      const spinDuration = 2000
      const spinInterval = 100

      const reelIntervals = [0, 1, 2].map((reelIndex) => {
        return setInterval(() => {
          setReels(prev => {
            const newReels = [...prev] as [SlotSymbol, SlotSymbol, SlotSymbol]
            newReels[reelIndex] = allSymbols[Math.floor(Math.random() * allSymbols.length)]
            return newReels
          })
        }, spinInterval)
      })

      // Call API to get result
      const result = await slotMachineService.playSlot(customerId, organizationId)

      if (!result.success) {
        alert(result.error || 'Errore durante lo spin')
        reelIntervals.forEach(clearInterval)
        setSpinning(false)
        return
      }

      // Stop reels one by one with final result
      setTimeout(() => {
        clearInterval(reelIntervals[0])
        setReels(prev => [result.result!.reels[0], prev[1], prev[2]])
      }, spinDuration)

      setTimeout(() => {
        clearInterval(reelIntervals[1])
        setReels(prev => [prev[0], result.result!.reels[1], prev[2]])
      }, spinDuration + 300)

      setTimeout(() => {
        clearInterval(reelIntervals[2])
        setReels(result.result!.reels)
        setSpinning(false)

        // Check for win
        if (result.result!.isWin && result.prize) {
          setPrizeWon(result.prize)
          setShowWin(true)

          // Play win sound
          if (result.result!.combination?.pattern === 'jackpot') {
            playSound('jackpot')
          } else {
            playSound('win')
          }

          if (onSpinComplete) {
            onSpinComplete(result.prize)
          }
        } else {
          if (onSpinComplete) {
            onSpinComplete(undefined)
          }
        }

        setSpinsLeft(prev => Math.max(0, prev - 1))
      }, spinDuration + 600)

      // Update availability
      setTimeout(() => {
        checkPlayAvailability()
      }, spinDuration + 1000)

    } catch (error) {
      console.error('❌ Error spinning:', error)
      setSpinning(false)
    }
  }

  if (loading) {
    return (
      <div className="slot-machine-modal">
        <div className="slot-machine-content">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="slot-machine-modal">
        <div className="slot-machine-content">
          <p>Slot machine non configurata</p>
          {onClose && <button onClick={onClose} className="btn-close">Chiudi</button>}
        </div>
      </div>
    )
  }

  return (
    <div className="slot-machine-modal" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      <div className="slot-machine-backdrop" onClick={showWin ? undefined : onClose}></div>

      <div className="slot-machine-content">
        {/* Close button */}
        {onClose && !showWin && (
          <button className="slot-close-btn" onClick={onClose}>
            <X size={24} strokeWidth={4} />
          </button>
        )}

        {/* Title */}
        <div className="slot-title">
          <Sparkles size={28} />
          <h2>{config.name}</h2>
          <Sparkles size={28} />
        </div>

        {/* Spins left */}
        <div className="spins-left">
          Tentativi disponibili oggi: <strong>{spinsLeft}</strong>
        </div>

        {/* Slot Machine */}
        <div className="slot-machine-container">
          <div className="slot-machine-frame">
            {/* Reels */}
            <div className="slot-reels">
              {reels.map((symbol, index) => (
                <div
                  key={index}
                  className={`slot-reel ${spinning ? 'slot-spinning' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="slot-symbol">{symbol}</div>
                </div>
              ))}
            </div>

            {/* Win line indicator */}
            <div className="slot-win-line"></div>
          </div>

          {/* Winning Combinations */}
          {config && config.winning_combinations && config.winning_combinations.length > 0 && (
            <div className="slot-prizes-section">
              <div className="prizes-header">
                <Award size={20} />
                <h3>Combinazioni Vincenti</h3>
                <Award size={20} />
              </div>
              <div className="prizes-list">
                {config.winning_combinations
                  .sort((a, b) => b.prize.value - a.prize.value)
                  .map((combo, index) => (
                    <div key={index} className="prize-item">
                      <div className="prize-combo">
                        {combo.pattern === 'jackpot' && <span>7️⃣ 7️⃣ 7️⃣</span>}
                        {combo.pattern === 'three_match' && combo.symbols && (
                          <span>{combo.symbols[0]} {combo.symbols[0]} {combo.symbols[0]}</span>
                        )}
                        {combo.pattern === 'three_match' && !combo.symbols && (
                          <span>🍒 🍒 🍒</span>
                        )}
                        {combo.pattern === 'two_match' && <span>🍋 🍋 ⭐</span>}
                        {combo.pattern === 'any_diamond' && <span>💎 - -</span>}
                        {combo.pattern === 'any_star' && <span>⭐ - -</span>}
                      </div>
                      <div className="prize-value">{combo.prize.value} pt</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Spin button */}
          <button
            className={`slot-spin-btn ${spinning ? 'slot-btn-spinning' : ''} ${!canPlay ? 'disabled' : ''}`}
            onClick={handleSpin}
            disabled={spinning || !canPlay}
          >
            {spinning ? 'GIRANDO...' : !canPlay ? 'FINITI' : 'SPIN!'}
          </button>
        </div>

      </div>

      {/* Prize reveal - outside slot-machine-content for proper z-index */}
      {showWin && prizeWon && (
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
                setShowWin(false)
                setPrizeWon(null)
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
  )
})

SlotMachine.displayName = 'SlotMachine'

export default SlotMachine
