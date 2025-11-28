// Plan-based access control for OMNILY PRO
// Follows ROADMAP pricing strategy: Freemium €0 → Basic €29 → Pro €99 → Enterprise €299
// V3: Dynamic feature overrides from database

import { supabase } from '../lib/supabase'

export const PlanType = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
} as const

export type PlanType = typeof PlanType[keyof typeof PlanType]

// Interface for database overrides
export interface PlanFeatureOverride {
  id: string
  plan_type: string
  feature_name: string
  value_type: 'boolean' | 'number' | 'string'
  boolean_value?: boolean
  number_value?: number
  string_value?: string
  description?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface PlanFeatures {
  // Core Limits
  maxCustomers: number
  maxWorkflows: number
  maxNotifications: number

  // Feature-specific Limits
  maxTiers: number           // Quanti tier di loyalty
  maxRewards: number         // Quanti premi
  maxCoupons: number         // Quanti coupon
  maxGiftCertificates: number // Quanti gift certificates
  maxCampaigns: number       // Quante campagne marketing

  // Dashboard Sections Access
  loyaltyTiers: boolean
  rewards: boolean
  categories: boolean
  marketingCampaigns: boolean
  teamManagement: boolean
  posIntegration: boolean
  notifications: boolean
  analyticsReports: boolean
  brandingSocial: boolean
  channelsIntegration: boolean

  // Commerce Features
  coupons: boolean
  giftCertificates: boolean
  lottery: boolean

  // Wallet Features
  wallet: boolean              // Standard wallet
  omnyWallet: boolean          // OmnyWallet integration
  cryptoPayments: boolean      // Accept crypto payments

  // Referral System
  referralSystem: boolean      // Sistema referral

  // Advanced Features
  advancedAnalytics: boolean
  apiAccess: boolean
  webhookSupport: boolean
  whiteLabel: boolean
  customDomain: boolean
  prioritySupport: boolean
  sso: boolean

  // Gaming Module (Pro+ exclusive)
  gamingModule: boolean
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  [PlanType.FREE]: {
    // Core Limits
    maxCustomers: 50,
    maxWorkflows: 1,
    maxNotifications: 100,

    // Feature-specific Limits
    maxTiers: 1,               // Solo 1 tier base
    maxRewards: 3,             // Max 3 premi
    maxCoupons: 0,             // No coupons
    maxGiftCertificates: 0,    // No gift certificates
    maxCampaigns: 0,           // No campagne

    // Dashboard Sections - Limited Access
    loyaltyTiers: false,       // ❌ Solo Basic+
    rewards: false,            // ❌ Solo Basic+
    categories: false,         // ❌ Solo Basic+
    marketingCampaigns: false, // ❌ Solo Pro+
    teamManagement: true,      // ✅ Abilitato per testing
    posIntegration: true,      // ✅ Sempre disponibile
    notifications: false,      // ❌ Solo Basic+
    analyticsReports: false,   // ❌ Solo Pro+
    brandingSocial: false,     // ❌ Solo Pro+
    channelsIntegration: false,// ❌ Solo Enterprise

    // Commerce Features
    coupons: false,            // ❌ Solo Basic+
    giftCertificates: false,   // ❌ Solo Pro+
    lottery: false,            // ❌ Solo Pro+

    // Wallet Features
    wallet: false,             // ❌ Solo Basic+
    omnyWallet: false,         // ❌ Solo Pro+
    cryptoPayments: false,     // ❌ Solo Pro+

    // Referral System
    referralSystem: false,     // ❌ Solo Basic+

    // Advanced Features
    advancedAnalytics: false,
    apiAccess: false,
    webhookSupport: false,
    whiteLabel: false,
    customDomain: false,
    prioritySupport: false,
    sso: false,

    // Gaming Module
    gamingModule: false        // ❌ Solo Pro+
  },

  [PlanType.BASIC]: {
    // Core Limits
    maxCustomers: 100,
    maxWorkflows: 5,
    maxNotifications: 1000,

    // Feature-specific Limits
    maxTiers: 3,               // 3 tier di loyalty
    maxRewards: 10,            // 10 premi
    maxCoupons: 20,            // 20 coupon
    maxGiftCertificates: 0,    // No gift certificates
    maxCampaigns: 5,           // 5 campagne

    // Dashboard Sections
    loyaltyTiers: true,        // ✅ Basic+
    rewards: true,             // ✅ Basic+
    categories: true,          // ✅ Basic+
    marketingCampaigns: false, // ❌ Solo Pro+
    teamManagement: true,      // ✅ Abilitato per testing
    posIntegration: true,      // ✅ Sempre disponibile
    notifications: true,       // ✅ Basic+
    analyticsReports: false,   // ❌ Solo Pro+
    brandingSocial: false,     // ❌ Solo Pro+
    channelsIntegration: false,// ❌ Solo Enterprise

    // Commerce Features
    coupons: true,             // ✅ Basic+
    giftCertificates: false,   // ❌ Solo Pro+
    lottery: false,            // ❌ Solo Pro+

    // Wallet Features
    wallet: true,              // ✅ Basic+
    omnyWallet: false,         // ❌ Solo Pro+
    cryptoPayments: false,     // ❌ Solo Pro+

    // Referral System
    referralSystem: true,      // ✅ Basic+

    // Advanced Features
    advancedAnalytics: false,
    apiAccess: false,
    webhookSupport: false,
    whiteLabel: false,
    customDomain: false,
    prioritySupport: false,
    sso: false,

    // Gaming Module
    gamingModule: false        // ❌ Solo Pro+
  },

  [PlanType.PRO]: {
    // Core Limits
    maxCustomers: 1000,
    maxWorkflows: 50,
    maxNotifications: 10000,

    // Feature-specific Limits
    maxTiers: 10,              // 10 tier di loyalty
    maxRewards: 50,            // 50 premi
    maxCoupons: 100,           // 100 coupon
    maxGiftCertificates: 50,   // 50 gift certificates
    maxCampaigns: 20,          // 20 campagne

    // Dashboard Sections
    loyaltyTiers: true,        // ✅ Basic+
    rewards: true,             // ✅ Basic+
    categories: true,          // ✅ Basic+
    marketingCampaigns: true,  // ✅ Pro+
    teamManagement: true,      // ✅ Pro+
    posIntegration: true,      // ✅ Sempre disponibile
    notifications: true,       // ✅ Basic+
    analyticsReports: true,    // ✅ Pro+
    brandingSocial: true,      // ✅ Pro+
    channelsIntegration: false,// ❌ Solo Enterprise

    // Commerce Features
    coupons: true,             // ✅ Basic+
    giftCertificates: true,    // ✅ Pro+
    lottery: true,             // ✅ Pro+

    // Wallet Features
    wallet: true,              // ✅ Basic+
    omnyWallet: true,          // ✅ Pro+ exclusive
    cryptoPayments: true,      // ✅ Pro+ exclusive

    // Referral System
    referralSystem: true,      // ✅ Basic+

    // Advanced Features
    advancedAnalytics: true,
    apiAccess: true,
    webhookSupport: true,
    whiteLabel: false,
    customDomain: false,
    prioritySupport: false,
    sso: false,

    // Gaming Module
    gamingModule: true         // ✅ Pro+ exclusive feature
  },

  [PlanType.ENTERPRISE]: {
    // Core Limits - Unlimited
    maxCustomers: -1,
    maxWorkflows: -1,
    maxNotifications: -1,

    // Feature-specific Limits - Unlimited
    maxTiers: -1,              // Illimitati
    maxRewards: -1,            // Illimitati
    maxCoupons: -1,            // Illimitati
    maxGiftCertificates: -1,   // Illimitati
    maxCampaigns: -1,          // Illimitati

    // Dashboard Sections - Full Access
    loyaltyTiers: true,        // ✅ Tutto disponibile
    rewards: true,
    categories: true,
    marketingCampaigns: true,
    teamManagement: true,
    posIntegration: true,
    notifications: true,
    analyticsReports: true,
    brandingSocial: true,
    channelsIntegration: true, // ✅ Solo Enterprise

    // Commerce Features - All Available
    coupons: true,             // ✅ Enterprise
    giftCertificates: true,    // ✅ Enterprise
    lottery: true,             // ✅ Enterprise

    // Wallet Features - All Available
    wallet: true,              // ✅ Enterprise
    omnyWallet: true,          // ✅ Enterprise
    cryptoPayments: true,      // ✅ Enterprise

    // Referral System
    referralSystem: true,      // ✅ Enterprise

    // Advanced Features - All Available
    advancedAnalytics: true,
    apiAccess: true,
    webhookSupport: true,
    whiteLabel: true,
    customDomain: true,
    prioritySupport: true,
    sso: true,

    // Gaming Module
    gamingModule: true         // ✅ Pro+ exclusive feature
  }
}

export const PLAN_PRICES = {
  [PlanType.FREE]: { price: 0, currency: 'EUR', period: 'forever' },
  [PlanType.BASIC]: { price: 29, currency: 'EUR', period: 'month' },
  [PlanType.PRO]: { price: 99, currency: 'EUR', period: 'month' },
  [PlanType.ENTERPRISE]: { price: 299, currency: 'EUR', period: 'month' }
}

export const PLAN_NAMES = {
  [PlanType.FREE]: 'Free',
  [PlanType.BASIC]: 'Basic',
  [PlanType.PRO]: 'Pro',
  [PlanType.ENTERPRISE]: 'Enterprise'
}

// Utility functions

// Cache for overrides (per evitare troppe query)
let overridesCache: PlanFeatureOverride[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60000 // 1 minuto

// Fetch overrides from database
export const fetchPlanOverrides = async (): Promise<PlanFeatureOverride[]> => {
  // Check cache
  const now = Date.now()
  if (overridesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return overridesCache
  }

  try {
    const { data, error } = await supabase
      .from('plan_feature_overrides')
      .select('*')
      .or('expires_at.is.null,expires_at.gte.now()') // Solo override attivi

    if (error) {
      console.error('[PlanPermissions] Error fetching overrides:', error)
      return []
    }

    overridesCache = data || []
    cacheTimestamp = now
    return overridesCache
  } catch (error) {
    console.error('[PlanPermissions] Exception fetching overrides:', error)
    return []
  }
}

// Clear cache (chiamare dopo modifiche)
export const clearOverridesCache = () => {
  overridesCache = null
  cacheTimestamp = 0
}

// Get plan features with overrides applied
export const getPlanFeatures = async (planType: string): Promise<PlanFeatures> => {
  const plan = planType.toLowerCase() as PlanType
  const baseFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES[PlanType.FREE]

  // Fetch overrides
  const overrides = await fetchPlanOverrides()

  // Apply overrides for this plan
  const planOverrides = overrides.filter(o => o.plan_type === plan)

  const finalFeatures = { ...baseFeatures }
  planOverrides.forEach(override => {
    const featureName = override.feature_name as keyof PlanFeatures
    if (featureName in finalFeatures) {
      // Get the correct value based on value_type
      let value: any
      switch (override.value_type) {
        case 'boolean':
          value = override.boolean_value ?? true
          break
        case 'number':
          value = override.number_value ?? 0
          break
        case 'string':
          value = override.string_value ?? ''
          break
        default:
          value = override.boolean_value ?? true
      }
      finalFeatures[featureName] = value as any
    }
  })

  return finalFeatures
}

// Synchronous version (uses cache, may be stale)
export const getPlanFeaturesSync = (planType: string): PlanFeatures => {
  const plan = planType.toLowerCase() as PlanType
  const baseFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES[PlanType.FREE]

  // Use cached overrides if available
  if (!overridesCache) {
    return baseFeatures
  }

  const planOverrides = overridesCache.filter(o => o.plan_type === plan)
  const finalFeatures = { ...baseFeatures }

  planOverrides.forEach(override => {
    const featureName = override.feature_name as keyof PlanFeatures
    if (featureName in finalFeatures) {
      // Get the correct value based on value_type
      let value: any
      switch (override.value_type) {
        case 'boolean':
          value = override.boolean_value ?? true
          break
        case 'number':
          value = override.number_value ?? 0
          break
        case 'string':
          value = override.string_value ?? ''
          break
        default:
          value = override.boolean_value ?? true
      }
      finalFeatures[featureName] = value as any
    }
  })

  return finalFeatures
}

export const hasAccess = async (planType: string, feature: keyof PlanFeatures): Promise<boolean> => {
  const features = await getPlanFeatures(planType)
  return features[feature] as boolean
}

// Synchronous version
export const hasAccessSync = (planType: string, feature: keyof PlanFeatures): boolean => {
  const features = getPlanFeaturesSync(planType)
  return features[feature] as boolean
}

export const getUpgradePlan = async (currentPlan: string, feature: keyof PlanFeatures): Promise<PlanType | null> => {
  const current = currentPlan.toLowerCase() as PlanType

  // Check which plan first provides this feature
  const plans = [PlanType.BASIC, PlanType.PRO, PlanType.ENTERPRISE]

  for (const plan of plans) {
    const features = await getPlanFeatures(plan)
    if (features[feature] && plan !== current) {
      return plan
    }
  }

  return null
}

export const formatPlanPrice = (planType: PlanType): string => {
  const pricing = PLAN_PRICES[planType]
  if (!pricing) return 'N/A'
  if (pricing.price === 0) return 'Gratuito'
  return `€${pricing.price}/${pricing.period === 'month' ? 'mese' : pricing.period}`
}

// Get all available features (per admin panel)
export const getAllFeatureNames = (): string[] => {
  const sampleFeatures = PLAN_FEATURES[PlanType.ENTERPRISE]
  // Ora includiamo TUTTE le features, anche i limiti numerici
  return Object.keys(sampleFeatures)
}