/**
 * TypeScript Types for Subscription System
 * Universal subscription system for any type of business
 */

// ============================================================================
// ENUMS
// ============================================================================

export type SubscriptionType =
  | 'daily_item'          // 1 item per day
  | 'daily_multiple'      // X items per day
  | 'total_items'         // X items total in period
  | 'unlimited_access'    // unlimited access
  | 'service_bundle';     // specific services included

export type DurationType = 'days' | 'weeks' | 'months' | 'years';

export type SubscriptionStatus = 'active' | 'paused' | 'expired' | 'cancelled';

export type SubscriptionVisibility = 'public' | 'hidden' | 'vip_only';

export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'bank_transfer';

export type RenewalType = 'auto' | 'manual';

// ============================================================================
// INTERFACES - Template Configuration
// ============================================================================

export interface IncludedItem {
  product_id?: string;
  name: string;
  quantity?: number;
  max_price?: number;
}

export interface TimeRestriction {
  start: string;  // HH:MM format
  end: string;    // HH:MM format
}

export type AllowedDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ExtraBenefit {
  type: 'discount' | 'free_item' | 'priority_access';
  categories?: string[];
  product_ids?: string[];
  discount_percent?: number;
  description?: string;
}

export interface SubscriptionTemplate {
  id: string;
  organization_id: string;

  // Basic Information
  name: string;
  description?: string;

  // Subscription Type
  subscription_type: SubscriptionType;

  // Duration Configuration
  duration_type: DurationType;
  duration_value: number;

  // Usage Limits
  daily_limit?: number | null;
  weekly_limit?: number | null;
  total_limit?: number | null;

  // Items/Services Configuration
  included_items?: IncludedItem[];
  included_categories?: string[];
  excluded_categories?: string[];

  // Price Limits
  max_price_per_item?: number | null;

  // Time Restrictions
  allowed_hours?: TimeRestriction | null;
  allowed_days?: AllowedDay[] | null;

  // Pricing
  price: number;
  original_price?: number | null;
  currency: string;

  // Renewal Settings
  auto_renewable: boolean;
  renewable_manually: boolean;

  // Extra Benefits
  extra_benefits?: ExtraBenefit[];

  // Status & Visibility
  is_active: boolean;
  visibility: SubscriptionVisibility;

  // UI/UX
  image_url?: string | null;
  color?: string;
  badge_text?: string | null;
  sort_order: number;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CreateSubscriptionTemplateRequest {
  organization_id: string;
  name: string;
  description?: string;
  subscription_type: SubscriptionType;
  duration_type: DurationType;
  duration_value: number;
  daily_limit?: number;
  weekly_limit?: number;
  total_limit?: number;
  included_items?: IncludedItem[];
  included_categories?: string[];
  excluded_categories?: string[];
  max_price_per_item?: number;
  allowed_hours?: TimeRestriction;
  allowed_days?: AllowedDay[];
  price: number;
  original_price?: number;
  currency?: string;
  auto_renewable?: boolean;
  renewable_manually?: boolean;
  extra_benefits?: ExtraBenefit[];
  is_active?: boolean;
  visibility?: SubscriptionVisibility;
  image_url?: string;
  color?: string;
  badge_text?: string;
  sort_order?: number;
}

export interface UpdateSubscriptionTemplateRequest extends Partial<CreateSubscriptionTemplateRequest> {
  id: string;
}

// ============================================================================
// INTERFACES - Customer Subscriptions
// ============================================================================

export interface CustomerSubscription {
  id: string;
  organization_id: string;
  customer_id: string;
  template_id: string;

  // Subscription Code
  subscription_code: string;

  // Dates
  start_date: string;
  end_date: string;
  next_renewal_date?: string | null;

  // Status
  status: SubscriptionStatus;

  // Usage Tracking
  usage_count: number;
  daily_usage_count: number;
  weekly_usage_count: number;
  last_usage_date?: string | null;
  last_usage_reset_at: string;
  last_weekly_reset_at: string;

  // Payment Info
  payment_method?: string;
  amount_paid: number;
  currency: string;

  // Renewal Tracking
  renewal_count: number;
  total_amount_paid?: number | null;

  // Pause Tracking
  paused_at?: string | null;
  pause_reason?: string | null;
  pause_days_used: number;

  // Cancellation
  cancelled_at?: string | null;
  cancellation_reason?: string | null;

  // Metadata
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;

  // Populated fields (joins)
  template?: SubscriptionTemplate;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateCustomerSubscriptionRequest {
  organization_id: string;
  customer_id: string;
  template_id: string;
  start_date?: string;
  payment_method?: PaymentMethod;
  amount_paid: number;
  notes?: string;
}

export interface UpdateCustomerSubscriptionRequest {
  id: string;
  status?: SubscriptionStatus;
  notes?: string;
  pause_reason?: string;
  cancellation_reason?: string;
}

// ============================================================================
// INTERFACES - Subscription Usages
// ============================================================================

export interface SubscriptionUsage {
  id: string;
  subscription_id: string;
  organization_id: string;
  customer_id: string;

  // Usage Details
  used_at: string;
  item_name: string;
  item_id?: string | null;
  item_category?: string | null;
  quantity: number;

  // Context
  cashier_name?: string | null;
  cashier_id?: string | null;
  pos_device_id?: string | null;

  // Value
  item_value?: number | null;

  // Metadata
  notes?: string | null;
  created_at: string;
}

export interface CreateSubscriptionUsageRequest {
  subscription_id: string;
  organization_id: string;
  customer_id: string;
  item_name: string;
  item_id?: string;
  item_category?: string;
  quantity?: number;
  cashier_name?: string;
  cashier_id?: string;
  pos_device_id?: string;
  item_value?: number;
  notes?: string;
}

// ============================================================================
// INTERFACES - Subscription Renewals
// ============================================================================

export interface SubscriptionRenewal {
  id: string;
  subscription_id: string;

  // Renewal Info
  renewed_at: string;
  previous_end_date: string;
  new_end_date: string;

  // Payment
  payment_method?: string;
  amount_paid: number;
  currency: string;

  // Tracking
  renewal_type: RenewalType;
  processed_by?: string | null;
  processed_by_id?: string | null;

  // Metadata
  notes?: string | null;
  created_at: string;
}

export interface CreateSubscriptionRenewalRequest {
  subscription_id: string;
  payment_method?: PaymentMethod;
  amount_paid: number;
  renewal_type: RenewalType;
  processed_by?: string;
  processed_by_id?: string;
  notes?: string;
}

// ============================================================================
// INTERFACES - Subscription Settings
// ============================================================================

export interface SubscriptionSettings {
  id: string;
  organization_id: string;

  // Code Configuration
  code_prefix: string;
  next_code_number: number;

  // Notifications
  notify_on_expiry: boolean;
  notify_days_before: number;
  notify_on_usage: boolean;

  // Usage Policies
  allow_exceed_daily_limit: boolean;
  allow_exceed_weekly_limit: boolean;

  // Features
  allow_pause: boolean;
  max_pause_days: number;
  allow_transfer: boolean;
  require_payment_upfront: boolean;

  // Auto-renewal
  enable_auto_renewal: boolean;
  auto_renewal_reminder_days: number;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface UpdateSubscriptionSettingsRequest {
  organization_id: string;
  code_prefix?: string;
  notify_on_expiry?: boolean;
  notify_days_before?: number;
  notify_on_usage?: boolean;
  allow_exceed_daily_limit?: boolean;
  allow_exceed_weekly_limit?: boolean;
  allow_pause?: boolean;
  max_pause_days?: number;
  allow_transfer?: boolean;
  require_payment_upfront?: boolean;
  enable_auto_renewal?: boolean;
  auto_renewal_reminder_days?: number;
}

// ============================================================================
// INTERFACES - Statistics & Analytics
// ============================================================================

export interface SubscriptionStats {
  total_active: number;
  total_paused: number;
  total_expired: number;
  total_cancelled: number;
  total_revenue: number;
  monthly_revenue: number;
  total_usages: number;
  monthly_usages: number;
  expiring_soon: number;
  avg_subscription_value: number;
  renewal_rate: number;
}

export interface TemplateStats {
  template_id: string;
  template_name: string;
  active_subscriptions: number;
  total_revenue: number;
  total_usages: number;
  avg_usages_per_subscription: number;
}

// ============================================================================
// INTERFACES - Validation
// ============================================================================

export interface SubscriptionValidationResult {
  is_valid: boolean;
  reason?: string;
  subscription?: CustomerSubscription;
  template?: SubscriptionTemplate;
  remaining_uses?: {
    daily?: number;
    weekly?: number;
    total?: number;
  };
}

export interface ValidateSubscriptionRequest {
  subscription_code: string;
  organization_id: string;
  item_name?: string;
  item_category?: string;
  item_price?: number;
}

export interface UseSubscriptionRequest {
  subscription_code: string;
  organization_id: string;
  item_name: string;
  item_id?: string;
  item_category?: string;
  item_price?: number;
  quantity?: number;
  cashier_name?: string;
  cashier_id?: string;
  notes?: string;
}

// ============================================================================
// INTERFACES - Responses
// ============================================================================

export interface SubscriptionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedSubscriptionResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================================================
// INTERFACES - Filters
// ============================================================================

export interface SubscriptionFilters {
  organization_id?: string;
  customer_id?: string;
  template_id?: string;
  status?: SubscriptionStatus | SubscriptionStatus[];
  search_code?: string;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  expiring_in_days?: number;
  page?: number;
  limit?: number;
}

export interface TemplateFilters {
  organization_id?: string;
  is_active?: boolean;
  visibility?: SubscriptionVisibility;
  subscription_type?: SubscriptionType;
  search?: string;
}
