/**
 * OMNILYPRO GAMING MODULE - Scratch Card Service
 * Handles scratch card gameplay, limits, and prize distribution
 */

import { supabase } from '../../lib/supabase'

export interface ScratchCardConfig {
  id: string
  organization_id: string
  enabled: boolean
  max_plays_per_day: number
  prizes: {
    cherry: { symbol: string; points: number; probability: number }
    diamond: { symbol: string; points: number; probability: number }
    star: { symbol: string; points: number; probability: number }
    gift: { symbol: string; points: number; probability: number }
  }
  no_prize_probability: number
  created_at: string
  updated_at: string
}

export interface ScratchCardPlay {
  id: string
  organization_id: string
  customer_id: string
  play_date: string
  won: boolean
  prize_symbol?: string
  prize_points: number
  grid_symbols: string[]
  played_at: string
}

export interface CanPlayResult {
  canPlay: boolean
  playsToday: number
  maxPlays: number
  reason?: string
}

export interface PlayResult {
  success: boolean
  won: boolean
  prize_symbol?: string
  prize_points: number
  grid_symbols: string[]
  error?: string
}

export class ScratchCardService {
  /**
   * Get scratch card configuration for organization
   */
  async getConfig(organizationId: string): Promise<ScratchCardConfig | null> {
    try {
      const { data, error } = await supabase
        .from('scratch_card_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle()

      if (error) {
        console.error('Failed to get scratch card config:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in ScratchCardService.getConfig:', error)
      return null
    }
  }

  /**
   * Create default config for organization if not exists
   */
  async ensureConfig(organizationId: string): Promise<ScratchCardConfig | null> {
    try {
      // Check if config exists
      let config = await this.getConfig(organizationId)
      if (config) return config

      // Create default config
      const { data, error } = await supabase
        .from('scratch_card_config')
        .insert({
          organization_id: organizationId,
          enabled: true,
          max_plays_per_day: 1,
          prizes: {
            cherry: { symbol: '🍒', points: 50, probability: 30 },
            diamond: { symbol: '💎', points: 100, probability: 20 },
            star: { symbol: '⭐', points: 200, probability: 10 },
            gift: { symbol: '🎁', points: 500, probability: 5 }
          },
          no_prize_probability: 35
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create scratch card config:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in ScratchCardService.ensureConfig:', error)
      return null
    }
  }

  /**
   * Update scratch card configuration
   */
  async updateConfig(
    organizationId: string,
    updates: Partial<Omit<ScratchCardConfig, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
  ): Promise<ScratchCardConfig | null> {
    try {
      const { data, error } = await supabase
        .from('scratch_card_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) {
        console.error('Failed to update scratch card config:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in ScratchCardService.updateConfig:', error)
      return null
    }
  }

  /**
   * Check if customer can play today
   */
  async canPlay(customerId: string, organizationId: string): Promise<CanPlayResult> {
    try {
      // Get config
      const config = await this.ensureConfig(organizationId)
      if (!config) {
        return {
          canPlay: false,
          playsToday: 0,
          maxPlays: 0,
          reason: 'Scratch card not configured'
        }
      }

      if (!config.enabled) {
        return {
          canPlay: false,
          playsToday: 0,
          maxPlays: config.max_plays_per_day,
          reason: 'Scratch card is disabled'
        }
      }

      // Count plays today
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

      const { count, error } = await supabase
        .from('customer_scratch_plays')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .eq('play_date', today)

      if (error) {
        console.error('Failed to count scratch plays:', error)
        return {
          canPlay: false,
          playsToday: 0,
          maxPlays: config.max_plays_per_day,
          reason: 'Database error'
        }
      }

      const playsToday = count || 0
      const canPlay = playsToday < config.max_plays_per_day

      return {
        canPlay,
        playsToday,
        maxPlays: config.max_plays_per_day,
        reason: canPlay ? undefined : 'Daily limit reached'
      }
    } catch (error) {
      console.error('Error in ScratchCardService.canPlay:', error)
      return {
        canPlay: false,
        playsToday: 0,
        maxPlays: 0,
        reason: 'Unknown error'
      }
    }
  }

  /**
   * Play scratch card and award prize
   */
  async play(
    customerId: string,
    organizationId: string,
    gridSymbols: string[],
    won: boolean,
    prizeSymbol?: string,
    prizePoints?: number
  ): Promise<PlayResult> {
    try {
      console.log('🎫 ScratchCardService.play:', { customerId, organizationId, won, prizeSymbol, prizePoints })

      // Check if can play
      const canPlayResult = await this.canPlay(customerId, organizationId)
      if (!canPlayResult.canPlay) {
        return {
          success: false,
          won: false,
          prize_points: 0,
          grid_symbols: gridSymbols,
          error: canPlayResult.reason || 'Cannot play'
        }
      }

      const today = new Date().toISOString().split('T')[0]

      // Record play
      const { data: playData, error: playError } = await supabase
        .from('customer_scratch_plays')
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          play_date: today,
          won,
          prize_symbol: prizeSymbol || null,
          prize_points: prizePoints || 0,
          grid_symbols: gridSymbols,
          played_at: new Date().toISOString()
        })
        .select()
        .single()

      if (playError) {
        console.error('Failed to record scratch play:', playError)
        return {
          success: false,
          won: false,
          prize_points: 0,
          grid_symbols: gridSymbols,
          error: 'Failed to record play'
        }
      }

      // If won, award points
      if (won && prizePoints && prizePoints > 0) {
        console.log(`💰 Awarding ${prizePoints} points to customer ${customerId}`)

        // Get current points
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('points')
          .eq('id', customerId)
          .single()

        if (customerError) {
          console.error('Failed to get customer:', customerError)
          return {
            success: false,
            won: true,
            prize_points: prizePoints,
            grid_symbols: gridSymbols,
            error: 'Failed to award points'
          }
        }

        // Update points
        const newPoints = (customer.points || 0) + prizePoints

        const { error: updateError } = await supabase
          .from('customers')
          .update({
            points: newPoints,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerId)

        if (updateError) {
          console.error('Failed to update customer points:', updateError)
          return {
            success: false,
            won: true,
            prize_points: prizePoints,
            grid_symbols: gridSymbols,
            error: 'Failed to award points'
          }
        }

        // Log activity
        try {
          await supabase
            .from('customer_activities')
            .insert({
              organization_id: organizationId,
              customer_id: customerId,
              activity_type: 'gaming_scratch_card_win',
              type: 'gaming_scratch_card_win',
              activity_title: 'Gratta e Vinci - Vincita!',
              activity_description: `Hai vinto ${prizePoints} punti con il simbolo ${prizeSymbol}!`,
              points_earned: prizePoints,
              created_at: new Date().toISOString()
            })
        } catch (activityError) {
          console.warn('Failed to log activity (non-blocking):', activityError)
        }

        console.log(`✅ Points awarded! Customer now has ${newPoints} points`)
      }

      return {
        success: true,
        won,
        prize_symbol: prizeSymbol,
        prize_points: prizePoints || 0,
        grid_symbols: gridSymbols
      }
    } catch (error) {
      console.error('Error in ScratchCardService.play:', error)
      return {
        success: false,
        won: false,
        prize_points: 0,
        grid_symbols: gridSymbols,
        error: 'Unknown error'
      }
    }
  }

  /**
   * Get customer's scratch card history
   */
  async getHistory(
    customerId: string,
    organizationId: string,
    limit: number = 30
  ): Promise<ScratchCardPlay[]> {
    try {
      const { data, error } = await supabase
        .from('customer_scratch_plays')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .order('played_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to get scratch card history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in ScratchCardService.getHistory:', error)
      return []
    }
  }

  /**
   * Get organization scratch card statistics
   */
  async getStats(organizationId: string) {
    try {
      const { data: plays, error } = await supabase
        .from('customer_scratch_plays')
        .select('won, prize_points, played_at')
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Failed to get scratch card stats:', error)
        return {
          total_plays: 0,
          total_wins: 0,
          total_points_awarded: 0,
          win_rate: 0,
          plays_today: 0,
          wins_today: 0
        }
      }

      const totalPlays = plays?.length || 0
      const totalWins = plays?.filter(p => p.won).length || 0
      const totalPointsAwarded = plays?.reduce((sum, p) => sum + (p.prize_points || 0), 0) || 0

      const today = new Date().toISOString().split('T')[0]
      const playsToday = plays?.filter(p => p.played_at.startsWith(today)).length || 0
      const winsToday = plays?.filter(p => p.won && p.played_at.startsWith(today)).length || 0

      return {
        total_plays: totalPlays,
        total_wins: totalWins,
        total_points_awarded: totalPointsAwarded,
        win_rate: totalPlays > 0 ? (totalWins / totalPlays) * 100 : 0,
        plays_today: playsToday,
        wins_today: winsToday
      }
    } catch (error) {
      console.error('Error in ScratchCardService.getStats:', error)
      return {
        total_plays: 0,
        total_wins: 0,
        total_points_awarded: 0,
        win_rate: 0,
        plays_today: 0,
        wins_today: 0
      }
    }
  }
}

// Export singleton instance
export const scratchCardService = new ScratchCardService()
