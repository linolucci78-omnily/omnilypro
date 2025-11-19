export interface Organization {
  id: string
  slug: string
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  points_name: string
  wallet_enabled: boolean
  loyalty_tiers: LoyaltyTier[]
  referral_tiers: ReferralTier[]
  created_at: string
}

export interface ReferralTier {
  name: string
  friends_required: number
  points_reward: number
  description: string
}

export interface Customer {
  id: string
  organization_id: string
  email: string
  name: string
  phone: string | null
  points: number
  tier: string | null
  referral_code: string
  friends_invited: number
  referral_points_earned: number
  created_at: string
}

export interface LoyaltyTier {
  name: string
  threshold: number
  multiplier: number
  color: string
}

export interface Reward {
  id: string
  organization_id: string
  name: string
  description: string
  image_url: string | null
  points_required: number
  type: 'discount' | 'freeProduct' | 'cashback' | 'giftCard'
  value: string
  is_active: boolean
  category: string | null
  required_tier: string | null
}

export interface CustomerActivity {
  id: string
  customer_id: string
  organization_id: string
  activity_type: string
  points_change: number
  description: string
  created_at: string
}

export interface RewardRedemption {
  id: string
  customer_id: string
  organization_id: string
  reward_id: string
  voucher_code: string
  points_spent: number
  status: 'active' | 'used' | 'expired'
  redeemed_at: string
  used_at: string | null
  expires_at: string
}
