/**
 * OMNILYPRO GAMING MODULE - Badge Gallery
 * Displays customer's badges (unlocked and locked)
 */

import React, { useState, useEffect } from 'react'
import { Lock, Award, Trophy, Star, Shield, Crown, X } from 'lucide-react'
import { badgeService } from '../../services/gaming/badgeService'
import type { Badge, CustomerBadge, BadgeCategory, BadgeRarity } from '../../services/gaming/types'
import './BadgeGallery.css'

interface BadgeGalleryProps {
  customerId: string
  organizationId: string
  primaryColor?: string
  onClose?: () => void
}

const BadgeGallery: React.FC<BadgeGalleryProps> = ({
  customerId,
  organizationId,
  primaryColor = '#dc2626',
  onClose
}) => {
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [customerBadges, setCustomerBadges] = useState<CustomerBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<BadgeCategory | 'all'>('all')
  const [filterRarity, setFilterRarity] = useState<BadgeRarity | 'all'>('all')

  useEffect(() => {
    loadBadges()
  }, [customerId, organizationId])

  const loadBadges = async () => {
    try {
      setLoading(true)

      // Load all badges for organization
      const badges = await badgeService.getAllBadges(organizationId)
      setAllBadges(badges)

      // Load customer's unlocked badges
      const unlocked = await badgeService.getCustomerBadges(customerId)
      setCustomerBadges(unlocked)

      console.log(`✅ Loaded ${badges.length} badges, ${unlocked.length} unlocked`)
    } catch (error) {
      console.error('❌ Error loading badges:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if customer has unlocked a badge
  const isUnlocked = (badgeId: string): CustomerBadge | undefined => {
    return customerBadges.find(cb => cb.badge_id === badgeId)
  }

  // Filter badges
  const filteredBadges = allBadges.filter(badge => {
    if (filterCategory !== 'all' && badge.category !== filterCategory) return false
    if (filterRarity !== 'all' && badge.rarity !== filterRarity) return false
    return true
  })

  // Calculate stats
  const unlockedCount = customerBadges.length
  const totalCount = allBadges.length
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  // Categories for filters
  const categories: Array<{ value: BadgeCategory | 'all', label: string, emoji: string }> = [
    { value: 'all', label: 'Tutti', emoji: '🎯' },
    { value: 'firstSteps', label: 'Primi Passi', emoji: '👋' },
    { value: 'loyalty', label: 'Fedeltà', emoji: '⭐' },
    { value: 'spending', label: 'Spesa', emoji: '💰' },
    { value: 'frequency', label: 'Frequenza', emoji: '🔄' },
    { value: 'social', label: 'Social', emoji: '🤝' },
    { value: 'special', label: 'Speciali', emoji: '✨' }
  ]

  const rarities: Array<{ value: BadgeRarity | 'all', label: string }> = [
    { value: 'all', label: 'Tutte' },
    { value: 'common', label: 'Comuni' },
    { value: 'rare', label: 'Rare' },
    { value: 'epic', label: 'Epiche' },
    { value: 'legendary', label: 'Leggendarie' }
  ]

  // Format unlock date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Get category label
  const getCategoryLabel = (category: BadgeCategory): string => {
    const cat = categories.find(c => c.value === category)
    return cat?.label || category
  }

  if (loading) {
    return (
      <div className="badge-gallery-modal">
        <div className="badge-gallery-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose()
          }
        }}></div>
        <div className="badge-gallery-content">
          <div className="badge-loading">
            <div className="badge-loading-spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="badge-gallery-modal" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      <div
        className="badge-gallery-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose()
          }
        }}
      ></div>

      <div className="badge-gallery-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        {onClose && (
          <button className="badge-close-btn" onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}>
            <X size={24} strokeWidth={4} />
          </button>
        )}

        <div className="badge-gallery">
          {/* Header */}
          <div className="badge-gallery-header">
        <div className="badge-gallery-title">
          <span className="emoji">🏆</span>
          <h2>Badge Collection</h2>
        </div>
        <div className="badge-gallery-stats">
          <div className="badge-stat">
            <div className="badge-stat-value">{unlockedCount}/{totalCount}</div>
            <div className="badge-stat-label">Sbloccati</div>
          </div>
          <div className="badge-stat">
            <div className="badge-stat-value">{completionPercentage}%</div>
            <div className="badge-stat-label">Completamento</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="badge-filters">
        {categories.map(cat => (
          <button
            key={cat.value}
            className={`filter-btn ${filterCategory === cat.value ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat.value)}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      {filteredBadges.length === 0 ? (
        <div className="badge-empty-state">
          <div className="emoji">🔍</div>
          <h3>Nessun Badge</h3>
          <p>Non ci sono badge in questa categoria</p>
        </div>
      ) : (
        <div className="badge-grid">
          {filteredBadges.map(badge => {
            const unlockedBadge = isUnlocked(badge.id)
            const locked = !unlockedBadge

            return (
              <div
                key={badge.id}
                className={`badge-card ${locked ? 'locked' : ''} rarity-${badge.rarity}`}
              >
                {/* Rarity label */}
                <div className={`badge-rarity ${badge.rarity}`}>
                  {badge.rarity}
                </div>

                {/* Badge icon */}
                <div className="badge-icon">
                  {badge.icon_emoji ? (
                    <span>{badge.icon_emoji}</span>
                  ) : badge.icon_url ? (
                    <img src={badge.icon_url} alt={badge.name} />
                  ) : (
                    <Award size={40} />
                  )}

                  {locked && (
                    <div className="lock-icon">
                      <Lock size={14} color="#6b7280" />
                    </div>
                  )}
                </div>

                {/* Badge name */}
                <h3 className="badge-name">{badge.name}</h3>

                {/* Badge description */}
                <p className="badge-description">{badge.description}</p>

                {/* Category */}
                <div className="badge-category">
                  {getCategoryLabel(badge.category)}
                </div>

                {/* Unlock date (if unlocked) */}
                {unlockedBadge && (
                  <div className="badge-unlock-date">
                    Sbloccato il {formatDate(unlockedBadge.unlocked_at)}
                  </div>
                )}

                {/* Progress bar (if has progress) */}
                {unlockedBadge?.progress && (
                  <div className="badge-progress">
                    <div className="badge-progress-bar">
                      <div
                        className="badge-progress-fill"
                        style={{ width: `${unlockedBadge.progress.percentage}%` }}
                      ></div>
                    </div>
                    <div className="badge-progress-text">
                      {unlockedBadge.progress.current}/{unlockedBadge.progress.target}
                    </div>
                  </div>
                )}

                {/* Requirements (if locked and has auto-unlock rule) */}
                {locked && badge.auto_unlock_rule && (
                  <div className="badge-progress-text" style={{ marginTop: '8px' }}>
                    {getRequirementText(badge.auto_unlock_rule)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
        </div>
      </div>
    </div>
  )
}

// Helper: Get requirement text for locked badges
function getRequirementText(rule: any): string {
  switch (rule.type) {
    case 'registration':
      return 'Registrati per sbloccare'
    case 'purchase_count':
      return `Fai ${rule.threshold} acquist${rule.threshold === 1 ? 'o' : 'i'}`
    case 'total_spent':
      return `Spendi €${rule.threshold} in totale`
    case 'visit_count':
      return `Fai ${rule.threshold} visit${rule.threshold === 1 ? 'a' : 'e'}`
    case 'points_reached':
      return `Raggiungi ${rule.threshold} punti`
    case 'days_since_registration':
      return `Cliente da ${rule.threshold} giorni`
    case 'reward_redeemed':
      return `Riscatta ${rule.threshold} prem${rule.threshold === 1 ? 'io' : 'i'}`
    case 'referrals':
      return `Invita ${rule.threshold} amic${rule.threshold === 1 ? 'o' : 'i'}`
    case 'challenges_completed':
      return `Completa ${rule.threshold} challenge`
    case 'streak_days':
      return `Mantieni streak di ${rule.threshold} giorni`
    case 'tier_reached':
      return `Raggiungi tier ${rule.tier_name}`
    default:
      return 'Sblocca questo badge'
  }
}

export default BadgeGallery
