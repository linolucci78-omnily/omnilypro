/**
 * Gift Certificate System - TypeScript Definitions
 *
 * Complete type definitions for the enterprise-grade gift certificate system
 * with dual Desktop/POS support.
 */

// ============================================================================
// TYPES AND CONSTANTS
// ============================================================================

export const GiftCertificateStatus = {
  ACTIVE: 'active',
  PARTIALLY_USED: 'partially_used',
  FULLY_USED: 'fully_used',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended'
} as const;

export type GiftCertificateStatus = typeof GiftCertificateStatus[keyof typeof GiftCertificateStatus];

export const GiftCertificateIssueType = {
  PURCHASED: 'purchased',
  PROMOTIONAL: 'promotional',
  REDEEMED_POINTS: 'redeemed_points',
  REFUND: 'refund',
  GIFT: 'gift'
} as const;

export type GiftCertificateIssueType = typeof GiftCertificateIssueType[keyof typeof GiftCertificateIssueType];

export const GiftCertificateTransactionType = {
  ISSUED: 'issued',
  REDEEMED: 'redeemed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
  ADJUSTMENT: 'adjustment',
  EXPIRED: 'expired'
} as const;

export type GiftCertificateTransactionType = typeof GiftCertificateTransactionType[keyof typeof GiftCertificateTransactionType];

export const GiftCertificateTemplateType = {
  BIRTHDAY: 'birthday',
  CHRISTMAS: 'christmas',
  EASTER: 'easter',
  VALENTINES: 'valentines',
  GENERIC: 'generic',
  CUSTOM: 'custom'
} as const;

export type GiftCertificateTemplateType = typeof GiftCertificateTemplateType[keyof typeof GiftCertificateTemplateType];

export const GiftCertificateCodeFormat = {
  ALPHANUMERIC: 'alphanumeric',
  NUMERIC: 'numeric',
  CUSTOM: 'custom'
} as const;

export type GiftCertificateCodeFormat = typeof GiftCertificateCodeFormat[keyof typeof GiftCertificateCodeFormat];

export const GiftCertificateAuditAction = {
  CREATED: 'created',
  VALIDATED: 'validated',
  REDEEMED: 'redeemed',
  CANCELLED: 'cancelled',
  MODIFIED: 'modified',
  VIEWED: 'viewed',
  PRINTED: 'printed',
  EMAILED: 'emailed'
} as const;

export type GiftCertificateAuditAction = typeof GiftCertificateAuditAction[keyof typeof GiftCertificateAuditAction] | string;

// ============================================================================
// MAIN INTERFACES
// ============================================================================

export interface GiftCertificate {
  id: string;
  organization_id: string;

  // Unique identifiers
  code: string;
  qr_code_data?: string;
  barcode?: string;

  // Value and balance
  original_amount: number;
  current_balance: number;
  currency: string;

  // Issuance info
  issued_by_user_id?: string;
  issued_at: string;
  issue_type: GiftCertificateIssueType;

  // Recipient info
  recipient_name?: string;
  recipient_email?: string;
  recipient_phone?: string;
  personal_message?: string;

  // Validity
  valid_from: string;
  valid_until?: string;

  // Status
  status: GiftCertificateStatus;

  // Template and terms
  template_id?: string;
  terms_conditions?: string;
  notes?: string;
  metadata?: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface GiftCertificateTransaction {
  id: string;
  gift_certificate_id: string;
  organization_id: string;

  // Transaction details
  transaction_type: GiftCertificateTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;

  // Reference
  transaction_ref?: string;
  performed_by_user_id?: string;
  customer_id?: string;

  // POS info
  pos_device_id?: string;
  pos_terminal_id?: string;

  // Description
  description?: string;
  notes?: string;
  metadata?: Record<string, any>;

  // Timestamp
  created_at: string;
}

export interface GiftCertificateTemplate {
  id: string;
  organization_id: string;

  // Template info
  name: string;
  description?: string;
  template_type: GiftCertificateTemplateType;

  // Design
  background_image_url?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;

  // Preset amounts
  preset_amounts: number[];
  allow_custom_amount: boolean;
  min_amount: number;
  max_amount: number;

  // Default validity
  default_validity_days: number;

  // Templates for generation
  pdf_template?: string;
  email_template?: string;

  // Status
  is_active: boolean;
  is_default: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface GiftCertificateSettings {
  id: string;
  organization_id: string;

  // General settings
  is_enabled: boolean;
  require_approval: boolean;

  // Code generation
  code_prefix: string;
  code_length: number;
  code_format: GiftCertificateCodeFormat;

  // Limits
  min_amount_per_certificate?: number;
  max_amount_per_certificate?: number;
  max_certificates_per_day?: number;
  max_balance_per_customer?: number;

  // Default validity
  default_validity_days?: number;

  // Email automation
  send_email_on_issue: boolean;
  send_email_on_redeem: boolean;
  send_reminder_before_expiry: boolean;
  reminder_days_before: number;

  // Notifications
  notify_admin_on_issue: boolean;
  notify_admin_threshold?: number;

  // Anti-fraud
  max_validation_attempts: number;
  lockout_duration_minutes: number;

  // Default terms
  default_terms_conditions?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface GiftCertificateAuditLog {
  id: string;
  gift_certificate_id?: string;
  organization_id: string;

  // Action tracking
  action: GiftCertificateAuditAction | string;
  user_id?: string;

  // Request info
  ip_address?: string;
  user_agent?: string;

  // Change tracking
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;

  // Result
  success: boolean;
  error_message?: string;

  // Timestamp
  created_at: string;
}

// ============================================================================
// STATISTICS AND REPORTS
// ============================================================================

export interface GiftCertificateStats {
  total_issued: number;
  total_value_issued: number;
  active_count: number;
  active_balance: number;
  total_redeemed: number;
  fully_used_count: number;
  expired_count: number;
  avg_certificate_value: number;
  redemption_rate: number;
}

export interface GiftCertificatesByStatus {
  active: number;
  partially_used: number;
  fully_used: number;
  expired: number;
  cancelled: number;
  suspended: number;
}

export interface GiftCertificateMonthlyStats {
  month: string;
  issued_count: number;
  issued_value: number;
  redeemed_count: number;
  redeemed_value: number;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateGiftCertificateRequest {
  organization_id: string;
  amount: number;
  template_id?: string;
  recipient_name?: string;
  recipient_email?: string;
  recipient_phone?: string;
  personal_message?: string;
  valid_until?: string;
  issue_type: GiftCertificateIssueType;
  metadata?: Record<string, any>;
  send_email?: boolean; // Whether to send email notification
}

export interface CreateGiftCertificateResponse {
  gift_certificate: GiftCertificate;
  qr_code_url: string;
  pdf_url?: string;
}

export interface ValidateGiftCertificateRequest {
  code: string;
  organization_id: string;
}

export interface ValidateGiftCertificateResponse {
  valid: boolean;
  gift_certificate?: GiftCertificate;
  can_redeem: boolean;
  error_message?: string;
  remaining_balance?: number;
}

export interface RedeemGiftCertificateRequest {
  code: string;
  organization_id: string;
  amount: number;
  transaction_ref?: string;
  pos_device_id?: string;
  customer_id?: string;
  performed_by_user_id?: string;
}

export interface RedeemGiftCertificateResponse {
  success: boolean;
  new_balance: number;
  transaction: GiftCertificateTransaction;
  receipt_pdf_url?: string;
  receipt_html?: string;
}

export interface UpdateGiftCertificateRequest {
  status?: GiftCertificateStatus;
  valid_until?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// FILTER AND PAGINATION TYPES
// ============================================================================

export interface GiftCertificateFilters {
  status?: GiftCertificateStatus | GiftCertificateStatus[];
  issue_type?: GiftCertificateIssueType;
  from_date?: string;
  to_date?: string;
  min_amount?: number;
  max_amount?: number;
  recipient_email?: string;
  recipient_name?: string;
  search_code?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// ============================================================================
// UI/UX TYPES (for components)
// ============================================================================

export interface GiftCertificateCardProps {
  certificate: GiftCertificate;
  isPOSMode?: boolean;
  onView?: (certificate: GiftCertificate) => void;
  onValidate?: (certificate: GiftCertificate) => void;
  onPrint?: (certificate: GiftCertificate) => void;
  onEmail?: (certificate: GiftCertificate) => void;
}

export interface ValidatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onValidated: (certificate: GiftCertificate) => void;
  organizationId: string;
}

export interface RedeemModalProps {
  isOpen: boolean;
  certificate: GiftCertificate;
  onRedeem: (amount: number) => Promise<void>;
  onClose: () => void;
  organizationId: string;
}

export interface IssueModalProps {
  isOpen: boolean;
  onIssue: (data: CreateGiftCertificateRequest) => Promise<void>;
  onClose: () => void;
  organizationId: string;
  templates: GiftCertificateTemplate[];
}

// ============================================================================
// PRINT TYPES
// ============================================================================

export interface GiftCertificatePrintData {
  certificate: GiftCertificate;
  organization_name: string;
  organization_logo?: string;
  organization_address?: string;
  qr_code_data_url: string;
}

export interface RedemptionReceiptData {
  code: string;
  balance_before: number;
  amount_redeemed: number;
  balance_after: number;
  cashier_name: string;
  timestamp: Date;
  organization_name: string;
  organization_address?: string;
  organization_vat?: string;
  pos_terminal_id?: string;
  qr_code_url?: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface GiftCertificateValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: GiftCertificateFilters;
  from_date?: string;
  to_date?: string;
  include_transactions?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type GiftCertificateWithTransactions = GiftCertificate & {
  transactions: GiftCertificateTransaction[];
};

export type GiftCertificateWithTemplate = GiftCertificate & {
  template?: GiftCertificateTemplate;
};

export type PartialGiftCertificate = Partial<GiftCertificate>;
