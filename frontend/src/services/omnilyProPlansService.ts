import { supabase } from '../lib/supabase'

export interface OmnilyProPlan {
  id: string
  name: string
  slug: string
  description?: string
  price_monthly: number
  price_yearly: number
  setup_fee: number
  currency: string
  stripe_price_id_monthly?: string
  stripe_price_id_yearly?: string
  stripe_product_id?: string
  features: PlanFeatures
  limits: PlanLimits
  color: string
  badge_text?: string
  is_popular: boolean
  is_featured: boolean
  is_active: boolean
  visibility: 'public' | 'hidden' | 'internal'
  show_in_wizard: boolean
  show_in_landing: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PlanFeatures {
  // Core Features
  posEnabled: boolean
  loyaltyPrograms: boolean

  // Marketing & Communication
  emailMarketing: boolean
  smsMarketing: boolean
  whatsappMarketing: boolean
  campaigns: boolean
  emailAutomations: boolean

  // Customer Engagement
  coupons: boolean
  giftCards: boolean
  giftCertificates: boolean
  subscriptions: boolean
  referralProgram: boolean

  // Gaming & Lottery
  gamingLottery: boolean
  slotMachine: boolean
  scratchCards: boolean
  omnyCoin: boolean

  // Advanced Features
  nfcCards: boolean
  advancedAnalytics: boolean
  automations: boolean
  publicWebsite: boolean
  websiteBuilder: boolean
  mobileApp: boolean

  // Business Management
  multiLocation: boolean
  teamManagement: boolean
  categoriesManagement: boolean
  channelsManagement: boolean
  inventoryManagement: boolean

  // Customization & Integration
  customBranding: boolean
  customDomain: boolean
  apiAccess: boolean
  webhooks: boolean

  // Support & Services
  prioritySupport: boolean
  dedicatedAccountManager: boolean
  supportTickets: boolean
  contactMessages: boolean
}

export interface PlanLimits {
  // Customer & Team Limits
  maxCustomers: number | null
  maxTeamMembers: number | null
  maxLocations: number | null

  // Marketing Limits
  maxEmailsPerMonth: number | null
  maxSMSPerMonth: number | null
  maxWhatsAppPerMonth: number | null
  maxCampaigns: number | null
  maxEmailAutomations: number | null

  // Engagement Limits
  maxActiveCoupons: number | null
  maxActiveGiftCards: number | null
  maxActiveGiftCertificates: number | null
  maxSubscriptionPlans: number | null
  maxReferralRewards: number | null

  // Gaming Limits
  maxLotteryDrawsPerMonth: number | null
  maxSlotMachineSpins: number | null
  maxScratchCardsPerMonth: number | null

  // NFC & Cards
  maxNFCCards: number | null
  maxVirtualCards: number | null

  // Automation & Workflows
  maxAutomations: number | null
  maxWorkflows: number | null
  maxWebhooks: number | null

  // Content & Analytics
  maxLoyaltyPrograms: number | null
  maxNotifications: number | null
  maxCategories: number | null
  maxProductsPerCategory: number | null

  // Storage & Data
  maxStorageGB: number | null
  maxAPICallsPerDay: number | null
  maxReportsPerMonth: number | null
}

export class OmnilyProPlansService {
  /**
   * Get all plans (for admin)
   */
  async getAllPlans(): Promise<OmnilyProPlan[]> {
    const { data, error } = await supabase
      .from('omnilypro_plans')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
      throw error
    }

    return data || []
  }

  /**
   * Get active public plans (for landing page)
   */
  async getPublicPlans(): Promise<OmnilyProPlan[]> {
    const { data, error } = await supabase
      .from('omnilypro_plans')
      .select('*')
      .eq('is_active', true)
      .eq('visibility', 'public')
      .eq('show_in_landing', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching public plans:', error)
      throw error
    }

    return data || []
  }

  /**
   * Get active plans for wizard (organization creation)
   */
  async getWizardPlans(): Promise<OmnilyProPlan[]> {
    const { data, error } = await supabase
      .from('omnilypro_plans')
      .select('*')
      .eq('is_active', true)
      .eq('show_in_wizard', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching wizard plans:', error)
      throw error
    }

    return data || []
  }

  /**
   * Get plan by ID
   */
  async getPlanById(planId: string): Promise<OmnilyProPlan | null> {
    const { data, error } = await supabase
      .from('omnilypro_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (error) {
      console.error('Error fetching plan:', error)
      return null
    }

    return data
  }

  /**
   * Get plan by slug
   */
  async getPlanBySlug(slug: string): Promise<OmnilyProPlan | null> {
    const { data, error } = await supabase
      .from('omnilypro_plans')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching plan:', error)
      return null
    }

    return data
  }

  /**
   * Create new plan
   */
  async createPlan(plan: Partial<OmnilyProPlan>): Promise<OmnilyProPlan> {
    const { data, error } = await supabase
      .from('omnilypro_plans')
      .insert(plan)
      .select()
      .single()

    if (error) {
      console.error('Error creating plan:', error)
      throw error
    }

    return data
  }

  /**
   * Update plan
   */
  async updatePlan(planId: string, updates: Partial<OmnilyProPlan>): Promise<OmnilyProPlan> {
    const { data, error } = await supabase
      .from('omnilypro_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single()

    if (error) {
      console.error('Error updating plan:', error)
      throw error
    }

    return data
  }

  /**
   * Delete plan
   */
  async deletePlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('omnilypro_plans')
      .delete()
      .eq('id', planId)

    if (error) {
      console.error('Error deleting plan:', error)
      throw error
    }
  }

  /**
   * Update plan features
   */
  async updatePlanFeatures(planId: string, features: Partial<PlanFeatures>): Promise<OmnilyProPlan> {
    // Get current plan
    const plan = await this.getPlanById(planId)
    if (!plan) throw new Error('Plan not found')

    // Merge features
    const updatedFeatures = {
      ...plan.features,
      ...features
    }

    return this.updatePlan(planId, { features: updatedFeatures })
  }

  /**
   * Update plan limits
   */
  async updatePlanLimits(planId: string, limits: Partial<PlanLimits>): Promise<OmnilyProPlan> {
    // Get current plan
    const plan = await this.getPlanById(planId)
    if (!plan) throw new Error('Plan not found')

    // Merge limits
    const updatedLimits = {
      ...plan.limits,
      ...limits
    }

    return this.updatePlan(planId, { limits: updatedLimits })
  }

  /**
   * Get organization's current plan
   */
  async getOrganizationPlan(organizationId: string): Promise<OmnilyProPlan | null> {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('plan_id')
      .eq('id', organizationId)
      .single()

    if (orgError || !org?.plan_id) {
      console.error('Error fetching organization plan:', orgError)
      return null
    }

    return this.getPlanById(org.plan_id)
  }

  /**
   * Assign plan to organization
   */
  async assignPlanToOrganization(organizationId: string, planId: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .update({ plan_id: planId })
      .eq('id', organizationId)

    if (error) {
      console.error('Error assigning plan to organization:', error)
      throw error
    }
  }

  /**
   * Check if organization can use feature
   */
  async canUseFeature(organizationId: string, featureName: keyof PlanFeatures): Promise<boolean> {
    const plan = await this.getOrganizationPlan(organizationId)
    if (!plan) return false

    return plan.features[featureName] === true
  }

  /**
   * Check if organization is within limit
   */
  async isWithinLimit(
    organizationId: string,
    limitName: keyof PlanLimits,
    currentValue: number
  ): Promise<{ allowed: boolean; limit: number | null; current: number }> {
    const plan = await this.getOrganizationPlan(organizationId)

    if (!plan) {
      return { allowed: false, limit: 0, current: currentValue }
    }

    const limit = plan.limits[limitName]

    // null means unlimited
    if (limit === null) {
      return { allowed: true, limit: null, current: currentValue }
    }

    return {
      allowed: currentValue < limit,
      limit,
      current: currentValue
    }
  }
}

export const omnilyProPlansService = new OmnilyProPlansService()
