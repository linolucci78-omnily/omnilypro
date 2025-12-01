/**
 * AI Rewards Generation Service
 * Powered by Anthropic Claude via Supabase Edge Functions
 */

import { supabase } from '../lib/supabase'

export interface BusinessContext {
  organization: {
    name: string
    business_type?: string
    average_transaction?: number
  }
  loyalty_tiers: Array<{
    name: string
    min_points: number
    color?: string
  }>
  points_config: {
    name: string
    earn_rate: number
    currency: string
  }
  product_categories?: string[]
  customer_stats?: {
    total: number
    average_points: number
    top_spender_avg: number
  }
}

export interface AIGeneratedReward {
  name: string
  type: 'discount' | 'freeProduct' | 'cashback' | 'giftCard'
  value: string | number
  points_required: number
  required_tier?: string
  description: string
  emoji?: string
  imageSearchQuery?: string  // Query ottimizzata per cercare immagine (generata da AI)
  image_url?: string          // URL immagine trovata (aggiunto dopo ricerca)
  image_credit?: {            // Credit fotografo (richiesto da Unsplash/Pexels)
    author: string
    source: 'unsplash' | 'pexels'
    authorUrl: string
  }
}

export interface AIRewardsResponse {
  success: boolean
  rewards?: AIGeneratedReward[]
  reasoning?: string
  error?: string
}

class AIRewardsService {
  /**
   * Generate AI-powered rewards based on business context
   */
  async generateRewards(
    businessContext: BusinessContext,
    organizationId: string,
    customInstructions?: string,
    rewardsCount: number = 8,
    existingRewards?: Array<{ name: string; description: string }>
  ): Promise<AIRewardsResponse> {
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return {
          success: false,
          error: 'Non autenticato'
        }
      }

      // Call Edge Function directly with fetch to get better error details
      const response = await fetch(
        'https://sjvatdnvewohvswfrdiv.supabase.co/functions/v1/generate-ai-rewards',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            businessContext,
            organizationId,
            customInstructions,
            rewardsCount,
            existingRewards  // Passa rewards esistenti alla Edge Function
          })
        }
      )

      const data = await response.json()

      console.log('AI Rewards Response Status:', response.status)
      console.log('AI Rewards Response:', data)

      if (!response.ok) {
        console.error('Edge Function error response:', data)
        return {
          success: false,
          error: data.error || `Errore ${response.status}: ${response.statusText}`
        }
      }

      return data as AIRewardsResponse
    } catch (error: any) {
      console.error('Error generating AI rewards:', error)
      return {
        success: false,
        error: error.message || 'Errore di connessione'
      }
    }
  }

  /**
   * Build business context from organization data
   */
  buildBusinessContext(
    organization: any,
    customers: any[]
  ): BusinessContext {
    // Calculate customer statistics
    const totalCustomers = customers.length
    const averagePoints = totalCustomers > 0
      ? customers.reduce((sum, c) => sum + (c.points || 0), 0) / totalCustomers
      : 0

    const topSpenders = customers
      .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
      .slice(0, Math.ceil(totalCustomers * 0.1)) // Top 10%

    const topSpenderAvg = topSpenders.length > 0
      ? topSpenders.reduce((sum, c) => sum + (c.total_spent || 0), 0) / topSpenders.length
      : 0

    // Calculate average transaction
    const totalTransactions = customers.reduce((sum, c) => sum + (c.visit_count || 0), 0)
    const totalSpent = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)
    const averageTransaction = totalTransactions > 0
      ? totalSpent / totalTransactions
      : 25 // Default fallback

    // Get loyalty tiers or use defaults
    const loyaltyTiers = organization.loyalty_tiers && organization.loyalty_tiers.length > 0
      ? organization.loyalty_tiers
      : [
          { name: 'Bronze', min_points: 0, color: '#cd7f32' },
          { name: 'Silver', min_points: 100, color: '#c0c0c0' },
          { name: 'Gold', min_points: 500, color: '#ffd700' }
        ]

    // Get points configuration
    const pointsConfig = {
      name: organization.points_name || 'Punti',
      earn_rate: 1, // Default: 1 punto per 1€
      currency: 'EUR'
    }

    // Get product categories if available
    const productCategories = organization.product_categories || []

    return {
      organization: {
        name: organization.name,
        business_type: organization.business_type,
        average_transaction: Math.round(averageTransaction * 100) / 100
      },
      loyalty_tiers: loyaltyTiers,
      points_config: pointsConfig,
      product_categories: productCategories.length > 0 ? productCategories : undefined,
      customer_stats: {
        total: totalCustomers,
        average_points: Math.round(averagePoints),
        top_spender_avg: Math.round(topSpenderAvg * 100) / 100
      }
    }
  }
}

export const aiRewardsService = new AIRewardsService()
