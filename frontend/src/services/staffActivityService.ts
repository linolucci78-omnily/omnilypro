import { supabase } from '../lib/supabase'

export interface StaffActivityLog {
  id: string
  organization_id: string
  staff_user_id: string | null
  staff_name: string
  action_type: string
  description: string
  customer_id?: string | null
  customer_name?: string | null
  action_data: Record<string, any>
  ip_address?: string | null
  user_agent?: string | null
  device_id?: string | null
  created_at: string
}

export interface StaffActivityStats {
  action_type: string
  count: number
  last_action: string
}

export interface TopStaffBySales {
  staff_user_id: string | null
  staff_name: string
  sales_count: number
  total_amount: number
  total_points: number
  last_sale: string
}

/**
 * Service per gestire i log delle attività degli operatori
 */
export const staffActivityService = {
  /**
   * Registra una vendita
   */
  async logSale(params: {
    organizationId: string
    staffUserId: string | null
    staffName: string
    customerId?: string
    customerName?: string
    amount: number
    points: number
    paymentMethod: string
    deviceId?: string
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('staff_activity_logs')
        .insert({
          organization_id: params.organizationId,
          staff_user_id: params.staffUserId,
          staff_name: params.staffName,
          action_type: 'sale',
          description: `Vendita di €${params.amount.toFixed(2)} a ${params.customerName || 'cliente'} (+${params.points} punti)`,
          customer_id: params.customerId,
          customer_name: params.customerName,
          action_data: {
            amount: params.amount,
            points: params.points,
            payment_method: params.paymentMethod
          },
          device_id: params.deviceId
        })

      if (error) {
        console.error('❌ Error logging sale activity:', error)
      } else {
        console.log('✅ Sale activity logged successfully')
      }
    } catch (error) {
      console.error('❌ Exception logging sale activity:', error)
    }
  },

  /**
   * Registra un riscatto premio
   */
  async logRewardRedeem(params: {
    organizationId: string
    staffUserId: string | null
    staffName: string
    customerId: string
    customerName: string
    rewardId: string
    rewardName: string
    pointsSpent: number
    deviceId?: string
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('staff_activity_logs')
        .insert({
          organization_id: params.organizationId,
          staff_user_id: params.staffUserId,
          staff_name: params.staffName,
          action_type: 'reward_redeem',
          description: `Riscatto premio "${params.rewardName}" per ${params.customerName} (${params.pointsSpent} punti)`,
          customer_id: params.customerId,
          customer_name: params.customerName,
          action_data: {
            reward_id: params.rewardId,
            reward_name: params.rewardName,
            points_spent: params.pointsSpent
          },
          device_id: params.deviceId
        })

      if (error) {
        console.error('❌ Error logging reward redemption activity:', error)
      } else {
        console.log('✅ Reward redemption activity logged successfully')
      }
    } catch (error) {
      console.error('❌ Exception logging reward redemption activity:', error)
    }
  },

  /**
   * Registra la creazione di un cliente
   */
  async logCustomerCreate(params: {
    organizationId: string
    staffUserId: string | null
    staffName: string
    customerId: string
    customerName: string
    customerEmail: string
    deviceId?: string
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('staff_activity_logs')
        .insert({
          organization_id: params.organizationId,
          staff_user_id: params.staffUserId,
          staff_name: params.staffName,
          action_type: 'customer_create',
          description: `Creato nuovo cliente: ${params.customerName} (${params.customerEmail})`,
          customer_id: params.customerId,
          customer_name: params.customerName,
          action_data: {
            customer_email: params.customerEmail
          },
          device_id: params.deviceId
        })

      if (error) {
        console.error('❌ Error logging customer create activity:', error)
      } else {
        console.log('✅ Customer create activity logged successfully')
      }
    } catch (error) {
      console.error('❌ Exception logging customer create activity:', error)
    }
  },

  /**
   * Registra la modifica di un cliente
   */
  async logCustomerUpdate(params: {
    organizationId: string
    staffUserId: string | null
    staffName: string
    customerId: string
    customerName: string
    fieldChanged: string
    oldValue?: any
    newValue?: any
    deviceId?: string
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('staff_activity_logs')
        .insert({
          organization_id: params.organizationId,
          staff_user_id: params.staffUserId,
          staff_name: params.staffName,
          action_type: 'customer_update',
          description: `Modificato cliente ${params.customerName}: ${params.fieldChanged}`,
          customer_id: params.customerId,
          customer_name: params.customerName,
          action_data: {
            field_changed: params.fieldChanged,
            old_value: params.oldValue,
            new_value: params.newValue
          },
          device_id: params.deviceId
        })

      if (error) {
        console.error('❌ Error logging customer update activity:', error)
      } else {
        console.log('✅ Customer update activity logged successfully')
      }
    } catch (error) {
      console.error('❌ Exception logging customer update activity:', error)
    }
  },

  /**
   * Registra l'eliminazione di un cliente
   */
  async logCustomerDelete(params: {
    organizationId: string
    staffUserId: string | null
    staffName: string
    customerId: string
    customerName: string
    deviceId?: string
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('staff_activity_logs')
        .insert({
          organization_id: params.organizationId,
          staff_user_id: params.staffUserId,
          staff_name: params.staffName,
          action_type: 'customer_delete',
          description: `Eliminato cliente: ${params.customerName}`,
          customer_id: params.customerId,
          customer_name: params.customerName,
          action_data: {},
          device_id: params.deviceId
        })

      if (error) {
        console.error('❌ Error logging customer delete activity:', error)
      } else {
        console.log('✅ Customer delete activity logged successfully')
      }
    } catch (error) {
      console.error('❌ Exception logging customer delete activity:', error)
    }
  },

  /**
   * Registra il login di un operatore
   */
  async logLogin(params: {
    organizationId: string
    staffUserId: string
    staffName: string
    ipAddress?: string
    userAgent?: string
    deviceId?: string
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('staff_activity_logs')
        .insert({
          organization_id: params.organizationId,
          staff_user_id: params.staffUserId,
          staff_name: params.staffName,
          action_type: 'login',
          description: `Login effettuato`,
          action_data: {},
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
          device_id: params.deviceId
        })

      if (error) {
        console.error('❌ Error logging login activity:', error)
      } else {
        console.log('✅ Login activity logged successfully')
      }
    } catch (error) {
      console.error('❌ Exception logging login activity:', error)
    }
  },

  /**
   * Registra il logout di un operatore
   */
  async logLogout(params: {
    organizationId: string
    staffUserId: string
    staffName: string
    deviceId?: string
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('staff_activity_logs')
        .insert({
          organization_id: params.organizationId,
          staff_user_id: params.staffUserId,
          staff_name: params.staffName,
          action_type: 'logout',
          description: `Logout effettuato`,
          action_data: {},
          device_id: params.deviceId
        })

      if (error) {
        console.error('❌ Error logging logout activity:', error)
      } else {
        console.log('✅ Logout activity logged successfully')
      }
    } catch (error) {
      console.error('❌ Exception logging logout activity:', error)
    }
  },

  /**
   * Registra una attività generica
   */
  async logActivity(params: {
    organizationId: string
    staffUserId: string | null
    staffName: string
    actionType: string
    description: string
    customerId?: string
    customerName?: string
    actionData?: Record<string, any>
    deviceId?: string
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('staff_activity_logs')
        .insert({
          organization_id: params.organizationId,
          staff_user_id: params.staffUserId,
          staff_name: params.staffName,
          action_type: params.actionType,
          description: params.description,
          customer_id: params.customerId,
          customer_name: params.customerName,
          action_data: params.actionData || {},
          device_id: params.deviceId
        })

      if (error) {
        console.error('❌ Error logging activity:', error)
      } else {
        console.log('✅ Activity logged successfully')
      }
    } catch (error) {
      console.error('❌ Exception logging activity:', error)
    }
  },

  /**
   * Ottiene i log di attività con filtri opzionali
   */
  async getLogs(params: {
    organizationId: string
    staffUserId?: string
    customerId?: string
    actionType?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<StaffActivityLog[]> {
    try {
      let query = supabase
        .from('staff_activity_logs')
        .select('*')
        .eq('organization_id', params.organizationId)
        .order('created_at', { ascending: false })

      if (params.staffUserId) {
        query = query.eq('staff_user_id', params.staffUserId)
      }

      if (params.customerId) {
        query = query.eq('customer_id', params.customerId)
      }

      if (params.actionType) {
        query = query.eq('action_type', params.actionType)
      }

      if (params.startDate) {
        query = query.gte('created_at', params.startDate)
      }

      if (params.endDate) {
        query = query.lte('created_at', params.endDate)
      }

      if (params.limit) {
        query = query.limit(params.limit)
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error fetching activity logs:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('❌ Exception fetching activity logs:', error)
      throw error
    }
  },

  /**
   * Ottiene statistiche attività per tipo di azione
   */
  async getActivityStats(params: {
    organizationId: string
    staffUserId?: string
    startDate?: string
    endDate?: string
  }): Promise<StaffActivityStats[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_staff_activity_stats', {
          p_organization_id: params.organizationId,
          p_staff_user_id: params.staffUserId || null,
          p_start_date: params.startDate || null,
          p_end_date: params.endDate || null
        })

      if (error) {
        console.error('❌ Error fetching activity stats:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('❌ Exception fetching activity stats:', error)
      throw error
    }
  },

  /**
   * Ottiene top operatori per vendite
   */
  async getTopStaffBySales(params: {
    organizationId: string
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<TopStaffBySales[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_top_staff_by_sales', {
          p_organization_id: params.organizationId,
          p_start_date: params.startDate || null,
          p_end_date: params.endDate || null,
          p_limit: params.limit || 10
        })

      if (error) {
        console.error('❌ Error fetching top staff by sales:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('❌ Exception fetching top staff by sales:', error)
      throw error
    }
  },

  /**
   * Elimina log più vecchi di N giorni (per GDPR compliance)
   */
  async deleteOldLogs(params: {
    organizationId: string
    daysToKeep: number
  }): Promise<{ deleted: number }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - params.daysToKeep)

      const { data, error } = await supabase
        .from('staff_activity_logs')
        .delete()
        .eq('organization_id', params.organizationId)
        .lt('created_at', cutoffDate.toISOString())
        .select('id')

      if (error) {
        console.error('❌ Error deleting old logs:', error)
        throw error
      }

      return { deleted: data?.length || 0 }
    } catch (error) {
      console.error('❌ Exception deleting old logs:', error)
      throw error
    }
  }
}
