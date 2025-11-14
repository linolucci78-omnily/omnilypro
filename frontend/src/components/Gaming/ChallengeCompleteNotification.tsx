/**
 * OMNILYPRO GAMING MODULE - Challenge Complete Notification
 * Toast notification when challenge is completed
 */

import React, { useEffect, useState } from 'react'
import { Trophy, X, Sparkles, Zap, Gift } from 'lucide-react'
import type { Challenge } from '../../services/gaming/types'
import './ChallengeCompleteNotification.css'

interface ChallengeCompleteNotificationProps {
  challenge: Challenge
  onClose: () => void
  autoCloseDelay?: number
}

const ChallengeCompleteNotification: React.FC<ChallengeCompleteNotificationProps> = ({
  challenge,
  onClose,
  autoCloseDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10)

    // Auto-close after delay
    const timer = setTimeout(() => {
      handleClose()
    }, autoCloseDelay)

    return () => clearTimeout(timer)
  }, [autoCloseDelay])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
    }, 300) // Match exit animation duration
  }

  return (
    <div className={`challenge-complete-notification ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''} type-${challenge.type}`}>
      {/* Confetti background */}
      <div className="notification-confetti">
        {[...Array(20)].map((_, i) => (
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

      {/* Close button */}
      <button className="notification-close" onClick={handleClose}>
        <X size={20} />
      </button>

      {/* Content */}
      <div className="notification-content">
        {/* Challenge icon */}
        <div className="notification-icon">
          {challenge.icon_emoji ? (
            <span className="notification-emoji">{challenge.icon_emoji}</span>
          ) : (
            <Trophy size={48} />
          )}
          <div className="icon-glow"></div>
        </div>

        {/* Text */}
        <div className="notification-text">
          <div className="notification-title">
            <Sparkles size={16} />
            <span>Challenge Completata!</span>
            <Sparkles size={16} />
          </div>
          <div className="notification-challenge-name">{challenge.title}</div>
          <div className="notification-description">{challenge.description}</div>

          {/* Rewards */}
          {challenge.rewards && (
            <div className="notification-rewards">
              {challenge.rewards.points && challenge.rewards.points > 0 && (
                <div className="reward-item">
                  <Zap size={16} />
                  +{challenge.rewards.points} punti
                </div>
              )}
              {challenge.rewards.free_spins && challenge.rewards.free_spins > 0 && (
                <div className="reward-item">
                  <Gift size={16} />
                  {challenge.rewards.free_spins} spin gratis
                </div>
              )}
              {challenge.rewards.discount && challenge.rewards.discount > 0 && (
                <div className="reward-item">
                  🎁 {challenge.rewards.discount}% sconto
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Type indicator */}
      <div className={`notification-type ${challenge.type}`}>
        {challenge.type === 'daily' ? 'GIORNALIERA' : 'SETTIMANALE'}
      </div>
    </div>
  )
}

export default ChallengeCompleteNotification
