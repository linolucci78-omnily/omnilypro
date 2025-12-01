import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { omnilyProPlansService, type OmnilyProPlan, type PlanFeatures, type PlanLimits } from '../services/omnilyProPlansService'

interface UsePlanFeaturesResult {
  plan: OmnilyProPlan | null
  features: PlanFeatures | null
  limits: PlanLimits | null
  loading: boolean
  error: string | null

  // Feature checks
  hasFeature: (feature: keyof PlanFeatures) => boolean
  checkLimit: (limit: keyof PlanLimits, currentValue: number) => { allowed: boolean; limit: number | null; remaining: number | null }
  canUseFeature: (feature: keyof PlanFeatures) => { allowed: boolean; reason?: string }
}

/**
 * Hook to check plan features and limits for the current organization
 *
 * Usage:
 * const { hasFeature, checkLimit, canUseFeature } = usePlanFeatures()
 *
 * if (!hasFeature('emailMarketing')) {
 *   // Show upgrade message
 * }
 *
 * const { allowed, remaining } = checkLimit('maxCustomers', currentCustomerCount)
 * if (!allowed) {
 *   // Show limit reached message
 * }
 */
export function usePlanFeatures(organizationId?: string): UsePlanFeaturesResult {
  const [plan, setPlan] = useState<OmnilyProPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlanFeatures()
  }, [organizationId])

  const loadPlanFeatures = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current organization
      let orgId = organizationId
      if (!orgId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Get user's organization
        const { data: orgUsers } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .single()

        if (!orgUsers) {
          throw new Error('Organization not found for user')
        }

        orgId = orgUsers.organization_id
      }

      // Get organization with plan_id
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('plan_id')
        .eq('id', orgId)
        .single()

      if (orgError) throw orgError
      if (!org?.plan_id) {
        // No plan assigned - use basic/free plan or show error
        setError('No plan assigned to organization')
        setPlan(null)
        return
      }

      // Get plan details
      const planData = await omnilyProPlansService.getPlan(org.plan_id)
      setPlan(planData)
    } catch (err: any) {
      console.error('Error loading plan features:', err)
      setError(err.message)
      setPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    if (!plan) return false
    return plan.features[feature] === true
  }

  const checkLimit = (
    limit: keyof PlanLimits,
    currentValue: number
  ): { allowed: boolean; limit: number | null; remaining: number | null } => {
    if (!plan) {
      return { allowed: false, limit: null, remaining: null }
    }

    const limitValue = plan.limits[limit]

    // null or 0 means unlimited
    if (limitValue === null || limitValue === 0) {
      return { allowed: true, limit: null, remaining: null }
    }

    const remaining = limitValue - currentValue
    return {
      allowed: currentValue < limitValue,
      limit: limitValue,
      remaining: Math.max(0, remaining)
    }
  }

  const canUseFeature = (
    feature: keyof PlanFeatures
  ): { allowed: boolean; reason?: string } => {
    if (!plan) {
      return { allowed: false, reason: 'No plan assigned' }
    }

    if (!plan.is_active) {
      return { allowed: false, reason: 'Plan is not active' }
    }

    if (!hasFeature(feature)) {
      return {
        allowed: false,
        reason: `Feature "${feature}" not available in ${plan.name} plan`
      }
    }

    return { allowed: true }
  }

  return {
    plan,
    features: plan?.features || null,
    limits: plan?.limits || null,
    loading,
    error,
    hasFeature,
    checkLimit,
    canUseFeature
  }
}
