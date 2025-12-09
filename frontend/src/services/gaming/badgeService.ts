/**
 * OMNILYPRO GAMING MODULE - Badge Service
 * Handles badge CRUD, auto-unlock, and badge assignment
 */

import { supabase } from '../../lib/supabase'
import type {
  Badge,
  CustomerBadge,
  BadgeUnlockResult,
  CreateBadgeInput,
  BadgeUnlockRule,
  Customer
} from './types'

export class BadgeService {
  /**
   * Get all badges for an organization
   */
  async getAllBadges(organizationId: string): Promise<Badge[]> {
    try {
      const { data, error } = await supabase
        .from('gaming_badges')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('rarity', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching badges:', error)
      throw error
    }
  }

  /**
   * Get badges earned by a customer
   */
  async getCustomerBadges(customerId: string): Promise<CustomerBadge[]> {
    try {
      const { data, error } = await supabase
        .from('customer_badges')
        .select(`
          *,
          badge:gaming_badges(*)
        `)
        .eq('customer_id', customerId)
        .order('unlocked_at', { ascending: false })

      if (error) {
        console.warn('⚠️ customer_badges query failed (suppressed):', error.message)
        return []
      }
      return data || []
    } catch (error) {
      console.warn('⚠️ Error fetching customer badges (suppressed)')
      return []
    }
  }

  /**
   * Check if customer has a specific badge
   */
  async hasBadge(customerId: string, badgeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('customer_badges')
        .select('id')
        .eq('customer_id', customerId)
        .eq('badge_id', badgeId)
        .maybeSingle()

      if (error) throw error
      return !!data
    } catch (error) {
      console.error('❌ Error checking badge:', error)
      return false
    }
  }

  /**
   * Unlock a badge for a customer (manual or admin granted)
   */
  async unlockBadge(
    customerId: string,
    badgeId: string,
    method: 'manual' | 'admin_granted' = 'manual'
  ): Promise<BadgeUnlockResult> {
    try {
      // Check if already has badge
      const hasBadge = await this.hasBadge(customerId, badgeId)
      if (hasBadge) {
        return { success: true, newly_unlocked: false }
      }

      // Get badge details for rewards
      const { data: badge, error: badgeError } = await supabase
        .from('gaming_badges')
        .select('*')
        .eq('id', badgeId)
        .single()

      if (badgeError) throw badgeError

      // Insert customer badge
      const { data: customerBadge, error } = await supabase
        .from('customer_badges')
        .insert({
          customer_id: customerId,
          badge_id: badgeId,
          unlock_method: method,
          unlocked_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      console.log(`🏆 Badge unlocked: ${badge.name} for customer ${customerId}`)

      // Award rewards if any
      if (badge.unlock_rewards) {
        await this.awardBadgeRewards(customerId, badge.unlock_rewards, badge.name)
      }

      // Create notification
      await this.createBadgeNotification(customerId, badge)

      return {
        success: true,
        badge: customerBadge,
        newly_unlocked: true
      }
    } catch (error: any) {
      console.error('❌ Error unlocking badge:', error)
      return {
        success: false,
        newly_unlocked: false,
        error: error.message
      }
    }
  }

  /**
   * Check and auto-unlock badges for a customer based on their current stats
   */
  async checkAndUnlockBadges(
    customerId: string,
    organizationId: string,
    trigger?: string
  ): Promise<BadgeUnlockResult[]> {
    try {
      console.log(`🔍 Checking badges for customer ${customerId}, trigger: ${trigger || 'general'}`)

      // Get all badges with auto-unlock rules for this org
      const { data: badges, error } = await supabase
        .from('gaming_badges')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .not('auto_unlock_rule', 'is', null)

      if (error) throw error
      if (!badges || badges.length === 0) return []

      const results: BadgeUnlockResult[] = []

      for (const badge of badges) {
        // Skip if already has badge
        const hasBadge = await this.hasBadge(customerId, badge.id)
        if (hasBadge) continue

        // Check if badge should be unlocked
        const shouldUnlock = await this.checkBadgeUnlockRule(
          customerId,
          organizationId,
          badge.auto_unlock_rule
        )

        if (shouldUnlock) {
          const result = await this.unlockBadge(customerId, badge.id, 'auto')
          results.push(result)
        }
      }

      return results
    } catch (error) {
      console.error('❌ Error checking badges:', error)
      return []
    }
  }

  /**
   * Check if a badge unlock rule is satisfied
   */
  private async checkBadgeUnlockRule(
    customerId: string,
    organizationId: string,
    rule: BadgeUnlockRule
  ): Promise<boolean> {
    try {
      // Load customer data
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

      if (customerError || !customer) {
        console.error('Error loading customer:', customerError)
        return false
      }

      switch (rule.type) {
        case 'registration':
          // Always true (unlock on registration)
          return true

        case 'purchase_count':
          // Check visits as proxy for purchases
          return (customer.visits || 0) >= (rule.threshold || 0)

        case 'total_spent':
          return (customer.total_spent || 0) >= (rule.threshold || 0)

        case 'visit_count':
          return (customer.visits || 0) >= (rule.threshold || 0)

        case 'points_reached':
          return (customer.points || 0) >= (rule.threshold || 0)

        case 'days_since_registration': {
          const registrationDate = new Date(customer.created_at)
          const now = new Date()
          const daysSince = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24))
          return daysSince >= (rule.threshold || 0)
        }

        case 'reward_redeemed': {
          // Query reward redemptions
          const { count, error } = await supabase
            .from('reward_redemptions')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customerId)

          if (error) throw error
          return (count || 0) >= (rule.threshold || 0)
        }

        case 'referrals': {
          // Query referral program
          const { data, error } = await supabase
            .from('referral_program')
            .select('successful_referrals')
            .eq('customer_id', customerId)
            .maybeSingle()

          if (error) {
            console.warn('⚠️ referral_program table not found (suppressed)')
            return false
          }
          return (data?.successful_referrals || 0) >= (rule.threshold || 0)
        }

        case 'challenges_completed': {
          // Query completed challenges
          const { count, error } = await supabase
            .from('customer_challenges')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customerId)
            .eq('status', 'completed')

          if (error) {
            console.warn('⚠️ customer_challenges query failed (suppressed):', error.message)
            return false
          }
          return (count || 0) >= (rule.threshold || 0)
        }

        case 'streak_days': {
          // Query streak system (if implemented)
          const { data, error } = await supabase
            .from('customer_streaks')
            .select('current_count')
            .eq('customer_id', customerId)
            .eq('type', 'daily_purchase')
            .maybeSingle()

          if (error) {
            console.warn('⚠️ customer_streaks table not found (suppressed)')
            return false
          }
          return (data?.current_count || 0) >= (rule.threshold || 0)
        }

        case 'tier_reached': {
          // Check customer tier (from loyalty system)
          // This requires tier calculation logic
          // For now, we'll return false and implement later
          return false
        }

        default:
          console.warn(`⚠️ Unknown badge unlock rule type: ${rule.type}`)
          return false
      }
    } catch (error) {
      console.error('❌ Error checking badge rule:', error)
      return false
    }
  }

  /**
   * Award badge rewards to customer
   */
  private async awardBadgeRewards(
    customerId: string,
    rewards: any,
    badgeName?: string
  ): Promise<void> {
    try {
      // Award points
      if (rewards.points && rewards.points > 0) {
        const { error } = await supabase.rpc('add_customer_points', {
          p_customer_id: customerId,
          p_points: rewards.points
        })

        if (error) {
          console.warn('⚠️ Error awarding badge points, using fallback:', error)
          // Fallback: update points directly
          const { data: customer } = await supabase
            .from('customers')
            .select('points, organization_id')
            .eq('id', customerId)
            .single()

          if (customer) {
            await supabase
              .from('customers')
              .update({ points: customer.points + rewards.points })
              .eq('id', customerId)

            // LOG BADGE POINTS in customer_activities for visibility
            try {
              await supabase
                .from('customer_activities')
                .insert({
                  organization_id: customer.organization_id,
                  customer_id: customerId,
                  activity_type: 'badge_reward',
                  activity_description: `Badge sbloccato: ${badgeName || 'Badge'} - Bonus punti`,
                  points_earned: rewards.points,
                  monetary_value: 0
                })
              console.log(`📝 Badge reward logged in customer_activities`)
            } catch (logError) {
              console.error('⚠️ Error logging badge reward (non-blocking):', logError)
            }
          }
        }

        console.log(`💰 Awarded ${rewards.points} points for badge unlock`)
      }

      // Award free spins (store in a free_spins table or customer field)
      if (rewards.free_spins && rewards.free_spins > 0) {
        // TODO: Implement free spins storage
        console.log(`🎰 Awarded ${rewards.free_spins} free spins for badge unlock`)
      }

      // Award discount (create discount code)
      if (rewards.discount && rewards.discount > 0) {
        // TODO: Implement discount code creation
        console.log(`💸 Awarded ${rewards.discount}% discount for badge unlock`)
      }
    } catch (error) {
      console.error('❌ Error awarding badge rewards:', error)
    }
  }

  /**
   * Create a notification for badge unlock
   */
  private async createBadgeNotification(
    customerId: string,
    badge: Badge
  ): Promise<void> {
    try {
      await supabase
        .from('gaming_notifications')
        .insert({
          customer_id: customerId,
          type: 'badge_unlocked',
          title: `🏆 Nuovo Badge Sbloccato!`,
          message: `Hai sbloccato il badge "${badge.name}"!`,
          data: { badge_id: badge.id, badge_name: badge.name }
        })

      console.log(`📬 Badge unlock notification created`)
    } catch (error) {
      console.error('❌ Error creating badge notification:', error)
    }
  }

  /**
   * Create a new badge (admin only)
   */
  async createBadge(input: CreateBadgeInput): Promise<Badge> {
    try {
      const { data, error } = await supabase
        .from('gaming_badges')
        .insert({
          organization_id: input.organization_id,
          name: input.name,
          description: input.description,
          icon_url: input.icon_url,
          icon_emoji: input.icon_emoji,
          category: input.category,
          rarity: input.rarity || 'common',
          auto_unlock_rule: input.auto_unlock_rule,
          unlock_rewards: input.unlock_rewards,
          is_active: input.is_active ?? true,
          is_predefined: false
        })
        .select()
        .single()

      if (error) throw error
      console.log(`✅ Badge created: ${data.name}`)
      return data
    } catch (error) {
      console.error('❌ Error creating badge:', error)
      throw error
    }
  }

  /**
   * Update a badge
   */
  async updateBadge(
    badgeId: string,
    updates: Partial<CreateBadgeInput>
  ): Promise<Badge> {
    try {
      const { data, error } = await supabase
        .from('gaming_badges')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', badgeId)
        .select()
        .single()

      if (error) throw error
      console.log(`✅ Badge updated: ${data.name}`)
      return data
    } catch (error) {
      console.error('❌ Error updating badge:', error)
      throw error
    }
  }

  /**
   * Delete a badge
   */
  async deleteBadge(badgeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('gaming_badges')
        .delete()
        .eq('id', badgeId)

      if (error) throw error
      console.log(`✅ Badge deleted: ${badgeId}`)
    } catch (error) {
      console.error('❌ Error deleting badge:', error)
      throw error
    }
  }

  /**
   * Get badge statistics for customer
   */
  async getBadgeStats(customerId: string, organizationId?: string): Promise<any> {
    try {
      // Total badges created (if organizationId provided)
      let totalBadges = 0
      if (organizationId) {
        const { count, error: badgesError } = await supabase
          .from('gaming_badges')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)

        if (badgesError) {
          console.warn('⚠️ gaming_badges query failed (suppressed):', badgesError.message)
        } else {
          totalBadges = count || 0
        }
      }

      // Total badges unlocked by this customer
      const { count: totalUnlocked, error: unlockedError } = await supabase
        .from('customer_badges')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('unlocked', true)

      if (unlockedError) {
        console.warn('⚠️ customer_badges query failed (suppressed):', unlockedError.message)
      }

      // Badges unlocked today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: unlockedToday, error: todayError } = await supabase
        .from('customer_badges')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('unlocked', true)
        .gte('unlocked_at', today.toISOString())

      if (todayError) {
        console.warn('⚠️ customer_badges today query failed (suppressed):', todayError.message)
      }

      return {
        total_badges: totalBadges || 0,
        total_unlocked: totalUnlocked || 0,
        unlocked_today: unlockedToday || 0
      }
    } catch (error) {
      console.warn('⚠️ Error fetching badge stats (suppressed)')
      return {
        total_badges: 0,
        total_unlocked: 0,
        unlocked_today: 0
      }
    }
  }

  /**
   * Seed predefined badges for an organization
   */
  async seedPredefinedBadges(organizationId: string): Promise<void> {
    try {
      console.log(`🌱 Seeding predefined badges for org ${organizationId}`)

      // Load predefined badges from JSON
      const predefinedBadges = await import('../../../docs/gaming-predefined-badges.json')

      for (const badgeData of predefinedBadges.predefined_badges) {
        await supabase
          .from('gaming_badges')
          .insert({
            organization_id: organizationId,
            ...badgeData,
            is_predefined: true,
            is_active: true
          })
      }

      console.log(`✅ Predefined badges seeded successfully`)
    } catch (error) {
      console.error('❌ Error seeding predefined badges:', error)
      throw error
    }
  }
}

// Export singleton instance
export const badgeService = new BadgeService()
