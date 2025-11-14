/**
 * OMNILYPRO GAMING MODULE - Notifications Context
 * Global context for managing gaming notifications (challenge complete, badge unlock)
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { Challenge, Badge } from '../services/gaming/types'
import ChallengeCompleteNotification from '../components/Gaming/ChallengeCompleteNotification'
import BadgeUnlockNotification from '../components/Gaming/BadgeUnlockNotification'

interface ChallengeNotification {
  id: string
  type: 'challenge'
  challenge: Challenge
}

interface BadgeNotification {
  id: string
  type: 'badge'
  badge: Badge
}

type GamingNotification = ChallengeNotification | BadgeNotification

interface GamingNotificationsContextType {
  showChallengeComplete: (challenge: Challenge) => void
  showBadgeUnlock: (badge: Badge) => void
}

const GamingNotificationsContext = createContext<GamingNotificationsContextType | undefined>(undefined)

export const useGamingNotifications = () => {
  const context = useContext(GamingNotificationsContext)
  if (!context) {
    throw new Error('useGamingNotifications must be used within GamingNotificationsProvider')
  }
  return context
}

interface GamingNotificationsProviderProps {
  children: ReactNode
}

export const GamingNotificationsProvider: React.FC<GamingNotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<GamingNotification[]>([])

  const showChallengeComplete = useCallback((challenge: Challenge) => {
    const notification: ChallengeNotification = {
      id: `challenge-${Date.now()}-${Math.random()}`,
      type: 'challenge',
      challenge
    }
    setNotifications(prev => [...prev, notification])
  }, [])

  const showBadgeUnlock = useCallback((badge: Badge) => {
    const notification: BadgeNotification = {
      id: `badge-${Date.now()}-${Math.random()}`,
      type: 'badge',
      badge
    }
    setNotifications(prev => [...prev, notification])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <GamingNotificationsContext.Provider value={{ showChallengeComplete, showBadgeUnlock }}>
      {children}

      {/* Render notifications */}
      <div className="gaming-notifications-container">
        {notifications.map((notification, index) => {
          if (notification.type === 'challenge') {
            return (
              <div
                key={notification.id}
                style={{
                  position: 'fixed',
                  top: `${20 + index * 120}px`,
                  right: '20px',
                  zIndex: 10000 + index
                }}
              >
                <ChallengeCompleteNotification
                  challenge={notification.challenge}
                  onClose={() => removeNotification(notification.id)}
                  autoCloseDelay={5000}
                />
              </div>
            )
          } else {
            return (
              <div
                key={notification.id}
                style={{
                  position: 'fixed',
                  top: `${20 + index * 120}px`,
                  right: '20px',
                  zIndex: 10000 + index
                }}
              >
                <BadgeUnlockNotification
                  badge={notification.badge}
                  onClose={() => removeNotification(notification.id)}
                  autoCloseDelay={5000}
                />
              </div>
            )
          }
        })}
      </div>
    </GamingNotificationsContext.Provider>
  )
}
