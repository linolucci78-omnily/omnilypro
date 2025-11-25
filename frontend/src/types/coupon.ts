/**
 * Coupon System - TypeScript Definitions
 *
 * Complete type definitions for the coupon system
 * Supports both short-term (flash) and long-term coupons
 */

// ============================================================================
// TYPES AND CONSTANTS
// ============================================================================

export const CouponStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  USED: 'used'
} as const

export type CouponStatus = typeof CouponStatus[keyof typeof CouponStatus]

export const CouponType = {
  PERCENTAGE: 'percentage',      // Sconto percentuale (es. 20% off)
  FIXED_AMOUNT: 'fixed_amount',  // Sconto fisso (es. €10 off)
  FREE_PRODUCT: 'free_product',  // Prodotto gratuito
  BUY_X_GET_Y: 'buy_x_get_y',   // Compra X prendi Y
  FREE_SHIPPING: 'free_shipping' // Spedizione gratuita
} as const

export type CouponType = typeof CouponType[keyof typeof CouponType]

export const CouponDurationType = {
  FLASH: 'flash',      // Coupon breve (ore)
  SHORT: 'short',      // Coupon breve (giorni)
  STANDARD: 'standard', // Coupon standard (settimane)
  LONG: 'long'         // Coupon lungo (mesi)
} as const

export type CouponDurationType = typeof CouponDurationType[keyof typeof CouponDurationType]

// ============================================================================
// MAIN INTERFACES
// ============================================================================

export interface Coupon {
  id: string
  organization_id: string

  // Identificatori
  code: string
  qr_code_data?: string

  // Tipo e valore
  type: CouponType
  value: number | string // Numero per percentage/fixed, stringa per descrizioni

  // Durata
  duration_type: CouponDurationType

  // Validità
  valid_from: string
  valid_until: string

  // Status
  status: CouponStatus

  // Dettagli
  title: string
  description: string
  terms_conditions?: string

  // Limitazioni
  min_purchase_amount?: number
  max_discount_amount?: number
  usage_limit?: number // Limite totale di utilizzi
  usage_per_customer?: number // Limite per singolo cliente
  current_usage: number // Utilizzi attuali

  // Targeting
  customer_tier_required?: string // Tier richiesto (es. 'Gold', 'VIP')
  first_purchase_only?: boolean

  // Metadata
  image_url?: string
  background_color?: string
  text_color?: string
  is_flash?: boolean // True se è un flash coupon

  // Timestamps
  created_at: string
  updated_at: string
  created_by_user_id?: string
}

export interface CouponUsage {
  id: string
  coupon_id: string
  customer_id: string
  organization_id: string

  // Dettagli utilizzo
  used_at: string
  transaction_id?: string
  discount_applied: number

  // Metadata
  created_at: string
}

export interface CouponStats {
  total_coupons: number
  active_coupons: number
  total_usage: number
  total_discount_given: number
  avg_discount_per_use: number
  most_used_coupon?: {
    id: string
    code: string
    usage_count: number
  }
  expiring_soon_count: number // Coupon che scadono nei prossimi 7 giorni
}

// ============================================================================
// REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface CreateCouponRequest {
  code: string
  type: CouponType
  value: number | string
  duration_type: CouponDurationType
  valid_from: string
  valid_until: string
  title: string
  description: string
  terms_conditions?: string
  min_purchase_amount?: number
  max_discount_amount?: number
  usage_limit?: number
  usage_per_customer?: number
  customer_tier_required?: string
  first_purchase_only?: boolean
  image_url?: string
  background_color?: string
  text_color?: string
  is_flash?: boolean
}

export interface CreateCouponResponse {
  success: boolean
  coupon?: Coupon
  error?: string
}

export interface ValidateCouponRequest {
  code: string
  customer_id: string
  purchase_amount?: number
}

export interface ValidateCouponResponse {
  success: boolean
  valid: boolean
  coupon?: Coupon
  discount_amount?: number
  error?: string
  message?: string
}

export interface UseCouponRequest {
  coupon_id: string
  customer_id: string
  transaction_id?: string
  discount_applied: number
}

export interface UseCouponResponse {
  success: boolean
  usage?: CouponUsage
  error?: string
}

// ============================================================================
// FILTER & PAGINATION
// ============================================================================

export interface CouponFilters {
  status?: CouponStatus | CouponStatus[]
  type?: CouponType
  duration_type?: CouponDurationType
  is_flash?: boolean
  search_code?: string
  valid_from?: string
  valid_until?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
