/**
 * Coupons Service - OMNILY PRO
 *
 * Service for managing coupons operations
 * Handles CRUD operations, validation, usage tracking, and analytics
 */

import { supabase } from '../lib/supabase'
import type {
  Coupon,
  CouponUsage,
  CouponStats,
  CreateCouponRequest,
  CreateCouponResponse,
  ValidateCouponRequest,
  ValidateCouponResponse,
  UseCouponRequest,
  UseCouponResponse,
  CouponFilters,
  PaginationParams,
  PaginatedResponse
} from '../types/coupon'

export class CouponsService {

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all coupons for an organization
   */
  async getAll(
    organizationId: string,
    filters?: CouponFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Coupon>> {
    try {
      let query = supabase
        .from('coupons')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)

      // Apply filters
      if (filters) {
        if (filters.status) {
          if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status)
          } else {
            query = query.eq('status', filters.status)
          }
        }

        if (filters.type) {
          query = query.eq('type', filters.type)
        }

        if (filters.duration_type) {
          query = query.eq('duration_type', filters.duration_type)
        }

        if (filters.is_flash !== undefined) {
          query = query.eq('is_flash', filters.is_flash)
        }

        if (filters.search_code) {
          query = query.ilike('code', `%${filters.search_code}%`)
        }

        if (filters.valid_from) {
          query = query.gte('valid_from', filters.valid_from)
        }

        if (filters.valid_until) {
          query = query.lte('valid_until', filters.valid_until)
        }
      }

      // Apply pagination
      const page = pagination?.page || 1
      const limit = pagination?.limit || 50
      const offset = (page - 1) * limit

      query = query.range(offset, offset + limit - 1)

      // Apply sorting
      const sortBy = pagination?.sort_by || 'created_at'
      const sortOrder = pagination?.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error, count } = await query

      if (error) {
        console.error('Failed to get coupons:', error)
        throw error
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error: any) {
      console.error('Error in CouponsService.getAll:', error)
      throw error
    }
  }

  /**
   * Get active coupons for an organization
   */
  async getActive(organizationId: string): Promise<Coupon[]> {
    try {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .lte('valid_from', now)
        .gte('valid_until', now)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to get active coupons:', error)
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Error in CouponsService.getActive:', error)
      throw error
    }
  }

  /**
   * Get flash coupons (expiring soon)
   */
  async getFlashCoupons(organizationId: string): Promise<Coupon[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('is_flash', true)
        .order('valid_until', { ascending: true })

      if (error) {
        console.error('Failed to get flash coupons:', error)
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Error in CouponsService.getFlashCoupons:', error)
      throw error
    }
  }

  /**
   * Get coupon by ID
   */
  async getById(couponId: string): Promise<Coupon | null> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .single()

      if (error) {
        console.error('Failed to get coupon:', error)
        return null
      }

      return data
    } catch (error: any) {
      console.error('Error in CouponsService.getById:', error)
      return null
    }
  }

  /**
   * Get coupon by code
   */
  async getByCode(code: string, organizationId: string): Promise<Coupon | null> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('organization_id', organizationId)
        .single()

      if (error) {
        console.error('Failed to get coupon by code:', error)
        return null
      }

      return data
    } catch (error: any) {
      console.error('Error in CouponsService.getByCode:', error)
      return null
    }
  }

  /**
   * Create a new coupon
   */
  async create(
    organizationId: string,
    couponData: CreateCouponRequest,
    userId?: string
  ): Promise<CreateCouponResponse> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          organization_id: organizationId,
          code: couponData.code.toUpperCase(),
          type: couponData.type,
          value: couponData.value,
          duration_type: couponData.duration_type,
          valid_from: couponData.valid_from,
          valid_until: couponData.valid_until,
          status: 'active',
          title: couponData.title,
          description: couponData.description,
          terms_conditions: couponData.terms_conditions,
          min_purchase_amount: couponData.min_purchase_amount,
          max_discount_amount: couponData.max_discount_amount,
          usage_limit: couponData.usage_limit,
          usage_per_customer: couponData.usage_per_customer,
          current_usage: 0,
          customer_tier_required: couponData.customer_tier_required,
          first_purchase_only: couponData.first_purchase_only || false,
          image_url: couponData.image_url,
          background_color: couponData.background_color,
          text_color: couponData.text_color,
          is_flash: couponData.is_flash || false,
          created_by_user_id: userId
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create coupon:', error)
        return { success: false, error: error.message }
      }

      return { success: true, coupon: data }
    } catch (error: any) {
      console.error('Error in CouponsService.create:', error)
      return { success: false, error: error.message || 'Unknown error' }
    }
  }

  /**
   * Update coupon
   */
  async update(
    couponId: string,
    updates: Partial<CreateCouponRequest>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId)

      if (error) {
        console.error('Failed to update coupon:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error in CouponsService.update:', error)
      return { success: false, error: error.message || 'Unknown error' }
    }
  }

  /**
   * Delete/Cancel coupon
   */
  async cancel(couponId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId)

      if (error) {
        console.error('Failed to cancel coupon:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error in CouponsService.cancel:', error)
      return { success: false, error: error.message || 'Unknown error' }
    }
  }

  // ============================================================================
  // VALIDATION & USAGE
  // ============================================================================

  /**
   * Validate a coupon for usage
   */
  async validate(request: ValidateCouponRequest): Promise<ValidateCouponResponse> {
    try {
      const coupon = await this.getByCode(request.code, '')

      if (!coupon) {
        return {
          success: true,
          valid: false,
          message: 'Coupon non trovato'
        }
      }

      // Check status
      if (coupon.status !== 'active') {
        return {
          success: true,
          valid: false,
          message: 'Coupon non più valido'
        }
      }

      // Check dates
      const now = new Date()
      const validFrom = new Date(coupon.valid_from)
      const validUntil = new Date(coupon.valid_until)

      if (now < validFrom || now > validUntil) {
        return {
          success: true,
          valid: false,
          message: 'Coupon scaduto o non ancora valido'
        }
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.current_usage >= coupon.usage_limit) {
        return {
          success: true,
          valid: false,
          message: 'Limite di utilizzo raggiunto'
        }
      }

      // Check minimum purchase
      if (coupon.min_purchase_amount && request.purchase_amount) {
        if (request.purchase_amount < coupon.min_purchase_amount) {
          return {
            success: true,
            valid: false,
            message: `Acquisto minimo richiesto: €${coupon.min_purchase_amount}`
          }
        }
      }

      // Calculate discount
      let discountAmount = 0
      if (coupon.type === 'percentage' && request.purchase_amount) {
        discountAmount = (request.purchase_amount * (Number(coupon.value) / 100))
      } else if (coupon.type === 'fixed_amount') {
        discountAmount = Number(coupon.value)
      }

      // Apply max discount if set
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount
      }

      return {
        success: true,
        valid: true,
        coupon,
        discount_amount: discountAmount,
        message: 'Coupon valido'
      }
    } catch (error: any) {
      console.error('Error in CouponsService.validate:', error)
      return {
        success: false,
        valid: false,
        error: error.message || 'Unknown error'
      }
    }
  }

  /**
   * Use a coupon
   */
  async use(request: UseCouponRequest): Promise<UseCouponResponse> {
    try {
      // Create usage record
      const { data: usage, error: usageError } = await supabase
        .from('coupon_usages')
        .insert({
          coupon_id: request.coupon_id,
          customer_id: request.customer_id,
          transaction_id: request.transaction_id,
          discount_applied: request.discount_applied,
          used_at: new Date().toISOString()
        })
        .select()
        .single()

      if (usageError) {
        console.error('Failed to create coupon usage:', usageError)
        return { success: false, error: usageError.message }
      }

      // Increment usage count
      const { error: updateError } = await supabase.rpc('increment_coupon_usage', {
        coupon_id_param: request.coupon_id
      })

      if (updateError) {
        console.error('Failed to increment coupon usage:', updateError)
      }

      return { success: true, usage }
    } catch (error: any) {
      console.error('Error in CouponsService.use:', error)
      return { success: false, error: error.message || 'Unknown error' }
    }
  }

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  /**
   * Get coupon statistics
   */
  async getStats(organizationId: string): Promise<CouponStats> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('organization_id', organizationId)

      if (error) throw error

      const coupons = data || []
      const activeCoupons = coupons.filter(c => c.status === 'active')

      // Get total usage
      const { data: usages } = await supabase
        .from('coupon_usages')
        .select('discount_applied')
        .eq('organization_id', organizationId)

      const totalUsage = usages?.length || 0
      const totalDiscount = usages?.reduce((sum, u) => sum + u.discount_applied, 0) || 0

      // Most used coupon
      const usageByCoupon = coupons.map(c => ({
        id: c.id,
        code: c.code,
        usage_count: c.current_usage
      })).sort((a, b) => b.usage_count - a.usage_count)

      const mostUsed = usageByCoupon[0]

      // Expiring soon (next 7 days)
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      const expiringSoon = activeCoupons.filter(c =>
        new Date(c.valid_until) <= sevenDaysFromNow
      )

      return {
        total_coupons: coupons.length,
        active_coupons: activeCoupons.length,
        total_usage: totalUsage,
        total_discount_given: totalDiscount,
        avg_discount_per_use: totalUsage > 0 ? totalDiscount / totalUsage : 0,
        most_used_coupon: mostUsed,
        expiring_soon_count: expiringSoon.length
      }
    } catch (error: any) {
      console.error('Error in CouponsService.getStats:', error)
      return {
        total_coupons: 0,
        active_coupons: 0,
        total_usage: 0,
        total_discount_given: 0,
        avg_discount_per_use: 0,
        expiring_soon_count: 0
      }
    }
  }
}

export const couponsService = new CouponsService()
