/**
 * OMNILYPRO GAMING MODULE - Badge Unlock Notification
 * Toast notification when badge is unlocked
 */

import React, { useEffect, useState } from 'react'
import { Award, X, Sparkles } from 'lucide-react'
import type { Badge } from '../../services/gaming/types'
import './BadgeUnlockNotification.css'

interface BadgeUnlockNotificationProps {
  badge: Badge
  onClose: () => void
  autoCloseDelay?: number
}

const BadgeUnlockNotification: React.FC<BadgeUnlockNotificationProps> = ({
  badge,
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
    <div className={`badge-unlock-notification ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''} rarity-${badge.rarity}`}>
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
        {/* Badge icon */}
        <div className="notification-icon">
          {badge.icon_emoji ? (
            <span className="notification-emoji">{badge.icon_emoji}</span>
          ) : (
            <Award size={48} />
          )}
          <div className="icon-glow"></div>
        </div>

        {/* Text */}
        <div className="notification-text">
          <div className="notification-title">
            <Sparkles size={16} />
            <span>Nuovo Badge Sbloccato!</span>
            <Sparkles size={16} />
          </div>
          <div className="notification-badge-name">{badge.name}</div>
          <div className="notification-description">{badge.description}</div>

          {/* Rewards */}
          {badge.unlock_rewards && (
            <div className="notification-rewards">
              {badge.unlock_rewards.points && (
                <div className="reward-item">
                  +{badge.unlock_rewards.points} punti
                </div>
              )}
              {badge.unlock_rewards.discount && (
                <div className="reward-item">
                  {badge.unlock_rewards.discount}% sconto
                </div>
              )}
              {badge.unlock_rewards.free_spins && (
                <div className="reward-item">
                  {badge.unlock_rewards.free_spins} spin gratis
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rarity indicator */}
      <div className={`notification-rarity ${badge.rarity}`}>
        {badge.rarity.toUpperCase()}
      </div>
    </div>
  )
}

export default BadgeUnlockNotification
