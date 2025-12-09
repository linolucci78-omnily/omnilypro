/**
 * Activity Logger Utility
 *
 * Provides easy-to-use functions for logging staff activities.
 * Automatically handles super admin virtual staff member creation.
 *
 * DUAL LOGGING SYSTEM:
 * - Logs to 'staff_activities' (legacy system, for staff_members)
 * - Logs to 'staff_activity_logs' (new system, for NFC operator tracking)
 */

import { supabase, staffApi } from './supabase'
import { staffActivityService } from '../services/staffActivityService'

interface LogActivityParams {
  organizationId: string
  action: string
  entityType?: string
  entityId?: string
  details?: any
}

/**
 * Get the current staff ID for logging purposes
 * - For regular staff members: returns their staff_id
 * - For super admins: creates/gets a virtual staff_member record
 */
async function getCurrentStaffId(organizationId: string): Promise<string | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('⚠️ [ACTIVITY LOGGER] No authenticated user')
      return null
    }

    console.log('👤 [ACTIVITY LOGGER] Current user:', { id: user.id, email: user.email })

    // Check if user is super admin
    const { data: orgUser, error: orgError } = await supabase
      .from('organization_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (orgError) {
      console.error('❌ [ACTIVITY LOGGER] Error checking organization user:', orgError)
      return null
    }

    const isSuperAdmin = orgUser?.role === 'super_admin'
    console.log('🔐 [ACTIVITY LOGGER] User role:', { role: orgUser?.role, isSuperAdmin })

    if (isSuperAdmin) {
      // Super admin - get or create virtual staff member
      console.log('🎯 [ACTIVITY LOGGER] Super admin detected, getting/creating virtual staff member')
      const staffId = await staffApi.getOrCreateVirtualStaffMember(
        organizationId,
        user.id,
        user.user_metadata?.full_name || user.email || 'Super Admin',
        user.email || 'superadmin@omnily.com'
      )
      console.log('✅ [ACTIVITY LOGGER] Using virtual staff ID:', staffId)
      return staffId
    }

    // Regular staff - find their staff_member record
    console.log('👔 [ACTIVITY LOGGER] Regular staff, looking up staff_member record')
    const { data: staffMember, error: staffError } = await supabase
      .from('staff_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', user.email)
      .maybeSingle()

    if (staffError) {
      console.error('❌ [ACTIVITY LOGGER] Error finding staff member:', staffError)
      return null
    }

    if (!staffMember) {
      console.warn('⚠️ [ACTIVITY LOGGER] No staff member found for user:', user.email)
      return null
    }

    console.log('✅ [ACTIVITY LOGGER] Using staff ID:', staffMember.id)
    return staffMember.id
  } catch (error) {
    console.error('❌ [ACTIVITY LOGGER] Exception in getCurrentStaffId:', error)
    return null
  }
}

/**
 * Log an activity for the current user
 * This is the main function to use in components
 */
export async function logActivity({
  organizationId,
  action,
  entityType,
  entityId,
  details
}: LogActivityParams): Promise<void> {
  try {
    console.log('📝 [ACTIVITY LOGGER] Logging activity:', { organizationId, action, entityType, entityId })

    // Get current staff ID
    const staffId = await getCurrentStaffId(organizationId)

    if (!staffId) {
      console.warn('⚠️ [ACTIVITY LOGGER] Cannot log activity - no staff ID available')
      return
    }

    // Log the activity (non-blocking - don't fail if logging fails)
    try {
      await staffApi.logActivity(
        organizationId,
        staffId,
        action,
        entityType,
        entityId,
        details
      )
      console.log('✅ [ACTIVITY LOGGER] Activity logged successfully')
    } catch (logError) {
      console.error('❌ [ACTIVITY LOGGER] Failed to log activity (non-blocking):', logError)
      // Don't re-throw - activity logging should never block main operations
    }
  } catch (error) {
    console.error('❌ [ACTIVITY LOGGER] Error logging activity:', error)
    // Don't throw - logging errors shouldn't break the main flow
  }
}

/**
 * Log customer creation
 * DUAL LOGGING: Logs to both legacy staff_activities and new staff_activity_logs
 */
export async function logCustomerCreated(
  organizationId: string,
  customerId: string,
  customerName: string,
  customerEmail?: string
): Promise<void> {
  // Log to legacy system (staff_activities)
  await logActivity({
    organizationId,
    action: 'created_customer',
    entityType: 'customer',
    entityId: customerId,
    details: { customer_name: customerName }
  })

  // Log to new system (staff_activity_logs) - handles NFC operators
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const staffName = user.user_metadata?.full_name || user.email || 'Operatore Sconosciuto'

      await staffActivityService.logCustomerCreate({
        organizationId,
        staffUserId: user.id,
        staffName,
        customerId,
        customerName,
        customerEmail: customerEmail || '',
        deviceId: typeof window !== 'undefined' ? (window as any).deviceId : undefined
      })
      console.log('✅ [ACTIVITY LOGGER] Customer creation logged to staff_activity_logs')
    }
  } catch (error) {
    console.error('❌ [ACTIVITY LOGGER] Error logging customer creation to staff_activity_logs:', error)
    // Don't throw - logging errors shouldn't break the main flow
  }
}

/**
 * Log customer update
 * DUAL LOGGING: Logs to both legacy staff_activities and new staff_activity_logs
 */
export async function logCustomerUpdated(
  organizationId: string,
  customerId: string,
  customerName: string,
  changes: any
): Promise<void> {
  // Log to legacy system (staff_activities)
  await logActivity({
    organizationId,
    action: 'updated_customer',
    entityType: 'customer',
    entityId: customerId,
    details: { customer_name: customerName, changes }
  })

  // Log to new system (staff_activity_logs) - handles NFC operators
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const staffName = user.user_metadata?.full_name || user.email || 'Operatore Sconosciuto'

      // Log each changed field separately for better audit trail
      for (const [field, value] of Object.entries(changes)) {
        await staffActivityService.logCustomerUpdate({
          organizationId,
          staffUserId: user.id,
          staffName,
          customerId,
          customerName,
          fieldChanged: field,
          oldValue: (value as any)?.old,
          newValue: (value as any)?.new || value,
          deviceId: typeof window !== 'undefined' ? (window as any).deviceId : undefined
        })
      }
      console.log('✅ [ACTIVITY LOGGER] Customer update logged to staff_activity_logs')
    }
  } catch (error) {
    console.error('❌ [ACTIVITY LOGGER] Error logging customer update to staff_activity_logs:', error)
    // Don't throw - logging errors shouldn't break the main flow
  }
}

/**
 * Log points added
 */
export async function logPointsAdded(
  organizationId: string,
  customerId: string,
  customerName: string,
  points: number,
  reason?: string
): Promise<void> {
  await logActivity({
    organizationId,
    action: 'added_points',
    entityType: 'customer',
    entityId: customerId,
    details: { customer_name: customerName, points, reason }
  })
}

/**
 * Log points removed
 */
export async function logPointsRemoved(
  organizationId: string,
  customerId: string,
  customerName: string,
  points: number,
  reason?: string
): Promise<void> {
  await logActivity({
    organizationId,
    action: 'removed_points',
    entityType: 'customer',
    entityId: customerId,
    details: { customer_name: customerName, points, reason }
  })
}

/**
 * Log reward redeemed
 * DUAL LOGGING: Logs to both legacy staff_activities and new staff_activity_logs
 */
export async function logRewardRedeemed(
  organizationId: string,
  customerId: string,
  customerName: string,
  rewardId: string,
  rewardName: string,
  pointsCost: number
): Promise<void> {
  // Log to legacy system (staff_activities)
  await logActivity({
    organizationId,
    action: 'redeemed_reward',
    entityType: 'reward',
    entityId: rewardId,
    details: {
      customer_id: customerId,
      customer_name: customerName,
      reward_name: rewardName,
      points_cost: pointsCost
    }
  })

  // Log to new system (staff_activity_logs) - handles NFC operators
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const staffName = user.user_metadata?.full_name || user.email || 'Operatore Sconosciuto'

      await staffActivityService.logRewardRedeem({
        organizationId,
        staffUserId: user.id,
        staffName,
        customerId,
        customerName,
        rewardId,
        rewardName,
        pointsSpent: pointsCost,
        deviceId: typeof window !== 'undefined' ? (window as any).deviceId : undefined
      })
      console.log('✅ [ACTIVITY LOGGER] Reward redemption logged to staff_activity_logs')
    }
  } catch (error) {
    console.error('❌ [ACTIVITY LOGGER] Error logging reward redemption to staff_activity_logs:', error)
    // Don't throw - logging errors shouldn't break the main flow
  }
}

/**
 * Log sale/transaction
 * DUAL LOGGING: Logs to both legacy staff_activities and new staff_activity_logs
 */
export async function logSale(
  organizationId: string,
  customerId: string | null,
  customerName: string | null,
  amount: number,
  pointsEarned?: number
): Promise<void> {
  // Log to legacy system (staff_activities)
  await logActivity({
    organizationId,
    action: 'sale_transaction',
    entityType: 'transaction',
    entityId: customerId || undefined,
    details: {
      customer_name: customerName,
      amount,
      points_earned: pointsEarned
    }
  })

  // Log to new system (staff_activity_logs) - handles NFC operators
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Get staff name from user metadata or email
      const staffName = user.user_metadata?.full_name || user.email || 'Operatore Sconosciuto'

      await staffActivityService.logSale({
        organizationId,
        staffUserId: user.id,
        staffName,
        customerId: customerId || undefined,
        customerName: customerName || undefined,
        amount,
        points: pointsEarned || 0,
        paymentMethod: 'cash', // Default to cash, can be parameterized in future
        deviceId: typeof window !== 'undefined' ? (window as any).deviceId : undefined
      })
      console.log('✅ [ACTIVITY LOGGER] Sale logged to staff_activity_logs')
    }
  } catch (error) {
    console.error('❌ [ACTIVITY LOGGER] Error logging sale to staff_activity_logs:', error)
    // Don't throw - logging errors shouldn't break the main flow
  }
}

/**
 * Log NFC card assignment
 */
export async function logNFCCardAssigned(
  organizationId: string,
  customerId: string,
  customerName: string,
  cardUid: string
): Promise<void> {
  await logActivity({
    organizationId,
    action: 'assigned_nfc_card',
    entityType: 'customer',
    entityId: customerId,
    details: {
      customer_name: customerName,
      card_uid: cardUid
    }
  })
}

/**
 * Log NFC card unassigned
 */
export async function logNFCCardUnassigned(
  organizationId: string,
  customerId: string,
  customerName: string,
  cardUid: string
): Promise<void> {
  await logActivity({
    organizationId,
    action: 'unassigned_nfc_card',
    entityType: 'customer',
    entityId: customerId,
    details: {
      customer_name: customerName,
      card_uid: cardUid
    }
  })
}
