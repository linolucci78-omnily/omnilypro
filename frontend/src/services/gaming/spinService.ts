/**
 * OMNILYPRO GAMING MODULE - Spin the Wheel Service
 * Handles spin logic, prize distribution, daily limits
 */

import { supabase } from '../../lib/supabase'
import type {
  WheelConfig,
  CustomerSpin,
  SpinResult,
  WheelSector,
  SpinPrize,
  UpdateWheelConfigInput
} from './types'

export class SpinService {
  /**
   * Get wheel configuration for organization
   */
  async getWheelConfig(organizationId: string): Promise<WheelConfig | null> {
    try {
      const { data, error } = await supabase
        .from('gaming_wheel_configs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error fetching wheel config:', error)
      return null
    }
  }

  /**
   * Get customer's spin history
   */
  async getCustomerSpins(customerId: string, limit: number = 20): Promise<CustomerSpin[]> {
    try {
      const { data, error } = await supabase
        .from('customer_wheel_spins')
        .select('*')
        .eq('customer_id', customerId)
        .order('spun_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching spins:', error)
      return []
    }
  }

  /**
   * Check if customer can spin (daily limit)
   */
  async canSpin(customerId: string, organizationId: string): Promise<{
    canSpin: boolean
    spinsToday: number
    maxSpins: number
    reason?: string
  }> {
    try {
      // Get wheel config
      const config = await this.getWheelConfig(organizationId)
      if (!config) {
        return { canSpin: false, spinsToday: 0, maxSpins: 0, reason: 'Wheel not configured' }
      }

      // Count spins today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count, error } = await supabase
        .from('customer_wheel_spins')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .gte('spun_at', today.toISOString())

      if (error) throw error

      const spinsToday = count || 0
      const maxSpins = config.max_spins_per_day
      const canSpin = spinsToday < maxSpins

      return {
        canSpin,
        spinsToday,
        maxSpins,
        reason: !canSpin ? `Limite giornaliero raggiunto (${maxSpins}/${maxSpins})` : undefined
      }
    } catch (error) {
      console.error('❌ Error checking spin availability:', error)
      return { canSpin: false, spinsToday: 0, maxSpins: 0, reason: 'Error checking availability' }
    }
  }

  /**
   * Spin the wheel!
   */
  async spinWheel(customerId: string, organizationId: string): Promise<SpinResult> {
    try {
      console.log(`🎰 Spinning wheel for customer ${customerId}`)

      // Check if can spin
      const { canSpin, reason } = await this.canSpin(customerId, organizationId)
      if (!canSpin) {
        return { success: false, error: reason }
      }

      // Get wheel config
      const config = await this.getWheelConfig(organizationId)
      if (!config || !config.sectors || config.sectors.length === 0) {
        return { success: false, error: 'Wheel not configured' }
      }

      // Select a random sector based on probabilities
      const sectorLanded = this.selectRandomSector(config.sectors)
      if (!sectorLanded) {
        return { success: false, error: 'Error selecting prize' }
      }

      // Create prize won object
      const prizeWon: SpinPrize = {
        type: sectorLanded.type,
        value: sectorLanded.value,
        label: sectorLanded.label,
        code: sectorLanded.type === 'discount' ? this.generateDiscountCode() : undefined
      }

      // Save spin to database
      const { data: spin, error: spinError } = await supabase
        .from('customer_wheel_spins')
        .insert({
          customer_id: customerId,
          organization_id: organizationId,
          wheel_config_id: config.id,
          sector_landed: sectorLanded,
          prize_won: prizeWon,
          rewards_claimed: false,
          spun_at: new Date().toISOString()
        })
        .select()
        .single()

      if (spinError) throw spinError

      // Award prize immediately
      await this.awardSpinPrize(customerId, prizeWon)

      // Mark as claimed
      await supabase
        .from('customer_wheel_spins')
        .update({ rewards_claimed: true, rewards_claimed_at: new Date().toISOString() })
        .eq('id', spin.id)

      console.log(`✅ Spin successful! Prize: ${prizeWon.label}`)

      return {
        success: true,
        spin,
        sector_landed: sectorLanded,
        prize_won: prizeWon
      }
    } catch (error: any) {
      console.error('❌ Error spinning wheel:', error)
      return {
        success: false,
        error: error.message || 'Error spinning wheel'
      }
    }
  }

  /**
   * Create or update wheel configuration
   */
  async updateWheelConfig(
    organizationId: string,
    config: UpdateWheelConfigInput
  ): Promise<WheelConfig> {
    try {
      // Check if config exists
      const existing = await this.getWheelConfig(organizationId)

      // Filter only valid database fields (exclude UI-only fields like spin_rotations)
      const validFields: any = {}
      const allowedFields = ['name', 'sectors', 'trigger_rules', 'max_spins_per_day', 'max_spins_per_week', 'cooldown_hours', 'is_active']

      for (const field of allowedFields) {
        if ((config as any)[field] !== undefined) {
          validFields[field] = (config as any)[field]
        }
      }

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('gaming_wheel_configs')
          .update({
            ...validFields,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        console.log(`✅ Wheel config updated`)
        return data
      } else {
        // Create
        const { data, error } = await supabase
          .from('gaming_wheel_configs')
          .insert({
            organization_id: organizationId,
            ...validFields,
            is_active: true
          })
          .select()
          .single()

        if (error) throw error
        console.log(`✅ Wheel config created`)
        return data
      }
    } catch (error) {
      console.error('❌ Error updating wheel config:', error)
      throw error
    }
  }

  /**
   * Seed default wheel configuration
   */
  async seedDefaultWheelConfig(organizationId: string): Promise<void> {
    try {
      console.log(`🌱 Seeding default wheel config for org ${organizationId}`)

      const defaultSectors: WheelSector[] = [
        { id: 1, label: '10 Punti', type: 'points', value: 10, color: '#3b82f6', probability: 25 },
        { id: 2, label: '25 Punti', type: 'points', value: 25, color: '#10b981', probability: 20 },
        { id: 3, label: '50 Punti', type: 'points', value: 50, color: '#f59e0b', probability: 15 },
        { id: 4, label: 'Sconto 10%', type: 'discount', value: 10, color: '#8b5cf6', probability: 15 },
        { id: 5, label: 'Riprova', type: 'nothing', value: 0, color: '#6b7280', probability: 10 },
        { id: 6, label: 'Spin Gratis', type: 'free_spin', value: 1, color: '#ec4899', probability: 5 },
        { id: 7, label: '100 Punti!', type: 'points', value: 100, color: '#ef4444', probability: 5 },
        { id: 8, label: 'Sconto 20%!', type: 'discount', value: 20, color: '#14b8a6', probability: 5 }
      ]

      await this.updateWheelConfig(organizationId, {
        name: 'Ruota della Fortuna',
        sectors: defaultSectors,
        max_spins_per_day: 3,
        cooldown_hours: 0,
        trigger_rules: {
          on_purchase: true,
          min_purchase_amount: 10
        },
        is_active: true
      })

      console.log(`✅ Default wheel config seeded`)
    } catch (error) {
      console.error('❌ Error seeding wheel config:', error)
      throw error
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Select random sector based on probabilities
   */
  private selectRandomSector(sectors: WheelSector[]): WheelSector | null {
    try {
      // Calculate total probability
      const totalProbability = sectors.reduce((sum, s) => sum + s.probability, 0)

      // Generate random number
      const random = Math.random() * totalProbability

      // Find sector
      let cumulative = 0
      for (const sector of sectors) {
        cumulative += sector.probability
        if (random <= cumulative) {
          return sector
        }
      }

      // Fallback to first sector
      return sectors[0]
    } catch (error) {
      console.error('❌ Error selecting sector:', error)
      return null
    }
  }

  /**
   * Award spin prize to customer
   */
  private async awardSpinPrize(customerId: string, prize: SpinPrize): Promise<void> {
    try {
      switch (prize.type) {
        case 'points':
          if (typeof prize.value === 'number' && prize.value > 0) {
            console.log(`💰 Assegnazione punti iniziata...`)
            console.log(`   - customerId: ${customerId}`)
            console.log(`   - punti da aggiungere: ${prize.value}`)

            // Add points to customer
            const { data: customer, error: fetchError } = await supabase
              .from('customers')
              .select('points')
              .eq('id', customerId)
              .single()

            if (fetchError) {
              console.error('❌ Errore recupero punti cliente:', fetchError)
              break
            }

            if (customer) {
              const oldPoints = customer.points || 0
              const newPoints = oldPoints + prize.value

              console.log(`   - punti attuali: ${oldPoints}`)
              console.log(`   - nuovi punti: ${newPoints}`)

              const { data: updated, error: updateError } = await supabase
                .from('customers')
                .update({ points: newPoints })
                .eq('id', customerId)
                .select()

              if (updateError) {
                console.error('❌ Errore aggiornamento punti:', updateError)
              } else {
                console.log(`✅ Punti aggiornati con successo! ${oldPoints} → ${newPoints}`)
                console.log('   - Risposta database:', updated)
              }
            } else {
              console.error('❌ Cliente non trovato!')
            }
          }
          break

        case 'discount':
          // Create discount code
          // TODO: Implement discount code system
          console.log(`💸 Created discount code: ${prize.code}`)
          break

        case 'free_spin':
          // Award free spin
          // TODO: Implement free spins tracking
          console.log(`🎰 Awarded ${prize.value} free spin(s)`)
          break

        case 'badge':
          // Award badge
          if (typeof prize.value === 'string') {
            const { badgeService } = await import('./badgeService')
            await badgeService.unlockBadge(customerId, prize.value, 'manual')
            console.log(`🏆 Awarded badge from spin`)
          }
          break

        case 'reward':
          // Award reward
          // TODO: Implement reward auto-redemption
          console.log(`🎁 Awarded reward from spin`)
          break

        case 'nothing':
          // No prize
          console.log(`😔 No prize this time`)
          break

        default:
          console.warn(`⚠️ Unknown prize type: ${prize.type}`)
      }

      // Create notification
      await this.createSpinNotification(customerId, prize)
    } catch (error) {
      console.error('❌ Error awarding spin prize:', error)
    }
  }

  /**
   * Generate discount code
   */
  private generateDiscountCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'SPIN'
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Create spin notification
   */
  private async createSpinNotification(customerId: string, prize: SpinPrize): Promise<void> {
    try {
      let message = ''

      switch (prize.type) {
        case 'points':
          message = `Hai vinto ${prize.value} punti!`
          break
        case 'discount':
          message = `Hai vinto uno sconto del ${prize.value}%! Codice: ${prize.code}`
          break
        case 'free_spin':
          message = `Hai vinto ${prize.value} spin gratis!`
          break
        case 'nothing':
          message = 'Riprova! Hai ancora ${X} spin disponibili oggi'
          break
        default:
          message = `Hai vinto: ${prize.label}!`
      }

      await supabase
        .from('gaming_notifications')
        .insert({
          customer_id: customerId,
          type: 'spin_available',
          title: '🎰 Spin Completato!',
          message,
          data: { prize }
        })

      console.log(`📬 Spin notification created`)
    } catch (error) {
      console.error('❌ Error creating spin notification:', error)
    }
  }
}

// Export singleton instance
export const spinService = new SpinService()
