import { supabase } from './supabase'

export interface Reward {
  id: string
  organization_id: string
  name: string
  description: string | null
  points_required: number
  image_url: string | null
  required_tier: string | null
  is_active: boolean
  stock: number | null
  created_at: string
}

class RewardsService {
  /**
   * Carica i premi attivi per un'organizzazione
   */
  async getActiveRewards(organizationId: string): Promise<Reward[]> {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('points_required', { ascending: true })

      if (error) {
        console.error('Error loading rewards:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getActiveRewards:', error)
      return []
    }
  }

  /**
   * Carica i premi disponibili per un cliente (in base a punti e tier)
   */
  async getAvailableRewards(
    organizationId: string,
    customerPoints: number,
    customerTier: string = 'Bronze'
  ): Promise<Reward[]> {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .lte('points_required', customerPoints)
        .order('points_required', { ascending: false })

      if (error) {
        console.error('Error loading available rewards:', error)
        throw error
      }

      // Filtra per tier se necessario
      const filtered = (data || []).filter(reward => {
        if (!reward.required_tier) return true

        const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum']
        const customerTierIndex = tierOrder.indexOf(customerTier)
        const requiredTierIndex = tierOrder.indexOf(reward.required_tier)

        return customerTierIndex >= requiredTierIndex
      })

      return filtered
    } catch (error) {
      console.error('Error in getAvailableRewards:', error)
      return []
    }
  }

  /**
   * Crea un nuovo riscatto (stato "In Attesa")
   */
  async createRedemption(
    customerId: string,
    organizationId: string,
    rewardId: string,
    rewardName: string,
    pointsSpent: number
  ): Promise<{ success: boolean; redemptionId?: string; error?: string }> {
    try {
      console.log('🎁 Creazione redemption:', { customerId, rewardId, pointsSpent })

      const { data, error } = await supabase
        .from('reward_redemptions')
        .insert({
          customer_id: customerId,
          organization_id: organizationId,
          reward_id: rewardId,
          reward_name: rewardName,
          points_spent: pointsSpent,
          used_at: null, // In attesa
          redeemed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating redemption:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Redemption creato con successo:', data)
      return { success: true, redemptionId: data.id }
    } catch (error: any) {
      console.error('Error in createRedemption:', error)
      return { success: false, error: error.message || 'Errore sconosciuto' }
    }
  }

  /**
   * Carica lo storico riscatti del cliente
   */
  async getCustomerRedemptions(customerId: string, organizationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          rewards:reward_id (
            image_url
          )
        `)
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .order('redeemed_at', { ascending: false })

      if (error) {
        console.error('Error loading redemptions:', error)
        throw error
      }

      // Flatten the rewards data to make it easier to use
      const flattenedData = data?.map(redemption => ({
        ...redemption,
        image_url: redemption.rewards?.image_url
      })) || []

      return flattenedData
    } catch (error) {
      console.error('Error in getCustomerRedemptions:', error)
      return []
    }
  }
}

export const rewardsService = new RewardsService()
