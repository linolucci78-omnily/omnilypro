/**
 * Coupons Service - Customer App
 *
 * Service for loading coupons (both regular and flash offers)
 */

import { supabase } from './supabase'

export interface Coupon {
  id: string
  organization_id: string
  code: string
  type: 'percentage' | 'fixed_amount' | 'free_product' | 'buy_x_get_y' | 'free_shipping'
  value: number | string
  duration_type: 'flash' | 'short' | 'standard' | 'long'
  valid_from: string
  valid_until: string
  status: 'active' | 'expired' | 'cancelled' | 'used'
  title: string
  description: string
  terms_conditions?: string
  min_purchase_amount?: number
  max_discount_amount?: number
  usage_limit?: number
  usage_per_customer?: number
  current_usage: number
  customer_tier_required?: string
  first_purchase_only?: boolean
  image_url?: string
  background_color?: string
  text_color?: string
  is_flash?: boolean
  created_at: string
  updated_at: string
}

export interface CouponUsage {
  id: string
  coupon_id: string
  customer_id: string
  used_at: string
  discount_applied: number
}

class CouponsService {
  /**
   * Get all active coupons for an organization
   */
  async getActiveCoupons(organizationId: string): Promise<Coupon[]> {
    try {
      console.log('📦 Loading coupons for organization:', organizationId)

      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .lte('valid_from', now)
        .gte('valid_until', now)
        .order('is_flash', { ascending: false }) // Flash first
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Failed to get coupons:', error)
        throw error
      }

      console.log('✅ Loaded coupons:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ Error in getActiveCoupons:', error)
      return []
    }
  }

  /**
   * Get flash coupons only
   */
  async getFlashCoupons(organizationId: string): Promise<Coupon[]> {
    try {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('is_flash', true)
        .lte('valid_from', now)
        .gte('valid_until', now)
        .order('valid_until', { ascending: true })

      if (error) {
        console.error('❌ Failed to get flash coupons:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('❌ Error in getFlashCoupons:', error)
      return []
    }
  }

  /**
   * Get customer's coupon usage history
   */
  async getCustomerCouponUsage(customerId: string): Promise<CouponUsage[]> {
    try {
      const { data, error } = await supabase
        .from('coupon_usages')
        .select('*')
        .eq('customer_id', customerId)
        .order('used_at', { ascending: false })

      if (error) {
        console.error('❌ Failed to get coupon usage:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('❌ Error in getCustomerCouponUsage:', error)
      return []
    }
  }

  /**
   * Check if customer has used a specific coupon
   */
  async hasCustomerUsedCoupon(customerId: string, couponId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('coupon_usages')
        .select('id')
        .eq('customer_id', customerId)
        .eq('coupon_id', couponId)
        .limit(1)

      if (error) {
        console.error('❌ Failed to check coupon usage:', error)
        return false
      }

      return (data?.length || 0) > 0
    } catch (error) {
      console.error('❌ Error in hasCustomerUsedCoupon:', error)
      return false
    }
  }

  /**
   * Calculate hours until expiration
   */
  getHoursUntilExpiration(validUntil: string): number {
    const now = new Date()
    const expiry = new Date(validUntil)
    const diffMs = expiry.getTime() - now.getTime()
    return Math.max(0, diffMs / (1000 * 60 * 60))
  }

  /**
   * Get badge text for coupon type
   */
  getBadgeText(coupon: Coupon): string {
    switch (coupon.type) {
      case 'percentage':
        return `-${coupon.value}%`
      case 'fixed_amount':
        return `-€${coupon.value}`
      case 'free_product':
        return 'FREE'
      case 'buy_x_get_y':
        return '2x1'
      case 'free_shipping':
        return 'GRATIS'
      default:
        return 'PROMO'
    }
  }

  /**
   * Get badge type for UI styling
   */
  getBadgeType(coupon: Coupon): 'percentage' | 'free' | 'promo' {
    if (coupon.type === 'percentage') return 'percentage'
    if (coupon.type === 'free_product' || coupon.type === 'free_shipping') return 'free'
    return 'promo'
  }
}

export const couponsService = new CouponsService()
