// Plan-based access control for OMNILY PRO
// Follows ROADMAP pricing strategy: Freemium €0 → Basic €29 → Pro €99 → Enterprise €299

export const PlanType = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
} as const

export type PlanType = typeof PlanType[keyof typeof PlanType]

export interface PlanFeatures {
  // Core Limits
  maxCustomers: number
  maxWorkflows: number
  maxNotifications: number

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
export const getPlanFeatures = (planType: string): PlanFeatures => {
  const plan = planType.toLowerCase() as PlanType
  return PLAN_FEATURES[plan] || PLAN_FEATURES[PlanType.FREE]
}

export const hasAccess = (planType: string, feature: keyof PlanFeatures): boolean => {
  const features = getPlanFeatures(planType)
  return features[feature] as boolean
}

export const getUpgradePlan = (currentPlan: string, feature: keyof PlanFeatures): PlanType | null => {
  const current = currentPlan.toLowerCase() as PlanType

  // Check which plan first provides this feature
  const plans = [PlanType.BASIC, PlanType.PRO, PlanType.ENTERPRISE]

  for (const plan of plans) {
    if (PLAN_FEATURES[plan][feature] && plan !== current) {
      return plan
    }
  }

  return null
}

export const formatPlanPrice = (planType: PlanType): string => {
  const pricing = PLAN_PRICES[planType]
  if (pricing.price === 0) return 'Gratuito'
  return `€${pricing.price}/${pricing.period === 'month' ? 'mese' : pricing.period}`
}