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
    const { data, error } = await supabase
      .from('slot_machine_config')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching slot config:', error)
      return null
    }

    return data
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
