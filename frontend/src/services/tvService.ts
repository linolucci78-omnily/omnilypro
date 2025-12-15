import { supabase } from '../lib/supabase'

export interface TVConfiguration {
    id?: string
    org_id: string
    background_image: string
    ticker_text: string
    jackpot_amount: number
    super_prize_image?: string
    rewards_json: any[]
    active_slides: {
        leaderboard: boolean
        rewards: boolean
        lottery: boolean
        promo: boolean
        activity: boolean
        howto: boolean
    }
}

export interface Customer {
    id: string
    name: string
    points: number
    tier: string
    avatar?: string
}

export interface Reward {
    id: string
    title: string
    points: number
    image?: string
    tier?: string
}

export const tvService = {
    /**
     * Fetch TV configuration for a specific organization
     */
    async getConfiguration(orgId: string): Promise<TVConfiguration | null> {
        const { data, error } = await supabase
            .from('tv_configurations')
            .select('*')
            .eq('org_id', orgId)
            .single()

        if (error) {
            console.error('Error fetching TV config:', error)
            return null
        }
        return data
    },

    /**
     * Create or Update the configuration
     */
    async saveConfiguration(config: TVConfiguration) {
        // Upsert based on org_id unique constraint
        const { data, error } = await supabase
            .from('tv_configurations')
            .upsert({
                org_id: config.org_id,
                background_image: config.background_image,
                ticker_text: config.ticker_text,
                jackpot_amount: config.jackpot_amount,
                super_prize_image: config.super_prize_image,
                rewards_json: config.rewards_json,
                active_slides: config.active_slides,
                updated_at: new Date().toISOString()
            }, { onConflict: 'org_id' })

        if (error) {
            throw error
        }
        return data
    },

    /**
     * Get top customers by points for leaderboard
     */
    async getTopCustomers(orgId: string, limit: number = 5): Promise<Customer[]> {
        const { data, error } = await supabase
            .from('customers')
            .select('id, name, points, tier')
            .eq('organization_id', orgId)
            .eq('is_active', true)
            .order('points', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching top customers:', error)
            return []
        }

        // Add initials as avatar
        return data.map(customer => ({
            ...customer,
            avatar: customer.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        }))
    },

    /**
     * Get active rewards for the organization (from real rewards table)
     * Returns random selection each time for variety
     */
    async getRewards(orgId: string, count: number = 3): Promise<Reward[]> {
        try {
            const { data, error } = await supabase
                .from('rewards')
                .select('id, name, points_required, image_url, required_tier')
                .eq('organization_id', orgId)
                .eq('is_active', true)

            if (error) {
                console.error('Error fetching rewards:', error)
                return []
            }

            // Map database fields to TV interface
            const allRewards = (data || []).map(reward => ({
                id: reward.id,
                title: reward.name,
                points: reward.points_required,
                image: reward.image_url,
                tier: reward.required_tier
            }))

            // Shuffle array randomly using Fisher-Yates algorithm
            const shuffled = [...allRewards]
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
            }

            // Return specified number of random rewards for TV display
            return shuffled.slice(0, Math.min(count, shuffled.length))
        } catch (error) {
            console.error('Error in getRewards:', error)
            return []
        }
    }
}
