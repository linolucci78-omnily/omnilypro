import { supabase } from '../lib/supabase'

/**
 * Service for managing rewards in OMNILY PRO loyalty system
 * Handles CRUD operations for organization rewards
 */

export interface Reward {
  id: string
  organization_id: string
  name: string
  type: 'discount' | 'freeProduct' | 'cashback' | 'giftCard'
  value: number | string
  points_required: number
  required_tier?: string // Livello di fedeltà richiesto (es. 'Iniziale', 'Affezionato', 'VIP')
  description: string
  image_url?: string
  is_active: boolean
  stock_quantity?: number
  valid_from?: string
  valid_until?: string
  terms_conditions?: string
  created_at: string
  updated_at: string
}

export interface RewardInput {
  name: string
  type: 'discount' | 'freeProduct' | 'cashback' | 'giftCard'
  value: number | string
  points_required: number
  required_tier?: string // Livello di fedeltà richiesto
  description: string
  image_url?: string
  is_active: boolean
  stock_quantity?: number
  valid_from?: string
  valid_until?: string
  terms_conditions?: string
  imageFile?: File
}

export class RewardsService {

  /**
   * Get all rewards for an organization
   */
  async getAll(organizationId: string): Promise<Reward[]> {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to get rewards:', error)
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Error in RewardsService.getAll:', error)
      throw error
    }
  }

  /**
   * Get active rewards for an organization
   */
  async getActive(organizationId: string): Promise<Reward[]> {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('points_required', { ascending: true })

      if (error) {
        console.error('Failed to get active rewards:', error)
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Error in RewardsService.getActive:', error)
      throw error
    }
  }

  /**
   * Get reward by ID
   */
  async getById(id: string, organizationId: string): Promise<Reward | null> {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Failed to get reward by ID:', error)
        throw error
      }

      return data || null
    } catch (error: any) {
      console.error('Error in RewardsService.getById:', error)
      throw error
    }
  }

  /**
   * Create new reward
   */
  async create(organizationId: string, rewardData: RewardInput): Promise<Reward> {
    try {
      console.log('REWARDS SERVICE: Creating reward...', rewardData.name)

      // Handle image upload if file provided
      let imageUrl = rewardData.image_url
      if (rewardData.imageFile) {
        imageUrl = await this.uploadImage(organizationId, rewardData.imageFile)
      }

      // Prepare reward data
      const rewardToCreate = {
        organization_id: organizationId,
        name: rewardData.name,
        type: rewardData.type,
        value: rewardData.value,
        points_required: rewardData.points_required,
        required_tier: rewardData.required_tier || null,
        description: rewardData.description,
        image_url: imageUrl,
        is_active: rewardData.is_active,
        stock_quantity: rewardData.stock_quantity || null,
        valid_from: rewardData.valid_from || null,
        valid_until: rewardData.valid_until || null,
        terms_conditions: rewardData.terms_conditions || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('rewards')
        .insert(rewardToCreate)
        .select()
        .single()

      if (error) {
        console.error('Failed to create reward:', error)
        throw error
      }

      console.log('Reward created successfully:', data.name)
      return data
    } catch (error: any) {
      console.error('Error in RewardsService.create:', error)
      throw error
    }
  }

  /**
   * Update existing reward
   */
  async update(id: string, organizationId: string, rewardData: Partial<RewardInput>): Promise<Reward> {
    try {
      console.log('REWARDS SERVICE: Updating reward...', id)

      // Handle image upload if new file provided
      let imageUrl = rewardData.image_url
      if (rewardData.imageFile) {
        imageUrl = await this.uploadImage(organizationId, rewardData.imageFile)
      }

      // Prepare update data
      const updateData: any = {
        ...rewardData,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      }

      // Remove imageFile from update data
      delete updateData.imageFile

      const { data, error } = await supabase
        .from('rewards')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) {
        console.error('Failed to update reward:', error)
        throw error
      }

      console.log('Reward updated successfully:', data.name)
      return data
    } catch (error: any) {
      console.error('Error in RewardsService.update:', error)
      throw error
    }
  }

  /**
   * Delete reward
   */
  async delete(id: string, organizationId: string): Promise<void> {
    try {
      console.log('REWARDS SERVICE: Deleting reward...', id)

      // Get reward to delete image if exists
      const reward = await this.getById(id, organizationId)
      if (reward?.image_url) {
        await this.deleteImage(reward.image_url)
      }

      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Failed to delete reward:', error)
        throw error
      }

      console.log('Reward deleted successfully')
    } catch (error: any) {
      console.error('Error in RewardsService.delete:', error)
      throw error
    }
  }

  /**
   * Toggle reward active status
   */
  async toggleStatus(id: string, organizationId: string, isActive: boolean): Promise<Reward> {
    try {
      console.log('REWARDS SERVICE: Toggling reward status...', id, isActive)

      const { data, error } = await supabase
        .from('rewards')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) {
        console.error('Failed to toggle reward status:', error)
        throw error
      }

      console.log('Reward status toggled successfully')
      return data
    } catch (error: any) {
      console.error('Error in RewardsService.toggleStatus:', error)
      throw error
    }
  }

  /**
   * Upload reward image to Supabase Storage
   */
  async uploadImage(organizationId: string, file: File): Promise<string> {
    try {
      console.log('REWARDS SERVICE: Uploading image...', file.name)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}/rewards/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('reward-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Failed to upload image:', error)
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('reward-images')
        .getPublicUrl(data.path)

      console.log('Image uploaded successfully:', urlData.publicUrl)
      return urlData.publicUrl
    } catch (error: any) {
      console.error('Error in RewardsService.uploadImage:', error)
      throw error
    }
  }

  /**
   * Delete image from Supabase Storage
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract path from URL
      const path = imageUrl.split('/reward-images/')[1]
      if (!path) return

      const { error } = await supabase.storage
        .from('reward-images')
        .remove([path])

      if (error) {
        console.error('Failed to delete image:', error)
        // Don't throw error for image deletion - just log it
      }
    } catch (error: any) {
      console.error('Error in RewardsService.deleteImage:', error)
      // Don't throw error for image deletion
    }
  }

  /**
   * Get rewards statistics for organization
   */
  async getStats(organizationId: string) {
    try {
      const { data: all, error } = await supabase
        .from('rewards')
        .select('id, type, is_active, points_required, created_at')
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Failed to get rewards stats:', error)
        throw error
      }

      const now = new Date()
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      return {
        total: all.length,
        active: all.filter(r => r.is_active).length,
        inactive: all.filter(r => !r.is_active).length,
        byType: {
          discount: all.filter(r => r.type === 'discount').length,
          freeProduct: all.filter(r => r.type === 'freeProduct').length,
          cashback: all.filter(r => r.type === 'cashback').length,
          giftCard: all.filter(r => r.type === 'giftCard').length
        },
        newThisMonth: all.filter(r => new Date(r.created_at) >= monthAgo).length,
        averagePoints: all.length > 0
          ? Math.round(all.reduce((sum, r) => sum + r.points_required, 0) / all.length)
          : 0
      }
    } catch (error: any) {
      console.error('Error in RewardsService.getStats:', error)
      throw error
    }
  }

  /**
   * Get rewards available for customer based on points AND loyalty tier
   */
  async getAvailableForCustomer(organizationId: string, customerPoints: number, customerTier?: string, loyaltyTiers?: any[]): Promise<Reward[]> {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .lte('points_required', customerPoints)
        .order('points_required', { ascending: true })

      if (error) {
        console.error('Failed to get available rewards:', error)
        throw error
      }

      // Filter by stock quantity, validity dates, and loyalty tier
      const availableRewards = (data || []).filter(reward => {
        // Check stock quantity
        if (reward.stock_quantity && reward.stock_quantity <= 0) {
          return false
        }

        // Check validity dates
        const now = new Date()
        if (reward.valid_from && new Date(reward.valid_from) > now) {
          return false
        }
        if (reward.valid_until && new Date(reward.valid_until) < now) {
          return false
        }

        // Check loyalty tier requirement
        if (reward.required_tier && customerTier && loyaltyTiers) {
          console.log(`🏆 Checking tier requirement: Reward needs '${reward.required_tier}', Customer has '${customerTier}'`);

          // Find customer tier index
          const customerTierData = loyaltyTiers.find(tier => tier.name === customerTier);
          const requiredTierData = loyaltyTiers.find(tier => tier.name === reward.required_tier);

          if (!customerTierData || !requiredTierData) {
            console.log(`⚠️ Tier not found: Customer='${customerTier}', Required='${reward.required_tier}'`);
            return false;
          }

          // Compare tier thresholds (customer must have >= required tier threshold)
          const customerTierThreshold = parseInt(customerTierData.threshold);
          const requiredTierThreshold = parseInt(requiredTierData.threshold);

          if (customerTierThreshold < requiredTierThreshold) {
            console.log(`❌ Tier too low: Customer threshold=${customerTierThreshold}, Required threshold=${requiredTierThreshold}`);
            return false;
          }

          console.log(`✅ Tier check passed: Customer threshold=${customerTierThreshold} >= Required threshold=${requiredTierThreshold}`);
        }

        return true
      })

      return availableRewards
    } catch (error: any) {
      console.error('Error in RewardsService.getAvailableForCustomer:', error)
      throw error
    }
  }

  /**
   * Redeem reward (decrease stock if applicable)
   */
  async redeemReward(id: string, organizationId: string): Promise<Reward> {
    try {
      console.log('REWARDS SERVICE: Redeeming reward...', id)

      const reward = await this.getById(id, organizationId)
      if (!reward) {
        throw new Error('Reward not found')
      }

      if (!reward.is_active) {
        throw new Error('Reward is not active')
      }

      // Check stock if applicable
      if (reward.stock_quantity !== null && reward.stock_quantity !== undefined && reward.stock_quantity <= 0) {
        throw new Error('Reward is out of stock')
      }

      // Update stock quantity if applicable
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (reward.stock_quantity !== null && reward.stock_quantity !== undefined) {
        updateData.stock_quantity = reward.stock_quantity - 1
      }

      const { data, error } = await supabase
        .from('rewards')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) {
        console.error('Failed to redeem reward:', error)
        throw error
      }

      console.log('Reward redeemed successfully')
      return data
    } catch (error: any) {
      console.error('Error in RewardsService.redeemReward:', error)
      throw error
    }
  }

  /**
   * Riscatta un premio per un cliente
   * - Scala i punti dal cliente
   * - Registra il riscatto nella tabella reward_redemptions
   * - Aggiorna lo stock del premio se applicabile
   */
  async redeemForCustomer(
    organizationId: string,
    customerId: string,
    rewardId: string,
    customerPoints: number,
    customerTier: string
  ): Promise<{success: boolean; redemption?: any; error?: string}> {
    try {
      console.log(`🎁 REDEEM: Inizio riscatto premio ${rewardId} per cliente ${customerId}`);

      // 1. Ottieni il premio
      const reward = await this.getById(rewardId, organizationId);
      if (!reward) {
        return { success: false, error: 'Premio non trovato' };
      }

      if (!reward.is_active) {
        return { success: false, error: 'Premio non attivo' };
      }

      // 2. Verifica punti sufficienti
      if (customerPoints < reward.points_required) {
        return { success: false, error: 'Punti insufficienti' };
      }

      // 3. Verifica stock
      if (reward.stock_quantity !== null && reward.stock_quantity !== undefined && reward.stock_quantity <= 0) {
        return { success: false, error: 'Premio esaurito' };
      }

      // 4. Calcola nuovi punti
      const newPoints = customerPoints - reward.points_required;

      // 5. Aggiorna punti cliente
      const { error: updateError } = await supabase
        .from('customers')
        .update({ points: newPoints, updated_at: new Date().toISOString() })
        .eq('id', customerId)
        .eq('organization_id', organizationId);

      if (updateError) {
        console.error('Failed to update customer points:', updateError);
        return { success: false, error: 'Errore aggiornamento punti cliente' };
      }

      // 6. Aggiorna stock premio se applicabile
      if (reward.stock_quantity !== null && reward.stock_quantity !== undefined) {
        await this.redeemReward(rewardId, organizationId);
      }

      // 7. Registra riscatto
      const redemptionData = {
        organization_id: organizationId,
        customer_id: customerId,
        reward_id: rewardId,
        reward_name: reward.name,
        reward_type: reward.type,
        reward_value: String(reward.value),
        points_spent: reward.points_required,
        customer_points_before: customerPoints,
        customer_points_after: newPoints,
        customer_tier: customerTier,
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: redemption, error: redemptionError } = await supabase
        .from('reward_redemptions')
        .insert(redemptionData)
        .select()
        .single();

      if (redemptionError) {
        console.error('Failed to create redemption record:', redemptionError);
        // Nota: I punti sono già stati scalati, quindi non possiamo fare rollback completo
        return { success: false, error: 'Errore registrazione riscatto' };
      }

      console.log('✅ Premio riscattato con successo!');
      return { success: true, redemption };

    } catch (error: any) {
      console.error('Error in RewardsService.redeemForCustomer:', error);
      return { success: false, error: error.message || 'Errore sconosciuto' };
    }
  }

  /**
   * Ottieni storico riscatti per un cliente
   */
  async getRedemptionsByCustomer(customerId: string, organizationId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .order('redeemed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get customer redemptions:', error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in RewardsService.getRedemptionsByCustomer:', error);
      throw error;
    }
  }

  /**
   * Ottieni statistiche riscatti per organizzazione
   */
  async getRedemptionStats(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select('id, points_spent, redeemed_at, status')
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Failed to get redemption stats:', error);
        throw error;
      }

      const now = new Date();
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      return {
        total: data.length,
        totalPointsSpent: data.reduce((sum, r) => sum + r.points_spent, 0),
        thisMonth: data.filter(r => new Date(r.redeemed_at) >= monthAgo).length,
        byStatus: {
          redeemed: data.filter(r => r.status === 'redeemed').length,
          used: data.filter(r => r.status === 'used').length,
          expired: data.filter(r => r.status === 'expired').length,
          cancelled: data.filter(r => r.status === 'cancelled').length
        }
      };
    } catch (error: any) {
      console.error('Error in RewardsService.getRedemptionStats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const rewardsService = new RewardsService()