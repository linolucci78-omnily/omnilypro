/**
 * OMNILYPRO GAMING MODULE - Challenge Service
 * Handles challenges CRUD, auto-generation, progress tracking
 */

import { supabase } from '../../lib/supabase'
import type {
  Challenge,
  CustomerChallenge,
  ChallengeType,
  ChallengeUpdateResult,
  CreateChallengeInput,
  Customer
} from './types'

export class ChallengeService {
  /**
   * Get all challenge templates for an organization
   */
  async getAllChallenges(organizationId: string): Promise<Challenge[]> {
    try {
      const { data, error } = await supabase
        .from('gaming_challenges')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('difficulty', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching challenges:', error)
      throw error
    }
  }

  /**
   * Get active challenges for a customer
   */
  async getCustomerChallenges(customerId: string): Promise<CustomerChallenge[]> {
    try {
      const { data, error } = await supabase
        .from('customer_challenges')
        .select(`
          *,
          challenge:gaming_challenges(*)
        `)
        .eq('customer_id', customerId)
        .in('status', ['active', 'completed'])
        .order('status', { ascending: true }) // Active first
        .order('expires_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching customer challenges:', error)
      throw error
    }
  }

  /**
   * Create a new challenge template (admin only)
   */
  async createChallenge(input: CreateChallengeInput): Promise<Challenge> {
    try {
      const { data, error } = await supabase
        .from('gaming_challenges')
        .insert({
          organization_id: input.organization_id,
          title: input.title,
          description: input.description,
          icon_emoji: input.icon_emoji,
          type: input.type,
          difficulty: input.difficulty || 'medium',
          requirements: input.requirements,
          rewards: input.rewards,
          duration_hours: input.duration_hours,
          is_recurring: input.is_recurring ?? true,
          recurrence_pattern: input.recurrence_pattern,
          is_active: input.is_active ?? true,
          is_template: true
        })
        .select()
        .single()

      if (error) throw error
      console.log(`✅ Challenge created: ${data.title}`)
      return data
    } catch (error) {
      console.error('❌ Error creating challenge:', error)
      throw error
    }
  }

  /**
   * Auto-generate daily/weekly challenges for a customer
   */
  async generateChallengesForCustomer(
    customer: Customer,
    type: 'daily' | 'weekly'
  ): Promise<CustomerChallenge[]> {
    try {
      console.log(`🎯 Generating ${type} challenges for customer ${customer.id}`)

      // Get challenge templates for this type
      const { data: templates, error } = await supabase
        .from('gaming_challenges')
        .select('*')
        .eq('organization_id', customer.organization_id)
        .eq('type', type)
        .eq('is_active', true)
        .eq('is_recurring', true)

      if (error) throw error
      if (!templates || templates.length === 0) {
        console.log(`⚠️ No ${type} challenge templates found`)
        return []
      }

      // Check how many challenges to generate
      const count = type === 'daily' ? 3 : 2 // 3 daily, 2 weekly

      // Randomly select challenges
      const selectedTemplates = this.selectRandomChallenges(templates, count)

      // Create customer challenges
      const generated: CustomerChallenge[] = []

      for (const template of selectedTemplates) {
        const duration = template.duration_hours || (type === 'daily' ? 24 : 168)
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + duration)

        const { data: customerChallenge, error: insertError } = await supabase
          .from('customer_challenges')
          .insert({
            customer_id: customer.id,
            challenge_id: template.id,
            progress: this.initializeProgress(template.requirements),
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            rewards_claimed: false
          })
          .select()
          .single()

        if (insertError) {
          console.error('❌ Error creating customer challenge:', insertError)
          continue
        }

        generated.push(customerChallenge)
      }

      console.log(`✅ Generated ${generated.length} ${type} challenges`)
      return generated
    } catch (error) {
      console.error('❌ Error generating challenges:', error)
      return []
    }
  }

  /**
   * Generate daily challenges for a specific customer
   */
  async generateDailyChallenges(customerId: string, organizationId: string): Promise<CustomerChallenge[]> {
    try {
      // Get customer data
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('organization_id', organizationId)
        .single()

      if (error || !customer) {
        console.error('❌ Customer not found:', error)
        return []
      }

      return await this.generateChallengesForCustomer(customer, 'daily')
    } catch (error) {
      console.error('❌ Error generating daily challenges:', error)
      return []
    }
  }

  /**
   * Generate weekly challenges for a specific customer
   */
  async generateWeeklyChallenges(customerId: string, organizationId: string): Promise<CustomerChallenge[]> {
    try {
      // Get customer data
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('organization_id', organizationId)
        .single()

      if (error || !customer) {
        console.error('❌ Customer not found:', error)
        return []
      }

      return await this.generateChallengesForCustomer(customer, 'weekly')
    } catch (error) {
      console.error('❌ Error generating weekly challenges:', error)
      return []
    }
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(
    customerChallengeId: string,
    increment: number | Record<string, number>
  ): Promise<ChallengeUpdateResult> {
    try {
      // Get current challenge
      const { data: customerChallenge, error: fetchError } = await supabase
        .from('customer_challenges')
        .select(`
          *,
          challenge:gaming_challenges(*)
        `)
        .eq('id', customerChallengeId)
        .single()

      if (fetchError) throw fetchError
      if (!customerChallenge || customerChallenge.status !== 'active') {
        return { success: false, completed: false, error: 'Challenge not active' }
      }

      // Calculate new progress
      const challenge = customerChallenge.challenge as Challenge
      const currentProgress = customerChallenge.progress || { current: 0 }

      let newProgress: any
      let isCompleted = false

      if (typeof increment === 'number') {
        // Simple increment
        const newCurrent = (currentProgress.current || 0) + increment
        const target = this.getTargetFromRequirements(challenge.requirements)
        const percentage = Math.min(Math.round((newCurrent / target) * 100), 100)

        newProgress = {
          current: newCurrent,
          target,
          percentage
        }

        isCompleted = newCurrent >= target
      } else {
        // Complex progress (multiple fields)
        newProgress = { ...currentProgress }
        for (const [key, value] of Object.entries(increment)) {
          newProgress[key] = (newProgress[key] || 0) + value
        }

        // Check completion based on requirements
        isCompleted = this.checkChallengeCompletion(challenge.requirements, newProgress)
      }

      // Update progress
      const updateData: any = {
        progress: newProgress,
        updated_at: new Date().toISOString()
      }

      if (isCompleted && customerChallenge.status === 'active') {
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
      }

      const { data: updated, error: updateError } = await supabase
        .from('customer_challenges')
        .update(updateData)
        .eq('id', customerChallengeId)
        .select()
        .single()

      if (updateError) throw updateError

      // Award rewards if completed
      if (isCompleted && !customerChallenge.rewards_claimed) {
        await this.awardChallengeRewards(
          customerChallenge.customer_id,
          challenge.rewards
        )

        // Mark rewards as claimed
        await supabase
          .from('customer_challenges')
          .update({ rewards_claimed: true, rewards_claimed_at: new Date().toISOString() })
          .eq('id', customerChallengeId)

        // Create notification
        await this.createChallengeNotification(
          customerChallenge.customer_id,
          challenge,
          'completed'
        )
      }

      console.log(`✅ Challenge progress updated: ${challenge.title}`)

      return {
        success: true,
        challenge: updated,
        completed: isCompleted,
        rewards: isCompleted ? challenge.rewards : undefined
      }
    } catch (error: any) {
      console.error('❌ Error updating challenge progress:', error)
      return {
        success: false,
        completed: false,
        error: error.message
      }
    }
  }

  /**
   * Update challenges based on customer activity (simple version with customerId)
   * This is the main function to call from transaction handlers
   */
  async updateChallengesForActivity(
    customerId: string,
    organizationId: string,
    activityType: 'purchase' | 'spend' | 'earn_points' | 'redeem_reward' | 'visit' | 'referral',
    data?: { amount?: number, count?: number, points?: number }
  ): Promise<ChallengeUpdateResult[]> {
    try {
      console.log(`🎮 Updating challenges for activity: ${activityType}`, data)

      // Get active challenges for customer
      const challenges = await this.getCustomerChallenges(customerId)
      const activeChallenges = challenges.filter(c => c.status === 'active')

      if (activeChallenges.length === 0) {
        console.log('⚠️ No active challenges found')
        return []
      }

      const results: ChallengeUpdateResult[] = []

      for (const customerChallenge of activeChallenges) {
        const challenge = customerChallenge.challenge as Challenge
        if (!challenge) continue

        // Check if this activity affects this challenge
        const shouldUpdate = this.shouldUpdateChallenge(
          challenge.requirements,
          activityType
        )

        if (shouldUpdate) {
          // Determine the increment value based on activity type and challenge requirements
          let incrementValue = 1

          if (activityType === 'purchase') {
            incrementValue = data?.count || 1 // Number of purchases
          } else if (activityType === 'spend') {
            incrementValue = data?.amount || 0 // Amount spent
          } else if (activityType === 'earn_points') {
            incrementValue = data?.points || 0 // Points earned
          } else if (activityType === 'visit') {
            incrementValue = 1 // Single visit
          } else if (activityType === 'redeem_reward') {
            incrementValue = data?.count || 1 // Number of rewards redeemed
          } else if (activityType === 'referral') {
            incrementValue = data?.count || 1 // Number of referrals
          }

          console.log(`  📈 Updating challenge "${challenge.title}" by +${incrementValue}`)

          const result = await this.updateChallengeProgress(
            customerChallenge.id,
            incrementValue
          )
          results.push(result)

          if (result.completed) {
            console.log(`  🎉 Challenge completed: "${challenge.title}"!`)
          }
        }
      }

      if (results.length > 0) {
        console.log(`✅ Updated ${results.length} challenge(s)`)
      }

      return results
    } catch (error) {
      console.error('❌ Error updating challenges for activity:', error)
      return []
    }
  }

  /**
   * Check and update challenges based on customer activity
   * @deprecated Use updateChallengesForActivity instead
   */
  async checkAndUpdateChallenges(
    customer: Customer,
    activityType: 'purchase' | 'spend' | 'earn_points' | 'redeem_reward' | 'visit' | 'referral',
    value?: number
  ): Promise<ChallengeUpdateResult[]> {
    try {
      // Get active challenges for customer
      const challenges = await this.getCustomerChallenges(customer.id)
      const activeChallenges = challenges.filter(c => c.status === 'active')

      if (activeChallenges.length === 0) return []

      const results: ChallengeUpdateResult[] = []

      for (const customerChallenge of activeChallenges) {
        const challenge = customerChallenge.challenge as Challenge

        // Check if this activity affects this challenge
        const shouldUpdate = this.shouldUpdateChallenge(
          challenge.requirements,
          activityType
        )

        if (shouldUpdate) {
          const result = await this.updateChallengeProgress(
            customerChallenge.id,
            value || 1
          )
          results.push(result)
        }
      }

      return results
    } catch (error) {
      console.error('❌ Error checking challenges:', error)
      return []
    }
  }

  /**
   * Expire old challenges
   */
  async expireOldChallenges(): Promise<number> {
    try {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('customer_challenges')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('expires_at', now)
        .select()

      if (error) throw error

      const expiredCount = data?.length || 0
      console.log(`✅ Expired ${expiredCount} challenges`)
      return expiredCount
    } catch (error) {
      console.error('❌ Error expiring challenges:', error)
      return 0
    }
  }

  /**
   * Generate challenges for all customers (cron job)
   */
  async generateDailyChallengesForAll(organizationId: string): Promise<void> {
    try {
      console.log(`🔄 Generating daily challenges for org ${organizationId}`)

      // Get all customers
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId)

      if (error) throw error
      if (!customers) return

      for (const customer of customers) {
        await this.generateChallengesForCustomer(customer, 'daily')
      }

      console.log(`✅ Generated daily challenges for ${customers.length} customers`)
    } catch (error) {
      console.error('❌ Error generating daily challenges:', error)
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private selectRandomChallenges(templates: Challenge[], count: number): Challenge[] {
    const shuffled = [...templates].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, templates.length))
  }

  private initializeProgress(requirements: any): any {
    const target = this.getTargetFromRequirements(requirements)
    return {
      current: 0,
      target,
      percentage: 0
    }
  }

  private getTargetFromRequirements(requirements: any): number {
    return requirements.count || requirements.amount || requirements.points || 1
  }

  private checkChallengeCompletion(requirements: any, progress: any): boolean {
    switch (requirements.type) {
      case 'make_purchases':
        return progress.current >= requirements.count
      case 'spend_amount':
        return progress.current >= requirements.amount
      case 'earn_points':
        return progress.current >= requirements.points
      case 'redeem_rewards':
        return progress.current >= requirements.count
      case 'visit_count':
        return progress.current >= requirements.count
      case 'referrals':
        return progress.current >= requirements.count
      default:
        return false
    }
  }

  private shouldUpdateChallenge(requirements: any, activityType: string): boolean {
    const typeMap: Record<string, string[]> = {
      purchase: ['make_purchases'],
      spend: ['spend_amount'],
      earn_points: ['earn_points'],
      redeem_reward: ['redeem_rewards'],
      visit: ['visit_count'],
      referral: ['referrals']
    }

    const relevantTypes = typeMap[activityType] || []
    return relevantTypes.includes(requirements.type)
  }

  private async awardChallengeRewards(customerId: string, rewards: any): Promise<void> {
    try {
      // Award points
      if (rewards.points && rewards.points > 0) {
        const { data: customer } = await supabase
          .from('customers')
          .select('points')
          .eq('id', customerId)
          .single()

        if (customer) {
          await supabase
            .from('customers')
            .update({ points: customer.points + rewards.points })
            .eq('id', customerId)
        }

        console.log(`💰 Awarded ${rewards.points} points for challenge completion`)
      }

      // Award badge
      if (rewards.badge_id) {
        const { badgeService } = await import('./badgeService')
        await badgeService.unlockBadge(customerId, rewards.badge_id, 'manual')
        console.log(`🏆 Awarded badge for challenge completion`)
      }

      // Award free spins
      if (rewards.free_spins && rewards.free_spins > 0) {
        // TODO: Implement free spins storage
        console.log(`🎰 Awarded ${rewards.free_spins} free spins`)
      }

      // Award discount
      if (rewards.discount && rewards.discount > 0) {
        // TODO: Implement discount code creation
        console.log(`💸 Awarded ${rewards.discount}% discount`)
      }
    } catch (error) {
      console.error('❌ Error awarding challenge rewards:', error)
    }
  }

  private async createChallengeNotification(
    customerId: string,
    challenge: Challenge,
    type: 'completed' | 'new' | 'expiring'
  ): Promise<void> {
    try {
      const messages = {
        completed: {
          title: '🎯 Challenge Completata!',
          message: `Hai completato "${challenge.title}"!`
        },
        new: {
          title: '🆕 Nuova Challenge!',
          message: `Nuova challenge disponibile: "${challenge.title}"`
        },
        expiring: {
          title: '⏰ Challenge in Scadenza!',
          message: `La challenge "${challenge.title}" scade presto!`
        }
      }

      await supabase
        .from('gaming_notifications')
        .insert({
          customer_id: customerId,
          type: type === 'completed' ? 'challenge_completed' : type === 'new' ? 'new_challenge' : 'challenge_expiring',
          title: messages[type].title,
          message: messages[type].message,
          data: { challenge_id: challenge.id, challenge_title: challenge.title }
        })

      console.log(`📬 Challenge notification created: ${type}`)
    } catch (error) {
      console.error('❌ Error creating challenge notification:', error)
    }
  }

  /**
   * Seed predefined challenge templates
   */
  async seedPredefinedChallenges(organizationId: string): Promise<void> {
    try {
      console.log(`🌱 Seeding predefined challenges for org ${organizationId}`)

      const predefinedChallenges = [
        // DAILY CHALLENGES
        {
          title: 'Shopping Veloce',
          description: 'Fai 1 acquisto oggi',
          icon_emoji: '🛒',
          type: 'daily' as ChallengeType,
          difficulty: 'easy' as const,
          requirements: { type: 'make_purchases', count: 1 },
          rewards: { points: 50 },
          duration_hours: 24,
          is_recurring: true
        },
        {
          title: 'Spendi €20',
          description: 'Spendi almeno €20 oggi',
          icon_emoji: '💰',
          type: 'daily' as ChallengeType,
          difficulty: 'medium' as const,
          requirements: { type: 'spend_amount', amount: 20 },
          rewards: { points: 100 },
          duration_hours: 24,
          is_recurring: true
        },
        {
          title: 'Accumula Punti',
          description: 'Guadagna 50 punti oggi',
          icon_emoji: '⭐',
          type: 'daily' as ChallengeType,
          difficulty: 'medium' as const,
          requirements: { type: 'earn_points', points: 50 },
          rewards: { points: 75 },
          duration_hours: 24,
          is_recurring: true
        },

        // WEEKLY CHALLENGES
        {
          title: 'Settimana Attiva',
          description: 'Fai 3 acquisti questa settimana',
          icon_emoji: '🎯',
          type: 'weekly' as ChallengeType,
          difficulty: 'medium' as const,
          requirements: { type: 'make_purchases', count: 3 },
          rewards: { points: 200 },
          duration_hours: 168,
          is_recurring: true
        },
        {
          title: 'Big Spender',
          description: 'Spendi €100 questa settimana',
          icon_emoji: '💸',
          type: 'weekly' as ChallengeType,
          difficulty: 'hard' as const,
          requirements: { type: 'spend_amount', amount: 100 },
          rewards: { points: 500, free_spins: 2 },
          duration_hours: 168,
          is_recurring: true
        },
        {
          title: 'Riscatta 2 Premi',
          description: 'Riscatta 2 premi questa settimana',
          icon_emoji: '🎁',
          type: 'weekly' as ChallengeType,
          difficulty: 'medium' as const,
          requirements: { type: 'redeem_rewards', count: 2 },
          rewards: { points: 250 },
          duration_hours: 168,
          is_recurring: true
        }
      ]

      for (const challengeData of predefinedChallenges) {
        await supabase
          .from('gaming_challenges')
          .insert({
            organization_id: organizationId,
            ...challengeData,
            is_active: true,
            is_template: true
          })
      }

      console.log(`✅ Predefined challenges seeded successfully`)
    } catch (error) {
      console.error('❌ Error seeding predefined challenges:', error)
      throw error
    }
  }
}

// Export singleton instance
export const challengeService = new ChallengeService()
