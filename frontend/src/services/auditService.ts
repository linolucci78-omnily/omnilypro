/**
 * Audit Logging Service
 * Automatically tracks and logs all important user actions in the system
 * Logs are stored in the audit_logs table for compliance and security monitoring
 */

import { supabase } from '../lib/supabase'

export type AuditAction =
  // Authentication
  | 'user.login'
  | 'user.logout'
  | 'user.login_failed'
  | 'user.signup'
  | 'user.password_reset'
  | 'user.password_changed'

  // User Management
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.role_changed'
  | 'user.permissions_changed'

  // Organization Management
  | 'organization.created'
  | 'organization.updated'
  | 'organization.deleted'
  | 'organization.member_added'
  | 'organization.member_removed'

  // Data Access
  | 'data.access'
  | 'data.export'
  | 'data.import'
  | 'data.delete'

  // Subscription & Billing
  | 'subscription.created'
  | 'subscription.upgraded'
  | 'subscription.downgraded'
  | 'subscription.cancelled'
  | 'payment.succeeded'
  | 'payment.failed'

  // Settings
  | 'settings.updated'
  | 'settings.reset'

  // Security
  | 'security.password_reset'
  | 'security.2fa_enabled'
  | 'security.2fa_disabled'
  | 'security.suspicious_activity'

  // API
  | 'api.rate_limit_exceeded'
  | 'api.error'

  // System
  | 'system.backup_completed'
  | 'system.maintenance_started'
  | 'system.maintenance_ended'

export interface AuditMetadata {
  ip_address?: string
  user_agent?: string
  location?: string
  resource?: string
  action?: string
  changes?: string[]
  old_value?: any
  new_value?: any
  reason?: string
  email?: string
  error?: string
  status_code?: number
  [key: string]: any
}

class AuditService {
  /**
   * Log an audit event
   */
  async log(
    action: AuditAction,
    metadata: AuditMetadata = {},
    userId?: string,
    organizationId?: string
  ): Promise<void> {
    try {
      // Get current user if not provided
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id
      }

      // Enrich metadata with browser info
      const enrichedMetadata = {
        ...metadata,
        user_agent: metadata.user_agent || navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }

      // Try to get IP address (client-side this is limited)
      // In production, this should be set server-side
      if (!enrichedMetadata.ip_address) {
        try {
          const response = await fetch('https://api.ipify.org?format=json')
          const data = await response.json()
          enrichedMetadata.ip_address = data.ip
        } catch (e) {
          // IP fetch failed, continue without it
        }
      }

      // Insert audit log
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          user_id: userId || null,
          organization_id: organizationId || null,
          metadata: enrichedMetadata,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('[AuditService] Failed to log audit event:', error)
      } else {
        console.log(`[AuditService] ✅ Logged: ${action}`, enrichedMetadata)
      }
    } catch (error) {
      console.error('[AuditService] Exception logging audit event:', error)
    }
  }

  /**
   * Log user login
   */
  async logLogin(userId: string, organizationId?: string, metadata?: AuditMetadata) {
    await this.log('user.login', metadata, userId, organizationId)
  }

  /**
   * Log user logout
   */
  async logLogout(userId: string, organizationId?: string, metadata?: AuditMetadata) {
    await this.log('user.logout', metadata, userId, organizationId)
  }

  /**
   * Log failed login attempt
   */
  async logLoginFailed(email: string, reason: string, metadata?: AuditMetadata) {
    await this.log('user.login_failed', {
      ...metadata,
      email,
      reason
    })
  }

  /**
   * Log data access
   */
  async logDataAccess(resource: string, action: string, metadata?: AuditMetadata) {
    await this.log('data.access', {
      ...metadata,
      resource,
      action
    })
  }

  /**
   * Log data export
   */
  async logDataExport(resource: string, format: string, count: number, metadata?: AuditMetadata) {
    await this.log('data.export', {
      ...metadata,
      resource,
      format,
      count
    })
  }

  /**
   * Log organization update
   */
  async logOrganizationUpdate(organizationId: string, changes: string[], metadata?: AuditMetadata) {
    await this.log('organization.updated', {
      ...metadata,
      changes
    }, undefined, organizationId)
  }

  /**
   * Log subscription change
   */
  async logSubscriptionChange(
    type: 'created' | 'upgraded' | 'downgraded' | 'cancelled',
    organizationId: string,
    metadata?: AuditMetadata
  ) {
    const action = `subscription.${type}` as AuditAction
    await this.log(action, metadata, undefined, organizationId)
  }

  /**
   * Log payment event
   */
  async logPayment(
    success: boolean,
    amount: string,
    organizationId: string,
    metadata?: AuditMetadata
  ) {
    const action = success ? 'payment.succeeded' : 'payment.failed'
    await this.log(action, {
      ...metadata,
      amount
    }, undefined, organizationId)
  }

  /**
   * Log settings update
   */
  async logSettingsUpdate(section: string, changes: string[], metadata?: AuditMetadata) {
    await this.log('settings.updated', {
      ...metadata,
      section,
      changes
    })
  }

  /**
   * Log API error
   */
  async logApiError(endpoint: string, error: string, statusCode?: number, metadata?: AuditMetadata) {
    await this.log('api.error', {
      ...metadata,
      endpoint,
      error,
      status_code: statusCode
    })
  }
}

// Export singleton instance
export const auditService = new AuditService()
