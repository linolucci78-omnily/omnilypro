/**
 * OMNILYPRO GAMING MODULE - TypeScript Types
 * Badge System, Challenges, Spin the Wheel
 */

// ============================================
// GAMING CONFIG
// ============================================

export interface GamingConfig {
  id: string
  organization_id: string
  is_enabled: boolean
  // Badge settings
  badges_enabled: boolean
  auto_badge_unlock: boolean
  // Challenges settings
  challenges_enabled: boolean
  daily_challenges_count: number
  weekly_challenges_count: number
  // Spin settings
  spin_enabled: boolean
  spin_trigger_rules: SpinTriggerRules
  max_spins_per_day: number
  // Metadata
  created_at: string
  updated_at: string
}

export interface SpinTriggerRules {
  on_purchase?: boolean
  min_purchase_amount?: number
  on_points_milestone?: number[]
  manual_grant?: boolean
}

// ============================================
// BADGE SYSTEM
// ============================================

export type BadgeCategory = 'firstSteps' | 'loyalty' | 'spending' | 'frequency' | 'social' | 'seasonal' | 'special'
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Badge {
  id: string
  organization_id: string
  name: string
  description: string
  icon_url?: string
  icon_emoji?: string
  category: BadgeCategory
  rarity: BadgeRarity
  auto_unlock_rule?: BadgeUnlockRule
  unlock_rewards?: BadgeRewards
  is_active: boolean
  is_predefined: boolean
  created_at: string
  updated_at: string
}

export interface BadgeUnlockRule {
  type: 'registration' | 'purchase_count' | 'reward_redeemed' | 'days_since_registration' |
        'total_spent' | 'visit_count' | 'streak_days' | 'referrals' | 'challenges_completed' |
        'points_reached' | 'tier_reached'
  threshold?: number
  tier_name?: string
}

export interface BadgeRewards {
  points?: number
  discount?: number
  free_spins?: number
}

export interface CustomerBadge {
  id: string
  customer_id: string
  badge_id: string
  unlocked_at: string
  unlock_method: 'auto' | 'manual' | 'admin_granted'
  progress?: BadgeProgress
  created_at: string
  // Joined data
  badge?: Badge
}

export interface BadgeProgress {
  current: number
  target: number
  percentage: number
}

// ============================================
// CHALLENGES SYSTEM
// ============================================

export type ChallengeType = 'daily' | 'weekly' | 'monthly' | 'special'
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard'
export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'expired'

export interface Challenge {
  id: string
  organization_id: string
  title: string
  description: string
  icon_emoji?: string
  type: ChallengeType
  difficulty: ChallengeDifficulty
  requirements: ChallengeRequirements
  rewards: ChallengeRewards
  duration_hours?: number
  start_time?: string
  end_time?: string
  is_recurring: boolean
  recurrence_pattern?: string
  is_active: boolean
  is_template: boolean
  created_at: string
  updated_at: string
}

export interface ChallengeRequirements {
  type: 'make_purchases' | 'spend_amount' | 'earn_points' | 'redeem_rewards' |
        'visit_count' | 'referrals' | 'streak_days'
  count?: number
  amount?: number
  points?: number
}

export interface ChallengeRewards {
  points?: number
  badge_id?: string
  free_spins?: number
  discount?: number
}

export interface CustomerChallenge {
  id: string
  customer_id: string
  challenge_id: string
  progress: ChallengeProgress
  status: ChallengeStatus
  started_at: string
  expires_at: string
  completed_at?: string
  rewards_claimed: boolean
  rewards_claimed_at?: string
  created_at: string
  updated_at: string
  // Joined data
  challenge?: Challenge
}

export interface ChallengeProgress {
  current: number
  target: number
  percentage: number
  // For complex challenges
  [key: string]: any
}

// ============================================
// SPIN THE WHEEL
// ============================================

export type PrizeType = 'points' | 'discount' | 'free_spin' | 'badge' | 'reward' | 'nothing'

export interface WheelConfig {
  id: string
  organization_id: string
  name: string
  sectors: WheelSector[]
  trigger_rules: SpinTriggerRules
  max_spins_per_day: number
  max_spins_per_week?: number
  cooldown_hours: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WheelSector {
  id: number
  label: string
  type: PrizeType
  value: number | string
  color: string
  probability: number // Percentage 0-100
}

export interface CustomerSpin {
  id: string
  customer_id: string
  organization_id: string
  wheel_config_id?: string
  sector_landed: WheelSector
  prize_won: SpinPrize
  rewards_claimed: boolean
  rewards_claimed_at?: string
  spun_at: string
  created_at: string
}

export interface SpinPrize {
  type: PrizeType
  value: number | string
  label: string
  code?: string // Discount code se type=discount
}

// ============================================
// GAMING STATS
// ============================================

export interface GamingStats {
  id: string
  organization_id: string
  date: string
  badges_unlocked_today: number
  badges_unlocked_total: number
  challenges_completed_today: number
  challenges_active: number
  spins_today: number
  prizes_won: Record<string, number>
  active_gamers_today: number
  created_at: string
  updated_at: string
}

export interface CustomerGamingOverview {
  customer_id: string
  customer_name: string
  organization_id: string
  badges_earned: number
  challenges_completed: number
  challenges_active: number
  total_spins: number
  spins_today: number
  last_gaming_activity: string
}

// ============================================
// GAMING NOTIFICATIONS
// ============================================

export type GamingNotificationType = 'badge_unlocked' | 'challenge_completed' |
                                     'spin_available' | 'challenge_expiring' |
                                     'new_challenge' | 'reward_earned'

export interface GamingNotification {
  id: string
  customer_id: string
  type: GamingNotificationType
  title: string
  message: string
  data?: any
  is_read: boolean
  read_at?: string
  created_at: string
}

// ============================================
// SERVICE RESPONSES
// ============================================

export interface BadgeUnlockResult {
  success: boolean
  badge?: CustomerBadge
  newly_unlocked: boolean
  error?: string
}

export interface ChallengeUpdateResult {
  success: boolean
  challenge?: CustomerChallenge
  completed: boolean
  rewards?: ChallengeRewards
  error?: string
}

export interface SpinResult {
  success: boolean
  spin?: CustomerSpin
  sector_landed?: WheelSector
  prize_won?: SpinPrize
  error?: string
}

// ============================================
// API INPUTS
// ============================================

export interface CreateBadgeInput {
  organization_id: string
  name: string
  description: string
  icon_url?: string
  icon_emoji?: string
  category: BadgeCategory
  rarity?: BadgeRarity
  auto_unlock_rule?: BadgeUnlockRule
  unlock_rewards?: BadgeRewards
  is_active?: boolean
}

export interface CreateChallengeInput {
  organization_id: string
  title: string
  description: string
  icon_emoji?: string
  type: ChallengeType
  difficulty?: ChallengeDifficulty
  requirements: ChallengeRequirements
  rewards: ChallengeRewards
  duration_hours?: number
  is_recurring?: boolean
  recurrence_pattern?: string
  is_active?: boolean
}

export interface UpdateWheelConfigInput {
  name?: string
  sectors?: WheelSector[]
  trigger_rules?: SpinTriggerRules
  max_spins_per_day?: number
  max_spins_per_week?: number
  cooldown_hours?: number
  is_active?: boolean
}
