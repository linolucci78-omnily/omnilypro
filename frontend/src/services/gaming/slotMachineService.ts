/**
 * OMNILYPRO GAMING MODULE - Slot Machine Service
 * Handles slot machine configuration, spins, and prizes
 */

import { supabase } from '../../lib/supabase'
import type {
  SlotMachineConfig,
  SlotSymbol,
  SlotResult,
  SlotSpinResult,
  CustomerSlotSpin,
  SlotSymbolConfig,
  WinningCombination
} from './types'

class SlotMachineService {
  /**
   * Get slot machine configuration for organization
   */
  async getSlotConfig(organizationId: string): Promise<SlotMachineConfig | null> {
    console.log('🔍 Fetching slot config for org:', organizationId)

    const { data, error } = await supabase
      .from('slot_machine_config')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('❌ Error fetching slot config:', error)
      return null
    }

    console.log('✅ Found slot config with ID:', data?.id)
    return data
  }

  /**
   * Update slot machine configuration
   */
  async updateSlotConfig(organizationId: string, config: Partial<SlotMachineConfig>): Promise<boolean> {
    try {
      console.log('🔄 Updating slot config for org:', organizationId)
      console.log('📝 Config ID:', config.id)
      console.log('📝 Config data:', JSON.stringify(config, null, 2))

      // Find the config for this org (without is_active filter to handle all cases)
      const { data: existing, error: fetchError } = await supabase
        .from('slot_machine_config')
        .select('id')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError || !existing) {
        console.error('❌ No existing config found for org:', organizationId, fetchError)
        return false
      }

      console.log('✅ Found existing config with ID:', existing.id)

      const updateData = {
        name: config.name,
        symbols: config.symbols,
        winning_combinations: config.winning_combinations,
        max_spins_per_day: config.max_spins_per_day,
        cooldown_hours: config.cooldown_hours,
        is_active: config.is_active
      }

      console.log('📤 Calling stored function to update config...')

      // Use PostgreSQL function to bypass RLS
      const { data: result, error } = await supabase.rpc('update_slot_machine_config', {
        p_organization_id: organizationId,
        p_name: updateData.name,
        p_symbols: updateData.symbols,
        p_winning_combinations: updateData.winning_combinations,
        p_max_spins_per_day: updateData.max_spins_per_day,
        p_cooldown_hours: updateData.cooldown_hours,
        p_is_active: updateData.is_active
      })

      if (error) {
        console.error('❌ Error calling update function:', error)
        console.error('❌ Error details:', JSON.stringify(error, null, 2))
        return false
      }

      console.log('✅ Slot machine config updated successfully!')
      console.log('📊 Updated data:', result)

      return true
    } catch (error) {
      console.error('❌ Exception updating slot config:', error)
      return false
    }
  }

  /**
   * Check if customer can play slot machine today
   */
  async canPlay(customerId: string, organizationId: string): Promise<{
    canPlay: boolean
    spinsToday: number
    maxSpins: number
  }> {
    try {
      const config = await this.getSlotConfig(organizationId)
      if (!config) {
        return { canPlay: false, spinsToday: 0, maxSpins: 0 }
      }

      const today = new Date().toISOString().split('T')[0]

      const { data: spins, error } = await supabase
        .from('customer_slot_spins')
        .select('id')
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .gte('spun_at', `${today}T00:00:00`)
        .lte('spun_at', `${today}T23:59:59`)

      if (error) throw error

      const spinsToday = spins?.length || 0
      const canPlay = spinsToday < config.max_spins_per_day

      return {
        canPlay,
        spinsToday,
        maxSpins: config.max_spins_per_day
      }
    } catch (error) {
      console.error('Error checking slot availability:', error)
      return { canPlay: false, spinsToday: 0, maxSpins: 0 }
    }
  }

  /**
   * Generate random reels based on symbol weights
   */
  private generateReels(symbols: SlotSymbolConfig[]): [SlotSymbol, SlotSymbol, SlotSymbol] {
    const weightedSymbols: SlotSymbol[] = []

    // Create array with symbols repeated by weight
    symbols.forEach(config => {
      for (let i = 0; i < config.weight; i++) {
        weightedSymbols.push(config.symbol)
      }
    })

    const reel1 = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)]
    const reel2 = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)]
    const reel3 = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)]

    return [reel1, reel2, reel3]
  }

  /**
   * Check if reels match a winning combination
   */
  private checkWin(reels: [SlotSymbol, SlotSymbol, SlotSymbol], combinations: WinningCombination[]): {
    isWin: boolean
    combination?: WinningCombination
  } {
    for (const combo of combinations) {
      switch (combo.pattern) {
        case 'jackpot':
          // 7️⃣ 7️⃣ 7️⃣
          if (reels[0] === '7️⃣' && reels[1] === '7️⃣' && reels[2] === '7️⃣') {
            return { isWin: true, combination: combo }
          }
          break

        case 'three_match':
          // All 3 symbols the same
          if (reels[0] === reels[1] && reels[1] === reels[2]) {
            // Check if it matches the required symbols
            if (!combo.symbols || combo.symbols.includes(reels[0])) {
              return { isWin: true, combination: combo }
            }
          }
          break

        case 'two_match':
          // Any 2 symbols the same
          if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
            return { isWin: true, combination: combo }
          }
          break

        case 'any_diamond':
          // At least one 💎
          if (reels.includes('💎')) {
            return { isWin: true, combination: combo }
          }
          break

        case 'any_star':
          // At least one ⭐
          if (reels.includes('⭐')) {
            return { isWin: true, combination: combo }
          }
          break
      }
    }

    return { isWin: false }
  }

  /**
   * Play slot machine
   */
  async playSlot(customerId: string, organizationId: string): Promise<SlotSpinResult> {
    try {
      // Check if can play
      const { canPlay } = await this.canPlay(customerId, organizationId)
      if (!canPlay) {
        return {
          success: false,
          error: 'Hai esaurito i tentativi per oggi!'
        }
      }

      // Get configuration
      const config = await this.getSlotConfig(organizationId)
      if (!config) {
        return {
          success: false,
          error: 'Slot machine non configurata'
        }
      }

      // Generate random reels
      const reels = this.generateReels(config.symbols)

      // Check for win
      const { isWin, combination } = this.checkWin(reels, config.winning_combinations)

      const result: SlotResult = {
        reels,
        isWin,
        combination,
        prize: isWin && combination ? {
          type: combination.prize.type,
          value: combination.prize.value,
          label: combination.prize.label
        } : undefined
      }

      // Save spin to database
      const { data: spin, error: spinError } = await supabase
        .from('customer_slot_spins')
        .insert({
          customer_id: customerId,
          organization_id: organizationId,
          slot_config_id: config.id,
          result: result,
          prize_won: result.prize,
          rewards_claimed: false,
          spun_at: new Date().toISOString()
        })
        .select()
        .single()

      if (spinError) throw spinError

      console.log('🎰 Slot spin saved:', spin)

      // If won points, add them to customer balance
      if (result.isWin && result.prize && result.prize.type === 'points') {
        console.log('💰 Adding', result.prize.value, 'points to customer', customerId)

        try {
          // Try PostgreSQL function first
          const { error: rpcError } = await supabase.rpc('add_loyalty_points', {
            p_customer_id: customerId,
            p_points: result.prize.value
          })

          if (rpcError) {
            console.warn('⚠️ RPC function not available, using fallback:', rpcError)

            // Fallback: get current points and add manually
            const { data: customer, error: fetchError } = await supabase
              .from('customers')
              .select('points')
              .eq('id', customerId)
              .single()

            if (fetchError) throw fetchError

            const currentPoints = customer?.points || 0
            const newPoints = currentPoints + result.prize.value

            console.log(`📊 Current: ${currentPoints}, Adding: ${result.prize.value}, New total: ${newPoints}`)

            const { error: updateError } = await supabase
              .from('customers')
              .update({ points: newPoints })
              .eq('id', customerId)

            if (updateError) throw updateError

            console.log('✅ Points added successfully via fallback!')
          } else {
            console.log('✅ Points added successfully via RPC!')
          }
        } catch (error) {
          console.error('❌ Error updating customer points:', error)
          // Don't fail the whole operation, just log the error
        }
      }

      return {
        success: true,
        result,
        prize: result.prize
      }
    } catch (error) {
      console.error('Error playing slot:', error)
      return {
        success: false,
        error: 'Errore durante il gioco'
      }
    }
  }

  /**
   * Seed default slot machine configuration
   */
  async seedDefaultSlotConfig(organizationId: string): Promise<void> {
    const defaultConfig: Partial<SlotMachineConfig> = {
      organization_id: organizationId,
      name: 'Slot Machine Fortuna',
      symbols: [
        { symbol: '🍒', weight: 30 },
        { symbol: '🍋', weight: 25 },
        { symbol: '🍊', weight: 20 },
        { symbol: '🍉', weight: 15 },
        { symbol: '⭐', weight: 5 },
        { symbol: '💎', weight: 3 },
        { symbol: '7️⃣', weight: 2 }
      ],
      winning_combinations: [
        {
          pattern: 'jackpot',
          prize: { type: 'points', value: 1000, label: '1000 Punti - JACKPOT!' },
          probability: 1
        },
        {
          pattern: 'three_match',
          symbols: ['💎'],
          prize: { type: 'points', value: 500, label: '500 Punti - Tre Diamanti!' },
          probability: 3
        },
        {
          pattern: 'three_match',
          symbols: ['⭐'],
          prize: { type: 'points', value: 300, label: '300 Punti - Tre Stelle!' },
          probability: 5
        },
        {
          pattern: 'three_match',
          prize: { type: 'points', value: 100, label: '100 Punti - Tre uguali!' },
          probability: 15
        },
        {
          pattern: 'two_match',
          prize: { type: 'points', value: 20, label: '20 Punti - Due uguali!' },
          probability: 30
        },
        {
          pattern: 'any_diamond',
          prize: { type: 'points', value: 50, label: '50 Punti - Diamante!' },
          probability: 10
        }
      ],
      max_spins_per_day: 3,
      cooldown_hours: 0,
      is_active: true
    }

    const { error } = await supabase
      .from('slot_machine_config')
      .insert(defaultConfig)

    if (error) {
      console.error('Error seeding slot config:', error)
      throw error
    }

    console.log('✅ Default slot machine config seeded')
  }
}

export const slotMachineService = new SlotMachineService()
