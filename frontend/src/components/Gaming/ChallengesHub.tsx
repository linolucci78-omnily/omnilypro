/**
 * OMNILYPRO GAMING MODULE - Challenges Hub
 * Dashboard for customer challenges (daily/weekly)
 */

import React, { useState, useEffect } from 'react'
import { Target, Trophy, Clock, CheckCircle2, Zap, Gift, X } from 'lucide-react'
import { challengeService } from '../../services/gaming/challengeService'
import type { CustomerChallenge, Challenge } from '../../services/gaming/types'
import './ChallengesHub.css'

interface ChallengesHubProps {
  customerId: string
  organizationId: string
  primaryColor?: string
  onClose?: () => void
}

const ChallengesHub: React.FC<ChallengesHubProps> = ({
  customerId,
  organizationId,
  primaryColor = '#dc2626',
  onClose
}) => {
  const [challenges, setChallenges] = useState<CustomerChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    loadChallenges()
  }, [customerId])

  const loadChallenges = async () => {
    try {
      setLoading(true)
      const data = await challengeService.getCustomerChallenges(customerId)
      setChallenges(data)
      console.log(`✅ Loaded ${data.length} challenges`)
    } catch (error) {
      console.error('❌ Error loading challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter challenges
  const filteredChallenges = challenges.filter(c => {
    if (filter === 'all') return true
    return c.status === filter
  })

  // Separate by type
  const dailyChallenges = filteredChallenges.filter(c => c.challenge?.type === 'daily')
  const weeklyChallenges = filteredChallenges.filter(c => c.challenge?.type === 'weekly')

  // Calculate stats
  const activeCount = challenges.filter(c => c.status === 'active').length
  const completedCount = challenges.filter(c => c.status === 'completed').length

  // Format time remaining
  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()

    if (diff < 0) return 'Scaduta'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} giorn${days === 1 ? 'o' : 'i'}`
    }

    return `${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="challenges-hub-modal">
        <div className="challenges-hub-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose()
          }
        }}></div>
        <div className="challenges-hub-content">
          <div className="challenges-loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="challenges-hub-modal" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      <div
        className="challenges-hub-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose()
          }
        }}
      ></div>

      <div className="challenges-hub-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        {onClose && (
          <button className="challenges-close-btn" onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}>
            <X size={24} strokeWidth={4} />
          </button>
        )}

        <div className="challenges-hub">
          {/* Header */}
          <div className="challenges-header">
        <div className="challenges-title">
          <Target size={32} />
          <h2>Le Tue Challenge</h2>
        </div>
        <div className="challenges-stats">
          <div className="stat">
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Attive</div>
          </div>
          <div className="stat">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Completate</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="challenges-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tutte
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Attive
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completate
        </button>
      </div>

      {/* Daily Challenges */}
      {dailyChallenges.length > 0 && (
        <div className="challenge-section">
          <h3 className="section-title">
            <Zap size={20} />
            Challenge Giornaliere
          </h3>
          <div className="challenges-grid">
            {dailyChallenges.map(customerChallenge => {
              const challenge = customerChallenge.challenge as Challenge
              const progress = customerChallenge.progress
              const isCompleted = customerChallenge.status === 'completed'

              return (
                <div
                  key={customerChallenge.id}
                  className={`challenge-card ${isCompleted ? 'completed' : ''}`}
                >
                  {/* Icon */}
                  <div className="challenge-icon">
                    {challenge.icon_emoji || '🎯'}
                  </div>

                  {/* Content */}
                  <div className="challenge-content">
                    <h4 className="challenge-title">{challenge.title}</h4>
                    <p className="challenge-description">{challenge.description}</p>

                    {/* Progress */}
                    <div className="challenge-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress.percentage || 0}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {progress.current || 0}/{progress.target || 1}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="challenge-footer">
                      {/* Time remaining */}
                      {!isCompleted && (
                        <div className="time-remaining">
                          <Clock size={14} />
                          {getTimeRemaining(customerChallenge.expires_at)}
                        </div>
                      )}

                      {/* Rewards */}
                      <div className="challenge-rewards">
                        {challenge.rewards.points && (
                          <span className="reward-badge">
                            +{challenge.rewards.points} punti
                          </span>
                        )}
                        {challenge.rewards.free_spins && (
                          <span className="reward-badge">
                            {challenge.rewards.free_spins} spin
                          </span>
                        )}
                      </div>

                      {/* Completed badge */}
                      {isCompleted && (
                        <div className="completed-badge">
                          <CheckCircle2 size={16} />
                          Completata!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Weekly Challenges */}
      {weeklyChallenges.length > 0 && (
        <div className="challenge-section">
          <h3 className="section-title">
            <Trophy size={20} />
            Challenge Settimanali
          </h3>
          <div className="challenges-grid">
            {weeklyChallenges.map(customerChallenge => {
              const challenge = customerChallenge.challenge as Challenge
              const progress = customerChallenge.progress
              const isCompleted = customerChallenge.status === 'completed'

              return (
                <div
                  key={customerChallenge.id}
                  className={`challenge-card weekly ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="challenge-icon">
                    {challenge.icon_emoji || '🏆'}
                  </div>

                  <div className="challenge-content">
                    <h4 className="challenge-title">{challenge.title}</h4>
                    <p className="challenge-description">{challenge.description}</p>

                    <div className="challenge-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress.percentage || 0}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {progress.current || 0}/{progress.target || 1}
                      </div>
                    </div>

                    <div className="challenge-footer">
                      {!isCompleted && (
                        <div className="time-remaining">
                          <Clock size={14} />
                          {getTimeRemaining(customerChallenge.expires_at)}
                        </div>
                      )}

                      <div className="challenge-rewards">
                        {challenge.rewards.points && (
                          <span className="reward-badge">
                            +{challenge.rewards.points} punti
                          </span>
                        )}
                        {challenge.rewards.free_spins && (
                          <span className="reward-badge">
                            {challenge.rewards.free_spins} spin
                          </span>
                        )}
                      </div>

                      {isCompleted && (
                        <div className="completed-badge">
                          <CheckCircle2 size={16} />
                          Completata!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredChallenges.length === 0 && (
        <div className="challenges-empty">
          <Gift size={64} />
          <h3>Nessuna Challenge</h3>
          <p>Le challenge giornaliere verranno generate automaticamente!</p>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}

export default ChallengesHub
