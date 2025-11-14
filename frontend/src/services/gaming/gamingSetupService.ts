/**
 * GAMING SETUP SERVICE
 * Auto-setup del Gaming Module per nuove organizzazioni
 */

import { supabase } from '../../lib/supabase'
import { badgeService } from './badgeService'
import { challengeService } from './challengeService'
import { spinService } from './spinService'

export class GamingSetupService {
  /**
   * Check if Gaming Module is already setup for organization
   */
  async isSetup(organizationId: string): Promise<boolean> {
    try {
      // Check if badges exist
      const { data: badges, error } = await supabase
        .from('gaming_badges')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1)

      if (error) throw error
      return badges !== null && badges.length > 0
    } catch (error) {
      console.error('❌ Error checking gaming setup:', error)
      return false
    }
  }

  /**
   * Auto-setup Gaming Module for organization (if not already done)
   * Called when org accesses Gaming Hub for first time
   */
  async ensureSetup(organizationId: string): Promise<{
    success: boolean
    alreadySetup: boolean
    error?: string
  }> {
    try {
      console.log(`🎮 Checking Gaming setup for organization: ${organizationId}`)

      // Check if already setup
      const alreadySetup = await this.isSetup(organizationId)

      if (alreadySetup) {
        console.log('   ✅ Gaming Module già configurato')
        return { success: true, alreadySetup: true }
      }

      console.log('   🌱 Prima volta! Inizializzando Gaming Module...')

      // Seed badges
      console.log('   🏆 Creating badges...')
      await badgeService.seedPredefinedBadges(organizationId)

      // Seed challenges
      console.log('   🎯 Creating challenges...')
      await challengeService.seedPredefinedChallenges(organizationId)

      // Seed wheel config
      console.log('   🎡 Configuring wheel...')
      await spinService.seedDefaultWheelConfig(organizationId)

      console.log('   ✅ Gaming Module configurato con successo!')

      return { success: true, alreadySetup: false }
    } catch (error: any) {
      console.error('❌ Error during Gaming setup:', error)
      return {
        success: false,
        alreadySetup: false,
        error: error.message || 'Unknown error'
      }
    }
  }

  /**
   * Initialize Gaming for a new customer
   * Generate initial challenges and check badge unlocks
   */
  async initializeCustomer(customerId: string, organizationId: string): Promise<void> {
    try {
      console.log(`👤 Initializing Gaming for customer: ${customerId}`)

      // Ensure organization setup first
      await this.ensureSetup(organizationId)

      // Generate daily challenges
      await challengeService.generateDailyChallenges(customerId, organizationId)

      // Generate weekly challenges
      await challengeService.generateWeeklyChallenges(customerId, organizationId)

      // Check for badge unlocks (e.g., "Welcome" badge)
      await badgeService.checkAndUnlockBadges(customerId, organizationId)

      console.log('   ✅ Customer Gaming initialized')
    } catch (error) {
      console.error('❌ Error initializing customer Gaming:', error)
      // Non-blocking error - customer can still use the app
    }
  }

  /**
   * Check if customer has Gaming data initialized
   */
  async isCustomerInitialized(customerId: string): Promise<boolean> {
    try {
      const { data: challenges } = await supabase
        .from('customer_challenges')
        .select('id')
        .eq('customer_id', customerId)
        .limit(1)

      return challenges !== null && challenges.length > 0
    } catch (error) {
      console.error('❌ Error checking customer Gaming:', error)
      return false
    }
  }

  /**
   * Ensure customer is initialized (auto-init if first access)
   */
  async ensureCustomerInitialized(customerId: string, organizationId: string): Promise<void> {
    const isInitialized = await this.isCustomerInitialized(customerId)

    if (!isInitialized) {
      console.log('🎮 First time customer, initializing Gaming...')
      await this.initializeCustomer(customerId, organizationId)
    }
  }
}

// Export singleton instance
export const gamingSetupService = new GamingSetupService()
